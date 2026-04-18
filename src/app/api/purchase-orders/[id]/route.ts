import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, po_items(*), rfqs(rfq_number, buyer_company), dispatch_batches(*, dispatch_batch_items(*), commercial_invoices(id, invoice_number), tax_invoices(id, tax_invoice_number), packing_lists(id))')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, ...poData } = body

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(poData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items) {
    await supabase.from('po_items').delete().eq('po_id', params.id)
    if (items.length > 0) {
      const mapped = items.map((item: Record<string, unknown>, i: number) => ({
        ...item,
        po_id: params.id,
        sort_order: i,
        available_qty: item.available_qty ?? item.quantity,
      }))
      await supabase.from('po_items').insert(mapped)
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { error } = await supabase.from('purchase_orders').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH: update a single PO item (dispatch tracking)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()

  // Update po_item dispatch fields
  if (body.po_item_id) {
    const { error } = await supabase
      .from('po_items')
      .update({
        available_qty: body.available_qty,
        ready_to_ship: body.ready_to_ship,
      })
      .eq('id', body.po_item_id)
      .eq('po_id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
