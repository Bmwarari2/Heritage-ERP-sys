import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, tiCreateSchema, stripManagedFields } from '@/lib/validation'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const poId = searchParams.get('po_id')
  const limit = Math.min(MAX_PAGE_SIZE, Number(searchParams.get('limit')) || DEFAULT_PAGE_SIZE)
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

  let query = supabase
    .from('tax_invoices')
    .select('*, ti_items(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (poId) query = query.eq('po_id', poId)

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

  const parsed = parse(tiCreateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { items, ...tiData } = parsed
  const safe = stripManagedFields(tiData as Record<string, unknown>)

  if (!safe.tax_invoice_number) {
    const { data: seqData, error: seqErr } = await supabase.rpc('next_doc_number', { p_doc_type: 'tax_invoice' })
    if (seqErr) return NextResponse.json({ error: seqErr.message }, { status: 500 })
    safe.tax_invoice_number = seqData
  }

  const { data: ti, error } = await supabase.from('tax_invoices').insert(safe).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    const { error: itemsError } = await supabase.from('ti_items').insert(
      items.map((item, i) => ({ ...stripManagedFields(item as Record<string, unknown>), ti_id: ti.id, sort_order: i }))
    )
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json(ti, { status: 201 })
}
