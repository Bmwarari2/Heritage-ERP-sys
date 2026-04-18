import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_ADMIN_EMAIL = 'admin@heritage.local'
const DEFAULT_ADMIN_PASSWORD = 'HeritageDefault2025!'

/**
 * One-time bootstrap endpoint. Creates a default admin user if zero users
 * exist yet. Marks the user with must_change_password=true so they're forced
 * to set a new password on first login. Safe to call repeatedly — it does
 * nothing once any user exists.
 */
export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase env vars are not configured.' }, { status: 500 })
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: existing, error: listError } = await admin.auth.admin.listUsers({ perPage: 1 })
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }
  if (existing.users.length > 0) {
    return NextResponse.json({
      ok: true,
      message: 'Users already exist — no bootstrap performed.',
      created: false,
    })
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Default Admin' },
  })
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || 'Failed to create admin.' }, { status: 500 })
  }

  // Upsert profile row marked with must_change_password=true and admin role
  const { error: profileError } = await admin.from('profiles').upsert({
    id: created.user.id,
    email: DEFAULT_ADMIN_EMAIL,
    full_name: 'Default Admin',
    role: 'admin',
    must_change_password: true,
    updated_at: new Date().toISOString(),
  })
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    created: true,
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    message: 'Default admin created. Sign in and change the password immediately.',
  })
}

export async function GET() {
  return NextResponse.json({
    hint: 'POST to this endpoint to create the default admin account (only works when no users exist).',
  })
}
