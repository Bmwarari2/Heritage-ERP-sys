'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ArrowLeft } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'

export default function NewClientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', contact_person: '', email: '', phone: '',
    address: '', country: '', vat_number: '', notes: '',
  })

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Client name is required.'); return }
    setSaving(true)
    setError('')

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error || 'Failed to save client.'); setSaving(false); return }
    router.push(`/clients/${data.id}`)
  }

  return (
    <PageWrapper title="New Client" subtitle="Add a new client to your directory"
      actions={
        <button className="btn btn-secondary btn-sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-3xl">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1a2744]">Client Details</h3></div>
          <div className="card-body space-y-4">
            <div>
              <label className="form-label">Company / Client Name *</label>
              <input required className="form-input" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Acme Corporation" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Contact Person</label>
                <input className="form-input" value={form.contact_person} onChange={e => setField('contact_person', e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="contact@client.com" />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+1 234 567 8900" />
              </div>
              <div>
                <label className="form-label">Country</label>
                <input className="form-input" value={form.country} onChange={e => setField('country', e.target.value)} placeholder="e.g. United Kingdom" />
              </div>
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-textarea" rows={3} value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Full postal address" />
            </div>
            <div>
              <label className="form-label">VAT / Tax Number</label>
              <input className="form-input" value={form.vat_number} onChange={e => setField('vat_number', e.target.value)} placeholder="GB 123 456 789" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any internal notes about this client…" />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Client</>}
          </button>
        </div>
      </form>
    </PageWrapper>
  )
}
