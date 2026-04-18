import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('commercial_invoices')
    .select('*, ci_items(*)')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...ciData } = body
  const { data, error } = await supabase
    .from('commercial_invoices').update(ciData).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (items) {
    await supabase.from('ci_items').delete().eq('ci_id', params.id)
    if (items.length > 0) {
      await supabase.from('ci_items').insert(
        items.map((item: Record<string, unknown>, i: number) => ({ ...item, ci_id: params.id, sort_order: i }))
      )
    }
  }
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('commercial_invoices').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
