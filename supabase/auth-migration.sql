-- ============================================================
-- Heritage ERP — Auth migration
-- Run this ONCE in the Supabase SQL Editor AFTER the base schema.sql.
-- Safe to re-run (all statements are idempotent).
-- ============================================================

-- 1. Add must_change_password flag so users who log in with the default
--    bootstrap password are forced to rotate it on first login.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Auto-create a profiles row whenever a new auth.users row is inserted.
--    Keeps profiles in lock-step with Supabase Auth so the middleware's
--    must_change_password lookup always finds a row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, must_change_password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::BOOLEAN, TRUE)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Let authenticated users read their own profile (needed by middleware
--    to check the must_change_password flag).
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
CREATE POLICY "users_read_own_profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Let authenticated users update their own profile (excluding role &
--    must_change_password — those can only be changed via service-role).
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
