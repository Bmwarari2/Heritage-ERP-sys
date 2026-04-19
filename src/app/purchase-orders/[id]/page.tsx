'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Printer, ArrowLeft, Loader2, Package, CheckSquare, Square, AlertTriangle, ExternalLink } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import POForm from '@/components/po/POForm'
import { printPdf } from '@/lib/print-pdf'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import type { PurchaseOrder, POItem } from '@/types'

type BatchDoc = { id: string; invoice_number?: string; tax_invoice_number?: string }
type DispatchBatch = {
  id: string
  batch_number: number
  dispatched_at: string
  notes: string | null
  commercial_invoices?: BatchDoc[]
  tax_invoices?: BatchDoc[]
  packing_lists?: BatchDoc[]
}

export default function PODetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [po, setPo] = useState<PurchaseOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [dispatchNotes, setDispatchNotes] = useState('')
  const [dispatching, setDispatching] = useState(false)

  // Local dispatch state (available qty and checkboxes)
  const [dispatchState, setDispatchState] = useState<Record<string, { avail: number; checked: boolean }>>({})
  // Local extras state (product link and notes — editable inline after PO is saved)
  const [itemExtras, setItemExtras] = useState<Record<string, { url: string; notes: string }>>({})

  async function load() {
    const res = await fetch(`/api/purchase-orders/${id}`)
    const data = await res.json()
    setPo(data)
    const state: Record<string, { avail: number; checked: boolean }> = {}
    const extras: Record<string, { url: string; notes: string }> = {}
    for (const item of (data.po_items ?? [])) {
      // Default avail to full remaining qty when nothing has been set yet
      const remaining = Math.round((item.quantity ?? 0) - (item.shipped_qty ?? 0))
      const avail = (item.available_qty == null || (item.available_qty === 0 && item.shipped_qty === 0))
        ? remaining
        : Math.round(item.available_qty)
      state[item.id] = { avail, checked: item.ready_to_ship ?? false }
      extras[item.id] = { url: item.product_url ?? '', notes: item.vendor_notes ?? '' }
    }
    setDispatchState(state)
    setItemExtras(extras)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function updateItemDispatch(itemId: string, avail: number, checked: boolean) {
    setDispatchState(s => ({ ...s, [itemId]: { avail, checked } }))
    await fetch(`/api/purchase-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ po_item_id: itemId, available_qty: avail, ready_to_ship: checked }),
    })
  }

  async function saveItemExtra(itemId: string, url: string, notes: string) {
    await fetch(`/api/purchase-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ po_item_id: itemId, product_url: url, vendor_notes: notes }),
    })
    // Reflect normalised URL (https:// may have been prepended server-side)
    const normalised = url && !/^https?:\/\//i.test(url) ? `https://${url}` : url
    setItemExtras(s => ({ ...s, [itemId]: { url: normalised, notes } }))
  }

  async function createDispatch(docType: 'commercial-invoices' | 'tax-invoices' | 'packing-lists') {
    const readyItems = (po?.po_items ?? []).filter(i => dispatchState[i.id]?.checked)
    if (readyItems.length === 0) { alert('No items marked as ready to ship.'); return }

    setDispatching(true)
    const batchRes = await fetch(`/api/purchase-orders/${id}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: dispatchNotes,
        items: readyItems.map(i => ({ po_item_id: i.id, dispatched_qty: dispatchState[i.id].avail })),
      }),
    })
    const batchData = await batchRes.json()
    if (!batchData.batch) { setDispatching(false); alert('Failed to create dispatch batch'); return }

    // Navigate directly to the auto-created document
    if (docType === 'commercial-invoices' && batchData.ci_id) {
      router.push(`/commercial-invoices/${batchData.ci_id}`)
    } else if (docType === 'tax-invoices' && batchData.ti_id) {
      router.push(`/tax-invoices/${batchData.ti_id}`)
    } else if (docType === 'packing-lists' && batchData.pl_id) {
      router.push(`/packing-lists/${batchData.pl_id}`)
    } else {
      setDispatching(false)
      load()
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
  if (!po) return <div className="flex-1 flex items-center justify-center text-gray-400">PO not found</div>

  if (editing) {
    return (
      <PageWrapper title={`Edit PO ${po.po_number}`}
        actions={<button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel Edit</button>}>
        <POForm poType={po.po_type} existing={po} />
      </PageWrapper>
    )
  }

  // Sort by sort_order (preserving PDF order), then by item_number numerically
  const items = [...(po.po_items ?? [])].sort((a, b) => {
    const so = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (so !== 0) return so
    return (parseInt(a.item_number) || 0) - (parseInt(b.item_number) || 0)
  })
  const hasReadyItems = items.some(i => dispatchState[i.id]?.checked)

  function getItemRowStyle(item: POItem) {
    const s = dispatchState[item.id]
    if (!s) return ''
    if (item.fully_shipped) return 'opacity-40 bg-gray-100'
    if (s.checked) {
      const remaining = Math.round(item.quantity - item.shipped_qty)
      if (s.avail < remaining) return 'bg-amber-50'   // partial — stands out
      return 'bg-gray-100 text-gray-500'              // full qty ready — greyed
    }
    return ''
  }

  const batches = ((po as PurchaseOrder & { dispatch_batches?: DispatchBatch[] }).dispatch_batches ?? [])
    .sort((a, b) => a.batch_number - b.batch_number)

  return (
    <PageWrapper
      title={`PO — ${po.po_number}`}
      subtitle={po.ship_to_company ?? po.delivery_address ?? undefined}
      actions={
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></button>
          {po.rfq_id && <Link href={`/rfq/${po.rfq_id}`} className="btn btn-secondary btn-sm">View RFQ</Link>}
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4" /> Edit</button>
          <button className="btn btn-secondary btn-sm" onClick={() => printPdf(`/api/purchase-orders/${po.id}/pdf`)}><Printer className="w-4 h-4" /> Print</button>
          <a href={`/api/purchase-orders/${po.id}/pdf`} className="btn btn-primary btn-sm" target="_blank" rel="noopener">
            <Printer className="w-4 h-4" /> Download PDF
          </a>
        </div>
      }
    >
      <div className="space-y-6 w-full">
        {/* ---- Print Layout ---- */}
        <div className="card card-body w-full print-page doc-print-page">
          <div className="doc-print-inner">
            <div className="doc-header">
              <div className="doc-header-left">
                <p className="doc-doc-label">Document</p>
                <h1 className="doc-title">Purchase Order</h1>
                <dl className="doc-ref-box">
                  <dt>PO Number</dt>
                  <dd className="font-mono">{po.po_number}</dd>
                  <dt>Date</dt>
                  <dd>{formatDate(po.po_date)}</dd>
                  {po.currency && (<><dt>Currency</dt><dd>{po.currency}</dd></>)}
                  {po.inco_terms && (<><dt>Inco Terms</dt><dd>{po.inco_terms}</dd></>)}
                  {po.payment_terms && (<><dt>Payment Terms</dt><dd>{po.payment_terms}</dd></>)}
                  {po.your_reference && (<><dt>Your Reference</dt><dd>{po.your_reference}</dd></>)}
                </dl>
              </div>
            </div>

            <div className="mb-5 no-print"><StatusBadge status={po.status} /></div>

            {/* 2x2 address grid (Shipping / Vendor, Billing / Meta) */}
            <section className="doc-address-grid">
              <div className="doc-address-cell">
                <p className="section-title">Shipping Address</p>
                <p className="font-medium">{po.ship_to_company ?? po.delivery_address}</p>
                {po.ship_to_po_box && <p>PO Box {po.ship_to_po_box}</p>}
                {po.ship_to_town && <p>{po.ship_to_town} {po.ship_to_post_code}</p>}
                {po.ship_to_country && <p>{po.ship_to_country}</p>}
              </div>

              <div className="doc-address-cell">
                <p className="section-title">Vendor (Heritage)</p>
                <p className="font-medium">{po.vendor_name}</p>
                {po.vendor_city && <p>{po.vendor_city} {po.vendor_post_code}</p>}
                {po.vendor_country && <p>{po.vendor_country}</p>}
                {po.vendor_email && <p>{po.vendor_email}</p>}
              </div>

              <hr className="doc-address-divider" />

              <div className="doc-address-cell">
                <p className="section-title">Billing Address</p>
                <p className="font-medium">{po.bill_to_company}</p>
                {po.bill_to_site && <p>{po.bill_to_site}</p>}
                {po.bill_to_town && <p>{po.bill_to_town}</p>}
                {po.bill_to_country && <p>{po.bill_to_country}</p>}
                {po.billing_email && <p>{po.billing_email}</p>}
              </div>

              <div className="doc-address-cell">
                <p className="section-title">Order Details</p>
                {po.created_by_buyer && <p><span className="font-medium">Created By:</span> {po.created_by_buyer}</p>}
                {po.sales_person && <p><span className="font-medium">Sales Person:</span> {po.sales_person}</p>}
                {po.mode_of_transport && <p><span className="font-medium">Transport:</span> {po.mode_of_transport}</p>}
                {po.your_reference && <p><span className="font-medium">Your Ref:</span> {po.your_reference}</p>}
              </div>
            </section>

          {/* Line Items */}
          <section className="doc-items">
            <p className="section-title">Items</p>
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Item</th>
                    {po.po_type === 'client' ? (
                      <>
                        <th>Material Code</th>
                        <th>Description</th>
                        <th>OEM / Part No</th>
                        <th className="text-right">Qty</th>
                        <th>Unit</th>
                        <th>Delivery</th>
                        <th className="text-right">Net Price</th>
                        <th className="text-right">Net Amount</th>
                        <th className="no-print w-36">Product Link</th>
                        <th className="no-print w-40">Notes</th>
                      </>
                    ) : (
                      <>
                        <th>Description</th>
                        <th className="text-right">Qty</th>
                        <th>Unit</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Total</th>
                        <th className="no-print w-36">Product Link</th>
                        <th className="no-print w-40">Notes</th>
                      </>
                    )}
                    {/* Dispatch cols — screen only */}
                    <th className="no-print text-center">Avail Qty</th>
                    <th className="no-print text-center">Ready</th>
                    <th className="no-print text-center">Shipped</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const ds = dispatchState[item.id] ?? { avail: 0, checked: false }
                    const remaining = Math.round(item.quantity - item.shipped_qty)
                    const isPartial = ds.checked && ds.avail < remaining
                    return (
                      <tr key={item.id} className={getItemRowStyle(item)}>
                        <td className="font-mono">{item.item_number}</td>
                        {po.po_type === 'client' ? (
                          <>
                            <td className="font-mono">{item.material_code}</td>
                            <td>
                              <p className="font-medium">{item.description_short}</p>
                              {item.description_full && <p className="text-gray-400 text-xs">{item.description_full}</p>}
                            </td>
                            <td>{item.oem} / {item.part_number}</td>
                            <td className="text-right">{Math.round(item.quantity)}</td>
                            <td>{item.unit}</td>
                            <td>{formatDate(item.delivery_date)}</td>
                            <td className="text-right">{item.net_price.toFixed(2)}</td>
                            <td className="text-right font-medium">{item.net_amount.toFixed(2)}</td>
                            {/* Product link — inline edit, saves on blur */}
                            <td className="no-print">
                              <div className="flex items-center gap-1">
                                <input
                                  className="form-input text-xs py-0.5 w-full"
                                  placeholder="Paste link…"
                                  value={itemExtras[item.id]?.url ?? ''}
                                  onChange={e => setItemExtras(s => ({ ...s, [item.id]: { ...s[item.id], url: e.target.value } }))}
                                  onBlur={e => saveItemExtra(item.id, e.target.value, itemExtras[item.id]?.notes ?? '')}
                                />
                                {itemExtras[item.id]?.url && (
                                  <a href={itemExtras[item.id].url} target="_blank" rel="noreferrer" className="text-blue-500 flex-shrink-0">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                            {/* Notes — inline edit, saves on blur */}
                            <td className="no-print">
                              <input
                                className="form-input text-xs py-0.5 w-full"
                                placeholder="Notes…"
                                value={itemExtras[item.id]?.notes ?? ''}
                                onChange={e => setItemExtras(s => ({ ...s, [item.id]: { ...s[item.id], notes: e.target.value } }))}
                                onBlur={e => saveItemExtra(item.id, itemExtras[item.id]?.url ?? '', e.target.value)}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{item.description_short}</td>
                            <td className="text-right">{Math.round(item.quantity)}</td>
                            <td>{item.unit}</td>
                            <td className="text-right">{item.unit_price.toFixed(2)}</td>
                            <td className="text-right font-medium">{item.total_price.toFixed(2)}</td>
                            <td className="no-print">
                              <div className="flex items-center gap-1">
                                <input
                                  className="form-input text-xs py-0.5 w-full"
                                  placeholder="Paste link…"
                                  value={itemExtras[item.id]?.url ?? ''}
                                  onChange={e => setItemExtras(s => ({ ...s, [item.id]: { ...s[item.id], url: e.target.value } }))}
                                  onBlur={e => saveItemExtra(item.id, e.target.value, itemExtras[item.id]?.notes ?? '')}
                                />
                                {itemExtras[item.id]?.url && (
                                  <a href={itemExtras[item.id].url} target="_blank" rel="noreferrer" className="text-blue-500 flex-shrink-0">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="no-print">
                              <input
                                className="form-input text-xs py-0.5 w-full"
                                placeholder="Notes…"
                                value={itemExtras[item.id]?.notes ?? ''}
                                onChange={e => setItemExtras(s => ({ ...s, [item.id]: { ...s[item.id], notes: e.target.value } }))}
                                onBlur={e => saveItemExtra(item.id, itemExtras[item.id]?.url ?? '', e.target.value)}
                              />
                            </td>
                          </>
                        )}
                        {/* Dispatch controls — screen only */}
                        <td className="no-print text-center">
                          {item.fully_shipped ? (
                            <span className="text-green-600 font-medium text-xs">✓ Done</span>
                          ) : (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                className={cn("w-20 form-input text-right text-xs py-1",
                                  isPartial ? "border-amber-400 bg-amber-50" : "")}
                                value={ds.avail}
                                min={0}
                                max={remaining}
                                step={1}
                                onChange={e => updateItemDispatch(item.id, parseInt(e.target.value) || 0, ds.checked)}
                              />
                              {isPartial && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                            </div>
                          )}
                        </td>
                        <td className="no-print text-center">
                          {!item.fully_shipped && (
                            <button
                              type="button"
                              onClick={() => updateItemDispatch(item.id, ds.avail, !ds.checked)}
                              className={cn("transition-colors", ds.checked ? "text-green-600" : "text-gray-300 hover:text-gray-500")}
                            >
                              {ds.checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </button>
                          )}
                        </td>
                        <td className="no-print text-center text-xs text-gray-500">
                          {item.shipped_qty > 0 ? Math.round(item.shipped_qty) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Totals */}
          <div className="flex justify-end mb-4">
            <div className="w-64 text-sm space-y-1">
              {po.net_value > 0 && <div className="flex justify-between"><span className="text-gray-600">Net Value</span><span>{formatCurrency(po.net_value, po.currency)}</span></div>}
              {po.customs_duties_percent > 0 && <div className="flex justify-between"><span className="text-gray-600">Duties ({po.customs_duties_percent}%)</span><span>{formatCurrency(po.customs_duties_amount, po.currency)}</span></div>}
              <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                <span>Total Amount</span>
                <span className="text-[#1E3A5F]">{formatCurrency(po.total_amount || po.purchase_total, po.currency)}</span>
              </div>
            </div>
          </div>

          {po.comments && (
            <div className="text-sm mb-3">
              <p className="section-title">Comments</p>
              <p className="text-gray-700">{po.comments}</p>
            </div>
          )}
          {po.instructions_to_vendor && (
            <div className="text-sm">
              <p className="section-title">Instructions To Vendor</p>
              <p className="text-gray-700">{po.instructions_to_vendor}</p>
            </div>
          )}
          </div>
        </div>

        {/* ---- Dispatch Actions (screen only) ---- */}
        {po.po_type === 'client' && !items.every(i => i.fully_shipped) && (
          <div className="card no-print">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#3A6EA5]" />
                <h3 className="font-semibold text-[#1E3A5F]">Dispatch &amp; Create Documents</h3>
              </div>
            </div>
            <div className="card-body">
              <p className="text-sm text-gray-600 mb-4">
                Mark items ready to ship and set the available quantity, then click a document button.
                All three documents (Commercial Invoice, Tax Invoice, Packing List) are created automatically —
                you will be taken to whichever one you click.
              </p>
              <div className="mb-4">
                <label className="form-label">Dispatch Notes (optional)</label>
                <textarea className="form-textarea" rows={2} value={dispatchNotes} onChange={e => setDispatchNotes(e.target.value)} placeholder="Notes for this dispatch batch…" />
              </div>
              <div className="flex gap-3 flex-wrap">
                <button className="btn btn-primary" disabled={!hasReadyItems || dispatching}
                  onClick={() => createDispatch('commercial-invoices')}>
                  {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Commercial Invoice
                </button>
                <button className="btn btn-secondary" disabled={!hasReadyItems || dispatching}
                  onClick={() => createDispatch('tax-invoices')}>
                  Tax Invoice
                </button>
                <button className="btn btn-primary" disabled={!hasReadyItems || dispatching}
                  onClick={() => createDispatch('packing-lists')}>
                  Packing List
                </button>
              </div>
              {!hasReadyItems && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Check at least one item as ready to ship to create dispatch documents.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ---- Previous Dispatch Batches ---- */}
        {batches.length > 0 && (
          <div className="card no-print">
            <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Dispatch Batches</h3></div>
            <div className="card-body divide-y divide-gray-100">
              {batches.map(batch => {
                const ci = batch.commercial_invoices?.[0]
                const ti = batch.tax_invoices?.[0]
                const pl = batch.packing_lists?.[0]
                return (
                  <div key={batch.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">Batch #{batch.batch_number}</p>
                        <p className="text-xs text-gray-500">{formatDate(batch.dispatched_at)}</p>
                        {batch.notes && <p className="text-xs text-gray-400 mt-0.5">{batch.notes}</p>}
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {ci ? (
                          <Link href={`/commercial-invoices/${ci.id}`} className="btn btn-secondary btn-sm text-xs">
                            CI {ci.invoice_number}
                          </Link>
                        ) : null}
                        {ti ? (
                          <Link href={`/tax-invoices/${ti.id}`} className="btn btn-secondary btn-sm text-xs">
                            TI {ti.tax_invoice_number}
                          </Link>
                        ) : null}
                        {pl ? (
                          <Link href={`/packing-lists/${pl.id}`} className="btn btn-secondary btn-sm text-xs">
                            Packing List
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
