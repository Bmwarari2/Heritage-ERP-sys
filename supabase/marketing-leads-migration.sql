-- ============================================================
-- Heritage ERP — Marketing leads migration
-- Captures quote requests submitted from the public marketing
-- website (POST /api/leads/quote). Anonymous users may INSERT;
-- authenticated ERP users read, update and delete.
--
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ============================================================

-- 1. quote_requests table
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category     TEXT NOT NULL,
  item_desc    TEXT NOT NULL,
  quantity     TEXT NOT NULL,
  origin       TEXT NOT NULL,
  destination  TEXT NOT NULL,
  timeline     TEXT NOT NULL,
  company      TEXT NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'new',
  assigned_to  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_status     ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_email      ON public.quote_requests(email);

-- 2. Row-level security
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous (and authenticated) INSERT from the public website.
DROP POLICY IF EXISTS "public_insert_quote_requests" ON public.quote_requests;
CREATE POLICY "public_insert_quote_requests"
  ON public.quote_requests
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated ERP users can SELECT, UPDATE or DELETE.
DROP POLICY IF EXISTS "authenticated_read_quote_requests" ON public.quote_requests;
CREATE POLICY "authenticated_read_quote_requests"
  ON public.quote_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_update_quote_requests" ON public.quote_requests;
CREATE POLICY "authenticated_update_quote_requests"
  ON public.quote_requests
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_delete_quote_requests" ON public.quote_requests;
CREATE POLICY "authenticated_delete_quote_requests"
  ON public.quote_requests
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 3. Keep updated_at current
CREATE OR REPLACE FUNCTION public.set_quote_requests_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quote_requests_updated_at ON public.quote_requests;
CREATE TRIGGER trg_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_quote_requests_updated_at();
