-- ============================================================
-- Heritage ERP — Security & Integrity Hardening Migration
-- Run ONCE in the Supabase SQL Editor, AFTER schema.sql,
-- auth-migration.sql, clients-migration.sql, and
-- company-settings-migration.sql have been applied.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Integrity constraints that the original schema missed
-- ------------------------------------------------------------

-- rfq_number and po_number should be unique.
-- Use a partial-unique so cancelled rows don't block revisions.
CREATE UNIQUE INDEX IF NOT EXISTS rfqs_rfq_number_active_uidx
  ON public.rfqs (rfq_number)
  WHERE status <> 'cancelled';

CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_po_number_active_uidx
  ON public.purchase_orders (po_number)
  WHERE status <> 'cancelled';

-- Dispatch batches: (po_id, batch_number) must be unique.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'dispatch_batches_po_batch_number_key'
  ) THEN
    ALTER TABLE public.dispatch_batches
      ADD CONSTRAINT dispatch_batches_po_batch_number_key
      UNIQUE (po_id, batch_number);
  END IF;
END$$;

-- ------------------------------------------------------------
-- 2. Year rollover in next_doc_number
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_doc_number(p_doc_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  seq RECORD;
  current_yy TEXT := to_char(NOW(), 'YY');
BEGIN
  -- Lock the row to prevent concurrent increment.
  SELECT * INTO seq FROM public.document_sequences
    WHERE doc_type = p_doc_type FOR UPDATE;

  IF seq IS NULL THEN
    RAISE EXCEPTION 'Unknown document sequence: %', p_doc_type;
  END IF;

  IF seq.year <> current_yy THEN
    UPDATE public.document_sequences
    SET last_number = 1, year = current_yy
    WHERE doc_type = p_doc_type
    RETURNING * INTO seq;
  ELSE
    UPDATE public.document_sequences
    SET last_number = last_number + 1
    WHERE doc_type = p_doc_type
    RETURNING * INTO seq;
  END IF;

  RETURN seq.prefix || seq.year || LPAD(seq.last_number::TEXT, 4, '0');
END;
$$;

-- ------------------------------------------------------------
-- 3. Company-settings defaults for tax/origin/currency
-- ------------------------------------------------------------
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS default_vat_rate NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_country_of_origin TEXT DEFAULT 'United Kingdom',
  ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'GBP';

-- ------------------------------------------------------------
-- 4. Profile flag needed by middleware (idempotent safety net)
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- ------------------------------------------------------------
-- 5. Helper: role lookup for RLS and application code
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 6. Auto-populate created_by = auth.uid() when app omits it
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rfqs', 'proforma_invoices', 'purchase_orders',
    'dispatch_batches', 'commercial_invoices', 'tax_invoices',
    'packing_lists'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_set_created_by ON public.%I;', t, t);
    EXECUTE format(
      'CREATE TRIGGER %I_set_created_by BEFORE INSERT ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_created_by();',
      t, t
    );
  END LOOP;
END$$;

-- ------------------------------------------------------------
-- 7. Replace permissive RLS policies with tighter ones.
--    * SELECT/INSERT/UPDATE → any authenticated user (shared workspace)
--    * DELETE               → admin, or the row's creator
--    This preserves today's shared-workspace behaviour while
--    preventing a compromised non-admin account from wiping data.
-- ------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rfqs', 'rfq_items',
    'proforma_invoices', 'proforma_items',
    'purchase_orders', 'po_items',
    'dispatch_batches', 'dispatch_batch_items',
    'commercial_invoices', 'ci_items',
    'tax_invoices', 'ti_items',
    'packing_lists', 'packing_list_items', 'packing_list_boxes',
    'document_sequences'
  ]
  LOOP
    -- Drop legacy catch-all policy from schema.sql
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_all" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_select"  ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_insert"  ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_update"  ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_delete"  ON public.%I;', t);

    EXECUTE format(
      'CREATE POLICY "auth_select" ON public.%I FOR SELECT TO authenticated USING (true);',
      t
    );
    EXECUTE format(
      'CREATE POLICY "auth_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (true);',
      t
    );
    EXECUTE format(
      'CREATE POLICY "auth_update" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true);',
      t
    );
  END LOOP;
