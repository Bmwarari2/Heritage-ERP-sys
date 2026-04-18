'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import DocumentHeader from '@/components/shared/DocumentHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { TaxInvoice } from '@/types'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function TIContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNew = id === 'new'
  const poId = searchParams.get('po_id')
  const batchId = searchParams.get('batch_id')

  const [ti, setTi] = useState<TaxInvoice | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(isNew)

  const todayStr = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    po_id: poId ?? '', batch_id: batchId ?? '', purchase_order_number: '',
    customer_name: '', customer_id: '', customer_address: '', customer_phone: '',
    payment_due_date: addDays(todayStr, 30), sales_person: '', payment_terms: 'Net 30',
    order_date: todayStr,
    invoice_date: todayStr,
    shipping_terms: '',
    vat_reg_number: '', company_reg_number: '',
    currency: 'GBP', sales_tax_rate: '0', notes: '', status: 'draft' as string,
    bank_name: '', bank_account_name: 'Heritage Global Solutions Ltd',
    bank_account_number: '', bank_sort_code: '', bank_iban: '', bank_swift: '',
  })

  const [items, setItems] = useState([{ item_number: '1', item_description: '', quantity: 1, unit_price: 0 }])

  // Auto-load company settings to pre-fill VAT/Reg and bank details
  useEffect(() => {
    fetch('/api/settings/company').then(r => r.json()).then(s => {
      if (!s || s.error) return
      setForm(f => ({
        ...f,
        vat_reg_number: f.vat_reg_number || s.vat_reg_number || '',
        company_reg_number: f.company_reg_number || s.company_reg_number || '',
        bank_name: f.bank_name || (f.currency === 'USD' ? s.usd_bank_name : s.gbp_bank_name) || '',
        bank_account_name: f.bank_account_name || (f.currency === 'USD' ? s.usd_account_name : s.gbp_account_name) || 'Heritage Global Solutions Ltd',
        bank_account_number: f.bank_account_number || (f.currency === 'USD' ? s.usd_account_number : s.gbp_account_number) || '',
        bank_sort_code: f.bank_sort_code || (f.currency === 'USD' ? s.usd_sort_code : s.gbp_sort_code) || '',
        bank_iban: f.bank_iban || (f.currency === 'USD' ? s.usd_iban : s.gbp_iban) || '',
        bank_swift: f.bank_swift || (f.currency === 'USD' ? s.usd_swift : s.gbp_swift) || '',
      }))
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-populate logged-in user as sales_person for new TIs
  useEffect(() => {
    if (!isNew) return
    fetch('/api/auth/profile').then(r => r.json()).then(p => {
      if (p?.full_name) setForm(f => ({ ...f, sales_person: f.sales_person || p.full_name }))
    }).catch(() => {})
  }, [isNew])

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/tax-invoices/${id}`).then(r => r.json()).then(data => {
        setTi(data); setLoading(false)
        setForm({
          po_id: data.po_id ?? '', batch_id: data.batch_id ?? '',
          purchase_order_number: data.purchase_order_number ?? '',
          customer_name: data.customer_name ?? '', customer_id: data.customer_id ?? '',
          customer_address: data.customer_address ?? '', customer_phone: data.customer_phone ?? '',
          payment_due_date: data.payment_due_date ?? addDays(data.invoice_date, 30),
          sales_person: data.sales_person ?? '',
          payment_terms: data.payment_terms ?? 'Net 30',
          order_date: data.order_date ?? todayStr,
          invoice_date: data.invoice_date,
          shipping_terms: data.shipping_terms ?? '', vat_reg_number: data.vat_reg_number ?? '',
          company_reg_number: data.company_reg_number ?? '', currency: data.currency,
          sales_tax_rate: String(data.sales_tax_rate ?? '0'), notes: data.notes ?? '',
          status: data.status, bank_name: data.bank_name ?? '',
          bank_account_name: data.bank_account_name ?? '',
          bank_account_number: data.bank_account_number ?? '',
          bank_sort_code: data.bank_sort_code ?? '', bank_iban: data.bank_iban ?? '',
          bank_swift: data.bank_swift ?? '',
        })
        setItems(data.ti_items?.map((i: { item_number: string; item_description: string | null; quantity: number; unit_price: number }) => ({
          item_number: i.item_number, item_description: i.item_description ?? '',
          quantity: i.quantity, unit_price: i.unit_price,
        })) ?? [])
      })
    } else if (batchId) {
      fetch(`/api/dispatch-batches/${batchId}`).then(r => r.json()).then(batch => {
        if (!batch?.purchase_orders) return
        const po = batch.purchase_orders
        const customerAddr = [po.bill_to_site, po.bill_to_po_box ? `PO Box ${po.bill_to_po_box}` : null,
          po.bill_to_town, po.bill_to_country].filter(Boolean).join('\n')
        // Fetch company settings for bank details matching PO currency
        fetch('/api/settings/company').then(r => r.json()).then(s => {
          const cur = po.currency ?? 'GBP'
          const isUSD = cur === 'USD'
          setForm(f => ({
            ...f,
            purchase_order_number: po.po_number ?? '',
            currency: cur,
            payment_terms: po.payment_terms ?? f.payment_terms,
            shipping_terms: po.inco_terms ?? '',
            order_date: po.po_date ?? f.order_date,
            sales_person: po.sales_person ?? f.sales_person,
            customer_name: po.bill_to_company ?? po.ship_to_company ?? '',
            customer_address: customerAddr,
            customer_phone: po.vendor_phone ?? '',
            vat_reg_number: s?.vat_reg_number || f.vat_reg_number,
            company_reg_number: s?.company_reg_number || f.company_reg_number,
            bank_name: isUSD ? (s?.usd_bank_name || '') : (s?.gbp_bank_name || ''),
            bank_account_name: isUSD ? (s?.usd_account_name || 'Heritage Global Solutions Ltd') : (s?.gbp_account_name || 'Heritage Global Solutions Ltd'),
            bank_account_number: isUSD ? (s?.usd_account_number || '') : (s?.gbp_account_number || ''),
            bank_sort_code: isUSD ? (s?.usd_sort_code || '') : (s?.gbp_sort_code || ''),
            bank_iban: isUSD ? (s?.usd_iban || '') : (s?.gbp_iban || ''),
            bank_swift: isUSD ? (s?.usd_swift || '') : (s?.gbp_swift || ''),
          }))
        }).catch(() => {
          setForm(f => ({
            ...f,
            purchase_order_number: po.po_number ?? '',
            currency: po.currency ?? 'GBP',
            payment_terms: po.payment_terms ?? f.payment_terms,
            shipping_terms: po.inco_terms ?? '',
            order_date: po.po_date ?? f.order_date,
            sales_person: po.sales_person ?? f.sales_person,
            customer_name: po.bill_to_company ?? po.ship_to_company ?? '',
            customer_address: customerAddr,
            customer_phone: po.vendor_phone ?? '',
          }))
        })
        const batchItems = (batch.dispatch_batch_items ?? [])
          .map((bi: { dispatched_qty: number; po_items: { item_number: string; description_short: string | null; description_full: string | null; net_price: number; unit_price: number } }) => {
            const po_item = bi.po_items
            const desc = [po_item.description_short, po_item.description_full].filter(Boolean).join(' — ')
            return {
              item_number: po_item.item_number,
              item_description: desc,
              quantity: bi.dispatched_qty,
              unit_price: Number(po_item.net_price) || Number(po_item.unit_price) || 0,
            }
          })
        if (batchItems.length > 0) setItems(batchItems)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, batchId, isNew])

  function setField(key: string, value: string) {
    setForm(f => {
      const updated = { ...f, [key]: value }
      // When invoice_date changes, recalculate payment_due_date
      if (key === 'invoice_date' && value) {
        updated.payment_due_date = addDays(value, 30)
      }
      return updated
    })
  }

  function setItemField(i: number, key: string, value: string | number) {
    setItems(items => items.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }

  const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0)
  const taxRate = parseFloat(form.sales_tax_rate) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, sales_tax_rate: taxRate, subtotal, sales_tax_amount: taxAmount, total_amount: total, items }
    const url = isNew ? '/api/tax-invoices' : `/api/tax-invoices/${id}`
    const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setSaving(false)
    if (res.ok) { if (isNew) router.replace(`/tax-invoices/${data.id}`); else { setTi(data); setEditing(false) } }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

  if (editing) {
    return (
      <PageWrapper title={isNew ? 'New Tax Invoice' : `Edit ${ti?.tax_invoice_number}`}
        actions={<div className="flex gap-2">
          {!isNew && <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>}
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>}>
        <div className="space-y-6 w-full">
          {/* Bill To */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Bill To</h3></div>
              <div className="card-body space-y-3">
                <div><label className="form-label">Customer Name</label><input className="form-input" value={form.customer_name} onChange={e => setField('customer_name', e.target.value)} /></div>
                <div><label className="form-label">Customer ID</label><input className="form-input" value={form.customer_id} onChange={e => setField('customer_id', e.target.value)} /></div>
                <div><label className="form-label">Address</label><textarea className="form-textarea" rows={2} value={form.customer_address} onChange={e => setField('customer_address', e.target.value)} /></div>
                <div><label className="form-label">Phone</label><input className="form-input" value={form.customer_phone} onChange={e => setField('customer_phone', e.target.value)} /></div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Payment & Order Details</h3></div>
              <div className="card-body space-y-3">
                <div><label className="form-label">Invoice Date</label><input type="date" className="form-input" value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)} /></div>
                <div><label className="form-label">Payment Due Date (auto: +30 days)</label><input type="date" className="form-input" value={form.payment_due_date} onChange={e => setField('payment_due_date', e.target.value)} /></div>
                <div><label className="form-label">Payment Terms</label><input className="form-input" value={form.payment_terms} onChange={e => setField('payment_terms', e.target.value)} /></div>
                <div><label className="form-label">Sales Person</label><input className="form-input" value={form.sales_person} onChange={e => setField('sales_person', e.target.value)} /></div>
                <div><label className="form-label">PO Number</label><input className="form-input" value={form.purchase_order_number} onChange={e => setField('purchase_order_number', e.target.value)} /></div>
                <div><label className="form-label">Shipping Terms</label><input className="form-input" value={form.shipping_terms} onChange={e => setField('shipping_terms', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="form-label">VAT Reg No</label><input className="form-input" value={form.vat_reg_number} onChange={e => setField('vat_reg_number', e.target.value)} /></div>
                  <div><label className="form-label">Co Reg No</label><input className="form-input" value={form.company_reg_number} onChange={e => setField('company_reg_number', e.target.value)} /></div>
                </div>
                <div><label className="form-label">Currency</label><input className="form-input" value={form.currency} onChange={e => setField('currency', e.target.value)} /></div>
              </div>
            </div>
          </div>
          {/* Items */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-[#1E3A5F]">Items</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItems(i => [...i, { item_number: String(i.length + 1), item_description: '', quantity: 1, unit_price: 0 }])}>
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <table className="data-table">
              <thead><tr><th>Item No</th><th>Item Description</th><th className="text-right">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Line Total</th><th></th></tr></thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td><input className="form-input font-mono w-16" value={item.item_number} onChange={e => setItemField(i, 'item_number', e.target.value)} /></td>
                    <td><input className="form-input" value={item.item_description} onChange={e => setItemField(i, 'item_description', e.target.value)} /></td>
                    <td><input type="number" className="form-input text-right w-20" value={item.quantity === 0 ? '' : item.quantity} onChange={e => setItemField(i, 'quantity', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} /></td>
                    <td><input type="number" className="form-input text-right w-28" value={item.unit_price === 0 ? '' : item.unit_price} onChange={e => setItemField(i, 'unit_price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} /></td>
                    <td className="text-right font-medium">{(item.quantity * item.unit_price).toFixed(2)}</td>
                    <td><button type="button" onClick={() => setItems(items => items.filter((_, idx) => idx !== i))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between"><span>Sub Total</span><span>{form.currency} {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between items-center">
                  <span>Sales Tax (%)</span>
                  <input type="number" className="form-input w-20 text-right py-1" value={form.sales_tax_rate === '0' ? '' : form.sales_tax_rate} onChange={e => setField('sales_tax_rate', e.target.value === '' ? '0' : e.target.value)} />
                </div>
                <div className="flex justify-between"><span>Tax Amount</span><span>{form.currency} {taxAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold border-t border-gray-200 pt-2"><span>Total</span><span className="text-[#1E3A5F]">{form.currency} {total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
          {/* Bank Details */}
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Payment Details (Bank)</h3></div>
            <div className="card-body grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="form-label">Bank Name</label><input className="form-input" value={form.bank_name} onChange={e => setField('bank_name', e.target.value)} /></div>
              <div><label className="form-label">Account Name</label><input className="form-input" value={form.bank_account_name} onChange={e => setField('bank_account_name', e.target.value)} /></div>
              <div><label className="form-label">Account Number</label><input className="form-input" value={form.bank_account_number} onChange={e => setField('bank_account_number', e.target.value)} /></div>
              <div><label className="form-label">Sort Code</label><input className="form-input" value={form.bank_sort_code} onChange={e => setField('bank_sort_code', e.target.value)} /></div>
              <div><label className="form-label">IBAN</label><input className="form-input" value={form.bank_iban} onChange={e => setField('bank_iban', e.target.value)} /></div>
              <div><label className="form-label">SWIFT / BIC</label><input className="form-input" value={form.bank_swift} onChange={e => setField('bank_swift', e.target.value)} /></div>
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

  if (!ti) return null

  const tiSubtotal = Number(ti.subtotal)
  const tiTax = Number(ti.sales_tax_amount)
  const tiTotal = Number(ti.total_amount)

  return (
    <PageWrapper title={`Tax Invoice — ${ti.tax_invoice_number}`}
      actions={<div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></button>
        {ti.po_id && <Link href={`/purchase-orders/${ti.po_id}`} className="btn btn-secondary btn-sm">View PO</Link>}
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer className="w-4 h-4" /> Download PDF</button>
      </div>}>
      <div className="card card-body w-full print-page">
        <DocumentHeader title="TAX INVOICE" docNumber={ti.tax_invoice_number} docDate={formatDate(ti.invoice_date)} />
        <div className="mb-4 no-print"><StatusBadge status={ti.status} /></div>
        {/* Bill To & Payment */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="section-title">Bill To</p>
            <p className="font-medium">{ti.customer_name}</p>
            {ti.customer_id && <p><span className="font-medium">Customer ID:</span> {ti.customer_id}</p>}
            {ti.customer_address && <p className="whitespace-pre-line">{ti.customer_address}</p>}
            {ti.customer_phone && <p>{ti.customer_phone}</p>}
          </div>
          <div>
            <p className="section-title">Payment Due</p>
            {ti.payment_due_date && <p><span className="font-medium">Due:</span> {formatDate(ti.payment_due_date)}</p>}
            {ti.sales_person && <p><span className="font-medium">Sales Person:</span> {ti.sales_person}</p>}
            {ti.payment_terms && <p><span className="font-medium">Terms:</span> {ti.payment_terms}</p>}
            <p className="section-title mt-3">Order Details</p>
            {ti.purchase_order_number && <p><span className="font-medium">PO No:</span> {ti.purchase_order_number}</p>}
            {ti.order_date && <p><span className="font-medium">Order Date:</span> {formatDate(ti.order_date)}</p>}
            {ti.shipping_terms && <p><span className="font-medium">Shipping Terms:</span> {ti.shipping_terms}</p>}
          </div>
        </div>
        <table className="data-table text-xs mb-4">
          <thead><tr><th>Item No</th><th>Item Description</th><th className="text-right">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Line Total</th></tr></thead>
          <tbody>
            {ti.ti_items?.map(item => (
              <tr key={item.id}>
                <td className="font-mono">{item.item_number}</td>
                <td>{item.item_description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{ti.currency} {Number(item.unit_price).toFixed(2)}</td>
                <td className="text-right font-medium">{ti.currency} {Number(item.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between mb-4">
          <div className="text-xs text-gray-500">
            {ti.vat_reg_number && <p><span className="font-medium">VAT Reg No:</span> {ti.vat_reg_number}</p>}
            {ti.company_reg_number && <p><span className="font-medium">Co Reg No:</span> {ti.company_reg_number}</p>}
          </div>
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span>Sub Total</span><span>{ti.currency} {tiSubtotal.toFixed(2)}</span></div>
            {tiTax > 0 && <div className="flex justify-between"><span>Sales Tax ({ti.sales_tax_rate}%)</span><span>{ti.currency} {tiTax.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold border-t border-gray-200 pt-2"><span>Total</span><span className="text-[#1E3A5F]">{formatCurrency(tiTotal, ti.currency)}</span></div>
          </div>
        </div>
        {/* Bank Details */}
        {ti.bank_name && (
          <div className="text-sm border-t border-gray-100 pt-4">
            <p className="section-title">Payment Details</p>
            <div className="grid grid-cols-3 gap-4">
              {ti.bank_name && <p><span className="font-medium">Bank:</span> {ti.bank_name}</p>}
              {ti.bank_account_name && <p><span className="font-medium">Account:</span> {ti.bank_account_name}</p>}
              {ti.bank_account_number && <p><span className="font-medium">Account No:</span> {ti.bank_account_number}</p>}
              {ti.bank_sort_code && <p><span className="font-medium">Sort Code:</span> {ti.bank_sort_code}</p>}
              {ti.bank_iban && <p><span className="font-medium">IBAN:</span> {ti.bank_iban}</p>}
              {ti.bank_swift && <p><span className="font-medium">SWIFT:</span> {ti.bank_swift}</p>}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

export default function TaxInvoicePage() {
  return <Suspense fallback={<div>Loading…</div>}><TIContent /></Suspense>
}
