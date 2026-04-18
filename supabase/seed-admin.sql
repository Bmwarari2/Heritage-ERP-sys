-- ============================================================
-- Heritage ERP — Create default admin user
-- Run this in Supabase SQL Editor → Run
-- Safe to re-run: all statements are idempotent.
-- ============================================================

-- 1. Create the admin in auth.users (bypasses email confirmation)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if admin already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@heritage.local';

  IF v_user_id IS NULL THEN
    -- Create the auth user with a bcrypt-hashed password
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      role,
      aud,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_super_admin,
      confirmation_token,
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@heritage.local',
      crypt('HeritageDefault2025!', gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      '{"full_name": "Default Admin"}'::jsonb,
      now(),
      now(),
      false,
      '',
      ''
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'Admin user created with id: %', v_user_id;
  ELSE
    RAISE NOTICE 'Admin user already exists with id: %', v_user_id;
  END IF;

  -- 2. Upsert the profile row with admin role and must_change_password flag
  INSERT INTO public.profiles (id, email, full_name, role, must_change_password, updated_at)
  VALUES (v_user_id, 'admin@heritage.local', 'Default Admin', 'admin', true, now())
  ON CONFLICT (id) DO UPDATE
    SET
      role                 = 'admin',
      must_change_password = true,
      updated_at           = now();

  RAISE NOTICE 'Profile upserted for user: %', v_user_id;
END;
$$;
