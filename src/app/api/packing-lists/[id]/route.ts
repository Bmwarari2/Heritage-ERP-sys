import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, plUpdateSchema, stripManagedFields } from '@/lib/validation'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('packing_lists')
    .select('*, packing_list_items(*), packing_list_boxes(*)')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parsed = parse(plUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { items, boxes, ...plData } = parsed
  const safe = stripManagedFields(plData as Record<string, unknown>)

  const { error } = await supabase.from('packing_lists').update(safe).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items) {
    // Smart merge — avoid wiping items on an insert failure.
    const { data: existing } = await supabase
      .from('packing_list_items').select('id').eq('packing_list_id', params.id)
    const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
    const submittedIds = new Set(items.filter(i => i.id).map(i => i.id as string))

    const toDelete = [...existingIds].filter(id => !submittedIds.has(id))
    if (toDelete.length > 0) {
      await supabase.from('packing_list_items').delete().in('id', toDelete)
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>
      const safeItem = stripManagedFields(item)
      if (item.id && existingIds.has(item.id as string)) {
        await supabase.from('packing_list_items').update({ ...safeItem, sort_order: i }).eq('id', item.id as string)
      } else {
        await supabase.from('packing_list_items').insert({ ...safeItem, packing_list_id: params.id, sort_order: i })
      }
    }
  }

  if (boxes) {
    const { data: existingBoxes } = await supabase
      .from('packing_list_boxes').select('id').eq('packing_list_id', params.id)
    const existingIds = new Set((existingBoxes ?? []).map((r: { id: string }) => r.id))
    const submittedIds = new Set(boxes.filter(b => b.id).map(b => b.id as string))

    const toDelete = [...existingIds].filter(id => !submittedIds.has(id))
    if (toDelete.length > 0) {
      await supabase.from('packing_list_boxes').delete().in('id', toDelete)
    }

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i] as Record<string, unknown>
      const safeBox = stripManagedFields(box)
      if (box.id && existingIds.has(box.id as string)) {
        await supabase.from('packing_list_boxes').update({ ...safeBox, sort_order: i }).eq('id', box.id as string)
      } else {
        await supabase.from('packing_list_boxes').insert({ ...safeBox, packing_list_id: params.id, sort_order: i })
      }
    }
  }

  const { data: full, error: fetchErr } = await supabase
    .from('packing_lists').select('*, packing_list_items(*), packing_list_boxes(*)').eq('id', params.id).single()
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  return NextResponse.json(full)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { error } = await supabase.from('packing_lists').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
