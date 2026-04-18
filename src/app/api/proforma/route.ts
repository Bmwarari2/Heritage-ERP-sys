import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, proformaCreateSchema, stripManagedFields } from '@/lib/validation'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const rfqId = searchParams.get('rfq_id')
  const limit = Math.min(MAX_PAGE_SIZE, Number(searchParams.get('limit')) || DEFAULT_PAGE_SIZE)
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

  let query = supabase
    .from('proforma_invoices')
    .select('*, proforma_items(*), rfqs(rfq_number, buyer_company)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (rfqId) query = query.eq('rfq_id', rfqId)

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

  const parsed = parse(proformaCreateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { items, ...piData } = parsed
  const safe = stripManagedFields(piData as Record<string, unknown>)

  if (!safe.proforma_number) {
    const { data: seqData, error: seqErr } = await supabase.rpc('next_doc_number', { p_doc_type: 'proforma' })
    if (seqErr) return NextResponse.json({ error: seqErr.message }, { status: 500 })
    safe.proforma_number = seqData
  }

  const { data: pi, error } = await supabase
    .from('proforma_invoices')
    .insert(safe)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    const itemsWithId = items.map((item, i) => ({
      ...stripManagedFields(item as Record<string, unknown>),
      proforma_id: pi.id,
      sort_order: i,
    }))
    const { error: itemsError } = await supabase.from('proforma_items').insert(itemsWithId)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json(pi, { status: 201 })
}
