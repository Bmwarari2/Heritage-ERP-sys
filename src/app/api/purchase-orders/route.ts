import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { parse, poCreateSchema, sanitizeSearchTerm, stripManagedFields } from '@/lib/validation'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 200

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = sanitizeSearchTerm(searchParams.get('search'))
  const status = searchParams.get('status') ?? ''
  const limit = Math.min(MAX_PAGE_SIZE, Number(searchParams.get('limit')) || DEFAULT_PAGE_SIZE)
  const offset = Math.max(0, Number(searchParams.get('offset')) || 0)

  let query = supabase
    .from('purchase_orders')
    .select('*, po_items(*), rfqs(rfq_number)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`po_number.ilike.%${search}%,ship_to_company.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const parsed = parse(poCreateSchema, body)
  if (parsed instanceof NextResponse) return parsed

  const { items, ...poData } = parsed
  const safe = stripManagedFields(poData as Record<string, unknown>)

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert(safe)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (items && items.length > 0) {
    const mapped = items.map((item, i) => {
      const clean = stripManagedFields(item as Record<string, unknown>)
      return {
        ...clean,
        po_id: po.id,
        sort_order: i,
        available_qty: (clean.available_qty as number | null | undefined) ?? (clean.quantity as number | undefined),
      }
    })
    const { error: itemsError } = await supabase.from('po_items').insert(mapped)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json(po, { status: 201 })
}
