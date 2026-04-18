'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'
import type { PackingList } from '@/types'

export default function PackingListPage() {
  const [lists, setLists] = useState<PackingList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/packing-lists').then(r => r.json()).then(data => { setLists(Array.isArray(data) ? data : []); setLoading(false) })
  }, [])

  return (
    <PageWrapper title="Packing Lists" subtitle="Packing lists generated from purchase order dispatches">
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="font-medium">No packing lists yet</p>
            <p className="text-sm mt-1">Create one from a Purchase Order dispatch</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>PO Number</th><th>Our Order No</th><th>Destination</th><th>Shipped Via</th><th>Sales Person</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {lists.map(pl => (
                <tr key={pl.id}>
                  <td className="font-mono">{pl.customer_po_number ?? '—'}</td>
                  <td className="font-mono">{pl.our_order_number ?? '—'}</td>
                  <td>{pl.final_destination ?? '—'}</td>
                  <td>{pl.shipped_via ?? '—'}</td>
                  <td>{pl.sales_person ?? '—'}</td>
                  <td><StatusBadge status={pl.status} /></td>
                  <td>{formatDate(pl.created_at)}</td>
                  <td><Link href={`/packing-lists/${pl.id}`} className="btn btn-secondary btn-sm"><Eye className="w-3.5 h-3.5" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  )
}
