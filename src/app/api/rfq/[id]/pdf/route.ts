import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generateRFQPDF } from '@/lib/pdf/rfq-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: rfq, error } = await supabase
    .from('rfqs')
    .select('*, rfq_items(*)')
    .eq('id', params.id)
    .single()

  if (error || !rfq) {
    return NextResponse.json({ error: error?.message ?? 'RFQ not found' }, { status: 404 })
  }

  if (Array.isArray(rfq.rfq_items)) {
    rfq.rfq_items.sort(
      (a: { sort_order?: number }, b: { sort_order?: number }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
  }

  const pdf = await generateRFQPDF(rfq)
  const filename = `RFQ-${rfq.rfq_number}.pdf`.replace(/[^A-Za-z0-9._-]/g, '_')

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
