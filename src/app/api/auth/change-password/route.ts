import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const { currentPassword, newPassword } = await request.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 })
  }
  if (typeof newPassword !== 'string' || newPassword.length < 10) {
    return NextResponse.json({ error: 'Password must be at least 10 characters.' }, { status: 400 })
  }

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  // Verify current password by attempting a fresh sign-in with a scratch client
  const verifyClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  // Clear the must_change_password flag using service-role (bypasses RLS)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  await admin
    .from('profiles')
    .update({ must_change_password: false, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
