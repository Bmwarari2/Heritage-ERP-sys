/**
 * Shared PDFKit primitives used by every Heritage document generator
 * (RFQ, Purchase Order, Proforma, Commercial Invoice, Tax Invoice,
 * Packing List). The branded A4 background, palette, header, address
 * cells and paginated table renderer all live here so each document
 * generator only has to express the document-specific layout.
 */
import PDFDocument from 'pdfkit'
import path from 'path'
import fs from 'fs'
import { format, parseISO } from 'date-fns'

// A4 in PDF points (1pt = 1/72in)
export const A4_WIDTH = 595.28
export const A4_HEIGHT = 841.89

export const MARGIN_X = 50
export const MARGIN_TOP = 60
// Reserved vertical space on pages 2+ to keep content clear of the
// Heritage logo printed in the top band of the branded A4 background.
export const MARGIN_TOP_CONTINUED = 170
export const MARGIN_BOTTOM = 50
export const CONTENT_WIDTH = A4_WIDTH - MARGIN_X * 2

// Heritage palette (kept in sync with globals.css design tokens)
export const HERITAGE_900 = '#152E4A'
export const HERITAGE_800 = '#1D4166'
export const HERITAGE_700 = '#24507D'
export const HERITAGE_600 = '#2C6298'
export const HERITAGE_400 = '#5F99C9'
export const HERITAGE_100 = '#E2EEF8'
export const SLATE_800 = '#1E293B'
export const SLATE_700 = '#334155'
export const SLATE_500 = '#4B5563'
export const SLATE_300 = '#CBD5E1'
export const SLATE_200 = '#E2E8F0'
export const BORDER_BLUE = '#9FC1DC'

const BG_IMAGE_PATH = path.join(process.cwd(), 'public', 'A4-BG.png')

// ----------------------------------------------------------------
// Formatting
// ----------------------------------------------------------------

export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  try { return format(parseISO(s), 'dd MMM yyyy') } catch { return s }
}

export function fmtMoney(amount: number | null | undefined, currency = 'GBP'): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function fmtAmount(amount: number | null | undefined, decimals = 2): string {
  if (amount === null || amount === undefined) return '—'
  return Number(amount).toFixed(decimals)
}

export function compactLines(...lines: (string | number | null | undefined | false)[]): string[] {
  return lines.filter(Boolean).map(String)
}

// ----------------------------------------------------------------
// Document setup
// ----------------------------------------------------------------

export interface DocSetup {
  doc: PDFKit.PDFDocument
  finalize: () => Promise<Buffer>
}

export function createDocument(meta: { title: string; subject: string }): DocSetup {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: true,
    info: {
      Title: meta.title,
      Author: 'Heritage Global Solutions Ltd',
      Subject: meta.subject,
    },
  })

  // Attach listeners synchronously, before any drawing primitives run.
  const buffers: Buffer[] = []
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (b: Buffer) => buffers.push(b))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)
  })

  // Branded background — drawn on the initial page and repeated on
  // every subsequent page via the pageAdded event.
  const bgAvailable = fs.existsSync(BG_IMAGE_PATH)
  const paintBg = () => {
    if (!bgAvailable) return
    doc.image(BG_IMAGE_PATH, 0, 0, { width: A4_WIDTH, height: A4_HEIGHT })
  }
  paintBg()
  doc.on('pageAdded', paintBg)

  return { doc, finalize: () => done }
}

// ----------------------------------------------------------------
// Page-break helpers
// ----------------------------------------------------------------

/** Add a new page if `needed` points won't fit, return the new y. */
export function ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > A4_HEIGHT - MARGIN_BOTTOM) {
    doc.addPage()
    return MARGIN_TOP_CONTINUED
  }
  return y
}

// ----------------------------------------------------------------
// Header (title + ref box). The Heritage logo lives in the
// top-right corner of the background image, so the header content
// stays in the left 62% of the page.
// ----------------------------------------------------------------

export interface HeaderRef { label: string; value: string }

export function drawDocumentHeader(
  doc: PDFKit.PDFDocument,
  startY: number,
  title: string,
  refRows: HeaderRef[],
): number {
  let y = startY

  doc.fillColor(HERITAGE_700).font('Helvetica-Bold').fontSize(8)
     .text('DOCUMENT', MARGIN_X, y, { characterSpacing: 1.6 })
  y += 12

  doc.fillColor(HERITAGE_900).font('Helvetica-Bold').fontSize(22)
     .text(title.toUpperCase(), MARGIN_X, y, {
       width: CONTENT_WIDTH * 0.62,
       characterSpacing: 0.6,
     })
  y = doc.y + 10

  if (refRows.length === 0) return y + 8

  const rowH = 14
  const padding = 10
  const boxW = CONTENT_WIDTH * 0.58
  const boxH = refRows.length * rowH + padding * 2

  drawCell(doc, MARGIN_X, y, boxW, boxH, 0.85)

  let ry = y + padding
  for (const row of refRows) {
    doc.fillColor(HERITAGE_700).font('Helvetica-Bold').fontSize(7.5)
       .text(row.label.toUpperCase(), MARGIN_X + 12, ry + 1, { width: 130, characterSpacing: 0.8 })
    doc.fillColor(HERITAGE_900).font('Helvetica').fontSize(10)
       .text(row.value, MARGIN_X + 148, ry - 1, { width: boxW - 160 })
    ry += rowH
  }

  return y + boxH + 18
}

