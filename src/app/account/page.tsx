'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, User, Key } from 'lucide-react'
import Link from 'next/link'
import PageWrapper from '@/components/shared/PageWrapper'

export default function AccountPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/profile').then(r => r.json()).then(p => {
      setFullName(p.full_name ?? '')
      setEmail(p.email ?? '')
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName.trim() }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else { const d = await res.json(); setError(d.error || 'Failed to save.') }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

  return (
    <PageWrapper title="My Account">
      <div className="space-y-6 w-full max-w-lg">
        {/* Profile */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[#1E3A5F]" />
              <h3 className="font-semibold text-[#1E3A5F]">Profile</h3>
            </div>
          </div>
          <form onSubmit={handleSave} className="card-body space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div>
              <label className="form-label">Email</label>
              <input className="form-input bg-slate-50" value={email} disabled readOnly />
            </div>
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Name'}
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-[#1E3A5F]" />
              <h3 className="font-semibold text-[#1E3A5F]">Password</h3>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-slate-600 mb-4">Update your login password. Minimum 10 characters.</p>
            <Link href="/account/change-password" className="btn btn-secondary btn-sm">
              <Key className="w-4 h-4" /> Change Password
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
