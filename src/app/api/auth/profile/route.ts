import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = createServerClient()
  const { data } = await admin.from('profiles').select('id, full_name, email, role').eq('id', user.id).single()
  return NextResponse.json(data ?? { id: user.id, email: user.email, full_name: null })
}

export async function PUT(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { full_name } = await request.json()
  const admin = createServerClient()
  const { data, error } = await admin
    .from('profiles')
    .update({ full_name, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
