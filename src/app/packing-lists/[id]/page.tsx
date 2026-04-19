'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { printPdf } from '@/lib/print-pdf'
import type { PackingList } from '@/types'

function PLContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = id === 'new'
  const poId = searchParams.get('po_id')
  const batchId = searchParams.get('batch_id')

  const [pl, setPl] = useState<PackingList | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(isNew)

  const [form, setForm] = useState({
    po_id: poId ?? '', batch_id: batchId ?? '',
    customer_po_number: '', our_order_number: '',
    final_destination: '', shipped_via: '', sales_person: '',
    ship_to_address: '', status: 'draft' as string,
  })

  const [items, setItems] = useState([{ item_number: '1', quantity: 1, description: '' }])
  const [boxes, setBoxes] = useState([{
    box_number: 1, box_type: 'Cardboard', dimension_l: 0, dimension_w: 0, dimension_h: 0, gross_weight: 0, notes: ''
  }])

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/packing-lists/${id}`).then(r => r.json()).then(data => {
        setPl(data); setLoading(false)
        setForm({
          po_id: data.po_id ?? '', batch_id: data.batch_id ?? '',
          customer_po_number: data.customer_po_number ?? '', our_order_number: data.our_order_number ?? '',
          final_destination: data.final_destination ?? '', shipped_via: data.shipped_via ?? '',
          sales_person: data.sales_person ?? '', ship_to_address: data.ship_to_address ?? '',
          status: data.status,
        })
        setItems(data.packing_list_items ?? [{ item_number: '1', quantity: 1, description: '' }])
        setBoxes(data.packing_list_boxes?.length > 0 ? data.packing_list_boxes : [{ box_number: 1, box_type: 'Cardboard', dimension_l: 0, dimension_w: 0, dimension_h: 0, gross_weight: 0, notes: '' }])
      })
    } else if (batchId) {
      fetch(`/api/dispatch-batches/${batchId}`).then(r => r.json()).then(batch => {
        if (!batch?.purchase_orders) return
        const po = batch.purchase_orders
        const shipTo = [po.ship_to_company, po.ship_to_po_box ? `PO Box ${po.ship_to_po_box}` : null,
          [po.ship_to_town, po.ship_to_post_code].filter(Boolean).join(' '), po.ship_to_country]
          .filter(Boolean).join('\n')
        setForm(f => ({
          ...f,
          customer_po_number: po.po_number ?? '',
          our_order_number: po.your_reference ?? '',
          shipped_via: po.mode_of_transport ?? '',
          sales_person: po.sales_person ?? '',
          ship_to_address: shipTo,
        }))
        const batchItems = (batch.dispatch_batch_items ?? [])
          .map((bi: { dispatched_qty: number; po_items: { item_number: string; description_short: string | null; description_full: string | null } }) => {
            const po_item = bi.po_items
            const desc = [po_item.description_short, po_item.description_full].filter(Boolean).join(' — ')
            return { item_number: po_item.item_number, quantity: bi.dispatched_qty, description: desc }
          })
        if (batchItems.length > 0) setItems(batchItems)
      })
    }
  }, [id, batchId, isNew])

  function setField(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }
  function setItemField(i: number, key: string, value: string | number) {
    setItems(items => items.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }
  function setBoxField(i: number, key: string, value: string | number) {
    setBoxes(boxes => boxes.map((box, idx) => idx === i ? { ...box, [key]: value } : box))
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, items, boxes }
    const url = isNew ? '/api/packing-lists' : `/api/packing-lists/${id}`
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { if (isNew) router.replace(`/packing-lists/${data.id}`); else { setPl(data); setEditing(false) } }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

  if (editing) {
    return (
      <PageWrapper title={isNew ? 'New Packing List' : 'Edit Packing List'}
        actions={<div className="flex gap-2">
          {!isNew && <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>}
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>}>
        <div className="space-y-6 w-full">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Packing List Details</h3></div>
            {/* Condensed inline row for all header fields */}
            <div className="card-body grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div><label className="form-label">Customer PO Number</label><input className="form-input" value={form.customer_po_number} onChange={e => setField('customer_po_number', e.target.value)} /></div>
              <div><label className="form-label">Our Order No</label><input className="form-input" value={form.our_order_number} onChange={e => setField('our_order_number', e.target.value)} /></div>
              <div><label className="form-label">Final Destination</label><input className="form-input" value={form.final_destination} onChange={e => setField('final_destination', e.target.value)} /></div>
              <div><label className="form-label">Shipped Via</label><input className="form-input" value={form.shipped_via} onChange={e => setField('shipped_via', e.target.value)} /></div>
              <div><label className="form-label">Sales Person</label><input className="form-input" value={form.sales_person} onChange={e => setField('sales_person', e.target.value)} /></div>
            </div>
            <div className="px-6 pb-4">
              <label className="form-label">Ship To Address</label>
              <textarea className="form-textarea" rows={3} value={form.ship_to_address} onChange={e => setField('ship_to_address', e.target.value)} />
            </div>
          </div>

          {/* Items — no Item No column */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-[#1E3A5F]">Items</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItems(i => [...i, { item_number: String(i.length + 1), quantity: 1, description: '' }])}>
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <table className="data-table">
              <thead><tr><th className="text-center w-28">Quantity</th><th>Description</th><th className="w-10"></th></tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td><input type="number" className="form-input text-center" value={item.quantity === 0 ? '' : item.quantity} onChange={e => setItemField(i, 'quantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)} /></td>
                    <td><input className="form-input" value={item.description} onChange={e => setItemField(i, 'description', e.target.value)} /></td>
                    <td><button type="button" onClick={() => setItems(items => items.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Boxes */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-[#1E3A5F]">Box Details</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBoxes(b => [...b, { box_number: b.length + 1, box_type: 'Cardboard', dimension_l: 0, dimension_w: 0, dimension_h: 0, gross_weight: 0, notes: '' }])}>
                <Plus className="w-4 h-4" /> Add Box
              </button>
            </div>
            <table className="data-table text-xs">
              <thead><tr><th>Box No</th><th>Type</th><th>L (cm)</th><th>W (cm)</th><th>H (cm)</th><th>Gross Weight (kg)</th><th></th></tr></thead>
              <tbody>
                {boxes.map((box, i) => (
                  <tr key={i}>
                    <td><input className="form-input w-14 text-center" value={box.box_number === 0 ? '' : box.box_number} onChange={e => setBoxField(i, 'box_number', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)} /></td>
                    <td><input className="form-input" value={box.box_type} onChange={e => setBoxField(i, 'box_type', e.target.value)} /></td>
                    <td><input type="number" className="form-input text-right w-16" value={box.dimension_l === 0 ? '' : box.dimension_l} onChange={e => setBoxField(i, 'dimension_l', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-16" value={box.dimension_w === 0 ? '' : box.dimension_w} onChange={e => setBoxField(i, 'dimension_w', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-16" value={box.dimension_h === 0 ? '' : box.dimension_h} onChange={e => setBoxField(i, 'dimension_h', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-24" value={box.gross_weight === 0 ? '' : box.gross_weight} onChange={e => setBoxField(i, 'gross_weight', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} /></td>
                    <td><button type="button" onClick={() => setBoxes(boxes => boxes.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!pl) return null

  return (
    <PageWrapper title="Packing List"
      actions={<div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></button>
        {pl.po_id && <Link href={`/purchase-orders/${pl.po_id}`} className="btn btn-secondary btn-sm">View PO</Link>}
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn btn-secondary btn-sm" onClick={() => printPdf(`/api/packing-lists/${pl.id}/pdf`)}><Printer className="w-4 h-4" /> Print</button>
        <a href={`/api/packing-lists/${pl.id}/pdf`} className="btn btn-primary btn-sm" target="_blank" rel="noopener">
          <Printer className="w-4 h-4" /> Download PDF
        </a>
      </div>}>
      <div className="card card-body w-full print-page doc-print-page">
        <div className="doc-print-inner">
          <div className="doc-header">
            <div className="doc-header-left">
              <p className="doc-doc-label">Document</p>
              <h1 className="doc-title">Packing List</h1>
              <dl className="doc-ref-box">
                {pl.customer_po_number && (<><dt>Customer PO</dt><dd className="font-mono">{pl.customer_po_number}</dd></>)}
                {pl.our_order_number && (<><dt>Our Order No</dt><dd className="font-mono">{pl.our_order_number}</dd></>)}
                {pl.final_destination && (<><dt>Destination</dt><dd>{pl.final_destination}</dd></>)}
                {pl.shipped_via && (<><dt>Shipped Via</dt><dd>{pl.shipped_via}</dd></>)}
                {pl.sales_person && (<><dt>Sales Person</dt><dd>{pl.sales_person}</dd></>)}
              </dl>
            </div>
          </div>

          <div className="mb-5 no-print"><StatusBadge status={pl.status} /></div>

          {pl.ship_to_address && (
            <section className="doc-address-grid">
              <div className="doc-address-cell">
                <p className="section-title">Ship To</p>
                <p className="whitespace-pre-line">{pl.ship_to_address}</p>
              </div>
            </section>
          )}

          <section className="doc-items">
            <p className="section-title">Items</p>
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th className="text-center w-28">Quantity</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {pl.packing_list_items?.map(item => (
                    <tr key={item.id}>
                      <td className="text-center">{item.quantity}</td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {pl.packing_list_boxes && pl.packing_list_boxes.length > 0 && (
            <section className="doc-items">
              <p className="section-title">Box Details</p>
              <div className="overflow-x-auto">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th>Box No</th>
                      <th>Type</th>
                      <th>Dimensions (L×W×H cm)</th>
                      <th className="text-right">Gross Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pl.packing_list_boxes.map(box => (
                      <tr key={box.id}>
                        <td className="font-mono">{box.box_number}</td>
                        <td>{box.box_type}</td>
                        <td>{box.dimension_l} × {box.dimension_w} × {box.dimension_h}</td>
                        <td className="text-right">{box.gross_weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

export default function PackingListDetailPage() {
  return <Suspense fallback={<div>Loading…</div>}><PLContent /></Suspense>
}