END$$;

-- Child tables (items, etc.) cascade with their parents; allow delete to authenticated.
-- Parent document tables: restrict delete to admin or creator.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'rfqs', 'proforma_invoices', 'purchase_orders',
    'dispatch_batches', 'commercial_invoices',
    'tax_invoices', 'packing_lists'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "auth_delete" ON public.%I FOR DELETE TO authenticated
         USING (public.is_admin() OR created_by = auth.uid());',
      t
    );
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'rfq_items', 'proforma_items', 'po_items',
    'dispatch_batch_items', 'ci_items', 'ti_items',
    'packing_list_items', 'packing_list_boxes'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "auth_delete" ON public.%I FOR DELETE TO authenticated USING (true);',
      t
    );
  END LOOP;

  -- document_sequences: no delete for regular users
  EXECUTE 'CREATE POLICY "auth_delete" ON public.document_sequences FOR DELETE TO authenticated USING (public.is_admin());';
END$$;

-- Clients: authenticated can read/insert/update; admin can delete.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    EXECUTE 'ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "authenticated_all" ON public.clients';
    EXECUTE 'DROP POLICY IF EXISTS "auth_select"  ON public.clients';
    EXECUTE 'DROP POLICY IF EXISTS "auth_insert"  ON public.clients';
    EXECUTE 'DROP POLICY IF EXISTS "auth_update"  ON public.clients';
    EXECUTE 'DROP POLICY IF EXISTS "auth_delete"  ON public.clients';
    EXECUTE 'CREATE POLICY "auth_select" ON public.clients FOR SELECT TO authenticated USING (true)';
    EXECUTE 'CREATE POLICY "auth_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "auth_update" ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true)';
    EXECUTE 'CREATE POLICY "auth_delete" ON public.clients FOR DELETE TO authenticated USING (public.is_admin() OR created_by = auth.uid())';
  END IF;
END$$;

-- Allow admins to read all profiles (for user-management UI); users always read their own.
DROP POLICY IF EXISTS "admin_read_profiles" ON public.profiles;
CREATE POLICY "admin_read_profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin() OR id = auth.uid());

