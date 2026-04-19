import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generateCIPDF } from '@/lib/pdf/ci-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: ci, error } = await supabase
    .from('commercial_invoices')
    .select('*, ci_items(*)')
    .eq('id', params.id)
    .single()

  if (error || !ci) {
    return NextResponse.json({ error: error?.message ?? 'Commercial invoice not found' }, { status: 404 })
  }

  if (Array.isArray(ci.ci_items)) {
    ci.ci_items.sort(
      (a: { sort_order?: number }, b: { sort_order?: number }) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
  }

  const pdf = await generateCIPDF(ci)
  const filename = `CI-${ci.invoice_number}.pdf`.replace(/[^A-Za-z0-9._-]/g, '_')

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
