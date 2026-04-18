import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('proforma_invoices')
    .select('*, proforma_items(*), rfqs(rfq_number, buyer_company)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...piData } = body

  const { data, error } = await supabase
    .from('proforma_invoices')
    .update(piData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items) {
    await supabase.from('proforma_items').delete().eq('proforma_id', params.id)
    if (items.length > 0) {
      const mapped = items.map((item: Record<string, unknown>, i: number) => ({
        ...item,
        proforma_id: params.id,
        sort_order: i,
      }))
      await supabase.from('proforma_items').insert(mapped)
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('proforma_invoices').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
