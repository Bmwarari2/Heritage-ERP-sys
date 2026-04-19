/**
 * Programmatic RFQ PDF generator built on PDFKit.
 *
 * This is the Node equivalent of ReportLab (Python) / iText (Java) — the
 * PDF is constructed directly by issuing drawing primitives, with no HTML
 * → print round-trip. The rendered output is consistent across browsers
 * and printers because the rasterisation happens server-side.
 *
 * Layout mirrors the on-screen RFQ document:
 *   • full-bleed A4-BG.png background, redrawn on every page;
 *   • header with title + reference box (logo lives in the background
 *     image, so nothing extra is drawn at the top-right);
 *   • 2×2 address grid (Invoicing | Delivery / Contact | Vendor);
 *   • paginated line-item table that repeats its header row across pages;
 *   • optional comments + submission email footer.
 */
import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'
import { format, parseISO } from 'date-fns'
import type { RFQ, RFQItem } from '@/types'

// A4 in PDF points (1pt = 1/72in)
const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89

const MARGIN_X = 50
const MARGIN_TOP = 60
const MARGIN_BOTTOM = 50
const CONTENT_WIDTH = A4_WIDTH - MARGIN_X * 2

// Heritage palette (kept in sync with globals.css design tokens)
const HERITAGE_900 = '#152E4A'
const HERITAGE_800 = '#1D4166'
const HERITAGE_700 = '#24507D'
const HERITAGE_600 = '#2C6298'
const HERITAGE_400 = '#5F99C9'
const HERITAGE_100 = '#E2EEF8'
const SLATE_800 = '#1E293B'
const SLATE_700 = '#334155'
const SLATE_500 = '#4B5563'
const SLATE_300 = '#CBD5E1'
const SLATE_200 = '#E2E8F0'
const BORDER_BLUE = '#9FC1DC'

const BG_IMAGE_PATH = path.join(process.cwd(), 'public', 'A4-BG.png')

function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  try { return format(parseISO(s), 'dd MMM yyyy') } catch { return s }
}

function compactLines(...lines: (string | number | null | undefined | false)[]): string[] {
  return lines.filter(Boolean).map(String)
}

