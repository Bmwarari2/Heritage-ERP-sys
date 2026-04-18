'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Eye, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { ProformaInvoice } from '@/types'

export default function ProformaListPage() {
  const [proformas, setProformas] = useState<ProformaInvoice[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/proforma')
    setProformas(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function del(id: string) {
    if (!confirm('Delete this Proforma Invoice?')) return
    await fetch(`/api/proforma/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <PageWrapper title="Proforma Invoices" subtitle="Create proforma invoices linked to RFQs"
      actions={<Link href="/proforma/new" className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> New Proforma</Link>}>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : proformas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="font-medium">No proforma invoices yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Proforma No</th>
                <th>Linked RFQ</th>
                <th>Client Company</th>
                <th>Date</th>
                <th>Valid Until</th>
                <th>Currency</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proformas.map(pi => (
                <tr key={pi.id}>
                  <td className="font-mono font-medium text-[#1a2744]">{pi.proforma_number}</td>
                  <td className="text-gray-500 text-xs">{(pi.rfqs as { rfq_number?: string } | undefined)?.rfq_number ?? '—'}</td>
                  <td>{pi.client_company ?? '—'}</td>
                  <td>{formatDate(pi.invoice_date)}</td>
                  <td>{formatDate(pi.valid_until_date)}</td>
                  <td>{pi.currency}</td>
                  <td className="text-right font-medium">{formatCurrency(pi.total_amount, pi.currency)}</td>
                  <td><StatusBadge status={pi.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/proforma/${pi.id}`} className="btn btn-secondary btn-sm"><Eye className="w-3.5 h-3.5" /></Link>
                      <button onClick={() => del(pi.id)} className="btn btn-danger btn-sm"><Trash2 className="w-3.5 h-3.5" /></button>
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
