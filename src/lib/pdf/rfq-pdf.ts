/**
 * Programmatic RFQ PDF generator (PDFKit) — built on the shared
 * primitives in `./shared.ts`. Layout mirrors the on-screen RFQ
 * document: branded A4 background on every page, header with title +
 * reference box, 2×2 address grid, paginated items table, and an
 * optional comments + submission footer.
 */
import type { RFQ, RFQItem } from '@/types'
import {
  MARGIN_TOP,
  createDocument,
  drawDocumentHeader,
  drawAddressGrid,
  drawTable,
  drawTextBlock,
  drawFooterLine,
  fmtDate,
  fmtAmount,
  compactLines,
  type HeaderRef,
  type TableCol,
} from './shared'

export async function generateRFQPDF(rfq: RFQ): Promise<Buffer> {
  const { doc, finalize } = createDocument({
    title: `RFQ ${rfq.rfq_number}`,
    subject: 'Request for Quotation',
  })

  const refRows: HeaderRef[] = [
    { label: 'Doc Number', value: rfq.rfq_number },
    { label: 'Date', value: fmtDate(rfq.rfq_date) },
  ]
  if (rfq.quotation_deadline) refRows.push({ label: 'Quotation Deadline', value: fmtDate(rfq.quotation_deadline) })
  if (rfq.delivery_date) refRows.push({ label: 'Delivery Date', value: fmtDate(rfq.delivery_date) })
  if (rfq.your_reference) refRows.push({ label: 'Your Reference', value: rfq.your_reference })

  let y = drawDocumentHeader(doc, MARGIN_TOP, 'Request for Quotation', refRows)

  y = drawAddressGrid(doc, y, [
    {
      title: 'Invoicing Details',
      lines: compactLines(
        rfq.buyer_company,
        rfq.buyer_site,
        rfq.buyer_po_box && `PO Box ${rfq.buyer_po_box}`,
        rfq.buyer_country,
      ),
    },
    {
      title: 'Delivery Address',
      lines: compactLines(
        rfq.delivery_company,
        rfq.delivery_street,
        [rfq.delivery_town, rfq.delivery_post_code].filter(Boolean).join(' '),
        rfq.delivery_country,
      ),
    },
    {
      title: 'Contact Details',
      lines: compactLines(
        rfq.contact_person && `Contact: ${rfq.contact_person}`,
        rfq.contact_email,
        rfq.contact_tel && `Tel: ${rfq.contact_tel}`,
        rfq.contact_fax && `Fax: ${rfq.contact_fax}`,
      ),
    },
    {
      title: 'Vendor Details',
      lines: compactLines(
        rfq.vendor_name,
        rfq.vendor_address_line1,
        [rfq.vendor_city, rfq.vendor_post_code].filter(Boolean).join(' '),
        rfq.vendor_country,
        rfq.vendor_number && `Vendor No: ${rfq.vendor_number}`,
        rfq.vendor_contact_person && `Contact: ${rfq.vendor_contact_person}`,
        rfq.vendor_tel && `Tel: ${rfq.vendor_tel}`,
        rfq.vendor_fax && `Fax: ${rfq.vendor_fax}`,
        rfq.vendor_email && `Email: ${rfq.vendor_email}`,
      ),
    },
  ], 2)

  const items = rfq.rfq_items ?? []
  if (items.length > 0) {
    const cols: TableCol[] = [
      { label: '#',           w: 22,  align: 'left',  mono: true  },
      { label: 'Code',        w: 60,  align: 'left',  mono: true  },
      { label: 'Description', w: 175, align: 'left'               },
      { label: 'OEM',         w: 50,  align: 'left'               },
      { label: 'Part No',     w: 70,  align: 'left',  mono: true  },
      { label: 'Qty',         w: 40,  align: 'right'              },
      { label: 'Unit',        w: 30,  align: 'left'               },
      { label: 'Unit Price',  w: 50,  align: 'right'              },
    ]

    const rows = items.map((it: RFQItem) => [
      it.item_number ?? '',
      it.item_code ?? '—',
      [it.description_short, it.description_full].filter(Boolean).join('\n'),
      it.oem ?? '—',
      it.part_number ?? '—',
      it.quantity != null ? fmtAmount(it.quantity, 3) : '—',
      it.unit ?? '—',
      it.unit_price != null ? fmtAmount(it.unit_price, 2) : '—',
    ])

    y = drawTable(doc, { startY: y, cols, rows, heading: 'Items' })
  }

  if (rfq.comments) {
    y = drawTextBlock(doc, y + 16, 'Comments', rfq.comments, 100)
  }

  if (rfq.submission_email) {
    y = drawFooterLine(doc, y + 14, 'Please submit quotation to: ', rfq.submission_email)
  }

  doc.end()
  return finalize()
}