export async function generateRFQPDF(rfq: RFQ): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      bufferPages: true,
      info: {
        Title: `RFQ ${rfq.rfq_number}`,
        Author: 'Heritage Global Solutions Ltd',
        Subject: 'Request for Quotation',
      },
    })

    const buffers: Buffer[] = []
    doc.on('data', (b: Buffer) => buffers.push(b))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    const bgAvailable = fs.existsSync(BG_IMAGE_PATH)

    // Branded background — drawn on the initial page and repeated on
    // every subsequent page via the pageAdded event.
    const paintBg = () => {
      if (!bgAvailable) return
      doc.image(BG_IMAGE_PATH, 0, 0, { width: A4_WIDTH, height: A4_HEIGHT })
    }
    paintBg()
    doc.on('pageAdded', paintBg)

    // ---------- Header (left column only — logo sits in the background) ----------
    let y = MARGIN_TOP

    doc.fillColor(HERITAGE_700).font('Helvetica-Bold').fontSize(8)
       .text('DOCUMENT', MARGIN_X, y, { characterSpacing: 1.6 })
    y += 12

    doc.fillColor(HERITAGE_900).font('Helvetica-Bold').fontSize(22)
       .text('REQUEST FOR QUOTATION', MARGIN_X, y, {
         width: CONTENT_WIDTH * 0.62,
         characterSpacing: 0.6,
       })
    y = doc.y + 10

    // Reference box — flush under the title
    const refRows: [string, string][] = [
      ['Doc Number', rfq.rfq_number],
      ['Date', fmtDate(rfq.rfq_date)],
    ]
    if (rfq.quotation_deadline) refRows.push(['Quotation Deadline', fmtDate(rfq.quotation_deadline)])
    if (rfq.delivery_date) refRows.push(['Delivery Date', fmtDate(rfq.delivery_date)])
    if (rfq.your_reference) refRows.push(['Your Reference', rfq.your_reference])

    const refRowH = 14
    const refBoxPadding = 10
    const refBoxW = CONTENT_WIDTH * 0.58
    const refBoxH = refRows.length * refRowH + refBoxPadding * 2

    drawCell(doc, MARGIN_X, y, refBoxW, refBoxH, 0.85)

    let ry = y + refBoxPadding
    refRows.forEach(([k, v]) => {
      doc.fillColor(HERITAGE_700).font('Helvetica-Bold').fontSize(7.5)
         .text(k.toUpperCase(), MARGIN_X + 12, ry + 1, { width: 120, characterSpacing: 0.8 })
      doc.fillColor(HERITAGE_900).font('Helvetica').fontSize(10)
         .text(v, MARGIN_X + 138, ry - 1, { width: refBoxW - 150 })
      ry += refRowH
    })

    y += refBoxH + 18

    // ---------- 2×2 address grid ----------
    const cells = [
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
    ]

    const cellGap = 12
    const cellW = (CONTENT_WIDTH - cellGap) / 2
    const cellPadding = 10
    const titleH = 18
    const lineH = 12

    // Row heights = max content height of the two cells in the row
    const cellHeights = cells.map(
      c => titleH + c.lines.length * lineH + cellPadding * 2 + 2
    )
    const row1H = Math.max(cellHeights[0], cellHeights[1])
    const row2H = Math.max(cellHeights[2], cellHeights[3])

    drawAddressCell(doc, MARGIN_X, y, cellW, row1H, cells[0])
    drawAddressCell(doc, MARGIN_X + cellW + cellGap, y, cellW, row1H, cells[1])

    // Horizontal rule between the two grid rows
    const dividerY = y + row1H + 6
    doc.lineWidth(0.5).strokeColor(BORDER_BLUE)
       .moveTo(MARGIN_X, dividerY).lineTo(MARGIN_X + CONTENT_WIDTH, dividerY).stroke()

    drawAddressCell(doc, MARGIN_X, dividerY + 6, cellW, row2H, cells[2])
    drawAddressCell(doc, MARGIN_X + cellW + cellGap, dividerY + 6, cellW, row2H, cells[3])

    y = dividerY + 6 + row2H + 22

    // ---------- Items table ----------
    const items = rfq.rfq_items ?? []
    if (items.length > 0) {
      // Section heading — never orphaned; we insert a page break first
      // if there isn't room for the heading + at least one row.
      const minSectionHeight = 18 + 22 + 28 // heading + table head + 1 row
      if (y + minSectionHeight > A4_HEIGHT - MARGIN_BOTTOM) {
        doc.addPage()
        y = MARGIN_TOP
      }

      doc.fillColor(HERITAGE_800).font('Helvetica-Bold').fontSize(9)
         .text('ITEMS', MARGIN_X, y, { characterSpacing: 1.6 })
      doc.lineWidth(1).strokeColor(HERITAGE_400)
         .moveTo(MARGIN_X, y + 13).lineTo(MARGIN_X + 60, y + 13).stroke()
      y += 22

      const cols: TableCol[] = [
        { label: '#',           w: 22,  align: 'left'  },
        { label: 'Code',        w: 60,  align: 'left'  },
        { label: 'Description', w: 175, align: 'left'  },
        { label: 'OEM',         w: 50,  align: 'left'  },
        { label: 'Part No',     w: 70,  align: 'left'  },
        { label: 'Qty',         w: 40,  align: 'right' },
        { label: 'Unit',        w: 30,  align: 'left'  },
        { label: 'Unit Price',  w: 50,  align: 'right' },
      ]

      y = drawTableHeader(doc, MARGIN_X, y, cols)

      for (const item of items) {
        const rowH = computeRowHeight(doc, cols, item)
        if (y + rowH > A4_HEIGHT - MARGIN_BOTTOM) {
          doc.addPage()
          y = MARGIN_TOP
          y = drawTableHeader(doc, MARGIN_X, y, cols)
        }
        y = drawTableRow(doc, MARGIN_X, y, cols, item)
      }
    }

    // ---------- Comments ----------
    if (rfq.comments) {
      y += 16
      if (y + 60 > A4_HEIGHT - MARGIN_BOTTOM) { doc.addPage(); y = MARGIN_TOP }
      doc.fillColor(HERITAGE_800).font('Helvetica-Bold').fontSize(9)
         .text('COMMENTS', MARGIN_X, y, { characterSpacing: 1.6 })
      doc.lineWidth(1).strokeColor(HERITAGE_400)
         .moveTo(MARGIN_X, y + 13).lineTo(MARGIN_X + 90, y + 13).stroke()
      y += 18
      doc.fillColor(SLATE_700).font('Helvetica').fontSize(9.5)
         .text(rfq.comments, MARGIN_X, y, { width: CONTENT_WIDTH })
      y = doc.y + 8
    }

    // ---------- Submission email footer ----------
    if (rfq.submission_email) {
      y += 14
      if (y + 30 > A4_HEIGHT - MARGIN_BOTTOM) { doc.addPage(); y = MARGIN_TOP }
      doc.lineWidth(0.5).strokeColor(SLATE_200)
         .moveTo(MARGIN_X, y).lineTo(MARGIN_X + CONTENT_WIDTH, y).stroke()
      y += 8
      doc.fillColor(SLATE_500).font('Helvetica').fontSize(9.5)
         .text('Please submit quotation to: ', MARGIN_X, y, { continued: true })
      doc.fillColor(HERITAGE_700).font('Helvetica-Bold')
         .text(rfq.submission_email)
    }

    doc.end()
  })
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

