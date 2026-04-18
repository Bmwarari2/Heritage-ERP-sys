'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import DocumentHeader from '@/components/shared/DocumentHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { CommercialInvoice } from '@/types'

function CIContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = id === 'new'
  const poId = searchParams.get('po_id')
  const batchId = searchParams.get('batch_id')

  const [ci, setCi] = useState<CommercialInvoice | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(isNew)

  const [form, setForm] = useState({
    po_id: poId ?? '', batch_id: batchId ?? '',
    purchase_order_number: '', invoice_date: new Date().toISOString().slice(0, 10),
    currency: 'GBP', awb_bl_number: '', country_of_origin: 'United Kingdom',
    terms_of_sale: '', shipper_name: 'Heritage Global Solutions Ltd',
    shipper_address: '', consignee_name: '', consignee_address: '',
    notify_party: '', intermediate_consignee: '', final_destination: '',
    notes: '', status: 'draft' as string,
  })

  const [items, setItems] = useState([{ item_number: '1', product_description: '', quantity: 1, unit_price: 0 }])

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/commercial-invoices/${id}`).then(r => r.json()).then(data => {
        setCi(data); setLoading(false)
        setForm({
          po_id: data.po_id ?? '', batch_id: data.batch_id ?? '',
          purchase_order_number: data.purchase_order_number ?? '', invoice_date: data.invoice_date,
          currency: data.currency, awb_bl_number: data.awb_bl_number ?? '',
          country_of_origin: data.country_of_origin ?? 'United Kingdom',
          terms_of_sale: data.terms_of_sale ?? '', shipper_name: data.shipper_name,
          shipper_address: data.shipper_address ?? '', consignee_name: data.consignee_name ?? '',
          consignee_address: data.consignee_address ?? '', notify_party: data.notify_party ?? '',
          intermediate_consignee: data.intermediate_consignee ?? '', final_destination: data.final_destination ?? '',
          notes: data.notes ?? '', status: data.status,
        })
        setItems(data.ci_items?.map((i: { item_number: string; product_description: string | null; quantity: number; unit_price: number }) => ({
          item_number: i.item_number, product_description: i.product_description ?? '',
          quantity: i.quantity, unit_price: i.unit_price,
        })) ?? [])
      })
    }
  }, [id])

  function setField(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }
  function setItemField(i: number, key: string, value: string | number) {
    setItems(items => items.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0)

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, total_amount: totalAmount, items }
    const url = isNew ? '/api/commercial-invoices' : `/api/commercial-invoices/${id}`
    const method = isNew ? 'POST' : 'PUT'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      if (isNew) router.replace(`/commercial-invoices/${data.id}`)
      else { setCi(data); setEditing(false) }
    }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

  if (editing) {
    return (
      <PageWrapper title={isNew ? 'New Commercial Invoice' : `Edit ${ci?.invoice_number}`}
        actions={<div className="flex gap-2">
          {!isNew && <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>}
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>}>
        <div className="space-y-6 w-full">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-[#1a2744]">Invoice Details</h3></div>
            <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className="form-label">PO Number</label><input className="form-input" value={form.purchase_order_number} onChange={e => setField('purchase_order_number', e.target.value)} /></div>
              <div><label className="form-label">Invoice Date</label><input type="date" className="form-input" value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)} /></div>
              <div><label className="form-label">Currency</label><input className="form-input" value={form.currency} onChange={e => setField('currency', e.target.value)} /></div>
              <div><label className="form-label">AWB/BL No</label><input className="form-input" value={form.awb_bl_number} onChange={e => setField('awb_bl_number', e.target.value)} /></div>
              <div><label className="form-label">Country of Origin</label><input className="form-input" value={form.country_of_origin} onChange={e => setField('country_of_origin', e.target.value)} /></div>
              <div><label className="form-label">Terms of Sale</label><input className="form-input" value={form.terms_of_sale} onChange={e => setField('terms_of_sale', e.target.value)} /></div>
              <div><label className="form-label">Final Destination</label><input className="form-input" value={form.final_destination} onChange={e => setField('final_destination', e.target.value)} /></div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header"><h3 className="font-semibold text-[#1a2744]">Shipper (Heritage)</h3></div>
              <div className="card-body space-y-3">
                <div><label className="form-label">Name</label><input className="form-input" value={form.shipper_name} onChange={e => setField('shipper_name', e.target.value)} /></div>
                <div><label className="form-label">Address</label><textarea className="form-textarea" rows={3} value={form.shipper_address} onChange={e => setField('shipper_address', e.target.value)} /></div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="font-semibold text-[#1a2744]">Consignee (Client)</h3></div>
              <div className="card-body space-y-3">
                <div><label className="form-label">Name</label><input className="form-input" value={form.consignee_name} onChange={e => setField('consignee_name', e.target.value)} /></div>
                <div><label className="form-label">Address</label><textarea className="form-textarea" rows={2} value={form.consignee_address} onChange={e => setField('consignee_address', e.target.value)} /></div>
                <div><label className="form-label">Notify Party</label><input className="form-input" value={form.notify_party} onChange={e => setField('notify_party', e.target.value)} /></div>
                <div><label className="form-label">Intermediate Consignee (optional)</label><input className="form-input" value={form.intermediate_consignee} onChange={e => setField('intermediate_consignee', e.target.value)} /></div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-[#1a2744]">Items</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItems(i => [...i, { item_number: String(i.length + 1), product_description: '', quantity: 1, unit_price: 0 }])}>
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <table className="data-table">
              <thead><tr><th>Item No</th><th>Product Description</th><th className="text-right">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Total Value</th><th></th></tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td><input className="form-input font-mono w-16" value={item.item_number} onChange={e => setItemField(i, 'item_number', e.target.value)} /></td>
                    <td><input className="form-input" value={item.product_description} onChange={e => setItemField(i, 'product_description', e.target.value)} /></td>
                    <td><input type="number" className="form-input text-right w-24" value={item.quantity} onChange={e => setItemField(i, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-28" value={item.unit_price} onChange={e => setItemField(i, 'unit_price', parseFloat(e.target.value) || 0)} /></td>
                    <td className="text-right font-medium">{(item.quantity * item.unit_price).toFixed(2)}</td>
                    <td><button type="button" onClick={() => setItems(items => items.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <div className="w-48 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#1a2744]">{form.currency} {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="card card-body">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (!ci) return null

  // View mode
  return (
    <PageWrapper title={`Commercial Invoice — ${ci.invoice_number}`}
      actions={<div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></button>
        {ci.po_id && <Link href={`/purchase-orders/${ci.po_id}`} className="btn btn-secondary btn-sm">View PO</Link>}
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Printer className="w-4 h-4" /> Edit</button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer className="w-4 h-4" /> Download PDF</button>
      </div>}>
      <div className="card card-body w-full print-page">
        <DocumentHeader title="COMMERCIAL INVOICE" docNumber={ci.invoice_number} docDate={formatDate(ci.invoice_date)}
          extra={<div className="text-sm text-gray-600 mt-1 space-y-0.5">
            {ci.purchase_order_number && <p><span className="font-medium">PO No:</span> {ci.purchase_order_number}</p>}
            {ci.awb_bl_number && <p><span className="font-medium">AWB/BL:</span> {ci.awb_bl_number}</p>}
            <p><span className="font-medium">Currency:</span> {ci.currency}</p>
            {ci.terms_of_sale && <p><span className="font-medium">Terms:</span> {ci.terms_of_sale}</p>}
            {ci.country_of_origin && <p><span className="font-medium">Country of Origin:</span> {ci.country_of_origin}</p>}
          </div>} />
        <div className="mb-4 no-print"><StatusBadge status={ci.status} /></div>
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="section-title">Shipper</p>
            <p className="font-medium">{ci.shipper_name}</p>
            {ci.shipper_address && <p className="whitespace-pre-line">{ci.shipper_address}</p>}
          </div>
          <div>
            <p className="section-title">Consignee</p>
            <p className="font-medium">{ci.consignee_name}</p>
            {ci.consignee_address && <p className="whitespace-pre-line">{ci.consignee_address}</p>}
            {ci.notify_party && <p className="mt-1"><span className="font-medium">Notify:</span> {ci.notify_party}</p>}
            {ci.intermediate_consignee && <p><span className="font-medium">Intermediate:</span> {ci.intermediate_consignee}</p>}
            {ci.final_destination && <p><span className="font-medium">Final Destination:</span> {ci.final_destination}</p>}
          </div>
        </div>
        <table className="data-table text-xs mb-4">
          <thead><tr><th>Item No</th><th>Product Description</th><th className="text-right">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Total Value</th></tr></thead>
          <tbody>
            {ci.ci_items?.map(item => (
              <tr key={item.id}>
                <td className="font-mono">{item.item_number}</td>
                <td>{item.product_description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{ci.currency} {Number(item.unit_price).toFixed(2)}</td>
                <td className="text-right font-medium">{ci.currency} {Number(item.total_value).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mb-4">
          <div className="w-48 flex justify-between font-bold text-base border-t border-gray-200 pt-2">
            <span>Total Invoice Amount</span>
            <span className="text-[#1a2744]">{formatCurrency(ci.total_amount, ci.currency)}</span>
          </div>
        </div>
        {ci.notes && <div className="text-sm"><p className="section-title">Notes</p><p>{ci.notes}</p></div>}
      </div>
    </PageWrapper>
  )
}

export default function CommercialInvoicePage() {
  return <Suspense fallback={<div>Loading…</div>}><CIContent /></Suspense>
}
