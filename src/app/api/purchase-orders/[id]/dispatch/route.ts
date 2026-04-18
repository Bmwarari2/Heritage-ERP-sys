import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, dispatchSchema } from '@/lib/validation'

/**
 * POST /api/purchase-orders/[id]/dispatch
 * Delegates the entire 7-step flow (batch, batch items, po_item updates,
 * PO status, CI/TI/PL + items) to the `dispatch_po_batch` Postgres function,
 * which runs atomically in a single transaction. No race condition on
 * batch_number (UNIQUE(po_id, batch_number) + row lock), no partial failure
 * state, no burnt document numbers.
 *
 * Body: { items: [{ po_item_id, dispatched_qty }], notes?: string }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parsed = parse(dispatchSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { data, error } = await supabase.rpc('dispatch_po_batch', {
    p_po_id: params.id,
    p_items: parsed.items,
    p_notes: parsed.notes ?? null,
    p_created_by: user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // dispatch_po_batch returns a JSONB object with batch_id, ci_id, ti_id, pl_id, etc.
  const result = data as Record<string, unknown> | null
  return NextResponse.json({
    success: true,
    batch: { id: result?.batch_id, batch_number: result?.batch_number, po_id: params.id },
    ci_id: result?.ci_id ?? null,
    ti_id: result?.ti_id ?? null,
    pl_id: result?.pl_id ?? null,
    ci_number: result?.ci_number ?? null,
    ti_number: result?.ti_number ?? null,
  })
}
