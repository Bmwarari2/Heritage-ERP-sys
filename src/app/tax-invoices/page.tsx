'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { TaxInvoice } from '@/types'

export default function TaxInvoiceListPage() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tax-invoices').then(r => r.json()).then(data => { setInvoices(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  return (
    <PageWrapper title="Tax Invoices" subtitle="VAT/tax invoices generated from purchase order dispatches">
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="font-medium">No tax invoices yet</p>
            <p className="text-sm mt-1">Create one from a Purchase Order dispatch</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Tax Invoice No</th><th>PO Number</th><th>Customer</th><th>Date</th><th>Due Date</th><th className="text-right">Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {invoices.map(ti => (
                <tr key={ti.id}>
                  <td className="font-mono font-medium text-[#1a2744]">{ti.tax_invoice_number}</td>
                  <td className="font-mono text-sm">{ti.purchase_order_number ?? '—'}</td>
                  <td>{ti.customer_name ?? '—'}</td>
                  <td>{formatDate(ti.invoice_date)}</td>
                  <td>{formatDate(ti.payment_due_date)}</td>
                  <td className="text-right font-medium">{formatCurrency(ti.total_amount, ti.currency)}</td>
                  <td><StatusBadge status={ti.status} /></td>
                  <td><Link href={`/tax-invoices/${ti.id}`} className="btn btn-secondary btn-sm"><Eye className="w-3.5 h-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  )
}
