import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generateProformaPDF } from '@/lib/pdf/proforma-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: pi, error } = await supabase
    .from('proforma_invoices')
    .select('*, proforma_items(*), rfqs(rfq_number, buyer_company)')
    .eq('id', params.id)
    .single()

  if (error || !pi) {
    return NextResponse.json({ error: error?.message ?? 'Proforma not found' }, { status: 404 })
  }

  if (Array.isArray(pi.proforma_items)) {
    pi.proforma_items.sort(
      (a: { sort_order?: number }, b: { sort_order?: number }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
  }

  const pdf = await generateProformaPDF(pi)
  const filename = `Proforma-${pi.proforma_number}.pdf`.replace(/[^A-Za-z0-9._-]/g, '_')

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
