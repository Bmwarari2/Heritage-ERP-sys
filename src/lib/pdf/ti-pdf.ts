/**
 * Programmatic Tax Invoice PDF generator (PDFKit). Includes a payment
 * details (bank) section after totals.
 */
import type { TaxInvoice, TIItem } from '@/types'
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

export async function generateTIPDF(ti: TaxInvoice): Promise<Buffer> {
  const { doc, finalize } = createDocument({
    title: `Tax Invoice ${ti.tax_invoice_number}`,
    subject: 'Tax Invoice',
  })

  const refRows: HeaderRef[] = [
    { label: 'Invoice Number', value: ti.tax_invoice_number },
    { label: 'Invoice Date', value: fmtDate(ti.invoice_date) },
  ]
  if (ti.payment_due_date) refRows.push({ label: 'Payment Due', value: fmtDate(ti.payment_due_date) })
  if (ti.payment_terms) refRows.push({ label: 'Payment Terms', value: ti.payment_terms })
  if (ti.purchase_order_number) refRows.push({ label: 'PO Number', value: ti.purchase_order_number })
  if (ti.currency) refRows.push({ label: 'Currency', value: ti.currency })

  let y = drawDocumentHeader(doc, MARGIN_TOP, 'Tax Invoice', refRows)

  y = drawAddressGrid(doc, y, [
    {
      title: 'Bill To',
      lines: compactLines(
        ti.customer_name,
        ti.customer_id && `Customer ID: ${ti.customer_id}`,
        ...(ti.customer_address?.split('\n') ?? []),
        ti.customer_phone && `Phone: ${ti.customer_phone}`,
      ),
    },
    {
      title: 'Order Details',
      lines: compactLines(
        ti.sales_person && `Sales Person: ${ti.sales_person}`,
        ti.order_date && `Order Date: ${fmtDate(ti.order_date)}`,
        ti.shipping_terms && `Shipping Terms: ${ti.shipping_terms}`,
        ti.vat_reg_number && `VAT Reg No: ${ti.vat_reg_number}`,
        ti.company_reg_number && `Co Reg No: ${ti.company_reg_number}`,
      ),
    },
  ], 2)

  const items = ti.ti_items ?? []
  if (items.length > 0) {
    const cols: TableCol[] = [
      { label: '#',                w: 35,  align: 'left',  mono: true },
      { label: 'Item Description', w: 230, align: 'left' },
      { label: 'Qty',              w: 50,  align: 'right' },
      { label: 'Unit Price',       w: 75,  align: 'right' },
      { label: 'Line Total',       w: 105, align: 'right' },
    ]
    const rows = items.map((it: TIItem) => [
      it.item_number ?? '',
      it.item_description ?? '—',
      fmtAmount(it.quantity, 0),
      `${ti.currency} ${fmtAmount(it.unit_price, 2)}`,
      `${ti.currency} ${fmtAmount(it.line_total, 2)}`,
    ])
    y = drawTable(doc, { startY: y, cols, rows, heading: 'Items' })
  }

  const totals: TotalRow[] = [
    { label: 'Sub Total', value: `${ti.currency} ${fmtAmount(ti.subtotal, 2)}` },
  ]
  if (Number(ti.sales_tax_amount) > 0) {
    totals.push({
      label: `Sales Tax (${ti.sales_tax_rate}%)`,
      value: `${ti.currency} ${fmtAmount(ti.sales_tax_amount, 2)}`,
    })
  }
  totals.push({ label: 'Total', value: fmtMoney(ti.total_amount, ti.currency), emphasised: true })
  y = drawTotalsBox(doc, y + 8, totals, 240)

  if (ti.bank_name || ti.bank_account_number || ti.bank_iban) {
    const lines = compactLines(
      ti.bank_name && `Bank: ${ti.bank_name}`,
      ti.bank_account_name && `Account Name: ${ti.bank_account_name}`,
      ti.bank_account_number && `Account No: ${ti.bank_account_number}`,
      ti.bank_sort_code && `Sort Code: ${ti.bank_sort_code}`,
      ti.bank_iban && `IBAN: ${ti.bank_iban}`,
      ti.bank_swift && `SWIFT / BIC: ${ti.bank_swift}`,
    )
    y = drawTextBlock(doc, y + 6, 'Payment Details', lines.join('   •   '), 130)
  }

  if (ti.notes) {
    y = drawTextBlock(doc, y + 4, 'Notes', ti.notes, 70)
  }

  doc.end()
  return finalize()
}
