-- ============================================================
-- Dispatch: propagate client_id + notify_party from PO → CI/TI/PL
-- Drop-in replacement for dispatch_po_batch() from hardening-migration.sql
-- Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.dispatch_po_batch(
  p_po_id UUID,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user          UUID;
  v_po            RECORD;
  v_client        RECORD;
  v_settings      RECORD;
  v_batch_id      UUID;
  v_batch_num     INT;
  v_ci_id         UUID;
  v_ti_id         UUID;
  v_pl_id         UUID;
  v_ci_num        TEXT;
  v_ti_num        TEXT;
  v_ci_total      NUMERIC(14, 2);
  v_ti_subtotal   NUMERIC(14, 2);
  v_ti_tax        NUMERIC(14, 2);
  v_vat_rate      NUMERIC(5, 2);
  v_country       TEXT;
  v_currency      TEXT;
  v_bill_to       TEXT;
  v_ship_to       TEXT;
  v_vendor_addr   TEXT;
  v_notify_party  TEXT;
  v_all_done      BOOLEAN;
  v_item          JSONB;
  v_po_item       RECORD;
  v_new_shipped   NUMERIC;
  v_fully         BOOLEAN;
  v_remaining     NUMERIC;
BEGIN
  v_user := COALESCE(p_created_by, auth.uid());
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'dispatch_po_batch: not authenticated';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'dispatch_po_batch: no items provided';
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF v_po IS NULL THEN
    RAISE EXCEPTION 'dispatch_po_batch: purchase order % not found', p_po_id;
  END IF;

  -- Resolve client (for notify_party propagation to CI)
  IF v_po.client_id IS NOT NULL THEN
    SELECT * INTO v_client FROM public.clients WHERE id = v_po.client_id;
  END IF;
  v_notify_party := CASE WHEN v_client IS NOT NULL THEN v_client.notify_party ELSE NULL END;

  SELECT * INTO v_settings
  FROM public.company_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';

  v_vat_rate := COALESCE(v_settings.default_vat_rate, 0);
  v_country  := COALESCE(v_settings.default_country_of_origin, 'United Kingdom');
  v_currency := COALESCE(NULLIF(v_po.currency, ''), v_settings.default_currency, 'GBP');

  SELECT COALESCE(MAX(batch_number), 0) + 1
  INTO v_batch_num
  FROM public.dispatch_batches
  WHERE po_id = p_po_id;

  INSERT INTO public.dispatch_batches (po_id, batch_number, notes, created_by)
  VALUES (p_po_id, v_batch_num, p_notes, v_user)
  RETURNING id INTO v_batch_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.dispatch_batch_items (batch_id, po_item_id, dispatched_qty)
    VALUES (
      v_batch_id,
      (v_item->>'po_item_id')::UUID,
      (v_item->>'dispatched_qty')::NUMERIC
    );

    SELECT quantity, shipped_qty
    INTO v_po_item
    FROM public.po_items
    WHERE id = (v_item->>'po_item_id')::UUID
    FOR UPDATE;

    IF v_po_item IS NULL THEN
      RAISE EXCEPTION 'dispatch_po_batch: po_item % not found', (v_item->>'po_item_id');
    END IF;

    v_new_shipped := COALESCE(v_po_item.shipped_qty, 0) + (v_item->>'dispatched_qty')::NUMERIC;
    v_fully       := v_new_shipped >= v_po_item.quantity;
    v_remaining   := GREATEST(0, v_po_item.quantity - v_new_shipped);

    UPDATE public.po_items
    SET shipped_qty   = v_new_shipped,
        fully_shipped = v_fully,
        ready_to_ship = FALSE,
        available_qty = CASE WHEN v_fully THEN 0 ELSE v_remaining END
    WHERE id = (v_item->>'po_item_id')::UUID;
  END LOOP;

  SELECT bool_and(fully_shipped) INTO v_all_done
  FROM public.po_items WHERE po_id = p_po_id;

  UPDATE public.purchase_orders
  SET status = CASE WHEN COALESCE(v_all_done, FALSE) THEN 'complete' ELSE 'partial' END
  WHERE id = p_po_id;

  v_bill_to := array_to_string(
    ARRAY[
      v_po.bill_to_company,
      v_po.bill_to_site,
      CASE WHEN v_po.bill_to_po_box IS NOT NULL THEN 'PO Box ' || v_po.bill_to_po_box END,
      v_po.bill_to_town,
      v_po.bill_to_country
    ],
    E'\n'
  );

  v_ship_to := array_to_string(
    ARRAY[
      v_po.ship_to_company,
      CASE WHEN v_po.ship_to_po_box IS NOT NULL THEN 'PO Box ' || v_po.ship_to_po_box END,
      NULLIF(trim(BOTH ' ' FROM COALESCE(v_po.ship_to_town, '') || ' ' || COALESCE(v_po.ship_to_post_code, '')), ''),
      v_po.ship_to_country
    ],
    E'\n'
  );

  v_vendor_addr := array_to_string(
    ARRAY[
      NULLIF(trim(BOTH ' ' FROM COALESCE(v_po.vendor_city, '') || ' ' || COALESCE(v_po.vendor_post_code, '')), ''),
      v_po.vendor_country
    ],
    E'\n'
  );

  SELECT COALESCE(
           SUM(bi.dispatched_qty * COALESCE(NULLIF(pi.net_price, 0), pi.unit_price, 0)),
           0
         )
  INTO v_ci_total
  FROM public.dispatch_batch_items bi
  JOIN public.po_items pi ON pi.id = bi.po_item_id
  WHERE bi.batch_id = v_batch_id;

  v_ti_subtotal := v_ci_total;
  v_ti_tax      := ROUND(v_ti_subtotal * v_vat_rate / 100.0, 2);

  -- Commercial Invoice
  v_ci_num := public.next_doc_number('commercial_invoice');
  INSERT INTO public.commercial_invoices (
    po_id, batch_id, client_id, invoice_number, purchase_order_number, invoice_date, currency,
    country_of_origin, terms_of_sale, shipper_name, shipper_address,
    consignee_name, consignee_address, notify_party,
    total_amount, status, created_by
  ) VALUES (
    p_po_id, v_batch_id, v_po.client_id, v_ci_num, v_po.po_number, CURRENT_DATE, v_currency,
    v_country, COALESCE(v_po.inco_terms, ''),
    COALESCE(v_po.vendor_name, 'Heritage Global Solutions Ltd'), v_vendor_addr,
    COALESCE(v_po.bill_to_company, v_po.ship_to_company, ''),
    COALESCE(NULLIF(v_bill_to, ''), v_ship_to),
    v_notify_party,
    v_ci_total, 'draft', v_user
  ) RETURNING id INTO v_ci_id;

  INSERT INTO public.ci_items (
    ci_id, po_item_id, item_number, product_description, quantity, unit_price, sort_order
  )
  SELECT
    v_ci_id, pi.id, pi.item_number,
    CASE
      WHEN pi.description_short IS NOT NULL AND pi.description_full IS NOT NULL
        THEN pi.description_short || ' — ' || pi.description_full
      ELSE COALESCE(pi.description_short, pi.description_full, '')
    END,
    bi.dispatched_qty,
    COALESCE(NULLIF(pi.net_price, 0), pi.unit_price, 0),
    (ROW_NUMBER() OVER (ORDER BY COALESCE(pi.sort_order, 0)))::INT - 1
  FROM public.dispatch_batch_items bi
  JOIN public.po_items pi ON pi.id = bi.po_item_id
  WHERE bi.batch_id = v_batch_id;

  -- Tax Invoice
  v_ti_num := public.next_doc_number('tax_invoice');
  INSERT INTO public.tax_invoices (
    po_id, batch_id, client_id, tax_invoice_number, purchase_order_number, invoice_date, order_date,
    currency, payment_terms, shipping_terms, sales_person,
    customer_name, customer_address,
    subtotal, sales_tax_rate, sales_tax_amount, total_amount,
    vat_reg_number, company_reg_number, status, created_by
  ) VALUES (
    p_po_id, v_batch_id, v_po.client_id, v_ti_num, v_po.po_number, CURRENT_DATE, v_po.po_date,
    v_currency,
    COALESCE(v_po.payment_terms, ''),
    COALESCE(v_po.inco_terms, ''),
    COALESCE(v_po.sales_person, ''),
    COALESCE(v_po.bill_to_company, v_po.ship_to_company, ''),
    COALESCE(NULLIF(v_bill_to, ''), v_ship_to),
    v_ti_subtotal, v_vat_rate, v_ti_tax, v_ti_subtotal + v_ti_tax,
    v_settings.vat_reg_number, v_settings.company_reg_number,
    'draft', v_user
  ) RETURNING id INTO v_ti_id;

  INSERT INTO public.ti_items (
    ti_id, po_item_id, item_number, item_description, quantity, unit_price, sort_order
  )
  SELECT
    v_ti_id, pi.id, pi.item_number,
    CASE
      WHEN pi.description_short IS NOT NULL AND pi.description_full IS NOT NULL
        THEN pi.description_short || ' — ' || pi.description_full
      ELSE COALESCE(pi.description_short, pi.description_full, '')
    END,
    bi.dispatched_qty,
    COALESCE(NULLIF(pi.net_price, 0), pi.unit_price, 0),
    (ROW_NUMBER() OVER (ORDER BY COALESCE(pi.sort_order, 0)))::INT - 1
  FROM public.dispatch_batch_items bi
  JOIN public.po_items pi ON pi.id = bi.po_item_id
  WHERE bi.batch_id = v_batch_id;

  -- Packing List
  INSERT INTO public.packing_lists (
    po_id, batch_id, client_id, customer_po_number, our_order_number, shipped_via, sales_person,
    ship_to_address, status, created_by
  ) VALUES (
    p_po_id, v_batch_id, v_po.client_id, v_po.po_number, COALESCE(v_po.your_reference, ''),
    COALESCE(v_po.mode_of_transport, ''), COALESCE(v_po.sales_person, ''),
    v_ship_to, 'draft', v_user
  ) RETURNING id INTO v_pl_id;

  INSERT INTO public.packing_list_items (
    packing_list_id, po_item_id, item_number, description, quantity, sort_order
  )
  SELECT
    v_pl_id, pi.id, pi.item_number,
    CASE
      WHEN pi.description_short IS NOT NULL AND pi.description_full IS NOT NULL
        THEN pi.description_short || ' — ' || pi.description_full
      ELSE COALESCE(pi.description_short, pi.description_full, '')
    END,
    bi.dispatched_qty,
    (ROW_NUMBER() OVER (ORDER BY COALESCE(pi.sort_order, 0)))::INT - 1
  FROM public.dispatch_batch_items bi
  JOIN public.po_items pi ON pi.id = bi.po_item_id
  WHERE bi.batch_id = v_batch_id;

  RETURN jsonb_build_object(
    'batch_id',     v_batch_id,
    'batch_number', v_batch_num,
    'ci_id',        v_ci_id,
    'ti_id',        v_ti_id,
    'pl_id',        v_pl_id,
    'ci_number',    v_ci_num,
    'ti_number',    v_ti_num
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispatch_po_batch(UUID, JSONB, TEXT, UUID) TO authenticated;
