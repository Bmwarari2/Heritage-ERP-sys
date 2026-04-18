'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import type { RFQ, PurchaseOrder, POItem, ParsedPO } from '@/types'

type FormItem = Partial<POItem> & {
  item_number: string; quantity: number; unit: string
  net_price: number; per_quantity: number; net_amount: number
  unit_price: number; total_price: number
}

interface POFormProps {
  poType: 'client' | 'standalone'
  rfq?: RFQ | null
  existing?: PurchaseOrder | null
  parsedData?: ParsedPO | null
}

const EMPTY_CLIENT_ITEM: FormItem = {
  item_number: '10', material_code: '', description_short: '', description_full: '',
  reference: '', valuation_type: '', oem: '', part_number: '', quantity: 1, unit: 'EA',
  delivery_date: '', net_price: 0, per_quantity: 1, net_amount: 0,
  lead_amount: 0, product_url: '', vendor_notes: '', unit_price: 0, total_price: 0,
}

const EMPTY_STANDALONE_ITEM: FormItem = {
  item_number: '1', description_short: '', quantity: 1, unit: 'EA', unit_price: 0, total_price: 0,
  net_price: 0, per_quantity: 1, net_amount: 0,
}

export default function POForm({ poType, rfq, existing, parsedData }: POFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pd = parsedData

  const [form, setForm] = useState({
    rfq_id: existing?.rfq_id ?? rfq?.id ?? '',
    po_type: poType,
    po_number: existing?.po_number ?? pd?.po_number ?? '',
    po_date: existing?.po_date ?? pd?.po_date ?? new Date().toISOString().slice(0, 10),
    currency: existing?.currency ?? pd?.currency ?? 'GBP',
    inco_terms: existing?.inco_terms ?? pd?.inco_terms ?? '',
    mode_of_transport: existing?.mode_of_transport ?? pd?.mode_of_transport ?? '',
    payment_terms: existing?.payment_terms ?? pd?.payment_terms ?? '',
    created_by_buyer: existing?.created_by_buyer ?? pd?.created_by_buyer ?? '',
    created_by_email: existing?.created_by_email ?? pd?.created_by_email ?? '',
    your_reference: existing?.your_reference ?? pd?.your_reference ?? '',
    comments: existing?.comments ?? pd?.comments ?? '',
    // Shipping
    ship_to_company: existing?.ship_to_company ?? pd?.ship_to_company ?? rfq?.delivery_company ?? '',
    ship_to_town: existing?.ship_to_town ?? pd?.ship_to_town ?? rfq?.delivery_town ?? '',
    ship_to_po_box: existing?.ship_to_po_box ?? pd?.ship_to_po_box ?? '',
    ship_to_post_code: existing?.ship_to_post_code ?? pd?.ship_to_post_code ?? rfq?.delivery_post_code ?? '',
    ship_to_country: existing?.ship_to_country ?? pd?.ship_to_country ?? rfq?.delivery_country ?? '',
    // Vendor
    vendor_name: existing?.vendor_name ?? 'Heritage Global Solutions Ltd',
    vendor_po_box: existing?.vendor_po_box ?? pd?.vendor_po_box ?? '',
    vendor_city: existing?.vendor_city ?? pd?.vendor_city ?? '',
    vendor_post_code: existing?.vendor_post_code ?? pd?.vendor_post_code ?? '',
    vendor_country: existing?.vendor_country ?? pd?.vendor_country ?? '',
    vendor_tel: existing?.vendor_tel ?? pd?.vendor_tel ?? '',
    vendor_fax: existing?.vendor_fax ?? pd?.vendor_fax ?? '',
    vendor_email: existing?.vendor_email ?? pd?.vendor_email ?? '',
    // Billing
    bill_to_company: existing?.bill_to_company ?? pd?.bill_to_company ?? '',
    bill_to_site: existing?.bill_to_site ?? pd?.bill_to_site ?? '',
    bill_to_po_box: existing?.bill_to_po_box ?? pd?.bill_to_po_box ?? '',
    bill_to_town: existing?.bill_to_town ?? pd?.bill_to_town ?? '',
    bill_to_country: existing?.bill_to_country ?? pd?.bill_to_country ?? '',
    billing_email: existing?.billing_email ?? pd?.billing_email ?? '',
    // Sales
    sales_person: existing?.sales_person ?? '',
    sp_telephone: existing?.sp_telephone ?? '',
    vendor_phone: existing?.vendor_phone ?? '',
    // Financials
    net_value: existing?.net_value ?? pd?.net_value ?? 0,
    gross_price: existing?.gross_price ?? pd?.gross_price ?? 0,
    customs_duties_percent: existing?.customs_duties_percent ?? pd?.customs_duties_percent ?? 0,
    customs_duties_amount: existing?.customs_duties_amount ?? pd?.customs_duties_amount ?? 0,
    total_amount: existing?.total_amount ?? pd?.total_amount ?? 0,
    // Standalone
    billing_address: existing?.billing_address ?? '',
    delivery_address: existing?.delivery_address ?? '',
    standalone_notes: existing?.standalone_notes ?? '',
    // Vendor extras
    instructions_to_vendor: existing?.instructions_to_vendor ?? '',
    vendor_notes: existing?.vendor_notes ?? '',
    status: existing?.status ?? 'draft',
  })

  const [items, setItems] = useState<FormItem[]>(
    existing?.po_items?.map(i => ({ ...i })) ??
    pd?.items?.map(i => ({
      item_number: i.item_number, material_code: i.material_code,
      description_short: i.description_short, description_full: i.description_full,
      reference: i.reference, valuation_type: i.valuation_type,
      oem: i.oem, part_number: i.part_number, quantity: i.quantity, unit: i.unit,
      delivery_date: i.delivery_date, net_price: i.net_price, per_quantity: i.per_quantity,
      net_amount: i.net_amount, unit_price: 0, total_price: 0,
    })) ??
    [poType === 'standalone' ? { ...EMPTY_STANDALONE_ITEM } : { ...EMPTY_CLIENT_ITEM }]
  )

  function setField(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setItemField(i: number, key: string, value: string | number | boolean) {
    setItems(items => items.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [key]: value }
      if (poType === 'client' && (key === 'net_price' || key === 'quantity')) {
        updated.net_amount = (Number(updated.net_price) || 0) * (Number(updated.quantity) || 0)
      }
      if (poType === 'standalone' && (key === 'unit_price' || key === 'quantity')) {
        updated.total_price = (Number(updated.unit_price) || 0) * (Number(updated.quantity) || 0)
      }
      return updated
    }))
  }

  function addItem() {
    if (poType === 'standalone') {
      setItems(items => [...items, { ...EMPTY_STANDALONE_ITEM, item_number: String(items.length + 1) }])
    } else {
      const nextNum = ((parseInt(items[items.length - 1]?.item_number || '0') || 0) + 10).toString()
      setItems(items => [...items, { ...EMPTY_CLIENT_ITEM, item_number: nextNum }])
    }
  }

  const purchaseTotal = items.reduce((sum, i) =>
    sum + (poType === 'standalone'
      ? (Number(i.unit_price) * Number(i.quantity))
      : Number(i.net_amount)), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.po_number.trim()) { setError('PO Number is required'); return }
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      rfq_id: form.rfq_id || null,
      purchase_total: purchaseTotal,
      items: items.map(item => ({
        // Include id so the PUT route can preserve shipped/dispatch fields
        ...(item.id ? { id: item.id } : {}),
        item_number: item.item_number,
        material_code: item.material_code ?? '',
        description_short: item.description_short ?? '',
        description_full: item.description_full ?? '',
        reference: item.reference ?? '',
        valuation_type: item.valuation_type ?? '',
        oem: item.oem ?? '',
        part_number: item.part_number ?? '',
        quantity: Number(item.quantity),
        unit: item.unit ?? 'EA',
        delivery_date: item.delivery_date ?? null,
        net_price: Number(item.net_price),
        per_quantity: Number(item.per_quantity) || 1,
        net_amount: Number(item.net_amount),
        lead_amount: item.lead_amount ? Number(item.lead_amount) : null,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
        // product_url and vendor_notes are managed via inline edit on the PO
        // detail page after saving — do not send here to avoid overwriting them
      })),
    }

    const url = existing ? `/api/purchase-orders/${existing.id}` : '/api/purchase-orders'
    const method = existing ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); setSaving(false); return }
      router.push(`/purchase-orders/${data.id}`)
    } catch {
      setError('Network error')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Document Info */}
      <div className="card">
        <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Purchase Order Information</h3></div>
        <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">PO Number *</label>
            <input className="form-input font-mono" value={form.po_number} onChange={e => setField('po_number', e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={form.po_date} onChange={e => setField('po_date', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Currency</label>
            <input className="form-input" value={form.currency} onChange={e => setField('currency', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="partial">Partial</option>
              <option value="complete">Complete</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {poType === 'client' && (
            <>
              <div>
                <label className="form-label">Inco Terms</label>
                <input className="form-input" value={form.inco_terms} onChange={e => setField('inco_terms', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Mode of Transport</label>
                <input className="form-input" value={form.mode_of_transport} onChange={e => setField('mode_of_transport', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Payment Terms</label>
                <input className="form-input" value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Your Reference</label>
                <input className="form-input" value={form.your_reference} onChange={e => setField('your_reference', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Created By (Buyer)</label>
                <input className="form-input" value={form.created_by_buyer} onChange={e => setField('created_by_buyer', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Buyer Email</label>
                <input className="form-input" value={form.created_by_email} onChange={e => setField('created_by_email', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Sales Person</label>
                <input className="form-input" value={form.sales_person} onChange={e => setField('sales_person', e.target.value)} />
              </div>
              <div>
                <label className="form-label">SP Telephone</label>
                <input className="form-input" value={form.sp_telephone} onChange={e => setField('sp_telephone', e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Addresses */}
      {poType === 'client' ? (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Shipping Address</h3></div>
            <div className="card-body space-y-3">
              <div><label className="form-label">Company</label><input className="form-input" value={form.ship_to_company} onChange={e => setField('ship_to_company', e.target.value)} /></div>
              <div><label className="form-label">PO Box</label><input className="form-input" value={form.ship_to_po_box} onChange={e => setField('ship_to_po_box', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="form-label">Town</label><input className="form-input" value={form.ship_to_town} onChange={e => setField('ship_to_town', e.target.value)} /></div>
                <div><label className="form-label">Post Code</label><input className="form-input" value={form.ship_to_post_code} onChange={e => setField('ship_to_post_code', e.target.value)} /></div>
              </div>
              <div><label className="form-label">Country</label><input className="form-input" value={form.ship_to_country} onChange={e => setField('ship_to_country', e.target.value)} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Vendor Address (Heritage)</h3></div>
            <div className="card-body space-y-3">
              <div><label className="form-label">Name</label><input className="form-input" value={form.vendor_name} onChange={e => setField('vendor_name', e.target.value)} /></div>
              <div><label className="form-label">PO Box</label><input className="form-input" value={form.vendor_po_box} onChange={e => setField('vendor_po_box', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="form-label">City</label><input className="form-input" value={form.vendor_city} onChange={e => setField('vendor_city', e.target.value)} /></div>
                <div><label className="form-label">Post Code</label><input className="form-input" value={form.vendor_post_code} onChange={e => setField('vendor_post_code', e.target.value)} /></div>
              </div>
              <div><label className="form-label">Country</label><input className="form-input" value={form.vendor_country} onChange={e => setField('vendor_country', e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="form-label">Tel</label><input className="form-input" value={form.vendor_tel} onChange={e => setField('vendor_tel', e.target.value)} /></div>
                <div><label className="form-label">Fax</label><input className="form-input" value={form.vendor_fax} onChange={e => setField('vendor_fax', e.target.value)} /></div>
                <div><label className="form-label">Email</label><input className="form-input" value={form.vendor_email} onChange={e => setField('vendor_email', e.target.value)} /></div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Billing Address</h3></div>
            <div className="card-body space-y-3">
              <div><label className="form-label">Company</label><input className="form-input" value={form.bill_to_company} onChange={e => setField('bill_to_company', e.target.value)} /></div>
              <div><label className="form-label">Site</label><input className="form-input" value={form.bill_to_site} onChange={e => setField('bill_to_site', e.target.value)} /></div>
              <div><label className="form-label">PO Box</label><input className="form-input" value={form.bill_to_po_box} onChange={e => setField('bill_to_po_box', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="form-label">Town</label><input className="form-input" value={form.bill_to_town} onChange={e => setField('bill_to_town', e.target.value)} /></div>
                <div><label className="form-label">Country</label><input className="form-input" value={form.bill_to_country} onChange={e => setField('bill_to_country', e.target.value)} /></div>
              </div>
              <div><label className="form-label">Billing Email</label><input className="form-input" value={form.billing_email} onChange={e => setField('billing_email', e.target.value)} /></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card card-body">
            <label className="form-label">Billing Address</label>
            <textarea className="form-textarea" rows={3} value={form.billing_address} onChange={e => setField('billing_address', e.target.value)} />
          </div>
          <div className="card card-body">
            <label className="form-label">Delivery Address</label>
            <textarea className="form-textarea" rows={3} value={form.delivery_address} onChange={e => setField('delivery_address', e.target.value)} />
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-[#1E3A5F]">Items</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus className="w-4 h-4" /> Add Item</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-16">Item No</th>
                {poType === 'client' ? (
                  <>
                    <th className="w-28">Material Code</th>
                    <th>Description</th>
                    <th className="w-16">OEM</th>
                    <th className="w-24">Part No</th>
                    <th className="w-16">Qty</th>
                    <th className="w-16">Unit</th>
                    <th className="w-24">Delivery</th>
                    <th className="w-20">Net Price</th>
                    <th className="w-20 text-right">Net Amount</th>
                  </>
                ) : (
                  <>
                    <th>Description</th>
                    <th className="w-16">Qty</th>
                    <th className="w-16">Unit</th>
                    <th className="w-24">Unit Price</th>
                    <th className="w-24 text-right">Total</th>
                  </>
                )}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td><input className="form-input font-mono text-center text-sm" value={item.item_number} onChange={e => setItemField(i, 'item_number', e.target.value)} /></td>
                  {poType === 'client' ? (
                    <>
                      <td><input className="form-input font-mono text-xs" value={item.material_code ?? ''} onChange={e => setItemField(i, 'material_code', e.target.value)} /></td>
                      <td>
                        <input className="form-input text-sm" value={item.description_short ?? ''} onChange={e => setItemField(i, 'description_short', e.target.value)} placeholder="Short description" />
                        <textarea className="form-textarea text-xs mt-1" rows={1} value={item.description_full ?? ''} onChange={e => setItemField(i, 'description_full', e.target.value)} placeholder="Full description" />
                      </td>
                      <td><input className="form-input text-xs" value={item.oem ?? ''} onChange={e => setItemField(i, 'oem', e.target.value)} /></td>
                      <td><input className="form-input text-xs" value={item.part_number ?? ''} onChange={e => setItemField(i, 'part_number', e.target.value)} /></td>
                      <td><input type="number" className="form-input text-right" value={item.quantity} onChange={e => setItemField(i, 'quantity', parseInt(e.target.value) || 0)} min={0} step={1} /></td>
                      <td><input className="form-input" value={item.unit} onChange={e => setItemField(i, 'unit', e.target.value)} /></td>
                      <td><input type="date" className="form-input text-xs" value={item.delivery_date ?? ''} onChange={e => setItemField(i, 'delivery_date', e.target.value)} /></td>
                      <td><input type="number" className="form-input text-right" value={item.net_price} onChange={e => setItemField(i, 'net_price', parseFloat(e.target.value) || 0)} min={0} step={0.01} /></td>
                      <td className="text-right font-medium pr-4">{Number(item.net_amount).toFixed(2)}</td>
                    </>
                  ) : (
                    <>
                      <td><input className="form-input" value={item.description_short ?? ''} onChange={e => setItemField(i, 'description_short', e.target.value)} placeholder="Item description" /></td>
                      <td><input type="number" className="form-input text-right" value={item.quantity} onChange={e => setItemField(i, 'quantity', parseInt(e.target.value) || 0)} min={0} step={1} /></td>
                      <td><input className="form-input" value={item.unit} onChange={e => setItemField(i, 'unit', e.target.value)} /></td>
                      <td><input type="number" className="form-input text-right" value={item.unit_price} onChange={e => setItemField(i, 'unit_price', parseFloat(e.target.value) || 0)} min={0} step={0.01} /></td>
                      <td className="text-right font-medium pr-4">{(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}</td>
                    </>
                  )}
                  <td>
                    <button type="button" onClick={() => setItems(items => items.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Purchase Total */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <div className="w-64 text-sm">
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
              <span>Purchase Total</span>
              <span className="text-[#1E3A5F]">{form.currency} {purchaseTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial summary (client PO) */}
      {poType === 'client' && (
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Financial Summary</h3></div>
          <div className="card-body grid grid-cols-2 md:grid-cols-5 gap-4">
            <div><label className="form-label">Net Value</label><input type="number" className="form-input text-right" value={form.net_value} onChange={e => setField('net_value', parseFloat(e.target.value) || 0)} /></div>
            <div><label className="form-label">Gross Price</label><input type="number" className="form-input text-right" value={form.gross_price} onChange={e => setField('gross_price', parseFloat(e.target.value) || 0)} /></div>
            <div><label className="form-label">Duties %</label><input type="number" className="form-input text-right" value={form.customs_duties_percent} onChange={e => setField('customs_duties_percent', parseFloat(e.target.value) || 0)} /></div>
            <div><label className="form-label">Duties Amount</label><input type="number" className="form-input text-right" value={form.customs_duties_amount} onChange={e => setField('customs_duties_amount', parseFloat(e.target.value) || 0)} /></div>
            <div><label className="form-label">Total Amount</label><input type="number" className="form-input text-right font-bold" value={form.total_amount} onChange={e => setField('total_amount', parseFloat(e.target.value) || 0)} /></div>
          </div>
        </div>
      )}

      {/* Comments & Notes */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card card-body">
          <label className="form-label">Comments</label>
          <textarea className="form-textarea" rows={3} value={form.comments} onChange={e => setField('comments', e.target.value)} />
        </div>
        <div className="card card-body">
          <label className="form-label">{poType === 'standalone' ? 'Notes' : 'Instructions To Vendor'}</label>
          <textarea className="form-textarea" rows={3}
            value={poType === 'standalone' ? form.standalone_notes : form.instructions_to_vendor}
            onChange={e => setField(poType === 'standalone' ? 'standalone_notes' : 'instructions_to_vendor', e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save PO</>}
        </button>
      </div>
    </form>
  )
}
