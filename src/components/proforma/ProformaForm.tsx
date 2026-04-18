'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, Loader2, StickyNote } from 'lucide-react'
import type { RFQ, ProformaInvoice, ProformaItem, Client } from '@/types'

type FormItem = {
  item_number: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  internal_notes: string
}

interface ProformaFormProps {
  rfq?: RFQ | null
  existing?: ProformaInvoice | null
}

const EMPTY_ITEM: FormItem = {
  item_number: '', description: '', quantity: 1, unit: 'EA', unit_price: 0, internal_notes: '',
}

function buildVendorAddress(rfq: RFQ) {
  return [rfq.vendor_address_line1, rfq.vendor_city, rfq.vendor_post_code, rfq.vendor_country]
    .filter(Boolean).join(', ')
}

export default function ProformaForm({ rfq, existing }: ProformaFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showNotes, setShowNotes] = useState<Record<number, boolean>>({})
  const [clients, setClients] = useState<Client[]>([])

  const [form, setForm] = useState({
    rfq_id: existing?.rfq_id ?? rfq?.id ?? '',
    invoice_date: existing?.invoice_date ?? new Date().toISOString().slice(0, 10),
    valid_until_date: existing?.valid_until_date ?? rfq?.quotation_deadline ?? '',
    client_company: existing?.client_company ?? rfq?.buyer_company ?? '',
    client_department: existing?.client_department ?? rfq?.buyer_site ?? '',
    client_address: existing?.client_address ?? rfq?.postal_address ?? '',
    client_country: existing?.client_country ?? rfq?.buyer_country ?? '',
    client_phone: existing?.client_phone ?? rfq?.contact_tel ?? '',
    airway_bill: existing?.airway_bill ?? '',
    incoterm: existing?.incoterm ?? '',
    incoterm_country: existing?.incoterm_country ?? '',
    currency: existing?.currency ?? 'GBP',
    vendor_name: existing?.vendor_name ?? rfq?.vendor_name ?? 'Heritage Global Solutions Ltd',
    vendor_address: existing?.vendor_address ?? (rfq ? buildVendorAddress(rfq) : ''),
    notes: existing?.notes ?? '',
    status: existing?.status ?? 'draft',
    tax_rate: existing?.tax_rate ?? 0,
    client_id: existing?.client_id ?? '',
  })

  const [items, setItems] = useState<FormItem[]>(
    existing?.proforma_items?.map(i => ({
      item_number: i.item_number,
      description: i.description ?? '',
      quantity: i.quantity,
      unit: i.unit,
      unit_price: i.unit_price,
      internal_notes: i.internal_notes ?? '',
    })) ??
    rfq?.rfq_items?.map((i, idx) => ({
      item_number: i.item_number || String((idx + 1) * 10),
      description: [i.description_short, i.description_full ? `(${i.description_full})` : ''].filter(Boolean).join(' '),
      quantity: i.quantity,
      unit: i.unit,
      unit_price: 0,
      internal_notes: '',
    })) ??
    [{ ...EMPTY_ITEM, item_number: '10' }]
  )

  // When rfq prop arrives asynchronously (new proforma page fetches it after mount),
  // fill in any fields that are still empty.
  useEffect(() => {
    if (!rfq || existing) return
    setForm(f => ({
      ...f,
      rfq_id: rfq.id,
      valid_until_date: f.valid_until_date || rfq.quotation_deadline || '',
      client_company: f.client_company || rfq.buyer_company || '',
      client_department: f.client_department || rfq.buyer_site || '',
      client_address: f.client_address || rfq.postal_address || '',
      client_country: f.client_country || rfq.buyer_country || '',
      client_phone: f.client_phone || rfq.contact_tel || '',
      vendor_name: f.vendor_name || rfq.vendor_name || 'Heritage Global Solutions Ltd',
      vendor_address: f.vendor_address || buildVendorAddress(rfq),
    }))
    if (rfq.rfq_items && rfq.rfq_items.length > 0) {
      setItems(rfq.rfq_items.map((i, idx) => ({
        item_number: i.item_number || String((idx + 1) * 10),
        description: [i.description_short, i.description_full ? `(${i.description_full})` : ''].filter(Boolean).join(' '),
        quantity: i.quantity,
        unit: i.unit,
        unit_price: 0,
        internal_notes: '',
      })))
    }
  }, [rfq?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load clients for the selector
  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setClients(data)
    }).catch(() => {})
  }, [])

  function applyClient(clientId: string) {
    const c = clients.find(cl => cl.id === clientId)
    if (!c) return
    setForm(f => ({
      ...f,
      client_id: c.id,
      client_company: c.name,
      client_department: f.client_department,
      client_address: c.address ?? '',
      client_country: c.country ?? '',
      client_phone: c.phone ?? '',
    }))
  }

  function setField(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setItemField(i: number, key: string, value: string | number) {
    setItems(items => items.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }

  function addItem() {
    const nextNum = ((parseInt(items[items.length - 1]?.item_number || '0') || 0) + 10).toString()
    setItems(items => [...items, { ...EMPTY_ITEM, item_number: nextNum }])
  }

  function removeItem(i: number) {
    setItems(items => items.filter((_, idx) => idx !== i))
  }

  const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)
  const taxAmount = subtotal * (Number(form.tax_rate) / 100)
  const total = subtotal + taxAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      rfq_id: form.rfq_id || null,
      client_id: form.client_id || null,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      items: items.map(item => ({
        item_number: item.item_number,
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        unit_price: Number(item.unit_price),
        internal_notes: item.internal_notes,
      })),
    }

    const url = existing ? `/api/proforma/${existing.id}` : '/api/proforma'
    const method = existing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); setSaving(false); return }
      router.push(`/proforma/${data.id}`)
    } catch {
      setError('Network error')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {rfq && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          Linked to RFQ <strong>{rfq.rfq_number}</strong> — fields pre-filled from RFQ data. Adjust as needed.
        </div>
      )}

      {/* Invoice Details */}
      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-[#1a2744]">Invoice Details</h3></div>
        <div className="card-body grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Invoice Date</label>
            <input type="date" className="form-input" value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Valid Until</label>
            <input type="date" className="form-input" value={form.valid_until_date} onChange={e => setField('valid_until_date', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Currency</label>
            <input className="form-input" value={form.currency} onChange={e => setField('currency', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="form-label">Airway Bill</label>
            <input className="form-input" value={form.airway_bill} onChange={e => setField('airway_bill', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Incoterm</label>
            <input className="form-input" value={form.incoterm} onChange={e => setField('incoterm', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Incoterm Country</label>
            <input className="form-input" value={form.incoterm_country} onChange={e => setField('incoterm_country', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Sent To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1a2744]">Sent To (Client)</h3></div>
          <div className="card-body space-y-3">
            {clients.length > 0 && (
              <div>
                <label className="form-label">Select existing client</label>
                <select
                  className="form-select"
                  value={form.client_id}
                  onChange={e => { setField('client_id', e.target.value); applyClient(e.target.value) }}
                >
                  <option value="">— type manually —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Company Name</label>
              <input className="form-input" value={form.client_company} onChange={e => setField('client_company', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Department</label>
              <input className="form-input" value={form.client_department} onChange={e => setField('client_department', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-textarea" rows={2} value={form.client_address} onChange={e => setField('client_address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Country</label>
                <input className="form-input" value={form.client_country} onChange={e => setField('client_country', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Phone No</label>
                <input className="form-input" value={form.client_phone} onChange={e => setField('client_phone', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1a2744]">Vendor (Heritage)</h3></div>
          <div className="card-body space-y-3">
            <div>
              <label className="form-label">Vendor Name</label>
              <input className="form-input" value={form.vendor_name} onChange={e => setField('vendor_name', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Vendor Address</label>
              <textarea className="form-textarea" rows={3} value={form.vendor_address} onChange={e => setField('vendor_address', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-[#1a2744]">Line Items</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-16">Item No</th>
                <th>Description of Goods</th>
                <th className="w-20">Qty</th>
                <th className="w-16">Unit</th>
                <th className="w-28">Unit Price</th>
                <th className="w-32 text-right">Total Cost</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <>
                  <tr key={i}>
                    <td><input className="form-input font-mono text-center" value={item.item_number} onChange={e => setItemField(i, 'item_number', e.target.value)} /></td>
                    <td>
                      <input className="form-input" value={item.description} onChange={e => setItemField(i, 'description', e.target.value)} placeholder="Description of goods…" />
                      {showNotes[i] && (
                        <textarea
                          className="form-textarea mt-1 text-xs border-amber-300 bg-amber-50"
                          rows={2}
                          placeholder="Internal notes (not printed)"
                          value={item.internal_notes}
                          onChange={e => setItemField(i, 'internal_notes', e.target.value)}
                        />
                      )}
                    </td>
                    <td><input type="number" className="form-input text-right" value={item.quantity} min={0} step={0.001} onChange={e => setItemField(i, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                    <td><input className="form-input" value={item.unit} onChange={e => setItemField(i, 'unit', e.target.value)} /></td>
                    <td><input type="number" className="form-input text-right" value={item.unit_price} min={0} step={0.01} onChange={e => setItemField(i, 'unit_price', parseFloat(e.target.value) || 0)} /></td>
                    <td className="text-right font-medium text-[#1a2744] pr-4">
                      {(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" title="Internal notes" onClick={() => setShowNotes(n => ({ ...n, [i]: !n[i] }))}
                          className={`p-1 transition-colors ${showNotes[i] ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}>
                          <StickyNote className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end px-4 sm:px-6 py-4 border-t border-gray-100">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{form.currency} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax Rate (%)</span>
              <input type="number" className="form-input w-20 text-right text-sm py-1" value={form.tax_rate}
                onChange={e => setField('tax_rate', parseFloat(e.target.value) || 0)} min={0} max={100} step={0.01} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax Amount</span>
              <span className="font-medium">{form.currency} {taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
              <span>Total</span>
              <span className="text-[#1a2744]">{form.currency} {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card card-body">
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Notes appear below the line items on the proforma invoice" />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Proforma</>}
        </button>
      </div>
    </form>
  )
}
