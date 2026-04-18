'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Building2, Mail, Phone, MapPin, Loader2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import type { Client } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    fetch(`/api/clients?${params}`).then(r => r.json()).then(data => {
      setClients(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [search])

  return (
    <PageWrapper
      title="Clients"
      subtitle="Manage your client directory"
      actions={
        <Link href="/clients/new" className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> New Client
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="card card-body flex items-center gap-3 py-3">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="search"
            placeholder="Search clients by name, email, country…"
            className="flex-1 text-sm outline-none bg-transparent"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : clients.length === 0 ? (
          <div className="card card-body text-center py-16 text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No clients yet</p>
            <p className="text-sm mt-1">Create your first client to link across documents.</p>
            <Link href="/clients/new" className="btn btn-primary btn-sm mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Add Client
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map(c => (
              <Link key={c.id} href={`/clients/${c.id}`} className="card card-body hover:border-[#3A6EA5] transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1E3A5F] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-[#3A6EA5]" />
                  </div>
                </div>
                <h3 className="font-semibold text-[#1E3A5F] group-hover:text-[#3A6EA5] transition-colors">{c.name}</h3>
                {c.contact_person && <p className="text-sm text-gray-500 mt-0.5">{c.contact_person}</p>}
                <div className="mt-3 space-y-1">
                  {c.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.country && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{c.country}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
