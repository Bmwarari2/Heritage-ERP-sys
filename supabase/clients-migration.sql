-- ============================================================
-- Heritage ERP — Clients module migration
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ============================================================

-- 1. Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  contact_person  TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  billing_address TEXT,
  country         TEXT,
  vat_number      TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_clients" ON public.clients;
CREATE POLICY "authenticated_all_clients"
  ON public.clients FOR ALL
  USING (auth.role() = 'authenticated');

-- 3. Add client_id to key document tables so documents can be
--    linked to a client (nullable — existing records are unaffected).
ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.proforma_invoices
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.commercial_invoices
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.tax_invoices
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.packing_lists
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- 4. Index for faster lookups by client
CREATE INDEX IF NOT EXISTS idx_rfqs_client_id              ON public.rfqs(client_id);
CREATE INDEX IF NOT EXISTS idx_proforma_invoices_client_id ON public.proforma_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_client_id   ON public.purchase_orders(client_id);
