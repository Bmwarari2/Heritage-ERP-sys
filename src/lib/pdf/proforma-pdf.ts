/**
 * Programmatic Proforma Invoice PDF generator (PDFKit).
 */
import type { ProformaInvoice, ProformaItem, RFQ } from '@/types'
import {
  MARGIN_TOP,
  createDocument,
  drawDocumentHeader,
  drawAddressGrid,
  drawTable,
  drawTotalsBox,
  drawTextBlock,
  fmtDate,
  fmtMoney,
  fmtAmount,
  compactLines,
  type HeaderRef,
  type TableCol,
  type TotalRow,
} from './shared'

export async function generateProformaPDF(pi: ProformaInvoice): Promise<Buffer> {
  const { doc, finalize } = createDocument({
    title: `Proforma ${pi.proforma_number}`,
    subject: 'Proforma Invoice',
  })

  const refRows: HeaderRef[] = [
    { label: 'Doc Number', value: pi.proforma_number },
    { label: 'Date', value: fmtDate(pi.invoice_date) },
  ]
  if (pi.valid_until_date) refRows.push({ label: 'Valid Until', value: fmtDate(pi.valid_until_date) })
  const refRfq = (pi.rfqs as RFQ | undefined)?.rfq_number
  if (refRfq) refRows.push({ label: 'Ref RFQ', value: refRfq })
  if (pi.currency) refRows.push({ label: 'Currency', value: pi.currency })

  let y = drawDocumentHeader(doc, MARGIN_TOP, 'Proforma Invoice', refRows)

  y = drawAddressGrid(doc, y, [
    {
      title: 'Bill To',
      lines: compactLines(
        pi.client_company,
        pi.client_department,
        pi.client_address,
        pi.client_country,
        pi.client_phone && `Phone: ${pi.client_phone}`,
      ),
    },
    {
      title: 'Shipping & Terms',
      lines: compactLines(
        pi.airway_bill && `Airway Bill: ${pi.airway_bill}`,
        pi.incoterm && `Incoterm: ${pi.incoterm}`,
        pi.incoterm_country && `Incoterm Country: ${pi.incoterm_country}`,
        `Currency: ${pi.currency}`,
      ),
    },
  ], 2)

  const items = pi.proforma_items ?? []
  if (items.length > 0) {
    const cols: TableCol[] = [
      { label: '#',           w: 35,  align: 'left',  mono: true },
      { label: 'Description', w: 250, align: 'left' },
      { label: 'Qty',         w: 50,  align: 'right' },
      { label: 'Unit Price',  w: 75,  align: 'right' },
      { label: 'Total Cost',  w: 85,  align: 'right' },
    ]
    const rows = items.map((it: ProformaItem) => [
      it.item_number ?? '',
      it.description ?? '—',
      fmtAmount(it.quantity, 0),
      `${pi.currency} ${fmtAmount(it.unit_price, 2)}`,
      `${pi.currency} ${fmtAmount(it.total_cost, 2)}`,
    ])
    y = drawTable(doc, { startY: y, cols, rows, heading: 'Items' })
  }

  const totals: TotalRow[] = [
    { label: 'Subtotal', value: `${pi.currency} ${fmtAmount(pi.subtotal, 2)}` },
  ]
  if (pi.tax_rate > 0) {
    totals.push({ label: `Tax (${pi.tax_rate}%)`, value: `${pi.currency} ${fmtAmount(pi.tax_amount, 2)}` })
  }
  totals.push({ label: 'Total', value: fmtMoney(pi.total_amount, pi.currency), emphasised: true })
  y = drawTotalsBox(doc, y + 8, totals, 240)

  if (pi.notes) {
    y = drawTextBlock(doc, y + 4, 'Notes', pi.notes, 80)
  }

  doc.end()
  return finalize()
}
