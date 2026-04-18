import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('packing_lists')
    .select('*, packing_list_items(*), packing_list_boxes(*)')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, boxes, ...plData } = body
  const { data, error } = await supabase.from('packing_lists').update(plData).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (items) {
    await supabase.from('packing_list_items').delete().eq('packing_list_id', params.id)
    if (items.length > 0) {
      await supabase.from('packing_list_items').insert(
        items.map((item: Record<string, unknown>, i: number) => ({ ...item, packing_list_id: params.id, sort_order: i }))
      )
    }
  }
  if (boxes) {
    await supabase.from('packing_list_boxes').delete().eq('packing_list_id', params.id)
    if (boxes.length > 0) {
      await supabase.from('packing_list_boxes').insert(
        boxes.map((box: Record<string, unknown>, i: number) => ({ ...box, packing_list_id: params.id, sort_order: i }))
      )
    }
  }
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('packing_lists').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
