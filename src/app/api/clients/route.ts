import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, clientCreateSchema, stripManagedFields, sanitizeSearchTerm } from '@/lib/validation'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = sanitizeSearchTerm(searchParams.get('search'))
  const limit = Math.min(MAX_PAGE_SIZE, Number(searchParams.get('limit')) || DEFAULT_PAGE_SIZE)
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

  let query = supabase
    .from('clients')
    .select('*')
    .order('name')
    .range(offset, offset + limit - 1)
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,contact_person.ilike.%${search}%,country.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parsed = parse(clientCreateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const safe = stripManagedFields(parsed as Record<string, unknown>)

  const { data, error } = await supabase
    .from('clients')
    .insert(safe)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
