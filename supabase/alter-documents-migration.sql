-- ============================================================
-- Documents: additional fields surfaced on printed/exported PDFs
-- ============================================================

-- Proforma: lead time and payment terms
ALTER TABLE public.proforma_invoices
  ADD COLUMN IF NOT EXISTS lead_time TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- Clients: separate billing address
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS billing_address TEXT;