type TableCol = { label: string; w: number; align: 'left' | 'right' }

function drawCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  fillOpacity = 0.78,
) {
  doc.save()
  doc.fillOpacity(fillOpacity).fillColor('#FFFFFF').rect(x, y, w, h).fill()
  doc.restore()

  doc.lineWidth(0.5).strokeColor(BORDER_BLUE).rect(x, y, w, h).stroke()
}

function drawAddressCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: { title: string; lines: string[] },
) {
  drawCell(doc, x, y, w, h, 0.82)

  // Title
  doc.fillColor(HERITAGE_800).font('Helvetica-Bold').fontSize(8.5)
     .text(cell.title.toUpperCase(), x + 10, y + 9, {
       width: w - 20,
       characterSpacing: 1.2,
     })
  doc.lineWidth(0.6).strokeColor(BORDER_BLUE)
     .moveTo(x + 10, y + 24).lineTo(x + Math.min(110, w - 20), y + 24).stroke()

  // Body lines
  let ly = y + 30
  cell.lines.forEach((ln, idx) => {
    doc
      .fillColor(idx === 0 ? SLATE_800 : SLATE_700)
      .font(idx === 0 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .text(ln, x + 10, ly, { width: w - 20 })
    ly = doc.y + 1
  })
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  cols: TableCol[],
): number {
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  const headerH = 20

  // Header band
  doc.save()
  doc.fillOpacity(0.92).fillColor(HERITAGE_100).rect(x, y, totalW, headerH).fill()
  doc.restore()
  doc.lineWidth(0.5).strokeColor(SLATE_300).rect(x, y, totalW, headerH).stroke()

  let cx = x
  cols.forEach((c) => {
    doc.fillColor(HERITAGE_900).font('Helvetica-Bold').fontSize(7.5)
       .text(c.label.toUpperCase(), cx + 4, y + 6, {
         width: c.w - 8,
         align: c.align,
         characterSpacing: 0.8,
       })
    cx += c.w
  })

  return y + headerH
}

function rowValues(item: RFQItem): string[] {
  return [
    item.item_number ?? '',
    item.item_code ?? '—',
    [item.description_short, item.description_full].filter(Boolean).join('\n'),
    item.oem ?? '—',
    item.part_number ?? '—',
    item.quantity != null ? Number(item.quantity).toFixed(3) : '—',
    item.unit ?? '—',
    item.unit_price != null ? Number(item.unit_price).toFixed(2) : '—',
  ]
}

function computeRowHeight(doc: PDFKit.PDFDocument, cols: TableCol[], item: RFQItem): number {
  const values = rowValues(item)
  doc.font('Helvetica').fontSize(8.5)
  const heights = cols.map((c, i) => doc.heightOfString(values[i] || ' ', { width: c.w - 8 }))
  return Math.max(20, Math.max(...heights) + 8)
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  cols: TableCol[],
  item: RFQItem,
): number {
  const values = rowValues(item)
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  const rowH = computeRowHeight(doc, cols, item)

  // Row background — slight white fill so it stays legible over the
  // branded background image.
  doc.save()
  doc.fillOpacity(0.72).fillColor('#FFFFFF').rect(x, y, totalW, rowH).fill()
  doc.restore()

  // Cell text
  let cx = x
  cols.forEach((c, i) => {
    const isMono = ['#', 'Code', 'Part No'].includes(c.label)
    doc.fillColor(SLATE_800)
       .font(isMono ? 'Courier' : 'Helvetica')
       .fontSize(8.5)
       .text(values[i] || '', cx + 4, y + 4, {
         width: c.w - 8,
         align: c.align,
       })
    cx += c.w
  })

  // Bottom border for the row
  doc.lineWidth(0.4).strokeColor(SLATE_200)
     .moveTo(x, y + rowH).lineTo(x + totalW, y + rowH).stroke()

  return y + rowH
}
