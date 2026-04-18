-- ============================================================
-- Heritage ERP — Company Settings & Client Customer ID migration
-- Run this ONCE in the Supabase SQL Editor.
-- ============================================================

-- 1. Company settings — single row, managed by admin users
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT DEFAULT 'Heritage Global Solutions Ltd',
  vat_reg_number TEXT,
  company_reg_number TEXT,
  address TEXT,
  -- GBP bank details
  gbp_bank_name TEXT,
  gbp_account_name TEXT,
  gbp_account_number TEXT,
  gbp_sort_code TEXT,
  gbp_iban TEXT,
  gbp_swift TEXT,
  -- USD bank details
  usd_bank_name TEXT,
  usd_account_name TEXT,
  usd_account_number TEXT,
  usd_sort_code TEXT,
  usd_iban TEXT,
  usd_swift TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a single row so GET always returns something
INSERT INTO public.company_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 2. Customer short-code on clients (e.g. "GGM" for Gulf Gas Motors)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- 3. Let authenticated users read/update company settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_company_settings" ON public.company_settings;
CREATE POLICY "auth_read_company_settings"
  ON public.company_settings FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_update_company_settings" ON public.company_settings;
CREATE POLICY "auth_update_company_settings"
  ON public.company_settings FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
