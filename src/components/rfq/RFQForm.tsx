'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import type { ParsedRFQ, RFQ, RFQItem, Client } from '@/types'

type FormItem = Partial<RFQItem> & {
  item_number: string
  quantity: number
  unit: string
}

interface RFQFormProps {
  initialData?: ParsedRFQ | null
  existing?: RFQ | null
  onSaved?: (rfq: RFQ) => void
}

const EMPTY_ITEM: FormItem = {
  item_number: '',
  item_code: '',
  description_short: '',
  description_full: '',
  oem: '',
  part_number: '',
  quantity: 1,
  unit: 'EA',
}

export default function RFQForm({ initialData, existing, onSaved }: RFQFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState(searchParams.get('client_id') ?? '')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  function applyClient(clientId: string) {
    setSelectedClientId(clientId)
    const c = clients.find(cl => cl.id === clientId)
    if (!c) return
    setForm(f => ({ ...f, buyer_company: c.name }))
  }

  // Header fields
  const [form, setForm] = useState({
    rfq_number: existing?.rfq_number ?? initialData?.rfq_number ?? '',
    rfq_date: existing?.rfq_date ?? initialData?.rfq_date ?? '',
    quotation_deadline: existing?.quotation_deadline ?? initialData?.quotation_deadline ?? '',
    delivery_date: existing?.delivery_date ?? initialData?.delivery_date ?? '',
    your_reference: existing?.your_reference ?? initialData?.your_reference ?? '',
    submission_email: existing?.submission_email ?? initialData?.submission_email ?? '',
    comments: existing?.comments ?? initialData?.comments ?? '',
    status: existing?.status ?? 'draft',

    // Buyer / invoicing
    buyer_company: existing?.buyer_company ?? initialData?.buyer_company ?? '',
    buyer_site: existing?.buyer_site ?? initialData?.buyer_site ?? '',
    buyer_po_box: existing?.buyer_po_box ?? initialData?.buyer_po_box ?? '',
    buyer_country: existing?.buyer_country ?? initialData?.buyer_country ?? '',
    postal_address: existing?.postal_address ?? initialData?.postal_address ?? '',

    // Delivery
    delivery_company: existing?.delivery_company ?? initialData?.delivery_company ?? '',
    delivery_town: existing?.delivery_town ?? initialData?.delivery_town ?? '',
    delivery_street: existing?.delivery_street ?? initialData?.delivery_street ?? '',
    delivery_post_code: existing?.delivery_post_code ?? initialData?.delivery_post_code ?? '',
    delivery_country: existing?.delivery_country ?? initialData?.delivery_country ?? '',

    // Contact
    contact_person: existing?.contact_person ?? initialData?.contact_person ?? '',
    contact_email: existing?.contact_email ?? initialData?.contact_email ?? '',
    contact_tel: existing?.contact_tel ?? initialData?.contact_tel ?? '',
    contact_fax: existing?.contact_fax ?? initialData?.contact_fax ?? '',

    // Vendor (Heritage)
    vendor_name: existing?.vendor_name ?? 'Heritage Global Solutions Ltd',
    vendor_number: existing?.vendor_number ?? initialData?.vendor_number ?? '',
    vendor_address_line1: existing?.vendor_address_line1 ?? initialData?.vendor_address_line1 ?? '',
    vendor_city: existing?.vendor_city ?? initialData?.vendor_city ?? '',
    vendor_post_code: existing?.vendor_post_code ?? initialData?.vendor_post_code ?? '',
    vendor_country: existing?.vendor_country ?? initialData?.vendor_country ?? '',
    vendor_contact_person: existing?.vendor_contact_person ?? initialData?.vendor_contact_person ?? '',
    vendor_tel: existing?.vendor_tel ?? initialData?.vendor_tel ?? '',
    vendor_fax: existing?.vendor_fax ?? initialData?.vendor_fax ?? '',
    vendor_email: existing?.vendor_email ?? initialData?.vendor_email ?? '',
  })

  // Items
  const [items, setItems] = useState<FormItem[]>(
    existing?.rfq_items?.map(i => ({ ...i })) ??
    initialData?.items?.map(i => ({ ...i })) ??
    [{ ...EMPTY_ITEM }]
  )

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setItemField(index: number, key: string, value: string | number) {
    setItems(items => items.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }

  function addItem() {
    const nextNum = ((parseInt(items[items.length - 1]?.item_number || '0') || 0) + 10).toString()
    setItems(items => [...items, { ...EMPTY_ITEM, item_number: nextNum }])
  }

  function removeItem(index: number) {
    setItems(items => items.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.rfq_number.trim()) { setError('RFQ Number is required'); return }
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      source: initialData ? 'uploaded' : 'manual',
      items: items.map(item => ({
        item_number: item.item_number,
        item_code: item.item_code || '',
        description_short: item.description_short || '',
        description_full: item.description_full || '',
        oem: item.oem || '',
        part_number: item.part_number || '',
        quantity: Number(item.quantity) || 0,
        unit: item.unit || 'EA',
      })),
    }

    const url = existing ? `/api/rfq/${existing.id}` : '/api/rfq'
    const method = existing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); setSaving(false); return }
      if (existing && onSaved) { onSaved(data); setSaving(false); return }
      router.push(`/rfq/${data.id}`)
    } catch {
      setError('Network error')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* ---- Assign to Client ---- */}
      {!existing && (
        <div className="card card-body">
          <label className="form-label">Assign to Company / Client</label>
          <select className="form-input max-w-sm" value={selectedClientId} onChange={e => applyClient(e.target.value)}>
            <option value="">— Select a client (optional) —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.customer_id ? ` (${c.customer_id})` : ''}</option>)}
          </select>
        </div>
      )}

      {/* ---- Document Info ---- */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-[#1E3A5F]">Document Information</h3>
        </div>
        <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">RFQ Number *</label>
            <input className="form-input" value={form.rfq_number} onChange={e => setField('rfq_number', e.target.value)} required />
          </div>
          <div>
            <label className="form-label">RFQ Date</label>
            <input type="date" className="form-input" value={form.rfq_date} onChange={e => setField('rfq_date', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Quotation Deadline</label>
            <input type="date" className="form-input" value={form.quotation_deadline} onChange={e => setField('quotation_deadline', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Delivery Date</label>
            <input type="date" className="form-input" value={form.delivery_date} onChange={e => setField('delivery_date', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Your Reference (STK)</label>
            <input className="form-input" value={form.your_reference} onChange={e => setField('your_reference', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Submission Email</label>
            <input type="email" className="form-input" value={form.submission_email} onChange={e => setField('submission_email', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ---- Invoicing / Buyer Details ---- */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Invoicing Details (Buyer)</h3></div>
          <div className="card-body space-y-3">
            <div>
              <label className="form-label">Company Name</label>
              <input className="form-input" value={form.buyer_company} onChange={e => setField('buyer_company', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Site</label>
              <input className="form-input" value={form.buyer_site} onChange={e => setField('buyer_site', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">PO Box</label>
                <input className="form-input" value={form.buyer_po_box} onChange={e => setField('buyer_po_box', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Country</label>
                <input className="form-input" value={form.buyer_country} onChange={e => setField('buyer_country', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Postal Address</label>
              <textarea className="form-textarea" rows={2} value={form.postal_address} onChange={e => setField('postal_address', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Delivery Address</h3></div>
          <div className="card-body space-y-3">
            <div>
              <label className="form-label">Company</label>
              <input className="form-input" value={form.delivery_company} onChange={e => setField('delivery_company', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Street</label>
                <input className="form-input" value={form.delivery_street} onChange={e => setField('delivery_street', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Town</label>
                <input className="form-input" value={form.delivery_town} onChange={e => setField('delivery_town', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Post Code</label>
                <input className="form-input" value={form.delivery_post_code} onChange={e => setField('delivery_post_code', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Country</label>
                <input className="form-input" value={form.delivery_country} onChange={e => setField('delivery_country', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Contact Details ---- */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Buyer Contact Details</h3></div>
          <div className="card-body space-y-3">
            <div>
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={form.contact_person} onChange={e => setField('contact_person', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.contact_email} onChange={e => setField('contact_email', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Tel</label>
                <input className="form-input" value={form.contact_tel} onChange={e => setField('contact_tel', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Fax</label>
                <input className="form-input" value={form.contact_fax} onChange={e => setField('contact_fax', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Vendor Address Details (Heritage)</h3></div>
          <div className="card-body space-y-3">
            <div>
              <label className="form-label">Vendor Name</label>
              <input className="form-input" value={form.vendor_name} onChange={e => setField('vendor_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Vendor Number</label>
                <input className="form-input" value={form.vendor_number} onChange={e => setField('vendor_number', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Contact Person</label>
                <input className="form-input" value={form.vendor_contact_person} onChange={e => setField('vendor_contact_person', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Address</label>
              <input className="form-input" value={form.vendor_address_line1} onChange={e => setField('vendor_address_line1', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">City</label>
                <input className="form-input" value={form.vendor_city} onChange={e => setField('vendor_city', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Post Code</label>
                <input className="form-input" value={form.vendor_post_code} onChange={e => setField('vendor_post_code', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="form-label">Tel</label>
                <input className="form-input" value={form.vendor_tel} onChange={e => setField('vendor_tel', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Fax</label>
                <input className="form-input" value={form.vendor_fax} onChange={e => setField('vendor_fax', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" value={form.vendor_email} onChange={e => setField('vendor_email', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Line Items ---- */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-[#1E3A5F]">Line Items</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-16">Item No</th>
                <th className="w-28">Item Code</th>
                <th>Short Description</th>
                <th>Full Description</th>
                <th className="w-24">OEM</th>
                <th className="w-24">Part No</th>
                <th className="w-20">Qty</th>
                <th className="w-16">Unit</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <input className="form-input text-center font-mono" value={item.item_number}
                      onChange={e => setItemField(i, 'item_number', e.target.value)} />
                  </td>
                  <td>
                    <input className="form-input font-mono text-sm" value={item.item_code ?? ''}
                      onChange={e => setItemField(i, 'item_code', e.target.value)} />
                  </td>
                  <td>
                    <input className="form-input" value={item.description_short ?? ''}
                      onChange={e => setItemField(i, 'description_short', e.target.value)} />
                  </td>
                  <td>
                    <textarea className="form-textarea text-xs" rows={2} value={item.description_full ?? ''}
                      onChange={e => setItemField(i, 'description_full', e.target.value)} />
                  </td>
                  <td>
                    <input className="form-input text-sm" value={item.oem ?? ''}
                      onChange={e => setItemField(i, 'oem', e.target.value)} />
                  </td>
                  <td>
                    <input className="form-input text-sm" value={item.part_number ?? ''}
                      onChange={e => setItemField(i, 'part_number', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" className="form-input text-right" value={item.quantity}
                      onChange={e => setItemField(i, 'quantity', parseFloat(e.target.value) || 0)} min="0" step="0.001" />
                  </td>
                  <td>
                    <input className="form-input" value={item.unit}
                      onChange={e => setItemField(i, 'unit', e.target.value)} />
                  </td>
                  <td>
                    <button type="button" onClick={() => removeItem(i)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Comments ---- */}
      <div className="card card-body">
        <label className="form-label">Comments</label>
        <textarea className="form-textarea" rows={3} value={form.comments} onChange={e => setField('comments', e.target.value)} />
      </div>

      {/* ---- Actions ---- */}
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save RFQ</>}
        </button>
      </div>
    </form>
  )
}
