import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, plCreateSchema, stripManagedFields } from '@/lib/validation'

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
    .from('packing_lists')
    .select('*, packing_list_items(*), packing_list_boxes(*)')
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

  const parsed = parse(plCreateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { items, boxes, ...plData } = parsed
  const safe = stripManagedFields(plData as Record<string, unknown>)

  // Auto-generate our_order_number when not supplied
  if (!safe.our_order_number) {
    const { data: seq, error: seqErr } = await supabase.rpc('next_doc_number', { p_doc_type: 'packing_list' })
    if (seqErr) return NextResponse.json({ error: seqErr.message }, { status: 500 })
    if (seq) safe.our_order_number = seq
  }

  const { data: pl, error } = await supabase.from('packing_lists').insert(safe).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    const { error: itemsErr } = await supabase.from('packing_list_items').insert(
      items.map((item, i) => ({
        ...stripManagedFields(item as Record<string, unknown>),
        packing_list_id: pl.id,
        sort_order: i,
      }))
    )
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })
  }
  if (boxes && boxes.length > 0) {
    const { error: boxesErr } = await supabase.from('packing_list_boxes').insert(
      boxes.map((box, i) => ({
        ...stripManagedFields(box as Record<string, unknown>),
        packing_list_id: pl.id,
        sort_order: i,
      }))
    )
    if (boxesErr) return NextResponse.json({ error: boxesErr.message }, { status: 500 })
  }

  return NextResponse.json(pl, { status: 201 })
}
