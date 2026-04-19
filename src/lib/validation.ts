import { z } from 'zod'
import { NextResponse } from 'next/server'

// ============================================================
// Helpers
// ============================================================

/**
 * Parse an unknown body against a Zod schema. Returns a Response on failure
 * and the typed value on success. Usage:
 *
 *   const parsed = parse(schema, body); if (parsed instanceof Response) return parsed
 */
export function parse<T>(schema: z.ZodType<T>, input: unknown): T | NextResponse {
  const result = schema.safeParse(input)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: result.error.flatten() },
      { status: 400 }
    )
  }
  return result.data
}

/**
 * Sanitise a free-text search term so it cannot break out of a PostgREST
 * `.or()` filter. Strips commas, parentheses, backticks, and % / _ which
 * would broaden the ilike pattern. Trims and caps to 120 chars.
 */
export function sanitizeSearchTerm(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .trim()
    .slice(0, 120)
    .replace(/[,()`%_*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Strip server-managed columns a client is not allowed to set.
 * Call on every insert/update payload to avoid privilege escalation via
 * created_by/created_at tampering.
 */
export function stripManagedFields<T extends Record<string, unknown>>(obj: T): T {
  const clone = { ...obj }
  delete (clone as Record<string, unknown>).created_by
  delete (clone as Record<string, unknown>).created_at
  delete (clone as Record<string, unknown>).updated_at
  delete (clone as Record<string, unknown>).id
  return clone
}

// Coerce '' to null for DATE-typed columns
function dateField() {
  return z.preprocess(
    v => (v === '' || v === undefined ? null : v),
    z.string().nullable()
  )
}

// Numeric coercion: accepts number | "123" | "" | null
function numField(defaultValue: number | null = null) {
  return z.preprocess(
    v => {
      if (v === '' || v === null || v === undefined) return defaultValue
      const n = typeof v === 'number' ? v : Number(v)
      return Number.isFinite(n) ? n : defaultValue
    },
    z.number().nullable()
  )
}

const nullableString = () => z.string().nullable().optional()
const optionalString = () => z.string().optional()

// ============================================================
// Schemas
// ============================================================

// ---- RFQ ---------------------------------------------------
export const rfqItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    item_number: z.string().min(1).max(50),
    item_code: nullableString(),
    description_short: nullableString(),
    description_full: nullableString(),
    oem: nullableString(),
    part_number: nullableString(),
    quantity: numField(0),
    unit: optionalString(),
    unit_price: numField(),
    currency: nullableString(),
    sort_order: z.number().int().optional(),
  })
  .passthrough() // tolerate extra keys rather than 400

const rfqStatuses = z.enum(['draft', 'sent', 'responded', 'closed'])

const rfqBase = z
  .object({
    rfq_number: z.string().min(1).max(50),
    rfq_date: dateField().optional(),
    quotation_deadline: dateField().optional(),
    delivery_date: dateField().optional(),
    your_reference: nullableString(),
    submission_email: z.string().email().nullable().optional().or(z.literal('')),
    buyer_company: nullableString(),
    buyer_site: nullableString(),
    buyer_po_box: nullableString(),
    buyer_country: nullableString(),
    postal_address: nullableString(),
    delivery_company: nullableString(),
    delivery_town: nullableString(),
    delivery_street: nullableString(),
    delivery_post_code: nullableString(),
    delivery_country: nullableString(),
    contact_person: nullableString(),
    contact_email: nullableString(),
    contact_tel: nullableString(),
    contact_fax: nullableString(),
    vendor_name: optionalString(),
    vendor_number: nullableString(),
    vendor_address_line1: nullableString(),
    vendor_city: nullableString(),
    vendor_post_code: nullableString(),
    vendor_country: nullableString(),
    vendor_contact_person: nullableString(),
    vendor_tel: nullableString(),
    vendor_fax: nullableString(),
    vendor_email: nullableString(),
    comments: nullableString(),
    status: rfqStatuses.optional(),
    source: z.enum(['manual', 'uploaded']).optional(),
    original_pdf_url: nullableString(),
    items: z.array(rfqItemSchema).optional(),
  })
  .passthrough()

export const rfqCreateSchema = rfqBase
export const rfqUpdateSchema = rfqBase.partial()

// ---- PROFORMA ---------------------------------------------
export const proformaItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    item_number: z.string().min(1).max(50),
    description: nullableString(),
    quantity: numField(0),
    unit: optionalString(),
    unit_price: numField(0),
    internal_notes: nullableString(),
    sort_order: z.number().int().optional(),
  })
  .passthrough()

const proformaBase = z
  .object({
    proforma_number: optionalString(),
    rfq_id: z.string().uuid().nullable().optional(),
    invoice_date: dateField().optional(),
    valid_until_date: dateField().optional(),
    client_id: z.string().uuid().nullable().optional(),
    client_company: nullableString(),
    client_department: nullableString(),
    client_address: nullableString(),
    client_country: nullableString(),
    client_phone: nullableString(),
    airway_bill: nullableString(),
    incoterm: nullableString(),
    incoterm_country: nullableString(),
    currency: optionalString(),
    lead_time: nullableString(),
    payment_terms: nullableString(),
    vendor_name: optionalString(),
    vendor_address: nullableString(),
    subtotal: numField(0),
    tax_rate: numField(0),
    tax_amount: numField(0),
    total_amount: numField(0),
    notes: nullableString(),
    status: z.enum(['draft', 'sent', 'accepted', 'cancelled']).optional(),
    items: z.array(proformaItemSchema).optional(),
  })
  .passthrough()

export const proformaCreateSchema = proformaBase
export const proformaUpdateSchema = proformaBase.partial()

// ---- PO ---------------------------------------------------
export const poItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    item_number: z.string().min(1).max(50),
    material_code: nullableString(),
    description_short: nullableString(),
    description_full: nullableString(),
    reference: nullableString(),
    valuation_type: nullableString(),
    oem: nullableString(),
    part_number: nullableString(),
    quantity: numField(0),
    unit: optionalString(),
    delivery_date: dateField().optional(),
    net_price: numField(0),
    per_quantity: numField(1),
    net_amount: numField(0),
    lead_amount: numField(),
    available_qty: numField(),
    unit_price: numField(0),
    total_price: numField(0),
    sort_order: z.number().int().optional(),
  })
  .passthrough()

const poBase = z
  .object({
    rfq_id: z.string().uuid().nullable().optional(),
    po_number: z.string().min(1).max(50),
    po_date: dateField().optional(),
    document_date: nullableString(),
    version: optionalString(),
    // All address + contact fields are tolerant strings
    ship_to_company: nullableString(), ship_to_town: nullableString(),
    ship_to_po_box: nullableString(), ship_to_post_code: nullableString(),
    ship_to_country: nullableString(),
    vendor_name: optionalString(), vendor_po_box: nullableString(),
    vendor_city: nullableString(), vendor_post_code: nullableString(),
    vendor_country: nullableString(), vendor_tel: nullableString(),
    vendor_fax: nullableString(), vendor_email: nullableString(),
    bill_to_company: nullableString(), bill_to_site: nullableString(),
    bill_to_po_box: nullableString(), bill_to_town: nullableString(),
    bill_to_country: nullableString(), billing_email: nullableString(),
    sales_person: nullableString(), sp_telephone: nullableString(),
    vendor_phone: nullableString(), vendor_fax_field: nullableString(),
    vendor_email_field: nullableString(), contact_person: nullableString(),
    currency: optionalString(), inco_terms: nullableString(),
    mode_of_transport: nullableString(), payment_terms: nullableString(),
    created_by_buyer: nullableString(), created_by_email: nullableString(),
    your_reference: nullableString(), comments: nullableString(),
    net_value: numField(0), gross_price: numField(0),
    customs_duties_percent: numField(0), customs_duties_amount: numField(0),
    total_amount: numField(0),
    instructions_to_vendor: nullableString(), vendor_notes: nullableString(),
    po_type: z.enum(['client', 'standalone']).optional(),
    billing_address: nullableString(), delivery_address: nullableString(),
    purchase_total: numField(0), standalone_notes: nullableString(),
    status: z.enum(['draft', 'active', 'partial', 'complete', 'cancelled']).optional(),
    source: z.enum(['manual', 'uploaded']).optional(),
    original_pdf_url: nullableString(),
    client_id: z.string().uuid().nullable().optional(),
    items: z.array(poItemSchema).optional(),
  })
  .passthrough()

export const poCreateSchema = poBase
export const poUpdateSchema = poBase.partial()

export const poItemPatchSchema = z.object({
  po_item_id: z.string().uuid(),
  available_qty: numField().optional(),
  ready_to_ship: z.boolean().optional(),
  vendor_notes: nullableString(),
  product_url: nullableString(),
})

// ---- DISPATCH ---------------------------------------------
export const dispatchSchema = z.object({
  items: z
    .array(
      z.object({
        po_item_id: z.string().uuid(),
        dispatched_qty: z.coerce.number().positive(),
      })
    )
    .min(1, 'At least one item is required'),
  notes: nullableString(),
})

// ---- CI / TI / PL -----------------------------------------
const ciItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    po_item_id: z.string().uuid().nullable().optional(),
    item_number: z.string().min(1).max(50),
    product_description: nullableString(),
    quantity: numField(0),
    unit_price: numField(0),
    sort_order: z.number().int().optional(),
  })
  .passthrough()

const ciBase = z
  .object({
    invoice_number: optionalString(),
    po_id: z.string().uuid().nullable().optional(),
    batch_id: z.string().uuid().nullable().optional(),
    purchase_order_number: nullableString(),
    invoice_date: dateField().optional(),
    currency: optionalString(),
    awb_bl_number: nullableString(),
    country_of_origin: nullableString(),
    terms_of_sale: nullableString(),
    shipper_name: optionalString(),
    shipper_address: nullableString(),
    consignee_name: nullableString(),
    consignee_address: nullableString(),
    notify_party: nullableString(),
    intermediate_consignee: nullableString(),
    final_destination: nullableString(),
    total_amount: numField(0),
    notes: nullableString(),
    status: z.enum(['draft', 'issued', 'cancelled']).optional(),
    client_id: z.string().uuid().nullable().optional(),
    items: z.array(ciItemSchema).optional(),
  })
  .passthrough()

export const ciCreateSchema = ciBase
export const ciUpdateSchema = ciBase.partial()

const tiItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    po_item_id: z.string().uuid().nullable().optional(),
    item_number: z.string().min(1).max(50),
    item_description: nullableString(),
    quantity: numField(0),
    unit_price: numField(0),
    sort_order: z.number().int().optional(),
  })
  .passthrough()

const tiBase = z
  .object({
    tax_invoice_number: optionalString(),
    po_id: z.string().uuid().nullable().optional(),
    batch_id: z.string().uuid().nullable().optional(),
    purchase_order_number: nullableString(),
    customer_name: nullableString(),
    customer_id: nullableString(),
    customer_address: nullableString(),
    customer_phone: nullableString(),
    payment_due_date: dateField().optional(),
    sales_person: nullableString(),
    payment_terms: nullableString(),
    order_date: dateField().optional(),
    delivery_date: dateField().optional(),
    shipping_terms: nullableString(),
    vat_reg_number: nullableString(),
    company_reg_number: nullableString(),
    invoice_date: dateField().optional(),
    currency: optionalString(),
    subtotal: numField(0),
    sales_tax_rate: numField(0),
    sales_tax_amount: numField(0),
    total_amount: numField(0),
    bank_name: nullableString(),
    bank_account_name: nullableString(),
    bank_account_number: nullableString(),
    bank_sort_code: nullableString(),
    bank_iban: nullableString(),
    bank_swift: nullableString(),
    notes: nullableString(),
    status: z.enum(['draft', 'issued', 'paid', 'cancelled']).optional(),
    client_id: z.string().uuid().nullable().optional(),
    items: z.array(tiItemSchema).optional(),
  })
  .passthrough()

export const tiCreateSchema = tiBase
export const tiUpdateSchema = tiBase.partial()

const plItemSchema = z
  .object({
    id: z.string().uuid().optional(),
    po_item_id: z.string().uuid().nullable().optional(),
    item_number: z.string().min(1).max(50),
    description: nullableString(),
    quantity: numField(0),
    sort_order: z.number().int().optional(),
  })
  .passthrough()

const plBoxSchema = z
  .object({
    id: z.string().uuid().optional(),
    box_number: z.number().int().nonnegative(),
    box_type: nullableString(),
    dimension_l: numField(),
    dimension_w: numField(),
    dimension_h: numField(),
    gross_weight: numField(),
    notes: nullableString(),
    sort_order: z.number().int().optional(),
  })
  .passthrough()

const plBase = z
  .object({
    po_id: z.string().uuid().nullable().optional(),
    batch_id: z.string().uuid().nullable().optional(),
    customer_po_number: nullableString(),
    our_order_number: nullableString(),
    final_destination: nullableString(),
    shipped_via: nullableString(),
    sales_person: nullableString(),
    ship_to_address: nullableString(),
    notes: nullableString(),
    status: z.enum(['draft', 'issued']).optional(),
    client_id: z.string().uuid().nullable().optional(),
    items: z.array(plItemSchema).optional(),
    boxes: z.array(plBoxSchema).optional(),
  })
  .passthrough()

export const plCreateSchema = plBase
export const plUpdateSchema = plBase.partial()

// ---- CLIENTS ----------------------------------------------
const clientBase = z
  .object({
    name: z.string().min(1).max(200),
    customer_id: nullableString(),
    contact_person: nullableString(),
    email: nullableString(),
    phone: nullableString(),
    address: nullableString(),
    billing_address: nullableString(),
    notify_party: nullableString(),
    country: nullableString(),
    vat_number: nullableString(),
    notes: nullableString(),
  })
  .passthrough()

export const clientCreateSchema = clientBase
export const clientUpdateSchema = clientBase.partial()

// ---- COMPANY SETTINGS -------------------------------------
export const companySettingsUpdateSchema = z
  .object({
    company_name: optionalString(),
    vat_reg_number: nullableString(),
    company_reg_number: nullableString(),
    address: nullableString(),
    gbp_bank_name: nullableString(), gbp_account_name: nullableString(),
    gbp_account_number: nullableString(), gbp_sort_code: nullableString(),
    gbp_iban: nullableString(), gbp_swift: nullableString(),
    usd_bank_name: nullableString(), usd_account_name: nullableString(),
    usd_account_number: nullableString(), usd_sort_code: nullableString(),
    usd_iban: nullableString(), usd_swift: nullableString(),
    default_vat_rate: numField(),
    default_country_of_origin: nullableString(),
    default_currency: optionalString(),
  })
  .partial()
  .passthrough()

// ---- AUTH -------------------------------------------------
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, 'Password must be at least 10 characters.'),
})

export const updateProfileSchema = z.object({
  full_name: z.string().max(200).nullable(),
})