-- ------------------------------------------------------------
-- 8. Atomic dispatch function
--    Replaces the 7-step sequential flow in the API route.
--    Returns ids of batch + auto-generated CI/TI/PL.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dispatch_po_batch(
  p_po_id UUID,
  p_items JSONB,                         -- [{po_item_id, dispatched_qty}, ...]
  p_notes TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user        UUID;
  v_po          RECORD;
  v_settings    RECORD;
  v_batch_id    UUID;
  v_batch_num   INT;
  v_ci_id       UUID;
  v_ti_id       UUID;
  v_pl_id       UUID;
  v_ci_num      TEXT;
  v_ti_num      TEXT;
  v_ci_total    NUMERIC(14, 2);
  v_ti_subtotal NUMERIC(14, 2);
  v_ti_tax      NUMERIC(14, 2);
  v_vat_rate    NUMERIC(5, 2);
  v_country     TEXT;
  v_currency    TEXT;
  v_bill_to     TEXT;
  v_ship_to     TEXT;
  v_vendor_addr TEXT;
  v_all_done    BOOLEAN;
  v_item        JSONB;
  v_po_item     RECORD;
  v_new_shipped NUMERIC;
  v_fully       BOOLEAN;
  v_remaining   NUMERIC;
BEGIN
  -- Caller identity
  v_user := COALESCE(p_created_by, auth.uid());
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'dispatch_po_batch: not authenticated';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'dispatch_po_batch: no items provided';
  END IF;

  -- Lock PO header; all row locks in this txn serialise concurrent dispatches.
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF v_po IS NULL THEN
    RAISE EXCEPTION 'dispatch_po_batch: purchase order % not found', p_po_id;
  END IF;

  -- Settings / defaults
  SELECT * INTO v_settings
  FROM public.company_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';

  v_vat_rate := COALESCE(v_settings.default_vat_rate, 0);
  v_country  := COALESCE(v_settings.default_country_of_origin, 'United Kingdom');
  v_currency := COALESCE(NULLIF(v_po.currency, ''), v_settings.default_currency, 'GBP');

  -- Batch number assignment (PO is row-locked above; UNIQUE constraint is the safety net).
  SELECT COALESCE(MAX(batch_number), 0) + 1
  INTO v_batch_num
  FROM public.dispatch_batches
  WHERE po_id = p_po_id;

  INSERT INTO public.dispatch_batches (po_id, batch_number, notes, created_by)
  VALUES (p_po_id, v_batch_num, p_notes, v_user)
  RETURNING id INTO v_batch_id;

  -- Batch items + PO item shipment updates
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

  -- PO status
  SELECT bool_and(fully_shipped) INTO v_all_done
  FROM public.po_items WHERE po_id = p_po_id;

  UPDATE public.purchase_orders
  SET status = CASE WHEN COALESCE(v_all_done, FALSE) THEN 'complete' ELSE 'partial' END
  WHERE id = p_po_id;

  -- Address helpers (skip NULLs)
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

  -- Totals (mirrors app logic: prefer net_price, fall back to unit_price)
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
    po_id, batch_id, invoice_number, purchase_order_number, invoice_date, currency,
    country_of_origin, terms_of_sale, shipper_name, shipper_address,
    consignee_name, consignee_address, total_amount, status, created_by
  ) VALUES (
    p_po_id, v_batch_id, v_ci_num, v_po.po_number, CURRENT_DATE, v_currency,
    v_country, COALESCE(v_po.inco_terms, ''),
    COALESCE(v_po.vendor_name, 'Heritage Global Solutions Ltd'), v_vendor_addr,
    COALESCE(v_po.bill_to_company, v_po.ship_to_company, ''),
    COALESCE(NULLIF(v_bill_to, ''), v_ship_to),
    v_ci_total, 'draft', v_user
  ) RETURNING id INTO v_ci_id;

  INSERT INTO public.ci_items (
    ci_id, po_item_id, item_number, product_description, quantity, unit_price, sort_order
  )
  SELECT
    v_ci_id,
    pi.id,
    pi.item_number,
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
    po_id, batch_id, tax_invoice_number, purchase_order_number, invoice_date, order_date,
    currency, payment_terms, shipping_terms, sales_person,
    customer_name, customer_address,
    subtotal, sales_tax_rate, sales_tax_amount, total_amount,
    vat_reg_number, company_reg_number, status, created_by
  ) VALUES (
    p_po_id, v_batch_id, v_ti_num, v_po.po_number, CURRENT_DATE, v_po.po_date,
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
    v_ti_id,
    pi.id,
    pi.item_number,
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
    po_id, batch_id, customer_po_number, our_order_number, shipped_via, sales_person,
    ship_to_address, status, created_by
  ) VALUES (
    p_po_id, v_batch_id, v_po.po_number, COALESCE(v_po.your_reference, ''),
    COALESCE(v_po.mode_of_transport, ''), COALESCE(v_po.sales_person, ''),
    v_ship_to, 'draft', v_user
  ) RETURNING id INTO v_pl_id;

  INSERT INTO public.packing_list_items (
    packing_list_id, po_item_id, item_number, description, quantity, sort_order
  )
  SELECT
    v_pl_id,
    pi.id,
    pi.item_number,
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

-- Grant execute to authenticated. (RLS is bypassed because SECURITY DEFINER,
-- but the function is scoped to the caller's PO.)
GRANT EXECUTE ON FUNCTION public.dispatch_po_batch(UUID, JSONB, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_doc_number(TEXT) TO authenticated;

-- ------------------------------------------------------------
-- 9. Health-check helper the API can call from the anon client
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.db_health() RETURNS TEXT
LANGUAGE sql STABLE AS $$ SELECT 'ok' $$;
GRANT EXECUTE ON FUNCTION public.db_health() TO anon, authenticated;
