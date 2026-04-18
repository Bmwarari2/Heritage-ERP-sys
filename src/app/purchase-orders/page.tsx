'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Upload, Eye, Trash2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { PurchaseOrder } from '@/types'

export default function POListPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/purchase-orders')
    setPos(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function del(id: string) {
    if (!confirm('Delete this Purchase Order?')) return
    await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <PageWrapper title="Purchase Orders" subtitle="Manage client and standalone purchase orders"
      actions={
        <div className="flex gap-2">
          <Link href="/purchase-orders/new?mode=upload" className="btn btn-secondary btn-sm"><Upload className="w-4 h-4" /> Upload PDF</Link>
          <Link href="/purchase-orders/new?mode=standalone" className="btn btn-secondary btn-sm"><Plus className="w-4 h-4" /> Standalone PO</Link>
          <Link href="/purchase-orders/new" className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> New Client PO</Link>
        </div>
      }>
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : pos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="font-medium">No purchase orders yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Type</th>
                <th>Ship To</th>
                <th>Linked RFQ</th>
                <th>Date</th>
                <th>Currency</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po.id}>
                  <td className="font-mono font-medium text-[#1a2744]">{po.po_number}</td>
                  <td>
                    <span className={`badge text-xs ${po.po_type === 'standalone' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {po.po_type}
                    </span>
                  </td>
                  <td>{po.ship_to_company ?? po.delivery_address ?? '—'}</td>
                  <td className="text-gray-500 text-xs">{(po.rfqs as { rfq_number?: string } | undefined)?.rfq_number ?? '—'}</td>
                  <td>{formatDate(po.po_date)}</td>
                  <td>{po.currency}</td>
                  <td className="text-right font-medium">{formatCurrency(po.total_amount, po.currency)}</td>
                  <td><StatusBadge status={po.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/purchase-orders/${po.id}`} className="btn btn-secondary btn-sm"><Eye className="w-3.5 h-3.5" /></Link>
                      <button onClick={() => del(po.id)} className="btn btn-danger btn-sm"><Trash2 className="w-3.5 h-3.5" /></button>
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
