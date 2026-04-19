// ============================================================
// Heritage Global Solutions ERP — TypeScript Types
// ============================================================

/**
 * Per-document status unions. Splitting these replaces the old catch-all
 * `DocumentStatus` and lets TypeScript catch invalid transitions at the
 * call site (e.g. an RFQ will never be `paid`).
 */
export type RFQStatus        = 'draft' | 'sent' | 'responded' | 'closed'
export type ProformaStatus   = 'draft' | 'sent' | 'accepted' | 'cancelled'
export type POStatus         = 'draft' | 'active' | 'partial' | 'complete' | 'cancelled'
export type CIStatus         = 'draft' | 'issued' | 'cancelled'
export type TIStatus         = 'draft' | 'issued' | 'paid' | 'cancelled'
export type PLStatus         = 'draft' | 'issued'

/**
 * @deprecated Prefer the per-document status aliases above. Kept as a union
 * of every known status for incremental migration; new code should not
 * reference this.
 */
export type DocumentStatus =
  | RFQStatus
  | ProformaStatus
  | POStatus
  | CIStatus
  | TIStatus
  | PLStatus

// ---- CLIENTS ---------------------------------------------------
export interface Client {
  id: string
  name: string
  customer_id: string | null
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  billing_address: string | null
  country: string | null
  vat_number: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CompanySettings {
  id?: string
  company_name: string
  vat_reg_number: string | null
  company_reg_number: string | null
  address: string | null
  gbp_bank_name: string | null
  gbp_account_name: string | null
  gbp_account_number: string | null
  gbp_sort_code: string | null
  gbp_iban: string | null
  gbp_swift: string | null
  usd_bank_name: string | null
  usd_account_name: string | null
  usd_account_number: string | null
  usd_sort_code: string | null
  usd_iban: string | null
  usd_swift: string | null
}
export type DocumentSource = 'manual' | 'uploaded'
export type POType = 'client' | 'standalone'

// ---- RFQ -------------------------------------------------------
export interface RFQ {
  id: string
  rfq_number: string
  rfq_date: string | null
  quotation_deadline: string | null
  delivery_date: string | null
  your_reference: string | null
  submission_email: string | null
  buyer_company: string | null
  buyer_site: string | null
  buyer_po_box: string | null
  buyer_country: string | null
  postal_address: string | null
  delivery_company: string | null
  delivery_town: string | null
  delivery_street: string | null
  delivery_post_code: string | null
  delivery_country: string | null
  contact_person: string | null
  contact_email: string | null
  contact_tel: string | null
  contact_fax: string | null
  vendor_name: string
  vendor_number: string | null
  vendor_address_line1: string | null
  vendor_city: string | null
  vendor_post_code: string | null
  vendor_country: string | null
  vendor_contact_person: string | null
  vendor_tel: string | null
  vendor_fax: string | null
  vendor_email: string | null
  comments: string | null
  status: RFQStatus
  source: DocumentSource
  original_pdf_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  rfq_items?: RFQItem[]
}

export interface RFQItem {
  id: string
  rfq_id: string
  item_number: string
  item_code: string | null
  description_short: string | null
  description_full: string | null
  oem: string | null
  part_number: string | null
  quantity: number
  unit: string
  unit_price: number | null
  currency: string | null
  sort_order: number
  created_at: string
}

// ---- PROFORMA INVOICE ------------------------------------------
export interface ProformaInvoice {
  id: string
  proforma_number: string
  rfq_id: string | null
  invoice_date: string
  valid_until_date: string | null
  client_company: string | null
  client_department: string | null
  client_address: string | null
  client_country: string | null
  client_phone: string | null
  airway_bill: string | null
  incoterm: string | null
  incoterm_country: string | null
  currency: string
  lead_time: string | null
  payment_terms: string | null
  vendor_name: string
  vendor_address: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  notes: string | null
  status: ProformaStatus
  client_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  proforma_items?: ProformaItem[]
  rfqs?: RFQ
}

export interface ProformaItem {
  id: string
  proforma_id: string
  item_number: string
  description: string | null
  quantity: number
  unit: string
  unit_price: number
  total_cost: number
  internal_notes: string | null
  sort_order: number
  created_at: string
}

// ---- PURCHASE ORDER --------------------------------------------
export interface PurchaseOrder {
  id: string
  rfq_id: string | null
  po_number: string
  po_date: string | null
  document_date: string | null
  version: string
  ship_to_company: string | null
  ship_to_town: string | null
  ship_to_po_box: string | null
  ship_to_post_code: string | null
  ship_to_country: string | null
  vendor_name: string
  vendor_po_box: string | null
  vendor_city: string | null
  vendor_post_code: string | null
  vendor_country: string | null
  vendor_tel: string | null
  vendor_fax: string | null
  vendor_email: string | null
  bill_to_company: string | null
  bill_to_site: string | null
  bill_to_po_box: string | null
  bill_to_town: string | null
  bill_to_country: string | null
  billing_email: string | null
  sales_person: string | null
  sp_telephone: string | null
  vendor_phone: string | null
  vendor_fax_field: string | null
  vendor_email_field: string | null
  contact_person: string | null
  currency: string
  inco_terms: string | null
  mode_of_transport: string | null
  payment_terms: string | null
  created_by_buyer: string | null
  created_by_email: string | null
  your_reference: string | null
  comments: string | null
  net_value: number
  gross_price: number
  customs_duties_percent: number
  customs_duties_amount: number
  total_amount: number
  instructions_to_vendor: string | null
  vendor_notes: string | null
  po_type: POType
  billing_address: string | null
  delivery_address: string | null
  purchase_total: number
  standalone_notes: string | null
  status: POStatus
  source: DocumentSource
  original_pdf_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  po_items?: POItem[]
  rfqs?: RFQ
}

export interface POItem {
  id: string
  po_id: string
  item_number: string
  material_code: string | null
  description_short: string | null
  description_full: string | null
  reference: string | null
  valuation_type: string | null
  oem: string | null
  part_number: string | null
  quantity: number
  unit: string
  delivery_date: string | null
  net_price: number
  per_quantity: number
  net_amount: number
  lead_amount: number | null
  product_url: string | null
  vendor_notes: string | null
  available_qty: number
  ready_to_ship: boolean
  shipped_qty: number
  fully_shipped: boolean
  unit_price: number
  total_price: number
  sort_order: number
  created_at: string
  updated_at: string
}

// ---- DISPATCH BATCH --------------------------------------------
export interface DispatchBatch {
  id: string
  po_id: string
  batch_number: number
  dispatched_at: string
  created_by: string | null
  notes: string | null
  dispatch_batch_items?: DispatchBatchItem[]
}

export interface DispatchBatchItem {
  id: string
  batch_id: string
  po_item_id: string
  dispatched_qty: number
}

// ---- COMMERCIAL INVOICE ----------------------------------------
export interface CommercialInvoice {
  id: string
  invoice_number: string
  po_id: string | null
  batch_id: string | null
  purchase_order_number: string | null
  invoice_date: string
  currency: string
  awb_bl_number: string | null
  country_of_origin: string | null
  terms_of_sale: string | null
  shipper_name: string
  shipper_address: string | null
  consignee_name: string | null
  consignee_address: string | null
  notify_party: string | null
  intermediate_consignee: string | null
  final_destination: string | null
  total_amount: number
  notes: string | null
  status: CIStatus
  created_by: string | null
  created_at: string
  updated_at: string
  ci_items?: CIItem[]
}

export interface CIItem {
  id: string
  ci_id: string
  po_item_id: string | null
  item_number: string
  product_description: string | null
  quantity: number
  unit_price: number
  total_value: number
  sort_order: number
  created_at: string
}

// ---- TAX INVOICE -----------------------------------------------
export interface TaxInvoice {
  id: string
  tax_invoice_number: string
  po_id: string | null
  batch_id: string | null
  purchase_order_number: string | null
  customer_name: string | null
  customer_id: string | null
  customer_address: string | null
  customer_phone: string | null
  payment_due_date: string | null
  sales_person: string | null
  payment_terms: string | null
  order_date: string | null
  delivery_date: string | null
  shipping_terms: string | null
  vat_reg_number: string | null
  company_reg_number: string | null
  invoice_date: string
  currency: string
  subtotal: number
  sales_tax_rate: number
  sales_tax_amount: number
  total_amount: number
  bank_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_sort_code: string | null
  bank_iban: string | null
  bank_swift: string | null
  notes: string | null
  status: TIStatus
  created_by: string | null
  created_at: string
  updated_at: string
  ti_items?: TIItem[]
}

export interface TIItem {
  id: string
  ti_id: string
  po_item_id: string | null
  item_number: string
  item_description: string | null
  quantity: number
  unit_price: number
  line_total: number
  sort_order: number
  created_at: string
}

// ---- PACKING LIST ----------------------------------------------
export interface PackingList {
  id: string
  po_id: string | null
  batch_id: string | null
  customer_po_number: string | null
  our_order_number: string | null
  final_destination: string | null
  shipped_via: string | null
  sales_person: string | null
  ship_to_address: string | null
  notes: string | null
  status: PLStatus
  created_by: string | null
  created_at: string
  updated_at: string
  packing_list_items?: PackingListItem[]
  packing_list_boxes?: PackingListBox[]
}

export interface PackingListItem {
  id: string
  packing_list_id: string
  po_item_id: string | null
  item_number: string
  quantity: number
  description: string | null
  sort_order: number
  created_at: string
}

export interface PackingListBox {
  id: string
  packing_list_id: string
  box_number: number
  box_type: string | null
  dimension_l: number | null
  dimension_w: number | null
  dimension_h: number | null
  gross_weight: number | null
  notes: string | null
  sort_order: number
  created_at: string
}

// ---- AI PARSING ------------------------------------------------
export interface ParsedRFQ {
  rfq_number: string
  rfq_date: string
  quotation_deadline: string
  delivery_date: string
  your_reference: string
  submission_email: string
  buyer_company: string
  buyer_site: string
  buyer_po_box: string
  buyer_country: string
  postal_address: string
  delivery_company: string
  delivery_town: string
  delivery_street: string
  delivery_post_code: string
  delivery_country: string
  contact_person: string
  contact_email: string
  contact_tel: string
  contact_fax: string
  vendor_name: string
  vendor_number: string
  vendor_address_line1: string
  vendor_city: string
  vendor_post_code: string
  vendor_country: string
  vendor_contact_person: string
  vendor_tel: string
  vendor_fax: string
  vendor_email: string
  comments: string
  items: ParsedRFQItem[]
}

export interface ParsedRFQItem {
  item_number: string
  item_code: string
  description_short: string
  description_full: string
  oem: string
  part_number: string
  quantity: number
  unit: string
}

export interface ParsedPO {
  po_number: string
  po_date: string
  currency: string
  inco_terms: string
  mode_of_transport: string
  payment_terms: string
  created_by_buyer: string
  created_by_email: string
  your_reference: string
  comments: string
  ship_to_company: string
  ship_to_town: string
  ship_to_po_box: string
  ship_to_post_code: string
  ship_to_country: string
  bill_to_company: string
  bill_to_site: string
  bill_to_po_box: string
  bill_to_town: string
  bill_to_country: string
  billing_email: string
  vendor_name: string
  vendor_po_box: string
  vendor_city: string
  vendor_post_code: string
  vendor_country: string
  vendor_tel: string
  vendor_fax: string
  vendor_email: string
  net_value: number
  gross_price: number
  customs_duties_percent: number
  customs_duties_amount: number
  total_amount: number
  items: ParsedPOItem[]
}

export interface ParsedPOItem {
  item_number: string
  material_code: string
  description_short: string
  description_full: string
  reference: string
  valuation_type: string
  oem: string
  part_number: string
  quantity: number
  unit: string
  delivery_date: string
  net_price: number
  per_quantity: number
  net_amount: number
}
