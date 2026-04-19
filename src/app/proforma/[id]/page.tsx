'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Printer, ArrowLeft, Loader2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import ProformaForm from '@/components/proforma/ProformaForm'
import { printPdf } from '@/lib/print-pdf'
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

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
  if (!pi) return <div className="flex-1 flex items-center justify-center text-slate-400">Proforma not found</div>

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
  const refRfqNumber = (pi.rfqs as { rfq_number?: string } | undefined)?.rfq_number

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
          <button className="btn btn-secondary btn-sm" onClick={() => printPdf(`/api/proforma/${pi.id}/pdf`)}><Printer className="w-4 h-4" /> Print</button>
          <a href={`/api/proforma/${pi.id}/pdf`} className="btn btn-primary btn-sm" target="_blank" rel="noopener">
            <Printer className="w-4 h-4" /> Download PDF
          </a>
        </div>
      }
    >
      <div className="card card-body w-full print-page doc-print-page">
        <div className="doc-print-inner">
          <div className="doc-header">
            <div className="doc-header-left">
              <p className="doc-doc-label">Document</p>
              <h1 className="doc-title">Proforma Invoice</h1>
              <dl className="doc-ref-box">
                <dt>Doc Number</dt>
                <dd className="font-mono">{pi.proforma_number}</dd>
                <dt>Date</dt>
                <dd>{formatDate(pi.invoice_date)}</dd>
                {pi.valid_until_date && (<><dt>Valid Until</dt><dd>{formatDate(pi.valid_until_date)}</dd></>)}
                {refRfqNumber && (<><dt>Ref RFQ</dt><dd className="font-mono">{refRfqNumber}</dd></>)}
                {pi.currency && (<><dt>Currency</dt><dd>{pi.currency}</dd></>)}
              </dl>
            </div>
          </div>

          <div className="mb-5 no-print"><StatusBadge status={pi.status} /></div>

          <section className="doc-address-grid">
            <div className="doc-address-cell">
              <p className="section-title">Bill To</p>
              <p className="font-medium">{pi.client_company}</p>
              {pi.client_department && <p>{pi.client_department}</p>}
              {pi.client_address && <p className="whitespace-pre-line">{pi.client_address}</p>}
              {pi.client_country && <p>{pi.client_country}</p>}
              {pi.client_phone && <p><span className="font-medium">Phone:</span> {pi.client_phone}</p>}
            </div>

            <div className="doc-address-cell">
              <p className="section-title">Shipping &amp; Terms</p>
              {pi.airway_bill && <p><span className="font-medium">Airway Bill:</span> <span className="font-mono">{pi.airway_bill}</span></p>}
              {pi.incoterm && <p><span className="font-medium">Incoterm:</span> {pi.incoterm}</p>}
              {pi.incoterm_country && <p><span className="font-medium">Incoterm Country:</span> {pi.incoterm_country}</p>}
              <p><span className="font-medium">Currency:</span> {pi.currency}</p>
            </div>
          </section>

          <section className="doc-items">
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
                      <td className="text-right font-semibold">{pi.currency} {Number(item.total_cost).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex justify-end mt-6 mb-4">
            <div className="w-full sm:w-80 doc-address-cell">
              <p className="section-title">Summary</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-900">{pi.currency} {Number(pi.subtotal).toFixed(2)}</span>
                </div>
                {pi.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax ({pi.tax_rate}%)</span>
                    <span className="font-medium text-slate-900">{pi.currency} {Number(pi.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t-2 border-slate-300 pt-2 mt-2">
                  <span className="text-slate-900">Total</span>
                  <span className="text-heritage-900">{formatCurrency(pi.total_amount, pi.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {pi.notes && (
            <div className="text-sm mt-4">
              <p className="section-title">Notes</p>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">{pi.notes}</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
