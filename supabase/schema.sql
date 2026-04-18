-- ============================================================
-- Heritage Global Solutions ERP — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS / AUTH
-- ============================================================
-- Uses Supabase built-in auth.users table
-- Extended profile table below

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'vendor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RFQ (Request for Quotation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Document identifiers
  rfq_number TEXT NOT NULL,
  rfq_date DATE,
  quotation_deadline DATE,
  delivery_date DATE,
  your_reference TEXT,                -- e.g. STK000931
  submission_email TEXT,

  -- Buyer / Invoicing address
  buyer_company TEXT,
  buyer_site TEXT,
  buyer_po_box TEXT,
  buyer_country TEXT,
  postal_address TEXT,

  -- Delivery address
  delivery_company TEXT,
  delivery_town TEXT,
  delivery_street TEXT,
  delivery_post_code TEXT,
  delivery_country TEXT,

  -- Buyer contact
  contact_person TEXT,
  contact_email TEXT,
  contact_tel TEXT,
  contact_fax TEXT,

  -- Vendor details (Heritage Global Solutions)
  vendor_name TEXT DEFAULT 'Heritage Global Solutions Ltd',
  vendor_number TEXT,
  vendor_address_line1 TEXT,
  vendor_city TEXT,
  vendor_post_code TEXT,
  vendor_country TEXT,
  vendor_contact_person TEXT,
  vendor_tel TEXT,
  vendor_fax TEXT,
  vendor_email TEXT,

  -- Meta
  comments TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'responded', 'closed')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'uploaded')),
  original_pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rfq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,          -- e.g. "10", "20", "30"
  item_code TEXT,                      -- buyer's material/stock code
  description_short TEXT,
  description_full TEXT,
  oem TEXT,
  part_number TEXT,
  quantity NUMERIC(12, 3) DEFAULT 0,
  unit TEXT DEFAULT 'EA',
  unit_price NUMERIC(12, 2),           -- blank in RFQ, vendor fills
  currency TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFORMA INVOICE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proforma_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proforma_number TEXT NOT NULL UNIQUE,  -- auto-generated unique
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,  -- linked parent RFQ

  -- Dates
  invoice_date DATE DEFAULT CURRENT_DATE,
  valid_until_date DATE,

  -- Sent To (client info)
  client_company TEXT,
  client_department TEXT,
  client_address TEXT,
  client_country TEXT,
  client_phone TEXT,

  -- Shipping & Terms
  airway_bill TEXT,
  incoterm TEXT,
  incoterm_country TEXT,
  currency TEXT DEFAULT 'GBP',

  -- Vendor (auto-populated)
  vendor_name TEXT DEFAULT 'Heritage Global Solutions Ltd',
  vendor_address TEXT,

  -- Totals
  subtotal NUMERIC(14, 2) DEFAULT 0,
  tax_rate NUMERIC(5, 2) DEFAULT 0,
  tax_amount NUMERIC(14, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) DEFAULT 0,

  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.proforma_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proforma_id UUID NOT NULL REFERENCES public.proforma_invoices(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(12, 3) DEFAULT 0,
  unit TEXT DEFAULT 'EA',
  unit_price NUMERIC(12, 2) DEFAULT 0,
  total_cost NUMERIC(14, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  internal_notes TEXT,    -- NOT exported to PDF
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,  -- optional link to RFQ

  -- Identifiers
  po_number TEXT NOT NULL,
  po_date DATE,
  document_date TIMESTAMPTZ,
  version TEXT DEFAULT '0',

  -- Shipping address (buyer)
  ship_to_company TEXT,
  ship_to_town TEXT,
  ship_to_po_box TEXT,
  ship_to_post_code TEXT,
  ship_to_country TEXT,

  -- Vendor address (Heritage)
  vendor_name TEXT DEFAULT 'Heritage Global Solutions Ltd',
  vendor_po_box TEXT,
  vendor_city TEXT,
  vendor_post_code TEXT,
  vendor_country TEXT,
  vendor_tel TEXT,
  vendor_fax TEXT,
  vendor_email TEXT,

  -- Billing address
  bill_to_company TEXT,
  bill_to_site TEXT,
  bill_to_po_box TEXT,
  bill_to_town TEXT,
  bill_to_country TEXT,
  billing_email TEXT,

  -- Contact / Purchasing details
  sales_person TEXT,
  sp_telephone TEXT,
  vendor_phone TEXT,
  vendor_fax_field TEXT,
  vendor_email_field TEXT,
  contact_person TEXT,

  -- Order info
  currency TEXT DEFAULT 'GBP',
  inco_terms TEXT,
  mode_of_transport TEXT,
  payment_terms TEXT,
  created_by_buyer TEXT,
  created_by_email TEXT,
  your_reference TEXT,
  comments TEXT,

  -- Financial summary
  net_value NUMERIC(14, 2) DEFAULT 0,
  gross_price NUMERIC(14, 2) DEFAULT 0,
  customs_duties_percent NUMERIC(5, 2) DEFAULT 0,
  customs_duties_amount NUMERIC(14, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) DEFAULT 0,

  -- Vendor notes & instructions
  instructions_to_vendor TEXT,
  vendor_notes TEXT,

  -- Type: linked to client or standalone
  po_type TEXT DEFAULT 'client' CHECK (po_type IN ('client', 'standalone')),

  -- Standalone PO extra fields
  billing_address TEXT,
  delivery_address TEXT,
  purchase_total NUMERIC(14, 2) DEFAULT 0,
  standalone_notes TEXT,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'partial', 'complete', 'cancelled')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'uploaded')),
  original_pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.po_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_number TEXT NOT NULL,
  material_code TEXT,
  description_short TEXT,
  description_full TEXT,
  reference TEXT,
  valuation_type TEXT,
  oem TEXT,
  part_number TEXT,
  quantity NUMERIC(12, 3) DEFAULT 0,
  unit TEXT DEFAULT 'EA',
  delivery_date DATE,
  net_price NUMERIC(12, 2) DEFAULT 0,
  per_quantity NUMERIC(12, 3) DEFAULT 1,
  net_amount NUMERIC(14, 2) DEFAULT 0,

  -- Vendor-added fields
  lead_amount NUMERIC(14, 2),
  product_url TEXT,
  vendor_notes TEXT,

  -- Dispatch tracking
  available_qty NUMERIC(12, 3) DEFAULT 0,   -- qty vendor has ready to ship
  ready_to_ship BOOLEAN DEFAULT FALSE,        -- checkbox
  shipped_qty NUMERIC(12, 3) DEFAULT 0,       -- total shipped so far
  fully_shipped BOOLEAN DEFAULT FALSE,

  -- Standalone PO fields
  unit_price NUMERIC(12, 2) DEFAULT 0,
  total_price NUMERIC(14, 2) DEFAULT 0,

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISPATCH BATCHES
-- A batch is created each time vendor dispatches items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dispatch_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  batch_number INTEGER NOT NULL,   -- 1, 2, 3 ...
  dispatched_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.dispatch_batch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES public.dispatch_batches(id) ON DELETE CASCADE,
  po_item_id UUID NOT NULL REFERENCES public.po_items(id) ON DELETE CASCADE,
  dispatched_qty NUMERIC(12, 3) NOT NULL
);

