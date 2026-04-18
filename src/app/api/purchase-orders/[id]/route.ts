import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, poUpdateSchema, poItemPatchSchema, stripManagedFields } from '@/lib/validation'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, po_items(*), rfqs(rfq_number, buyer_company), dispatch_batches(*, dispatch_batch_items(*), commercial_invoices(id, invoice_number), tax_invoices(id, tax_invoice_number), packing_lists(id))')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parsed = parse(poUpdateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { items, ...poData } = parsed
  const safe = stripManagedFields(poData as Record<string, unknown>)

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(safe)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items) {
    // Smart merge — preserves dispatch fields (shipped_qty, etc.).
    const { data: existing } = await supabase
      .from('po_items')
      .select('id')
      .eq('po_id', params.id)

    const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
    const submittedIds = new Set(items.filter(i => i.id).map(i => i.id as string))

    const toDelete = [...existingIds].filter(id => !submittedIds.has(id))
    if (toDelete.length > 0) {
      await supabase.from('po_items').delete().in('id', toDelete)
    }

    const editableFields = [
      'item_number', 'material_code', 'description_short', 'description_full',
      'reference', 'valuation_type', 'oem', 'part_number', 'quantity', 'unit',
      'delivery_date', 'net_price', 'per_quantity', 'net_amount', 'lead_amount',
      'unit_price', 'total_price',
    ] as const

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>
      if (item.id && existingIds.has(item.id as string)) {
        const patch: Record<string, unknown> = { sort_order: i }
        for (const f of editableFields) {
          if (item[f] !== undefined) patch[f] = item[f]
        }
        await supabase.from('po_items').update(patch).eq('id', item.id as string)
      } else {
        const clean = stripManagedFields(item)
        await supabase.from('po_items').insert({
          ...clean,
          po_id: params.id,
          sort_order: i,
          available_qty: (clean.available_qty as number | null | undefined) ?? (clean.quantity as number | undefined),
        })
      }
    }
  }

  return NextResponse.json(data)
}

// PATCH: update a single PO item's dispatch tracking / notes / product_url.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parsed = parse(poItemPatchSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const patch: Record<string, unknown> = {}
  if (parsed.available_qty !== undefined) patch.available_qty = parsed.available_qty
  if (parsed.ready_to_ship !== undefined) patch.ready_to_ship = parsed.ready_to_ship
  if (parsed.vendor_notes !== undefined) patch.vendor_notes = parsed.vendor_notes
  if (parsed.product_url !== undefined) {
    let url: string = parsed.product_url ?? ''
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`
    patch.product_url = url
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ success: true })
  }

  const { error } = await supabase
    .from('po_items')
    .update(patch)
    .eq('id', parsed.po_item_id)
    .eq('po_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
