import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generatePLPDF } from '@/lib/pdf/pl-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: pl, error } = await supabase
    .from('packing_lists')
    .select('*, packing_list_items(*), packing_list_boxes(*)')
    .eq('id', params.id)
    .single()

  if (error || !pl) {
    return NextResponse.json({ error: error?.message ?? 'Packing list not found' }, { status: 404 })
  }

  if (Array.isArray(pl.packing_list_items)) {
    pl.packing_list_items.sort(
      (a: { sort_order?: number }, b: { sort_order?: number }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
  }
  if (Array.isArray(pl.packing_list_boxes)) {
    pl.packing_list_boxes.sort(
      (a: { sort_order?: number; box_number?: number }, b: { sort_order?: number; box_number?: number }) =>
        (a.sort_order ?? a.box_number ?? 0) - (b.sort_order ?? b.box_number ?? 0),
    )
  }

  const pdf = await generatePLPDF(pl)
  const ref = pl.our_order_number || pl.customer_po_number || pl.id
  const filename = `PackingList-${ref}.pdf`.replace(/[^A-Za-z0-9._-]/g, '_')

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(pdf.length),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
