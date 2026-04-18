import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) return NextResponse.json({})

  const like = `%${q}%`

  const [pos, cis, tis, pls, proformas, clients, items, users] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('id, po_number, ship_to_company, bill_to_company, status, po_date')
      .or(`po_number.ilike.${like},ship_to_company.ilike.${like},bill_to_company.ilike.${like},your_reference.ilike.${like}`)
      .limit(10),

    supabase
      .from('commercial_invoices')
      .select('id, invoice_number, consignee_name, purchase_order_number, status, invoice_date')
      .or(`invoice_number.ilike.${like},consignee_name.ilike.${like},purchase_order_number.ilike.${like}`)
      .limit(10),

    supabase
      .from('tax_invoices')
      .select('id, tax_invoice_number, customer_name, purchase_order_number, status, invoice_date')
      .or(`tax_invoice_number.ilike.${like},customer_name.ilike.${like},purchase_order_number.ilike.${like}`)
      .limit(10),

    supabase
      .from('packing_lists')
      .select('id, customer_po_number, our_order_number, ship_to_address, final_destination, status')
      .or(`customer_po_number.ilike.${like},our_order_number.ilike.${like},ship_to_address.ilike.${like},final_destination.ilike.${like}`)
      .limit(10),

    supabase
      .from('proforma_invoices')
      .select('id, proforma_number, client_company, status, invoice_date')
      .or(`proforma_number.ilike.${like},client_company.ilike.${like},client_address.ilike.${like}`)
      .limit(10),

    supabase
      .from('clients')
      .select('id, name, email, contact_person, country')
      .or(`name.ilike.${like},email.ilike.${like},contact_person.ilike.${like},country.ilike.${like}`)
      .limit(10),

    supabase
      .from('po_items')
      .select('id, po_id, item_number, description_short, material_code, oem, part_number, purchase_orders(po_number, ship_to_company)')
      .or(`description_short.ilike.${like},description_full.ilike.${like},material_code.ilike.${like},oem.ilike.${like},part_number.ilike.${like}`)
      .limit(10),

    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .or(`full_name.ilike.${like},email.ilike.${like}`)
      .limit(10),
  ])

  return NextResponse.json({
    purchase_orders: pos.data ?? [],
    commercial_invoices: cis.data ?? [],
    tax_invoices: tis.data ?? [],
    packing_lists: pls.data ?? [],
    proforma_invoices: proformas.data ?? [],
    clients: clients.data ?? [],
    items: items.data ?? [],
    users: users.data ?? [],
  })
}
