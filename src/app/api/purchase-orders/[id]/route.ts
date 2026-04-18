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
    // Find existing item IDs in the DB for this PO
    const { data: existing } = await supabase
      .from('po_items')
      .select('id')
      .eq('po_id', params.id)

    const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
    const submittedIds = new Set(
      (items as { id?: string }[]).filter(i => i.id).map(i => i.id as string)
    )

    // Delete items that were removed from the form
    const toDelete = [...existingIds].filter(id => !submittedIds.has(id))
    if (toDelete.length > 0) {
      await supabase.from('po_items').delete().in('id', toDelete)
    }

    const editableFields = [
      'item_number', 'material_code', 'description_short', 'description_full',
      'reference', 'valuation_type', 'oem', 'part_number', 'quantity', 'unit',
      'delivery_date', 'net_price', 'per_quantity', 'net_amount', 'lead_amount',
      'unit_price', 'total_price',
    ]

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>
      if (item.id && existingIds.has(item.id as string)) {
        // UPDATE — preserve shipped_qty, fully_shipped, ready_to_ship,
        // available_qty, product_url, vendor_notes
        const patch: Record<string, unknown> = { sort_order: i }
        for (const f of editableFields) {
          if (item[f] !== undefined) patch[f] = item[f]
        }
        await supabase.from('po_items').update(patch).eq('id', item.id as string)
      } else {
        // INSERT — new item, available_qty defaults to quantity
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...rest } = item
        await supabase.from('po_items').insert({
          ...rest,
          po_id: params.id,
          sort_order: i,
          available_qty: item.available_qty ?? item.quantity,
        })
      }
    }
  }

  return NextResponse.json(data)
}

// PATCH: update a single PO item's dispatch tracking and/or link/notes
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()

  if (body.po_item_id) {
    const patch: Record<string, unknown> = {}
    if (body.available_qty !== undefined) patch.available_qty = body.available_qty
    if (body.ready_to_ship !== undefined) patch.ready_to_ship = body.ready_to_ship
    if (body.vendor_notes !== undefined) patch.vendor_notes = body.vendor_notes
    if (body.product_url !== undefined) {
      let url: string = body.product_url ?? ''
      if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`
      patch.product_url = url
    }

    const { error } = await supabase
      .from('po_items')
      .update(patch)
      .eq('id', body.po_item_id)
      .eq('po_id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
