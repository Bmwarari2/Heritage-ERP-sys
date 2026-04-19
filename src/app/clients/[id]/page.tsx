'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Loader2, ArrowLeft, Trash2, Edit2, Building2, Mail, Phone, MapPin, FileText, ShoppingCart, Receipt, Upload } from 'lucide-react'
import Link from 'next/link'
import PageWrapper from '@/components/shared/PageWrapper'
import type { Client } from '@/types'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: '', customer_id: '', contact_person: '', email: '', phone: '',
    address: '', billing_address: '', country: '', vat_number: '', notes: '',
  })

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r => r.json()).then(data => {
      setClient(data)
      setForm({
        name: data.name ?? '',
        customer_id: data.customer_id ?? '',
        contact_person: data.contact_person ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        address: data.address ?? '',
        billing_address: data.billing_address ?? '',
        country: data.country ?? '',
        vat_number: data.vat_number ?? '',
        notes: data.notes ?? '',
      })
      setLoading(false)
    })
  }, [id])

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Client name is required.'); return }
    setSaving(true)
    setError('')

    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save.'); setSaving(false); return }
    setClient(data)
    setEditing(false)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete client "${client?.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    router.push('/clients')
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
  if (!client) return <div className="flex-1 flex items-center justify-center text-gray-400">Client not found</div>

  if (editing) {
    return (
      <PageWrapper title={`Edit — ${client.name}`} actions={
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
      }>
        <form onSubmit={handleSave} className="space-y-6 w-full">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="card">
            <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Client Details</h3></div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label">Company / Client Name *</label>
                  <input required className="form-input" value={form.name} onChange={e => setField('name', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Customer ID (short code)</label>
                  <input className="form-input font-mono uppercase" placeholder="e.g. GGM" value={form.customer_id} onChange={e => setField('customer_id', e.target.value.toUpperCase())} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Contact Person</label>
                  <input className="form-input" value={form.contact_person} onChange={e => setField('contact_person', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => setField('email', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Country</label>
                  <input className="form-input" value={form.country} onChange={e => setField('country', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Shipping / Physical Address</label>
                  <textarea className="form-textarea" rows={3} value={form.address} onChange={e => setField('address', e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Billing Address <span className="text-xs text-gray-400 font-normal">(leave blank to use shipping)</span></label>
                  <textarea className="form-textarea" rows={3} value={form.billing_address} onChange={e => setField('billing_address', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label">VAT / Tax Number</label>
                <input className="form-input" value={form.vat_number} onChange={e => setField('vat_number', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="card card-body">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={client.name}
      subtitle={client.country ?? undefined}
      actions={
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></button>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4" /> Edit</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      }
    >
      <div className="space-y-6 w-full">
        {/* Contact info */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#3A6EA5]" />
              </div>
              <div>
                <h2 className="font-bold text-[#1E3A5F]">{client.name}</h2>
                {client.customer_id && <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#1E3A5F]/10 text-[#1E3A5F]">{client.customer_id}</span>}
                {client.contact_person && <p className="text-sm text-gray-500 mt-0.5">{client.contact_person}</p>}
              </div>
            </div>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {client.email && (
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${client.email}`} className="hover:text-[#1E3A5F]">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.country && (
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{client.country}</span>
              </div>
            )}
            {client.vat_number && (
              <div className="flex items-center gap-2 text-gray-700">
                <Receipt className="w-4 h-4 text-gray-400" />
                <span>VAT: {client.vat_number}</span>
              </div>
            )}
            {client.address && (
              <div className="text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Shipping Address</p>
                {client.address}
              </div>
            )}
            {client.billing_address && (
              <div className="text-gray-700 whitespace-pre-line bg-gray-50 rounded-lg p-3 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Billing Address</p>
                {client.billing_address}
              </div>
            )}
            {client.notes && (
              <div className="col-span-full">
                <p className="form-label">Notes</p>
                <p className="text-gray-700 whitespace-pre-line">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions to create linked documents */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">Create Document for this Client</h3></div>
          <div className="card-body grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href={`/rfq/new?client_id=${client.id}&client_name=${encodeURIComponent(client.name)}`}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#3A6EA5] hover:bg-amber-50 transition-colors text-center">
              <FileText className="w-6 h-6 text-[#1E3A5F]" />
              <span className="text-xs font-medium text-gray-700">New RFQ</span>
            </Link>
            <Link href={`/rfq/new?mode=upload&client_id=${client.id}&client_name=${encodeURIComponent(client.name)}`}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#3A6EA5] hover:bg-amber-50 transition-colors text-center">
              <Upload className="w-6 h-6 text-[#1E3A5F]" />
              <span className="text-xs font-medium text-gray-700">Upload RFQ PDF</span>
            </Link>
            <Link href={`/purchase-orders/new?client_id=${client.id}&client_name=${encodeURIComponent(client.name)}`}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#3A6EA5] hover:bg-amber-50 transition-colors text-center">
              <ShoppingCart className="w-6 h-6 text-[#1E3A5F]" />
              <span className="text-xs font-medium text-gray-700">New PO</span>
            </Link>
            <Link href={`/purchase-orders/new?mode=upload&client_id=${client.id}&client_name=${encodeURIComponent(client.name)}`}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#3A6EA5] hover:bg-amber-50 transition-colors text-center">
              <Upload className="w-6 h-6 text-[#1E3A5F]" />
              <span className="text-xs font-medium text-gray-700">Upload PO PDF</span>
            </Link>
            <Link href={`/proforma/new?client_id=${client.id}&client_name=${encodeURIComponent(client.name)}`}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#3A6EA5] hover:bg-amber-50 transition-colors text-center">
              <FileText className="w-6 h-6 text-[#3A6EA5]" />
              <span className="text-xs font-medium text-gray-700">New Proforma</span>
            </Link>
            <Link href={`/commercial-invoices/new?client_id=${client.id}&client_name=${encodeURIComponent(client.name)}`}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-[#3A6EA5] hover:bg-amber-50 transition-colors text-center">
              <Receipt className="w-6 h-6 text-[#1E3A5F]" />
              <span className="text-xs font-medium text-gray-700">New CI</span>
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
