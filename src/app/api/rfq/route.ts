import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  let query = supabase
    .from('rfqs')
    .select('*, rfq_items(*)')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`rfq_number.ilike.%${search}%,buyer_company.ilike.%${search}%,your_reference.ilike.%${search}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...rfqData } = body

  // Insert RFQ
  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .insert(rfqData)
    .select()
    .single()

  if (rfqError) return NextResponse.json({ error: rfqError.message }, { status: 500 })

  // Insert items
  if (items && items.length > 0) {
    const itemsWithId = items.map((item: Record<string, unknown>, i: number) => ({
      ...item,
      rfq_id: rfq.id,
      sort_order: i,
    }))
    const { error: itemsError } = await supabase.from('rfq_items').insert(itemsWithId)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json(rfq, { status: 201 })
}
