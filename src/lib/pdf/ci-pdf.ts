/**
 * Programmatic Commercial Invoice PDF generator (PDFKit).
 */
import type { CommercialInvoice, CIItem } from '@/types'
import {
  MARGIN_TOP,
  CELL_SEPARATOR,
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

export async function generateCIPDF(ci: CommercialInvoice): Promise<Buffer> {
  const { doc, finalize } = createDocument({
    title: `Commercial Invoice ${ci.invoice_number}`,
    subject: 'Commercial Invoice',
  })

  const refRows: HeaderRef[] = [
    { label: 'Invoice Number', value: ci.invoice_number },
    { label: 'Date', value: fmtDate(ci.invoice_date) },
  ]
  if (ci.purchase_order_number) refRows.push({ label: 'PO Number', value: ci.purchase_order_number })
  if (ci.awb_bl_number) refRows.push({ label: 'AWB / BL', value: ci.awb_bl_number })
  refRows.push({ label: 'Currency', value: ci.currency })
  if (ci.terms_of_sale) refRows.push({ label: 'Terms of Sale', value: ci.terms_of_sale })
  if (ci.country_of_origin) refRows.push({ label: 'Country of Origin', value: ci.country_of_origin })
  if (ci.final_destination) refRows.push({ label: 'Final Destination', value: ci.final_destination })

  let y = drawDocumentHeader(doc, MARGIN_TOP, 'Commercial Invoice', refRows)

  const shipperLines: (string | false | null | undefined)[] = [
    ci.shipper_name,
    ...(ci.shipper_address?.split('\n') ?? []),
  ]
  if (ci.notify_party) {
    shipperLines.push(CELL_SEPARATOR, 'NOTIFY PARTY', ...ci.notify_party.split('\n'))
  }

  y = drawAddressGrid(doc, y, [
    {
      title: 'Shipper',
      lines: compactLines(...shipperLines),
    },
    {
      title: 'Consignee',
      lines: compactLines(
        ci.consignee_name,
        ...(ci.consignee_address?.split('\n') ?? []),
        ci.intermediate_consignee && `Intermediate: ${ci.intermediate_consignee}`,
      ),
    },
  ], 2)

  const items = ci.ci_items ?? []
  if (items.length > 0) {
    const cols: TableCol[] = [
      { label: '#',                   w: 35,  align: 'left',  mono: true },
      { label: 'Product Description', w: 230, align: 'left' },
      { label: 'Qty',                 w: 50,  align: 'right' },
      { label: 'Unit Price',          w: 75,  align: 'right' },
      { label: 'Total Value',         w: 105, align: 'right' },
    ]
    const rows = items.map((it: CIItem) => [
      it.item_number ?? '',
      it.product_description ?? '—',
      fmtAmount(it.quantity, 0),
      `${ci.currency} ${fmtAmount(it.unit_price, 2)}`,
      `${ci.currency} ${fmtAmount(it.total_value, 2)}`,
    ])
    y = drawTable(doc, { startY: y, cols, rows, heading: 'Items' })
  }

  const totals: TotalRow[] = [
    { label: 'Total Invoice Amount', value: fmtMoney(ci.total_amount, ci.currency), emphasised: true },
  ]
  y = drawTotalsBox(doc, y + 8, totals, 260)

  if (ci.notes) {
    y = drawTextBlock(doc, y + 4, 'Notes', ci.notes, 70)
  }

  doc.end()
  return finalize()
}