-- ============================================================
-- COMMERCIAL INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commercial_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,  -- auto-generated
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.dispatch_batches(id) ON DELETE SET NULL,
  purchase_order_number TEXT,

  -- Dates & Terms
  invoice_date DATE DEFAULT CURRENT_DATE,
  currency TEXT DEFAULT 'GBP',
  awb_bl_number TEXT,
  country_of_origin TEXT,
  terms_of_sale TEXT,

  -- Shipper (Vendor = Heritage)
  shipper_name TEXT DEFAULT 'Heritage Global Solutions Ltd',
  shipper_address TEXT,

  -- Consignee (client)
  consignee_name TEXT,
  consignee_address TEXT,
  notify_party TEXT,
  intermediate_consignee TEXT,
  final_destination TEXT,

  -- Totals
  total_amount NUMERIC(14, 2) DEFAULT 0,

  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ci_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ci_id UUID NOT NULL REFERENCES public.commercial_invoices(id) ON DELETE CASCADE,
  po_item_id UUID REFERENCES public.po_items(id) ON DELETE SET NULL,
  item_number TEXT NOT NULL,
  product_description TEXT,
  quantity NUMERIC(12, 3) DEFAULT 0,
  unit_price NUMERIC(12, 2) DEFAULT 0,
  total_value NUMERIC(14, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TAX INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_invoice_number TEXT NOT NULL UNIQUE,   -- auto-generated
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.dispatch_batches(id) ON DELETE SET NULL,
  purchase_order_number TEXT,

  -- Bill To
  customer_name TEXT,
  customer_id TEXT,
  customer_address TEXT,
  customer_phone TEXT,

  -- Payment
  payment_due_date DATE,
  sales_person TEXT,
  payment_terms TEXT,

  -- Order Details
  order_date DATE,

  -- Delivery
  delivery_date DATE,
  shipping_terms TEXT,

  -- Vendor / Company reg
  vat_reg_number TEXT,
  company_reg_number TEXT,

  -- Dates
  invoice_date DATE DEFAULT CURRENT_DATE,
  currency TEXT DEFAULT 'GBP',

  -- Totals
  subtotal NUMERIC(14, 2) DEFAULT 0,
  sales_tax_rate NUMERIC(5, 2) DEFAULT 0,
  sales_tax_amount NUMERIC(14, 2) DEFAULT 0,
  total_amount NUMERIC(14, 2) DEFAULT 0,

  -- Bank / Payment details
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_sort_code TEXT,
  bank_iban TEXT,
  bank_swift TEXT,

  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ti_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ti_id UUID NOT NULL REFERENCES public.tax_invoices(id) ON DELETE CASCADE,
  po_item_id UUID REFERENCES public.po_items(id) ON DELETE SET NULL,
  item_number TEXT NOT NULL,
  item_description TEXT,
  quantity NUMERIC(12, 3) DEFAULT 0,
  unit_price NUMERIC(12, 2) DEFAULT 0,
  line_total NUMERIC(14, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PACKING LISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.packing_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.dispatch_batches(id) ON DELETE SET NULL,
  customer_po_number TEXT,
  our_order_number TEXT,

  -- Shipping info
  final_destination TEXT,
  shipped_via TEXT,
  sales_person TEXT,

  -- Ship to
  ship_to_address TEXT,

  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.packing_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  packing_list_id UUID NOT NULL REFERENCES public.packing_lists(id) ON DELETE CASCADE,
  po_item_id UUID REFERENCES public.po_items(id) ON DELETE SET NULL,
  item_number TEXT NOT NULL,
  quantity NUMERIC(12, 3) DEFAULT 0,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.packing_list_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  packing_list_id UUID NOT NULL REFERENCES public.packing_lists(id) ON DELETE CASCADE,
  box_number INTEGER NOT NULL,
  box_type TEXT,                    -- e.g. "Cardboard", "Wooden Crate"
  dimension_l NUMERIC(8, 2),        -- cm
  dimension_w NUMERIC(8, 2),        -- cm
  dimension_h NUMERIC(8, 2),        -- cm
  gross_weight NUMERIC(8, 3),       -- kg
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT SEQUENCES (for auto-numbering)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_sequences (
  doc_type TEXT PRIMARY KEY,
  last_number INTEGER DEFAULT 0,
  prefix TEXT DEFAULT '',
  year TEXT DEFAULT ''
);

-- Seed initial sequences
INSERT INTO public.document_sequences (doc_type, prefix, year, last_number)
VALUES
  ('proforma', 'PI', to_char(NOW(), 'YY'), 0),
  ('commercial_invoice', 'CI', to_char(NOW(), 'YY'), 0),
  ('tax_invoice', 'TI', to_char(NOW(), 'YY'), 0),
  ('packing_list', 'PL', to_char(NOW(), 'YY'), 0)
ON CONFLICT (doc_type) DO NOTHING;

-- Function to get next document number
CREATE OR REPLACE FUNCTION public.next_doc_number(p_doc_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  seq RECORD;
  new_number INTEGER;
  result TEXT;
BEGIN
  UPDATE public.document_sequences
  SET last_number = last_number + 1,
      year = to_char(NOW(), 'YY')
  WHERE doc_type = p_doc_type
  RETURNING * INTO seq;

  result := seq.prefix || seq.year || LPAD(seq.last_number::TEXT, 4, '0');
  RETURN result;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ci_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ti_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_list_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write all (adjust for vendor roles later)
CREATE POLICY "authenticated_all" ON public.rfqs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.rfq_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.proforma_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.proforma_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.po_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.dispatch_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.dispatch_batch_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.commercial_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.ci_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.tax_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.ti_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.packing_lists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.packing_list_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.packing_list_boxes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON public.document_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "users_own_profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- TRIGGERS — keep updated_at current
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER rfqs_updated_at BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER proforma_updated_at BEFORE UPDATE ON public.proforma_invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER po_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER po_items_updated_at BEFORE UPDATE ON public.po_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER ci_updated_at BEFORE UPDATE ON public.commercial_invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER ti_updated_at BEFORE UPDATE ON public.tax_invoices FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER pl_updated_at BEFORE UPDATE ON public.packing_lists FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_rfq_items_rfq_id ON public.rfq_items(rfq_id);
CREATE INDEX IF NOT EXISTS idx_proforma_items_proforma_id ON public.proforma_items(proforma_id);
CREATE INDEX IF NOT EXISTS idx_proforma_invoices_rfq_id ON public.proforma_invoices(rfq_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON public.po_items(po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_rfq_id ON public.purchase_orders(rfq_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_batches_po_id ON public.dispatch_batches(po_id);
CREATE INDEX IF NOT EXISTS idx_ci_items_ci_id ON public.ci_items(ci_id);
CREATE INDEX IF NOT EXISTS idx_ti_items_ti_id ON public.ti_items(ti_id);
CREATE INDEX IF NOT EXISTS idx_pl_items_pl_id ON public.packing_list_items(packing_list_id);
CREATE INDEX IF NOT EXISTS idx_pl_boxes_pl_id ON public.packing_list_boxes(packing_list_id);
