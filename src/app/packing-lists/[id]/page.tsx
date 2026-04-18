'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import DocumentHeader from '@/components/shared/DocumentHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
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
    ship_to_address: '', notes: '', status: 'draft' as string,
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
          notes: data.notes ?? '', status: data.status,
        })
        setItems(data.packing_list_items ?? [{ item_number: '1', quantity: 1, description: '' }])
        setBoxes(data.packing_list_boxes?.length > 0 ? data.packing_list_boxes : [{ box_number: 1, box_type: 'Cardboard', dimension_l: 0, dimension_w: 0, dimension_h: 0, gross_weight: 0, notes: '' }])
      })
    }
  }, [id])

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
        <div className="space-y-6 max-w-5xl">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-[#1a2744]">Packing List Details</h3></div>
            <div className="card-body grid grid-cols-2 md:grid-cols-3 gap-4">
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

          {/* Items */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-[#1a2744]">Items</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItems(i => [...i, { item_number: String(i.length + 1), quantity: 1, description: '' }])}>
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <table className="data-table">
              <thead><tr><th className="w-20">Item No</th><th className="w-24">Quantity</th><th>Description</th><th className="w-10"></th></tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td><input className="form-input font-mono" value={item.item_number} onChange={e => setItemField(i, 'item_number', e.target.value)} /></td>
                    <td><input type="number" className="form-input text-right" value={item.quantity} onChange={e => setItemField(i, 'quantity', parseFloat(e.target.value) || 0)} /></td>
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
              <h3 className="font-semibold text-[#1a2744]">Box Details</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setBoxes(b => [...b, { box_number: b.length + 1, box_type: 'Cardboard', dimension_l: 0, dimension_w: 0, dimension_h: 0, gross_weight: 0, notes: '' }])}>
                <Plus className="w-4 h-4" /> Add Box
              </button>
            </div>
            <table className="data-table text-xs">
              <thead><tr><th>Box No</th><th>Type</th><th>L (cm)</th><th>W (cm)</th><th>H (cm)</th><th>Gross Weight (kg)</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {boxes.map((box, i) => (
                  <tr key={i}>
                    <td><input className="form-input w-14 text-center" value={box.box_number} onChange={e => setBoxField(i, 'box_number', parseInt(e.target.value) || 0)} /></td>
                    <td><input className="form-input" value={box.box_type} onChange={e => setBoxField(i, 'box_type', e.target.value)} /></td>
                    <td><input type="number" className="form-input text-right w-16" value={box.dimension_l} onChange={e => setBoxField(i, 'dimension_l', parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-16" value={box.dimension_w} onChange={e => setBoxField(i, 'dimension_w', parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-16" value={box.dimension_h} onChange={e => setBoxField(i, 'dimension_h', parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-24" value={box.gross_weight} onChange={e => setBoxField(i, 'gross_weight', parseFloat(e.target.value) || 0)} /></td>
                    <td><input className="form-input" value={box.notes} onChange={e => setBoxField(i, 'notes', e.target.value)} /></td>
                    <td><button type="button" onClick={() => setBoxes(boxes => boxes.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card card-body">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
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
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer className="w-4 h-4" /> Download PDF</button>
      </div>}>
      <div className="card card-body max-w-5xl print-page">
        <DocumentHeader title="PACKING LIST"
          extra={<div className="text-sm text-gray-600 mt-1 space-y-0.5">
            {pl.customer_po_number && <p><span className="font-medium">Customer PO No:</span> {pl.customer_po_number}</p>}
            {pl.our_order_number && <p><span className="font-medium">Our Order No:</span> {pl.our_order_number}</p>}
            {pl.final_destination && <p><span className="font-medium">Final Destination:</span> {pl.final_destination}</p>}
            {pl.shipped_via && <p><span className="font-medium">Shipped Via:</span> {pl.shipped_via}</p>}
            {pl.sales_person && <p><span className="font-medium">Sales Person:</span> {pl.sales_person}</p>}
          </div>} />

        <div className="mb-4 no-print"><StatusBadge status={pl.status} /></div>

        {pl.ship_to_address && (
          <div className="mb-6 text-sm">
            <p className="section-title">Ship To</p>
            <p className="whitespace-pre-line">{pl.ship_to_address}</p>
          </div>
        )}

        {/* Items */}
        <div className="mb-6">
          <p className="section-title">Items</p>
          <table className="data-table text-xs">
            <thead><tr><th>Item No</th><th className="text-right">Quantity</th><th>Description</th></tr></thead>
            <tbody>
              {pl.packing_list_items?.map(item => (
                <tr key={item.id}>
                  <td className="font-mono">{item.item_number}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Box Details */}
        {pl.packing_list_boxes && pl.packing_list_boxes.length > 0 && (
          <div className="mb-4">
            <p className="section-title">Box Details</p>
            <table className="data-table text-xs">
              <thead><tr><th>Box No</th><th>Type</th><th>Dimensions (LxWxH cm)</th><th className="text-right">Gross Weight (kg)</th><th>Notes</th></tr></thead>
              <tbody>
                {pl.packing_list_boxes.map(box => (
                  <tr key={box.id}>
                    <td className="font-mono">{box.box_number}</td>
                    <td>{box.box_type}</td>
                    <td>{box.dimension_l} × {box.dimension_w} × {box.dimension_h}</td>
                    <td className="text-right">{box.gross_weight}</td>
                    <td>{box.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pl.notes && <div className="text-sm"><p className="section-title">Notes</p><p>{pl.notes}</p></div>}
      </div>
    </PageWrapper>
  )
}

export default function PackingListDetailPage() {
  return <Suspense fallback={<div>Loading…</div>}><PLContent /></Suspense>
}
