import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generatePOPDF } from '@/lib/pdf/po-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, po_items(*)')
    .eq('id', params.id)
    .single()

  if (error || !po) {
    return NextResponse.json({ error: error?.message ?? 'Purchase order not found' }, { status: 404 })
  }

  const pdf = await generatePOPDF(po)
  const filename = `PO-${po.po_number}.pdf`.replace(/[^A-Za-z0-9._-]/g, '_')

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
