/**
 * Programmatic Packing List PDF generator (PDFKit). Renders the
 * shipment header, ship-to address, items table (qty + description),
 * and an optional Box Details table.
 */
import type { PackingList, PackingListItem, PackingListBox } from '@/types'
import {
  MARGIN_TOP,
  createDocument,
  drawDocumentHeader,
  drawAddressGrid,
  drawTable,
  drawTextBlock,
  fmtAmount,
  compactLines,
  type HeaderRef,
  type TableCol,
} from './shared'

export async function generatePLPDF(pl: PackingList): Promise<Buffer> {
  const { doc, finalize } = createDocument({
    title: `Packing List ${pl.our_order_number ?? pl.id}`,
    subject: 'Packing List',
  })

  const refRows: HeaderRef[] = []
  if (pl.customer_po_number) refRows.push({ label: 'Customer PO', value: pl.customer_po_number })
  if (pl.our_order_number) refRows.push({ label: 'Our Order No', value: pl.our_order_number })
  if (pl.final_destination) refRows.push({ label: 'Destination', value: pl.final_destination })
  if (pl.shipped_via) refRows.push({ label: 'Shipped Via', value: pl.shipped_via })
  if (pl.sales_person) refRows.push({ label: 'Sales Person', value: pl.sales_person })

  let y = drawDocumentHeader(doc, MARGIN_TOP, 'Packing List', refRows)

  if (pl.ship_to_address) {
    y = drawAddressGrid(doc, y, [
      {
        title: 'Ship To',
        lines: compactLines(...pl.ship_to_address.split('\n')),
      },
    ], 2)
  }

  const items = pl.packing_list_items ?? []
  if (items.length > 0) {
    const cols: TableCol[] = [
      { label: 'Quantity',    w: 90,  align: 'center' },
      { label: 'Description', w: 405, align: 'left'   },
    ]
    const rows = items.map((it: PackingListItem) => [
      fmtAmount(it.quantity, 0),
      it.description ?? '—',
    ])
    y = drawTable(doc, { startY: y, cols, rows, heading: 'Items' })
  }

  const boxes = pl.packing_list_boxes ?? []
  if (boxes.length > 0) {
    const cols: TableCol[] = [
      { label: 'Box No',                w: 60,  align: 'left',  mono: true },
      { label: 'Type',                  w: 130, align: 'left' },
      { label: 'Dimensions L×W×H (cm)', w: 180, align: 'left' },
      { label: 'Gross Weight (kg)',     w: 125, align: 'right' },
    ]
    const rows = boxes.map((b: PackingListBox) => [
      String(b.box_number),
      b.box_type ?? '—',
      [b.dimension_l, b.dimension_w, b.dimension_h]
        .map(v => v != null ? fmtAmount(v, 1) : '—').join(' × '),
      b.gross_weight != null ? fmtAmount(b.gross_weight, 2) : '—',
    ])
    y = drawTable(doc, { startY: y + 8, cols, rows, heading: 'Box Details', headingWidth: 110 })
  }

  if (pl.notes) {
    y = drawTextBlock(doc, y + 6, 'Notes', pl.notes, 70)
  }

  doc.end()
  return finalize()
}
