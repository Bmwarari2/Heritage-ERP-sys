'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, Building2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'

interface CompanySettings {
  company_name: string
  vat_reg_number: string
  company_reg_number: string
  address: string
  gbp_bank_name: string
  gbp_account_name: string
  gbp_account_number: string
  gbp_sort_code: string
  gbp_iban: string
  gbp_swift: string
  usd_bank_name: string
  usd_account_name: string
  usd_account_number: string
  usd_sort_code: string
  usd_iban: string
  usd_swift: string
}

const empty: CompanySettings = {
  company_name: 'Heritage Global Solutions Ltd',
  vat_reg_number: '', company_reg_number: '', address: '',
  gbp_bank_name: '', gbp_account_name: '', gbp_account_number: '', gbp_sort_code: '', gbp_iban: '', gbp_swift: '',
  usd_bank_name: '', usd_account_name: '', usd_account_number: '', usd_sort_code: '', usd_iban: '', usd_swift: '',
}

export default function CompanySettingsPage() {
  const [form, setForm] = useState<CompanySettings>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings/company').then(r => r.json()).then(data => {
      if (data && !data.error) {
        setForm({
          company_name: data.company_name ?? empty.company_name,
          vat_reg_number: data.vat_reg_number ?? '',
          company_reg_number: data.company_reg_number ?? '',
          address: data.address ?? '',
          gbp_bank_name: data.gbp_bank_name ?? '',
          gbp_account_name: data.gbp_account_name ?? '',
          gbp_account_number: data.gbp_account_number ?? '',
          gbp_sort_code: data.gbp_sort_code ?? '',
          gbp_iban: data.gbp_iban ?? '',
          gbp_swift: data.gbp_swift ?? '',
          usd_bank_name: data.usd_bank_name ?? '',
          usd_account_name: data.usd_account_name ?? '',
          usd_account_number: data.usd_account_number ?? '',
          usd_sort_code: data.usd_sort_code ?? '',
          usd_iban: data.usd_iban ?? '',
          usd_swift: data.usd_swift ?? '',
        })
      }
      setLoading(false)
    })
  }, [])

  function setField(key: keyof CompanySettings, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await fetch('/api/settings/company', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

  return (
    <PageWrapper title="Company Settings" subtitle="Heritage Global Solutions Ltd"
      actions={
        <button form="company-form" type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save'}
        </button>
      }>
      <form id="company-form" onSubmit={handleSave} className="space-y-6 w-full">
        {/* Company details */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[#1E3A5F]" />
              <h3 className="font-semibold text-[#1E3A5F]">Company Details</h3>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="form-label">Company Name</label>
              <input className="form-input" value={form.company_name} onChange={e => setField('company_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">VAT Registration Number</label>
                <input className="form-input" placeholder="e.g. GB123456789" value={form.vat_reg_number} onChange={e => setField('vat_reg_number', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Company Registration Number</label>
                <input className="form-input" placeholder="e.g. 12345678" value={form.company_reg_number} onChange={e => setField('company_reg_number', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-textarea" rows={3} value={form.address} onChange={e => setField('address', e.target.value)} />
            </div>
          </div>
        </div>

        {/* GBP bank details */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">GBP Bank Account</h3></div>
          <div className="card-body grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="form-label">Bank Name</label><input className="form-input" value={form.gbp_bank_name} onChange={e => setField('gbp_bank_name', e.target.value)} /></div>
            <div><label className="form-label">Account Name</label><input className="form-input" value={form.gbp_account_name} onChange={e => setField('gbp_account_name', e.target.value)} /></div>
            <div><label className="form-label">Account Number</label><input className="form-input" value={form.gbp_account_number} onChange={e => setField('gbp_account_number', e.target.value)} /></div>
            <div><label className="form-label">Sort Code</label><input className="form-input" placeholder="e.g. 01-02-03" value={form.gbp_sort_code} onChange={e => setField('gbp_sort_code', e.target.value)} /></div>
            <div><label className="form-label">IBAN</label><input className="form-input" value={form.gbp_iban} onChange={e => setField('gbp_iban', e.target.value)} /></div>
            <div><label className="form-label">SWIFT / BIC</label><input className="form-input" value={form.gbp_swift} onChange={e => setField('gbp_swift', e.target.value)} /></div>
          </div>
        </div>

        {/* USD bank details */}
        <div className="card">
          <div className="card-header"><h3 className="font-semibold text-[#1E3A5F]">USD Bank Account</h3></div>
          <div className="card-body grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="form-label">Bank Name</label><input className="form-input" value={form.usd_bank_name} onChange={e => setField('usd_bank_name', e.target.value)} /></div>
            <div><label className="form-label">Account Name</label><input className="form-input" value={form.usd_account_name} onChange={e => setField('usd_account_name', e.target.value)} /></div>
            <div><label className="form-label">Account Number</label><input className="form-input" value={form.usd_account_number} onChange={e => setField('usd_account_number', e.target.value)} /></div>
            <div><label className="form-label">Sort Code / ABA</label><input className="form-input" value={form.usd_sort_code} onChange={e => setField('usd_sort_code', e.target.value)} /></div>
            <div><label className="form-label">IBAN</label><input className="form-input" value={form.usd_iban} onChange={e => setField('usd_iban', e.target.value)} /></div>
            <div><label className="form-label">SWIFT / BIC</label><input className="form-input" value={form.usd_swift} onChange={e => setField('usd_swift', e.target.value)} /></div>
          </div>
        </div>
      </form>
    </PageWrapper>
  )
}
