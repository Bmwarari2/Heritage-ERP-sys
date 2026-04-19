-- ============================================================
-- Documents: additional fields surfaced on printed/exported PDFs
-- ============================================================

-- Proforma: lead time and payment terms
ALTER TABLE public.proforma_invoices
  ADD COLUMN IF NOT EXISTS lead_time TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT;
