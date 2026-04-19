import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const quoteSchema = z.object({
  category: z.string().trim().min(1).max(60),
  itemDesc: z.string().trim().min(1).max(2000),
  quantity: z.string().trim().min(1).max(200),
  origin: z.string().trim().min(1).max(200),
  destination: z.string().trim().min(1).max(400),
  timeline: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(80).optional().default(''),
  notes: z.string().trim().max(4000).optional().default(''),
})

/**
 * POST /api/leads/quote
 * Public endpoint — accepts marketing website quote-request submissions and
 * inserts them into quote_requests. RLS allows anonymous INSERT.
 */
export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = quoteSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please complete all required fields with valid values.' },
      { status: 400 }
    )
  }

  const d = parsed.data
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('quote_requests')
    .insert({
      category: d.category,
      item_desc: d.itemDesc,
      quantity: d.quantity,
      origin: d.origin,
      destination: d.destination,
      timeline: d.timeline,
      company: d.company,
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      notes: d.notes || null,
    })
    .select('id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Unable to save request. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id, created_at: data.created_at }, { status: 201 })
}