// ----------------------------------------------------------------
// Section heading — small caps, blue underline.
// ----------------------------------------------------------------

export function drawSectionHeading(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  width = 80,
): number {
  doc.fillColor(HERITAGE_800).font('Helvetica-Bold').fontSize(9)
     .text(label.toUpperCase(), x, y, { characterSpacing: 1.6 })
  doc.lineWidth(1).strokeColor(HERITAGE_400)
     .moveTo(x, y + 13).lineTo(x + width, y + 13).stroke()
  return y + 22
}

// ----------------------------------------------------------------
// Address-grid cells
// ----------------------------------------------------------------

export interface AddressCell { title: string; lines: string[] }

export function drawAddressGrid(
  doc: PDFKit.PDFDocument,
  startY: number,
  cells: AddressCell[],
  cols: 2 | 3 = 2,
): number {
  const gap = 12
  const cellW = (CONTENT_WIDTH - gap * (cols - 1)) / cols
  const padding = 10
  const titleH = 18
  const lineH = 12

  const heights = cells.map(c => titleH + c.lines.length * lineH + padding * 2 + 2)

  let y = startY
  for (let r = 0; r < Math.ceil(cells.length / cols); r++) {
    const row = cells.slice(r * cols, r * cols + cols)
    const rowH = Math.max(...row.map((_, i) => heights[r * cols + i]))

    row.forEach((cell, i) => {
      const x = MARGIN_X + i * (cellW + gap)
      drawAddressCell(doc, x, y, cellW, rowH, cell)
    })

    y += rowH

    // Horizontal rule between grid rows (not after the last row)
    if (r * cols + cols < cells.length) {
      const dy = y + 6
      doc.lineWidth(0.5).strokeColor(BORDER_BLUE)
         .moveTo(MARGIN_X, dy).lineTo(MARGIN_X + CONTENT_WIDTH, dy).stroke()
      y = dy + 6
    }
  }

  return y + 16
}

function drawAddressCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: AddressCell,
) {
  drawCell(doc, x, y, w, h, 0.82)

  doc.fillColor(HERITAGE_800).font('Helvetica-Bold').fontSize(8.5)
     .text(cell.title.toUpperCase(), x + 10, y + 9, {
       width: w - 20,
       characterSpacing: 1.2,
     })
  doc.lineWidth(0.6).strokeColor(BORDER_BLUE)
     .moveTo(x + 10, y + 24).lineTo(x + Math.min(110, w - 20), y + 24).stroke()

  let ly = y + 30
  cell.lines.forEach((ln, idx) => {
    if (ln === CELL_SEPARATOR) {
      ly += 3
      doc.lineWidth(0.5).strokeColor(BORDER_BLUE)
         .moveTo(x + 10, ly).lineTo(x + w - 10, ly).stroke()
      ly += 5
      return
    }
    doc
      .fillColor(idx === 0 ? SLATE_800 : SLATE_700)
      .font(idx === 0 ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .text(ln, x + 10, ly, { width: w - 20 })
    ly = doc.y + 1
  })
}

export const CELL_SEPARATOR = '\u0001___SEP___\u0001'

export function drawCell(
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

// ----------------------------------------------------------------
// Paginated tables
// ----------------------------------------------------------------

export type TableAlign = 'left' | 'right' | 'center'
export interface TableCol {
  label: string
  w: number
  align: TableAlign
  mono?: boolean
}

export interface TableOpts {
  startY: number
  cols: TableCol[]
  rows: string[][]
  /** Optional banner heading drawn once before the first table header. */
  heading?: string
  headingWidth?: number
}

export function drawTable(doc: PDFKit.PDFDocument, opts: TableOpts): number {
  let y = opts.startY

  if (opts.heading) {
    const minHeight = 22 + 22 + 28 // heading + table-head + 1 row
    y = ensureSpace(doc, y, minHeight)
    y = drawSectionHeading(doc, MARGIN_X, y, opts.heading, opts.headingWidth ?? 80)
  }

  y = drawTableHeader(doc, MARGIN_X, y, opts.cols)

  for (const values of opts.rows) {
    const rowH = computeRowHeight(doc, opts.cols, values)
    if (y + rowH > A4_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage()
      y = MARGIN_TOP_CONTINUED
      y = drawTableHeader(doc, MARGIN_X, y, opts.cols)
    }
    y = drawTableRow(doc, MARGIN_X, y, opts.cols, values)
  }

  return y
}

function drawTableHeader(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  cols: TableCol[],
): number {
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  const headerH = 20

  doc.save()
  doc.fillOpacity(0.92).fillColor(HERITAGE_100).rect(x, y, totalW, headerH).fill()
  doc.restore()
  doc.lineWidth(0.5).strokeColor(SLATE_300).rect(x, y, totalW, headerH).stroke()

  let cx = x
  for (const c of cols) {
    doc.fillColor(HERITAGE_900).font('Helvetica-Bold').fontSize(7.5)
       .text(c.label.toUpperCase(), cx + 4, y + 6, {
         width: c.w - 8,
         align: c.align,
         characterSpacing: 0.8,
       })
    cx += c.w
  }

  return y + headerH
}

function computeRowHeight(doc: PDFKit.PDFDocument, cols: TableCol[], values: string[]): number {
  doc.font('Helvetica').fontSize(8.5)
  const heights = cols.map((c, i) => doc.heightOfString(values[i] || ' ', { width: c.w - 8 }))
  return Math.max(20, Math.max(...heights) + 8)
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  cols: TableCol[],
  values: string[],
): number {
  const totalW = cols.reduce((s, c) => s + c.w, 0)
  const rowH = computeRowHeight(doc, cols, values)

  // Slight white fill so rows stay legible on top of the branded background.
  doc.save()
  doc.fillOpacity(0.72).fillColor('#FFFFFF').rect(x, y, totalW, rowH).fill()
  doc.restore()

  let cx = x
  cols.forEach((c, i) => {
    doc.fillColor(SLATE_800)
       .font(c.mono ? 'Courier' : 'Helvetica')
       .fontSize(8.5)
       .text(values[i] || '', cx + 4, y + 4, { width: c.w - 8, align: c.align })
    cx += c.w
  })

  doc.lineWidth(0.4).strokeColor(SLATE_200)
     .moveTo(x, y + rowH).lineTo(x + totalW, y + rowH).stroke()

  return y + rowH
}

// ----------------------------------------------------------------
// Totals box (right-aligned, label / value rows)
// ----------------------------------------------------------------

export interface TotalRow { label: string; value: string; emphasised?: boolean }

export function drawTotalsBox(
  doc: PDFKit.PDFDocument,
  startY: number,
  rows: TotalRow[],
  width = 240,
): number {
  const padding = 10
  const rowH = 16
  const h = rows.length * rowH + padding * 2
  const x = MARGIN_X + CONTENT_WIDTH - width

  let y = ensureSpace(doc, startY, h + 10)

  drawCell(doc, x, y, width, h, 0.85)

  let ry = y + padding
  rows.forEach((r) => {
    if (r.emphasised) {
      doc.lineWidth(0.5).strokeColor(SLATE_300)
         .moveTo(x + 10, ry - 2).lineTo(x + width - 10, ry - 2).stroke()
    }
    doc.fillColor(r.emphasised ? HERITAGE_900 : SLATE_700)
       .font(r.emphasised ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(r.emphasised ? 11 : 9.5)
       .text(r.label, x + 12, ry + (r.emphasised ? 0 : 2), { width: width / 2 - 12 })
    doc.fillColor(r.emphasised ? HERITAGE_900 : SLATE_800)
       .font(r.emphasised ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(r.emphasised ? 11 : 9.5)
       .text(r.value, x + width / 2, ry + (r.emphasised ? 0 : 2), {
         width: width / 2 - 12, align: 'right',
       })
    ry += rowH
  })

  return y + h + 12
}

// ----------------------------------------------------------------
// Free-form text block (e.g. comments / notes / instructions)
// ----------------------------------------------------------------

export function drawTextBlock(
  doc: PDFKit.PDFDocument,
  startY: number,
  heading: string,
  body: string,
  headingWidth = 90,
): number {
  let y = ensureSpace(doc, startY, 60)
  y = drawSectionHeading(doc, MARGIN_X, y, heading, headingWidth)
  doc.fillColor(SLATE_700).font('Helvetica').fontSize(9.5)
     .text(body, MARGIN_X, y, { width: CONTENT_WIDTH })
  return doc.y + 8
}

// ----------------------------------------------------------------
// Footer line (e.g. "Submit quotation to: x@y.com")
// ----------------------------------------------------------------

export function drawFooterLine(
  doc: PDFKit.PDFDocument,
  startY: number,
  prefix: string,
  highlight: string,
): number {
  let y = ensureSpace(doc, startY, 30)
  y += 6
  doc.lineWidth(0.5).strokeColor(SLATE_200)
     .moveTo(MARGIN_X, y).lineTo(MARGIN_X + CONTENT_WIDTH, y).stroke()
  y += 8
  doc.fillColor(SLATE_500).font('Helvetica').fontSize(9.5)
     .text(prefix, MARGIN_X, y, { continued: true })
  doc.fillColor(HERITAGE_700).font('Helvetica-Bold').text(highlight)
  return doc.y + 4
}
