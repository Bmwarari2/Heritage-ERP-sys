import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const rfqId = searchParams.get('rfq_id')

  let query = supabase
    .from('proforma_invoices')
    .select('*, proforma_items(*), rfqs(rfq_number, buyer_company)')
    .order('created_at', { ascending: false })

  if (rfqId) query = query.eq('rfq_id', rfqId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...piData } = body

  // Auto-generate proforma number if not set
  if (!piData.proforma_number) {
    const { data: seqData } = await supabase.rpc('next_doc_number', { p_doc_type: 'proforma' })
    piData.proforma_number = seqData
  }

  const { data: pi, error } = await supabase
    .from('proforma_invoices')
    .insert(piData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    const itemsWithId = items.map((item: Record<string, unknown>, i: number) => ({
      ...item,
      proforma_id: pi.id,
      sort_order: i,
    }))
    await supabase.from('proforma_items').insert(itemsWithId)
  }

  return NextResponse.json(pi, { status: 201 })
}
