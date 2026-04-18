import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const poId = searchParams.get('po_id')

  let query = supabase
    .from('commercial_invoices')
    .select('*, ci_items(*)')
    .order('created_at', { ascending: false })

  if (poId) query = query.eq('po_id', poId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...ciData } = body

  // Auto-generate invoice number
  if (!ciData.invoice_number) {
    const { data: seqData } = await supabase.rpc('next_doc_number', { p_doc_type: 'commercial_invoice' })
    ciData.invoice_number = seqData
  }

  const { data: ci, error } = await supabase
    .from('commercial_invoices')
    .insert(ciData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    const mapped = items.map((item: Record<string, unknown>, i: number) => ({
      ...item,
      ci_id: ci.id,
      sort_order: i,
    }))
    await supabase.from('ci_items').insert(mapped)
  }

  return NextResponse.json(ci, { status: 201 })
}
