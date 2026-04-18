import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, updateProfileSchema } from '@/lib/validation'

/**
 * Profile read/write. Uses the user-scoped client — the `users_own_profile`
 * RLS policy allows a user to read/update their own row.
 */
export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, must_change_password')
    .eq('id', user.id)
    .single()

  return NextResponse.json(
    data ?? { id: user.id, email: user.email, full_name: null, role: null, must_change_password: false }
  )
}

export async function PUT(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parsed = parse(updateProfileSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.full_name })
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
