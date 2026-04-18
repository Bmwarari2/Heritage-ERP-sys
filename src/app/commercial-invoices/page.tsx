'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { CommercialInvoice } from '@/types'

export default function CommercialInvoiceListPage() {
  const [invoices, setInvoices] = useState<CommercialInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/commercial-invoices').then(r => r.json()).then(data => { setInvoices(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  return (
    <PageWrapper title="Commercial Invoices" subtitle="Commercial invoices generated from purchase order dispatches">
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="font-medium">No commercial invoices yet</p>
            <p className="text-sm mt-1">Create one from a Purchase Order dispatch</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Invoice No</th><th>PO Number</th><th>Date</th><th>Consignee</th><th>Currency</th><th className="text-right">Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {invoices.map(ci => (
                <tr key={ci.id}>
                  <td className="font-mono font-medium text-[#1a2744]">{ci.invoice_number}</td>
                  <td className="font-mono text-sm">{ci.purchase_order_number ?? '—'}</td>
                  <td>{formatDate(ci.invoice_date)}</td>
                  <td>{ci.consignee_name ?? '—'}</td>
                  <td>{ci.currency}</td>
                  <td className="text-right font-medium">{formatCurrency(ci.total_amount, ci.currency)}</td>
                  <td><StatusBadge status={ci.status} /></td>
                  <td><Link href={`/commercial-invoices/${ci.id}`} className="btn btn-secondary btn-sm"><Eye className="w-3.5 h-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  )
}
