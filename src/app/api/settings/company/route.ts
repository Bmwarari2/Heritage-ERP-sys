import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .single()

  if (error) return NextResponse.json({}, { status: 200 }) // return empty if table doesn't exist yet
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { id: _id, ...rest } = body

  const { data, error } = await supabase
    .from('company_settings')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', SETTINGS_ID)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
