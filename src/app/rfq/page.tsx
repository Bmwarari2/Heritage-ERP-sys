'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Upload, Eye, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { RFQ } from '@/types'

export default function RFQListPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/rfq?search=${encodeURIComponent(search)}`)
    const data = await res.json()
    setRfqs(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [search])

  async function deleteRFQ(id: string) {
    if (!confirm('Delete this RFQ?')) return
    await fetch(`/api/rfq/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <PageWrapper
      title="Request for Quotation"
      subtitle="Manage all RFQs — create manually or upload and parse a PDF"
      actions={
        <div className="flex gap-2">
          <Link href="/rfq/new?mode=upload" className="btn btn-secondary btn-sm">
            <Upload className="w-4 h-4" /> Upload PDF
          </Link>
          <Link href="/rfq/new" className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" /> New RFQ
          </Link>
        </div>
      }
    >
      {/* Search */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="form-input pl-9"
            placeholder="Search by number, company, reference…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : rfqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-2">No RFQs found</p>
            <p className="text-sm">Create one manually or upload a PDF</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>RFQ Number</th>
                <th>Buyer / Company</th>
                <th>Reference</th>
                <th>RFQ Date</th>
                <th>Deadline</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq.id}>
                  <td className="font-mono font-medium text-[#1a2744]">{rfq.rfq_number}</td>
                  <td>{rfq.buyer_company || '—'}</td>
                  <td className="text-gray-500">{rfq.your_reference || '—'}</td>
                  <td>{formatDate(rfq.rfq_date)}</td>
                  <td>{formatDate(rfq.quotation_deadline)}</td>
                  <td className="text-center">{rfq.rfq_items?.length ?? 0}</td>
                  <td><StatusBadge status={rfq.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/rfq/${rfq.id}`} className="btn btn-secondary btn-sm">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => deleteRFQ(rfq.id)} className="btn btn-danger btn-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  )
}
