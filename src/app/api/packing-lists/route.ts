import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const poId = searchParams.get('po_id')

  let query = supabase
    .from('packing_lists')
    .select('*, packing_list_items(*), packing_list_boxes(*)')
    .order('created_at', { ascending: false })
  if (poId) query = query.eq('po_id', poId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, boxes, ...plData } = body

  const { data: pl, error } = await supabase.from('packing_lists').insert(plData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    await supabase.from('packing_list_items').insert(
      items.map((item: Record<string, unknown>, i: number) => ({ ...item, packing_list_id: pl.id, sort_order: i }))
    )
  }
  if (boxes && boxes.length > 0) {
    await supabase.from('packing_list_boxes').insert(
      boxes.map((box: Record<string, unknown>, i: number) => ({ ...box, packing_list_id: pl.id, sort_order: i }))
    )
  }

  return NextResponse.json(pl, { status: 201 })
}
