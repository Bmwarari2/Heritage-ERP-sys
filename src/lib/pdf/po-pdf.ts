/**
 * Programmatic Purchase Order PDF generator (PDFKit).
 * Handles both PO variants — `client` (full procurement schema with
 * material code / OEM / part number / delivery date) and `standalone`
 * (simplified description / qty / unit price / total).
 */
import type { PurchaseOrder, POItem } from '@/types'
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

export async function generatePOPDF(po: PurchaseOrder): Promise<Buffer> {
  const { doc, finalize } = createDocument({
    title: `PO ${po.po_number}`,
    subject: 'Purchase Order',
  })

  const refRows: HeaderRef[] = [
    { label: 'PO Number', value: po.po_number },
    { label: 'Date', value: fmtDate(po.po_date) },
  ]
  if (po.currency) refRows.push({ label: 'Currency', value: po.currency })
  if (po.inco_terms) refRows.push({ label: 'Inco Terms', value: po.inco_terms })
  if (po.payment_terms) refRows.push({ label: 'Payment Terms', value: po.payment_terms })
  if (po.your_reference) refRows.push({ label: 'Your Reference', value: po.your_reference })

  let y = drawDocumentHeader(doc, MARGIN_TOP, 'Purchase Order', refRows)

  y = drawAddressGrid(doc, y, [
    {
      title: 'Shipping Address',
      lines: compactLines(
        po.ship_to_company ?? po.delivery_address,
        po.ship_to_po_box && `PO Box ${po.ship_to_po_box}`,
        [po.ship_to_town, po.ship_to_post_code].filter(Boolean).join(' '),
        po.ship_to_country,
      ),
    },
    {
      title: 'Vendor (Heritage)',
      lines: compactLines(
        po.vendor_name,
        [po.vendor_city, po.vendor_post_code].filter(Boolean).join(' '),
        po.vendor_country,
        po.vendor_email,
      ),
    },
    {
      title: 'Billing Address',
      lines: compactLines(
        po.bill_to_company,
        po.bill_to_site,
        po.bill_to_town,
        po.bill_to_country,
        po.billing_email,
      ),
    },
  ], 3)

  const items = [...(po.po_items ?? [])].sort((a, b) => {
    const so = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (so !== 0) return so
    return (parseInt(a.item_number) || 0) - (parseInt(b.item_number) || 0)
  })

  if (items.length > 0) {
    if (po.po_type === 'client') {
      const cols: TableCol[] = [
        { label: '#',            w: 22, align: 'left',  mono: true },
        { label: 'Material',     w: 60, align: 'left',  mono: true },
        { label: 'Description',  w: 130, align: 'left' },
        { label: 'OEM/Part',     w: 65, align: 'left' },
        { label: 'Qty',          w: 30, align: 'right' },
        { label: 'Unit',         w: 28, align: 'left'  },
        { label: 'Delivery',     w: 50, align: 'left'  },
        { label: 'Net Price',    w: 50, align: 'right' },
        { label: 'Net Amount',   w: 55, align: 'right' },
      ]
      const rows = items.map((it: POItem) => [
        it.item_number ?? '',
        it.material_code ?? '—',
        [it.description_short, it.description_full].filter(Boolean).join('\n'),
        [it.oem, it.part_number].filter(Boolean).join(' / ') || '—',
        fmtAmount(Math.round(it.quantity), 0),
        it.unit ?? '—',
        fmtDate(it.delivery_date),
        fmtAmount(it.net_price, 2),
        fmtAmount(it.net_amount, 2),
      ])
      y = drawTable(doc, { startY: y, cols, rows, heading: 'Items' })
    } else {
      const cols: TableCol[] = [
        { label: '#',           w: 25,  align: 'left',  mono: true },
        { label: 'Description', w: 240, align: 'left' },
        { label: 'Qty',         w: 45,  align: 'right' },
        { label: 'Unit',        w: 35,  align: 'left'  },
        { label: 'Unit Price',  w: 65,  align: 'right' },
        { label: 'Total',       w: 70,  align: 'right' },
      ]
      const rows = items.map((it: POItem) => [
        it.item_number ?? '',
        it.description_short ?? '—',
        fmtAmount(Math.round(it.quantity), 0),
        it.unit ?? '—',
        fmtAmount(it.unit_price, 2),
        fmtAmount(it.total_price, 2),
      ])
      y = drawTable(doc, { startY: y, cols, rows, heading: 'Items' })
    }
  }

  const totals: TotalRow[] = []
  if (po.net_value > 0) totals.push({ label: 'Net Value', value: fmtMoney(po.net_value, po.currency) })
  if (po.customs_duties_percent > 0) {
    totals.push({
      label: `Duties (${po.customs_duties_percent}%)`,
      value: fmtMoney(po.customs_duties_amount, po.currency),
    })
  }
  totals.push({
    label: 'Total Amount',
    value: fmtMoney(po.total_amount || po.purchase_total, po.currency),
    emphasised: true,
  })
  y = drawTotalsBox(doc, y + 8, totals, 240)

  if (po.comments) {
    y = drawTextBlock(doc, y + 4, 'Comments', po.comments, 100)
  }
  if (po.instructions_to_vendor) {
    y = drawTextBlock(doc, y + 4, 'Instructions To Vendor', po.instructions_to_vendor, 180)
  }

  doc.end()
  return finalize()
}
