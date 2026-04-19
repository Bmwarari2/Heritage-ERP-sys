'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { printPdf } from '@/lib/print-pdf'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { CommercialInvoice, Client } from '@/types'

function CIContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = id === 'new'
  const poId = searchParams.get('po_id')
  const batchId = searchParams.get('batch_id')
  const initialClientId = searchParams.get('client_id') ?? ''

  const [ci, setCi] = useState<CommercialInvoice | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(isNew)

  const [form, setForm] = useState({
    po_id: poId ?? '', batch_id: batchId ?? '', client_id: initialClientId,
    purchase_order_number: '', invoice_date: new Date().toISOString().slice(0, 10),
    currency: 'GBP', awb_bl_number: '', country_of_origin: 'United Kingdom',
    terms_of_sale: '', shipper_name: 'Heritage Global Solutions Ltd',
    shipper_address: '', consignee_name: '', consignee_address: '',
    notify_party: '', intermediate_consignee: '', final_destination: '',
    notes: '', status: 'draft' as string,
  })

  const [items, setItems] = useState([{ item_number: '1', product_description: '', quantity: 1, unit_price: 0 }])

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => setClients([]))
  }, [])

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/commercial-invoices/${id}`).then(r => r.json()).then(data => {
        setCi(data); setLoading(false)
        setForm({
          po_id: data.po_id ?? '', batch_id: data.batch_id ?? '', client_id: data.client_id ?? '',
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
    } else if (batchId) {
      fetch(`/api/dispatch-batches/${batchId}`).then(r => r.json()).then(batch => {
        if (!batch?.purchase_orders) return
        const po = batch.purchase_orders
        const shipTo = [po.ship_to_company, po.ship_to_po_box ? `PO Box ${po.ship_to_po_box}` : null,
          [po.ship_to_town, po.ship_to_post_code].filter(Boolean).join(' '), po.ship_to_country]
          .filter(Boolean).join('\n')
        const shipperAddr = [po.vendor_name, [po.vendor_city, po.vendor_post_code].filter(Boolean).join(' '),
          po.vendor_country].filter(Boolean).join('\n')
        setForm(f => ({
          ...f,
          client_id: po.client_id ?? f.client_id,
          purchase_order_number: po.po_number ?? '',
          currency: po.currency ?? 'GBP',
          terms_of_sale: po.inco_terms ?? '',
          final_destination: po.ship_to_country ?? '',
          shipper_address: shipperAddr,
          consignee_name: po.bill_to_company ?? po.ship_to_company ?? '',
          consignee_address: shipTo,
        }))
        const batchItems = (batch.dispatch_batch_items ?? [])
          .map((bi: { dispatched_qty: number; po_items: { item_number: string; description_short: string | null; description_full: string | null; net_price: number; unit_price: number } }) => {
            const po_item = bi.po_items
            const desc = [po_item.description_short, po_item.description_full].filter(Boolean).join(' — ')
            return {
              item_number: po_item.item_number,
              product_description: desc,
              quantity: bi.dispatched_qty,
              unit_price: Number(po_item.net_price) || Number(po_item.unit_price) || 0,
            }
          })
        if (batchItems.length > 0) setItems(batchItems)
      })
    }
  }, [id, batchId, isNew])

  function setField(key: string, value: string) { setForm(f => ({ ...f, [key]: value })) }
  function setItemField(i: number, key: string, value: string | number) {
    setItems(items => items.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }

  function applyClient(clientId: string) {
    const c = clients.find(cl => cl.id === clientId)
    if (!c) { setForm(f => ({ ...f, client_id: '' })); return }
    setForm(f => ({
      ...f,
      client_id: c.id,
      consignee_name: c.name,
      consignee_address: c.address ?? f.consignee_address,
      notify_party: c.notify_party ?? f.notify_party,
    }))
  }

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0)

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, client_id: form.client_id || null, total_amount: totalAmount, items }
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
            <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Invoice Details</h3></div>
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
              <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Shipper (Heritage)</h3></div>
              <div className="card-body space-y-3">
                <div><label className="form-label">Name</label><input className="form-input" value={form.shipper_name} onChange={e => setField('shipper_name', e.target.value)} /></div>
                <div><label className="form-label">Address</label><textarea className="form-textarea" rows={3} value={form.shipper_address} onChange={e => setField('shipper_address', e.target.value)} /></div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Consignee (Client)</h3></div>
              <div className="card-body space-y-3">
                <div>
                  <label className="form-label">Client</label>
                  <select className="form-input" value={form.client_id} onChange={e => applyClient(e.target.value)}>
                    <option value="">— Select client —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Name</label><input className="form-input" value={form.consignee_name} onChange={e => setField('consignee_name', e.target.value)} /></div>
                <div><label className="form-label">Address</label><textarea className="form-textarea" rows={2} value={form.consignee_address} onChange={e => setField('consignee_address', e.target.value)} /></div>
                <div><label className="form-label">Notify Party</label><input className="form-input" value={form.notify_party} onChange={e => setField('notify_party', e.target.value)} /></div>
                <div><label className="form-label">Intermediate Consignee (optional)</label><input className="form-input" value={form.intermediate_consignee} onChange={e => setField('intermediate_consignee', e.target.value)} /></div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-[#1E3A5F]">Items</h3>
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
                    <td><input type="number" className="form-input text-right w-24" value={item.quantity === 0 ? '' : item.quantity} onChange={e => setItemField(i, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-28" value={item.unit_price === 0 ? '' : item.unit_price} onChange={e => setItemField(i, 'unit_price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} /></td>
                    <td className="text-right font-medium">{(item.quantity * item.unit_price).toFixed(2)}</td>
                    <td><button type="button" onClick={() => setItems(items => items.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <div className="w-48 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#1E3A5F]">{form.currency} {totalAmount.toFixed(2)}</span>
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

  // View / print mode
  return (
    <PageWrapper title={`Commercial Invoice — ${ci.invoice_number}`}
      actions={<div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></button>
        {ci.po_id && <Link href={`/purchase-orders/${ci.po_id}`} className="btn btn-secondary btn-sm">View PO</Link>}
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn btn-secondary btn-sm" onClick={() => printPdf(`/api/commercial-invoices/${ci.id}/pdf`)}><Printer className="w-4 h-4" /> Print</button>
        <a href={`/api/commercial-invoices/${ci.id}/pdf`} className="btn btn-primary btn-sm" target="_blank" rel="noopener">
          <Printer className="w-4 h-4" /> Download PDF
        </a>
      </div>}>
      <div className="card card-body w-full print-page doc-print-page">
        <div className="doc-print-inner">
          <div className="doc-header">
            <div className="doc-header-left">
              <p className="doc-doc-label">Document</p>
              <h1 className="doc-title">Commercial Invoice</h1>
              <dl className="doc-ref-box">
                <dt>Invoice No</dt>
                <dd className="font-mono">{ci.invoice_number}</dd>
                <dt>Date</dt>
                <dd>{formatDate(ci.invoice_date)}</dd>
                {ci.purchase_order_number && (<><dt>PO No</dt><dd className="font-mono">{ci.purchase_order_number}</dd></>)}
                {ci.awb_bl_number && (<><dt>AWB/BL</dt><dd className="font-mono">{ci.awb_bl_number}</dd></>)}
                <dt>Currency</dt>
                <dd>{ci.currency}</dd>
                {ci.terms_of_sale && (<><dt>Terms of Sale</dt><dd>{ci.terms_of_sale}</dd></>)}
                {ci.country_of_origin && (<><dt>Country of Origin</dt><dd>{ci.country_of_origin}</dd></>)}
                {ci.final_destination && (<><dt>Final Destination</dt><dd>{ci.final_destination}</dd></>)}
              </dl>
            </div>
          </div>

          <div className="mb-5 no-print"><StatusBadge status={ci.status} /></div>

          <section className="doc-address-grid">
            <div className="doc-address-cell">
              <p className="section-title">Shipper</p>
              <p className="font-medium">{ci.shipper_name}</p>
              {ci.shipper_address && <p className="whitespace-pre-line">{ci.shipper_address}</p>}
              {ci.notify_party && (
                <>
                  <hr className="my-2 border-slate-300" />
                  <p className="section-title">Notify Party</p>
                  <p className="whitespace-pre-line">{ci.notify_party}</p>
                </>
              )}
            </div>
            <div className="doc-address-cell">
              <p className="section-title">Consignee</p>
              <p className="font-medium">{ci.consignee_name}</p>
              {ci.consignee_address && <p className="whitespace-pre-line">{ci.consignee_address}</p>}
              {ci.intermediate_consignee && <p><span className="font-medium">Intermediate Consignee:</span> {ci.intermediate_consignee}</p>}
            </div>
          </section>

          <section className="doc-items">
            <p className="section-title">Items</p>
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Item No</th>
                    <th>Product Description</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {ci.ci_items?.map(item => (
                    <tr key={item.id}>
                      <td className="font-mono">{item.item_number}</td>
                      <td>{item.product_description}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">{ci.currency} {Number(item.unit_price).toFixed(2)}</td>
                      <td className="text-right font-semibold">{ci.currency} {Number(item.total_value).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex justify-end mt-6 mb-4">
            <div className="w-full sm:w-80 doc-address-cell">
              <p className="section-title">Summary</p>
              <div className="flex justify-between font-bold text-base border-t-2 border-slate-300 pt-2 mt-1">
                <span className="text-slate-900">Total Invoice Amount</span>
                <span className="text-heritage-900">{formatCurrency(ci.total_amount, ci.currency)}</span>
              </div>
            </div>
          </div>

          {ci.notes && (
            <div className="text-sm mt-4">
              <p className="section-title">Notes</p>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">{ci.notes}</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

export default function CommercialInvoicePage() {
  return <Suspense fallback={<div>Loading…</div>}><CIContent /></Suspense>
}
