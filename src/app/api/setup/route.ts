import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_ADMIN_EMAIL = 'admin@heritage.local'

/**
 * One-time bootstrap endpoint. Creates a default admin user if zero users
 * exist yet. Marks the user with must_change_password=true so they're forced
 * to set a new password on first login.
 *
 * Hardening (post-critique):
 *   - Requires X-Setup-Token header that matches SETUP_TOKEN env var. If
 *     SETUP_TOKEN is unset, the endpoint is disabled entirely — bootstrap
 *     must be done via the Supabase CLI or Studio in that case.
 *   - Generates a random 20-char password. The password is printed once
 *     to the server log and is NEVER returned in the HTTP response.
 *   - Guards against timing attacks on token comparison.
 */

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

function generatePassword(length = 20): string {
  // URL-safe base64; 15 bytes → 20 chars after stripping padding.
  return randomBytes(Math.ceil((length * 3) / 4))
    .toString('base64url')
    .slice(0, length)
}

function authorizeSetup(request: NextRequest): string | null {
  const configured = process.env.SETUP_TOKEN
  if (!configured) {
    return 'Setup endpoint is disabled. Set SETUP_TOKEN in the environment to enable bootstrap.'
  }
  const provided = request.headers.get('x-setup-token') ?? ''
  if (!provided || !constantTimeEqual(provided, configured)) {
    return 'Invalid setup token.'
  }
  return null
}

export async function POST(request: NextRequest) {
  const authError = authorizeSetup(request)
  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 })
  }

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

  const password = generatePassword(20)

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: DEFAULT_ADMIN_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Default Admin' },
  })
  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || 'Failed to create admin.' }, { status: 500 })
  }

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

  // Password is written to stdout once. NEVER included in the HTTP response.
  // Operator must grab it from `railway logs` / Supabase function logs.
  // eslint-disable-next-line no-console
  console.log(
    `[heritage-erp:setup] Bootstrap admin created.\n` +
    `  email:    ${DEFAULT_ADMIN_EMAIL}\n` +
    `  password: ${password}\n` +
    `  NOTE: must_change_password=true — change it on first login.`
  )

  return NextResponse.json({
    ok: true,
    created: true,
    email: DEFAULT_ADMIN_EMAIL,
    message:
      'Default admin created. The one-time password has been written to the server log. ' +
      'Retrieve it with `railway logs` (or your hosting provider\'s equivalent) and sign in immediately.',
  })
}

export async function GET() {
  return NextResponse.json({
    hint:
      'POST to this endpoint with a valid X-Setup-Token header to create the default admin account. ' +
      'Only works when no users exist. Disabled if SETUP_TOKEN is not set on the server.',
  })
}
