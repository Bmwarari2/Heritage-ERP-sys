import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * POST /api/purchase-orders/[id]/dispatch
 * Creates a new dispatch batch and updates shipped quantities on po_items.
 * Body: { items: [{ po_item_id, dispatched_qty }], notes?: string }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, notes } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items provided for dispatch' }, { status: 400 })
  }

  // Get current batch count for this PO
  const { count } = await supabase
    .from('dispatch_batches')
    .select('*', { count: 'exact', head: true })
    .eq('po_id', params.id)

  const batchNumber = (count ?? 0) + 1

  // Create batch
  const { data: batch, error: batchError } = await supabase
    .from('dispatch_batches')
    .insert({ po_id: params.id, batch_number: batchNumber, notes })
    .select()
    .single()

  if (batchError) return NextResponse.json({ error: batchError.message }, { status: 500 })

  // Insert batch items
  const batchItems = items.map((item: { po_item_id: string; dispatched_qty: number }) => ({
    batch_id: batch.id,
    po_item_id: item.po_item_id,
    dispatched_qty: item.dispatched_qty,
  }))
  await supabase.from('dispatch_batch_items').insert(batchItems)

  // Update shipped_qty and fully_shipped on each po_item
  for (const item of items as { po_item_id: string; dispatched_qty: number }[]) {
    const { data: poItem } = await supabase
      .from('po_items')
      .select('quantity, shipped_qty')
      .eq('id', item.po_item_id)
      .single()

    if (poItem) {
      const newShipped = (poItem.shipped_qty || 0) + item.dispatched_qty
      const fullyShipped = newShipped >= poItem.quantity
      await supabase
        .from('po_items')
        .update({
          shipped_qty: newShipped,
          fully_shipped: fullyShipped,
          ready_to_ship: false,
          available_qty: 0,
        })
        .eq('id', item.po_item_id)
    }
  }

  // Update PO status
  const { data: allItems } = await supabase
    .from('po_items')
    .select('fully_shipped')
    .eq('po_id', params.id)

  const allDone = allItems?.every((i: { fully_shipped: boolean }) => i.fully_shipped) ?? false
  await supabase
    .from('purchase_orders')
    .update({ status: allDone ? 'complete' : 'partial' })
    .eq('id', params.id)

  return NextResponse.json({ success: true, batch })
}
