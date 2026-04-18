import Anthropic from '@anthropic-ai/sdk'
import type { ParsedRFQ, ParsedPO } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ============================================================
// RFQ PARSING
// ============================================================
export async function parseRFQFromText(pdfText: string): Promise<ParsedRFQ> {
  const systemPrompt = `You are an expert procurement document parser for Heritage Global Solutions Ltd.
Your job is to extract structured data from Request for Quotation (RFQ) documents.
Return ONLY valid JSON matching the exact schema provided. Do not include any explanation.

RULES:
- Dates must be in ISO format YYYY-MM-DD (convert from DD.MM.YYYY)
- Quantities are numeric floats
- Unit prices in RFQs are BLANK — always return null for unit_price and currency
- OEM and Part Number are embedded in item descriptions after "OEM:" and "PART NO:" labels
- Item numbers increment in 10s (10, 20, 30...)
- If a field is not found, return an empty string "" for text fields, 0 for numbers
- The vendor is always Heritage Global Solutions Ltd`

  const userPrompt = `Parse this RFQ document and return JSON exactly matching this TypeScript interface:

{
  rfq_number: string,
  rfq_date: string,           // YYYY-MM-DD
  quotation_deadline: string, // YYYY-MM-DD
  delivery_date: string,      // YYYY-MM-DD
  your_reference: string,     // STK number
  submission_email: string,
  buyer_company: string,
  buyer_site: string,
  buyer_po_box: string,
  buyer_country: string,
  postal_address: string,
  delivery_company: string,
  delivery_town: string,
  delivery_street: string,
  delivery_post_code: string,
  delivery_country: string,
  contact_person: string,
  contact_email: string,
  contact_tel: string,
  contact_fax: string,
  vendor_name: string,
  vendor_number: string,
  vendor_address_line1: string,
  vendor_city: string,
  vendor_post_code: string,
  vendor_country: string,
  vendor_contact_person: string,
  vendor_tel: string,
  vendor_fax: string,
  vendor_email: string,
  comments: string,
  items: Array<{
    item_number: string,
    item_code: string,
    description_short: string,
    description_full: string,
    oem: string,
    part_number: string,
    quantity: number,
    unit: string
  }>
}

Document text:
${pdfText}`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  // Extract JSON from the response
  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  return JSON.parse(jsonMatch[0]) as ParsedRFQ
}

// ============================================================
// PO PARSING
// ============================================================
export async function parsePOFromText(pdfText: string): Promise<ParsedPO> {
  const systemPrompt = `You are an expert procurement document parser for Heritage Global Solutions Ltd.
Your job is to extract structured data from Purchase Order (PO) documents.
Return ONLY valid JSON matching the exact schema provided. Do not include any explanation.

RULES:
- Dates must be in ISO format YYYY-MM-DD (convert from DD.MM.YYYY)
- All numeric fields are floats
- OEM and Part Number are embedded in item descriptions after "OEM:" and "PART NO:" labels
- Item numbers increment in 10s (10, 20, 30...)
- If a field is not found, return an empty string "" for text fields, 0 for numbers
- The vendor is always Heritage Global Solutions Ltd`

  const userPrompt = `Parse this Purchase Order document and return JSON exactly matching this TypeScript interface:

{
  po_number: string,
  po_date: string,              // YYYY-MM-DD
  currency: string,
  inco_terms: string,
  mode_of_transport: string,
  payment_terms: string,
  created_by_buyer: string,
  created_by_email: string,
  your_reference: string,
  comments: string,
  ship_to_company: string,
  ship_to_town: string,
  ship_to_po_box: string,
  ship_to_post_code: string,
  ship_to_country: string,
  bill_to_company: string,
  bill_to_site: string,
  bill_to_po_box: string,
  bill_to_town: string,
  bill_to_country: string,
  billing_email: string,
  vendor_name: string,
  vendor_po_box: string,
  vendor_city: string,
  vendor_post_code: string,
  vendor_country: string,
  vendor_tel: string,
  vendor_fax: string,
  vendor_email: string,
  net_value: number,
  gross_price: number,
  customs_duties_percent: number,
  customs_duties_amount: number,
  total_amount: number,
  items: Array<{
    item_number: string,
    material_code: string,
    description_short: string,
    description_full: string,
    reference: string,
    valuation_type: string,
    oem: string,
    part_number: string,
    quantity: number,
    unit: string,
    delivery_date: string,      // YYYY-MM-DD
    net_price: number,
    per_quantity: number,
    net_amount: number
  }>
}

Document text:
${pdfText}`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const text = content.text.trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  return JSON.parse(jsonMatch[0]) as ParsedPO
}
