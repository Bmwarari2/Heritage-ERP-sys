import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

/**
 * GET /api/dispatch-batches/[id]
 * Returns a dispatch batch with its items joined to po_items and the parent PO.
 * Used by CI/TI/PL "new" pages to pre-populate items from a dispatch.
 */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('dispatch_batches')
    .select('*, dispatch_batch_items(*, po_items(*)), purchase_orders(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}
