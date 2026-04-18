import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  let query = supabase
    .from('purchase_orders')
    .select('*, po_items(*), rfqs(rfq_number)')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`po_number.ilike.%${search}%,ship_to_company.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...poData } = body

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert(poData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    const mapped = items.map((item: Record<string, unknown>, i: number) => ({
      ...item,
      po_id: po.id,
      sort_order: i,
    }))
    await supabase.from('po_items').insert(mapped)
  }

  return NextResponse.json(po, { status: 201 })
}
