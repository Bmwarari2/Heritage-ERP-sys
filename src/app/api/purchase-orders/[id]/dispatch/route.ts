import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * POST /api/purchase-orders/[id]/dispatch
 * Creates a dispatch batch, updates shipped quantities, then auto-creates a
 * draft Commercial Invoice, Tax Invoice, and Packing List for that batch.
 * Body: { items: [{ po_item_id, dispatched_qty }], notes?: string }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await request.json()
  const { items, notes } = body

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items provided for dispatch' }, { status: 400 })
  }

  // ── 1. Create dispatch batch ────────────────────────────────────────────────
  const { count } = await supabase
    .from('dispatch_batches')
    .select('*', { count: 'exact', head: true })
    .eq('po_id', params.id)

  const batchNumber = (count ?? 0) + 1

  const { data: batch, error: batchError } = await supabase
    .from('dispatch_batches')
    .insert({ po_id: params.id, batch_number: batchNumber, notes })
    .select()
    .single()

  if (batchError) return NextResponse.json({ error: batchError.message }, { status: 500 })

  // ── 2. Insert batch items ───────────────────────────────────────────────────
  const batchItemRows = (items as { po_item_id: string; dispatched_qty: number }[]).map(item => ({
    batch_id: batch.id,
    po_item_id: item.po_item_id,
    dispatched_qty: item.dispatched_qty,
  }))
  await supabase.from('dispatch_batch_items').insert(batchItemRows)

  // ── 3. Update shipped_qty on each po_item; reset avail_qty to what's left ──
  const dispatchedMap: Record<string, number> = {}
  for (const item of items as { po_item_id: string; dispatched_qty: number }[]) {
    const { data: poItem } = await supabase
      .from('po_items')
      .select('quantity, shipped_qty')
      .eq('id', item.po_item_id)
      .single()

    if (poItem) {
      const newShipped = (poItem.shipped_qty || 0) + item.dispatched_qty
      const fullyShipped = newShipped >= poItem.quantity
      const remaining = Math.max(0, poItem.quantity - newShipped)
      await supabase
        .from('po_items')
        .update({
          shipped_qty: newShipped,
          fully_shipped: fullyShipped,
          ready_to_ship: false,
          available_qty: fullyShipped ? 0 : remaining,
        })
        .eq('id', item.po_item_id)
      dispatchedMap[item.po_item_id] = item.dispatched_qty
    }
  }

  // ── 4. Update PO status ─────────────────────────────────────────────────────
  const { data: allItems } = await supabase
    .from('po_items')
    .select('fully_shipped')
    .eq('po_id', params.id)

  const allDone = allItems?.every((i: { fully_shipped: boolean }) => i.fully_shipped) ?? false
  await supabase
    .from('purchase_orders')
    .update({ status: allDone ? 'complete' : 'partial' })
    .eq('id', params.id)

  // ── 5. Fetch PO header and dispatched po_items for document auto-creation ──
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', params.id)
    .single()

  const poItemIds = (items as { po_item_id: string }[]).map(i => i.po_item_id)
  const { data: poItems } = await supabase
    .from('po_items')
    .select('*')
    .in('id', poItemIds)

  if (!po || !poItems) {
    return NextResponse.json({ success: true, batch })
  }

  // Address helpers
  const billToLines = [
    po.bill_to_company, po.bill_to_site,
    po.bill_to_po_box ? `PO Box ${po.bill_to_po_box}` : null,
    po.bill_to_town, po.bill_to_country,
  ].filter(Boolean).join('\n')

  const shipToLines = [
    po.ship_to_company,
    po.ship_to_po_box ? `PO Box ${po.ship_to_po_box}` : null,
    [po.ship_to_town, po.ship_to_post_code].filter(Boolean).join(' '),
    po.ship_to_country,
  ].filter(Boolean).join('\n')

  const vendorAddrLines = [
    [po.vendor_city, po.vendor_post_code].filter(Boolean).join(' '),
    po.vendor_country,
  ].filter(Boolean).join('\n')

  // Map po_item_id → dispatched_qty
  const ciItems = poItems.map((pi: Record<string, unknown>) => ({
    item_number: pi.item_number as string,
    product_description: [pi.description_short, pi.description_full].filter(Boolean).join(' — '),
    quantity: dispatchedMap[pi.id as string] ?? 0,
    unit_price: Number(pi.net_price) || Number(pi.unit_price) || 0,
  }))

  const tiItems = poItems.map((pi: Record<string, unknown>) => ({
    item_number: pi.item_number as string,
    item_description: [pi.description_short, pi.description_full].filter(Boolean).join(' — '),
    quantity: dispatchedMap[pi.id as string] ?? 0,
    unit_price: Number(pi.net_price) || Number(pi.unit_price) || 0,
  }))

  const plItems = poItems.map((pi: Record<string, unknown>) => ({
    item_number: pi.item_number as string,
    description: [pi.description_short, pi.description_full].filter(Boolean).join(' — '),
    quantity: dispatchedMap[pi.id as string] ?? 0,
  }))

  // ── 6. Auto-create Commercial Invoice (draft) ───────────────────────────────
  let ciId: string | null = null
  const { data: ciNum } = await supabase.rpc('next_doc_number', { p_doc_type: 'commercial_invoice' })
  const ciTotal = ciItems.reduce((s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0)
  const { data: ci } = await supabase
    .from('commercial_invoices')
    .insert({
      po_id: params.id,
      batch_id: batch.id,
      invoice_number: ciNum,
      purchase_order_number: po.po_number,
      invoice_date: new Date().toISOString().slice(0, 10),
      currency: po.currency || 'GBP',
      country_of_origin: 'United Kingdom',
      terms_of_sale: po.inco_terms || '',
      shipper_name: po.vendor_name || 'Heritage Global Solutions Ltd',
      shipper_address: vendorAddrLines,
      consignee_name: po.bill_to_company || po.ship_to_company || '',
      consignee_address: billToLines || shipToLines,
      total_amount: ciTotal,
      status: 'draft',
    })
    .select()
    .single()

  if (ci) {
    ciId = ci.id
    await supabase.from('ci_items').insert(
      ciItems.map((item: Record<string, unknown>, idx: number) => ({ ...item, ci_id: ci.id, sort_order: idx }))
    )
  }

  // ── 7. Auto-create Tax Invoice (draft) ─────────────────────────────────────
  let tiId: string | null = null
  const { data: tiNum } = await supabase.rpc('next_doc_number', { p_doc_type: 'tax_invoice' })
  const tiSubtotal = tiItems.reduce((s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0)
  const { data: ti } = await supabase
    .from('tax_invoices')
    .insert({
      po_id: params.id,
      batch_id: batch.id,
      tax_invoice_number: tiNum,
      purchase_order_number: po.po_number,
      invoice_date: new Date().toISOString().slice(0, 10),
      order_date: po.po_date,
      currency: po.currency || 'GBP',
      payment_terms: po.payment_terms || '',
      shipping_terms: po.inco_terms || '',
      sales_person: po.sales_person || '',
      customer_name: po.bill_to_company || po.ship_to_company || '',
      customer_address: billToLines || shipToLines,
      subtotal: tiSubtotal,
      sales_tax_rate: 0,
      sales_tax_amount: 0,
      total_amount: tiSubtotal,
      status: 'draft',
    })
    .select()
    .single()

  if (ti) {
    tiId = ti.id
    await supabase.from('ti_items').insert(
      tiItems.map((item: Record<string, unknown>, idx: number) => ({ ...item, ti_id: ti.id, sort_order: idx }))
    )
  }

  // ── 8. Auto-create Packing List (draft) ────────────────────────────────────
  let plId: string | null = null
  const { data: pl } = await supabase
    .from('packing_lists')
    .insert({
      po_id: params.id,
      batch_id: batch.id,
      customer_po_number: po.po_number,
      our_order_number: po.your_reference || '',
      shipped_via: po.mode_of_transport || '',
      sales_person: po.sales_person || '',
      ship_to_address: shipToLines,
      status: 'draft',
    })
    .select()
    .single()

  if (pl) {
    plId = pl.id
    await supabase.from('packing_list_items').insert(
      plItems.map((item: Record<string, unknown>, idx: number) => ({ ...item, packing_list_id: pl.id, sort_order: idx }))
    )
  }

  return NextResponse.json({ success: true, batch, ci_id: ciId, ti_id: tiId, pl_id: plId })
}
