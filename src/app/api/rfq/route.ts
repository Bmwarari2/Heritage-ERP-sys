import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, rfqCreateSchema, sanitizeSearchTerm, stripManagedFields } from '@/lib/validation'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = sanitizeSearchTerm(searchParams.get('search'))
  const status = searchParams.get('status') ?? ''
  const limit = Math.min(MAX_PAGE_SIZE, Number(searchParams.get('limit')) || DEFAULT_PAGE_SIZE)
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

  let query = supabase
    .from('rfqs')
    .select('*, rfq_items(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(
      `rfq_number.ilike.%${search}%,buyer_company.ilike.%${search}%,your_reference.ilike.%${search}%`
    )
  }
  if (status) query = query.eq('status', status)

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

  const parsed = parse(rfqCreateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { items, ...rfqData } = parsed
  const safe = stripManagedFields(rfqData as Record<string, unknown>)

  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .insert(safe)
    .select()
    .single()
  if (rfqError) return NextResponse.json({ error: rfqError.message }, { status: 500 })

  if (items && items.length > 0) {
    const itemsWithId = items.map((item, i) => ({
      ...stripManagedFields(item as Record<string, unknown>),
      rfq_id: rfq.id,
      sort_order: i,
    }))
    const { error: itemsError } = await supabase.from('rfq_items').insert(itemsWithId)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json(rfq, { status: 201 })
}
