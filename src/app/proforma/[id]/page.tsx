'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Printer, ArrowLeft, Loader2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import DocumentHeader from '@/components/shared/DocumentHeader'
import ProformaForm from '@/components/proforma/ProformaForm'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { ProformaInvoice } from '@/types'

export default function ProformaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [pi, setPi] = useState<ProformaInvoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetch(`/api/proforma/${id}`).then(r => r.json()).then(data => { setPi(data); setLoading(false) })
  }, [id])

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
  if (!pi) return <div className="flex-1 flex items-center justify-center text-gray-400">Proforma not found</div>

  if (editing) {
    return (
      <PageWrapper title={`Edit ${pi.proforma_number}`} actions={
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel Edit</button>
      }>
        <ProformaForm existing={pi} />
      </PageWrapper>
    )
  }

  const items = pi.proforma_items ?? []

  return (
    <PageWrapper
      title={`Proforma — ${pi.proforma_number}`}
      subtitle={pi.client_company ?? undefined}
      actions={
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></button>
          {pi.rfq_id && (
            <Link href={`/rfq/${pi.rfq_id}`} className="btn btn-secondary btn-sm">View RFQ</Link>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4" /> Edit</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer className="w-4 h-4" /> Download PDF</button>
        </div>
      }
    >
      <div className="card card-body w-full max-w-5xl print-page">
        <DocumentHeader
          title="PROFORMA INVOICE"
          docNumber={pi.proforma_number}
          docDate={formatDate(pi.invoice_date)}
          extra={
            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
              {pi.valid_until_date && <p><span className="font-medium">Valid Until:</span> {formatDate(pi.valid_until_date)}</p>}
              {(pi.rfqs as { rfq_number?: string } | undefined)?.rfq_number && (
                <p><span className="font-medium">Ref RFQ:</span> {(pi.rfqs as { rfq_number?: string }).rfq_number}</p>
              )}
            </div>
          }
        />

        <div className="mb-5 no-print"><StatusBadge status={pi.status} /></div>

        {/* Sent To / Shipping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="section-title">Sent To</p>
            <p className="font-medium">{pi.client_company}</p>
            {pi.client_department && <p>{pi.client_department}</p>}
            {pi.client_address && <p className="whitespace-pre-line">{pi.client_address}</p>}
            {pi.client_country && <p>{pi.client_country}</p>}
            {pi.client_phone && <p><span className="font-medium">Phone:</span> {pi.client_phone}</p>}
          </div>
          <div>
            <p className="section-title">Shipping & Terms</p>
            {pi.airway_bill && <p><span className="font-medium">Airway Bill:</span> {pi.airway_bill}</p>}
            {pi.incoterm && <p><span className="font-medium">Incoterm:</span> {pi.incoterm}</p>}
            {pi.incoterm_country && <p><span className="font-medium">Incoterm Country:</span> {pi.incoterm_country}</p>}
            <p><span className="font-medium">Currency:</span> {pi.currency}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-4">
          <p className="section-title">Items</p>
          <div className="overflow-x-auto">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>Item No</th>
                <th>Description of Goods</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="font-mono">{item.item_number}</td>
                  <td>{item.description}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{pi.currency} {Number(item.unit_price).toFixed(2)}</td>
                  <td className="text-right font-medium">{pi.currency} {Number(item.total_cost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1 text-sm border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{pi.currency} {Number(pi.subtotal).toFixed(2)}</span>
            </div>
            {pi.tax_rate > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({pi.tax_rate}%)</span>
                <span>{pi.currency} {Number(pi.tax_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2">
              <span>Total</span>
              <span className="text-[#1a2744]">{formatCurrency(pi.total_amount, pi.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {pi.notes && (
          <div className="text-sm border-t border-gray-100 pt-4">
            <p className="section-title">Notes</p>
            <p className="text-gray-700 whitespace-pre-line">{pi.notes}</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
