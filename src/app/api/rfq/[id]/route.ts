import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, rfqUpdateSchema, stripManagedFields } from '@/lib/validation'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('rfqs')
    .select('*, rfq_items(*)')
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

  const parsed = parse(rfqUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { items, ...rfqData } = parsed
  const safe = stripManagedFields(rfqData as Record<string, unknown>)

  const { data: rfq, error } = await supabase
    .from('rfqs')
    .update(safe)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items) {
    // Smart merge: compute diff, update existing, insert new, delete removed.
    const { data: existing } = await supabase
      .from('rfq_items').select('id').eq('rfq_id', params.id)
    const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
    const submittedIds = new Set(items.filter(i => i.id).map(i => i.id as string))

    const toDelete = [...existingIds].filter(id => !submittedIds.has(id))
    if (toDelete.length > 0) {
      await supabase.from('rfq_items').delete().in('id', toDelete)
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>
      const safeItem = stripManagedFields(item)
      if (item.id && existingIds.has(item.id as string)) {
        await supabase.from('rfq_items').update({ ...safeItem, sort_order: i }).eq('id', item.id as string)
      } else {
        await supabase.from('rfq_items').insert({ ...safeItem, rfq_id: params.id, sort_order: i })
      }
    }
  }

  return NextResponse.json(rfq)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { error } = await supabase.from('rfqs').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
