import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const poId = searchParams.get('po_id')

  let query = supabase.from('tax_invoices').select('*, ti_items(*)').order('created_at', { ascending: false })
  if (poId) query = query.eq('po_id', poId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...tiData } = body

  if (!tiData.tax_invoice_number) {
    const { data: seqData } = await supabase.rpc('next_doc_number', { p_doc_type: 'tax_invoice' })
    tiData.tax_invoice_number = seqData
  }

  const { data: ti, error } = await supabase.from('tax_invoices').insert(tiData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    await supabase.from('ti_items').insert(
      items.map((item: Record<string, unknown>, i: number) => ({ ...item, ti_id: ti.id, sort_order: i }))
    )
  }

  return NextResponse.json(ti, { status: 201 })
}
