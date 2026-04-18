import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from('tax_invoices').select('*, ti_items(*)').eq('id', params.id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...tiData } = body
  const { data, error } = await supabase.from('tax_invoices').update(tiData).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (items) {
    await supabase.from('ti_items').delete().eq('ti_id', params.id)
    if (items.length > 0) {
      await supabase.from('ti_items').insert(
        items.map((item: Record<string, unknown>, i: number) => ({ ...item, ti_id: params.id, sort_order: i }))
      )
    }
  }
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('tax_invoices').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
