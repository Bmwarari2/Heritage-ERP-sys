import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, companySettingsUpdateSchema, stripManagedFields } from '@/lib/validation'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .single()

  if (error) return NextResponse.json({}, { status: 200 }) // return empty if row missing
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parsed = parse(companySettingsUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const safe = stripManagedFields(parsed as Record<string, unknown>)

  const { data, error } = await supabase
    .from('company_settings')
    .update(safe)
    .eq('id', SETTINGS_ID)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
