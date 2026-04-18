'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Printer, FileText, ArrowLeft, Loader2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import RFQForm from '@/components/rfq/RFQForm'
import { formatDate } from '@/lib/utils'
import type { RFQ } from '@/types'

export default function RFQDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetch(`/api/rfq/${id}`)
      .then(r => r.json())
      .then(data => { setRfq(data); setLoading(false) })
  }, [id])

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
  if (!rfq) return <div className="flex-1 flex items-center justify-center text-gray-400">RFQ not found</div>

  if (editing) {
    return (
      <PageWrapper title={`Edit RFQ ${rfq.rfq_number}`} actions={
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel Edit</button>
      }>
        <RFQForm existing={rfq} />
      </PageWrapper>
    )
  }

  const items = rfq.rfq_items ?? []

  return (
    <PageWrapper
      title={`RFQ — ${rfq.rfq_number}`}
      subtitle={rfq.buyer_company ?? undefined}
      actions={
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
            <Edit2 className="w-4 h-4" /> Edit
          </button>
          <Link href={`/proforma/new?rfq_id=${rfq.id}`} className="btn btn-primary btn-sm">
            <FileText className="w-4 h-4" /> Create Proforma
          </Link>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Download PDF
          </button>
        </div>
      }
    >
      {/* ---- Print Layout ---- */}
      <div className="card card-body w-full print-page rfq-print-page" id="rfq-print">
        <div className="rfq-print-inner">
          {/* Header: Title + reference block (the background image already
              carries the Heritage logo in the top-right corner). */}
          <div className="rfq-header">
            <div className="rfq-header-left">
              <p className="rfq-doc-label">Document</p>
              <h1 className="rfq-title">REQUEST FOR QUOTATION</h1>

              <dl className="rfq-ref-box">
                <dt>Doc Number</dt>
                <dd className="font-mono">{rfq.rfq_number}</dd>

                <dt>Date</dt>
                <dd>{formatDate(rfq.rfq_date)}</dd>

                {rfq.quotation_deadline && (
                  <>
                    <dt>Quotation Deadline</dt>
                    <dd>{formatDate(rfq.quotation_deadline)}</dd>
                  </>
                )}
                {rfq.delivery_date && (
                  <>
                    <dt>Delivery Date</dt>
                    <dd>{formatDate(rfq.delivery_date)}</dd>
                  </>
                )}
                {rfq.your_reference && (
                  <>
                    <dt>Your Reference</dt>
                    <dd>{rfq.your_reference}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* Status — screen only */}
          <div className="mb-5 no-print">
            <StatusBadge status={rfq.status} />
          </div>

          {/* Address Grid — 2x2 */}
          <section className="rfq-address-grid">
            <div className="rfq-address-cell">
              <p className="section-title">Invoicing Details</p>
              <p className="font-medium">{rfq.buyer_company}</p>
              {rfq.buyer_site && <p>{rfq.buyer_site}</p>}
              {rfq.buyer_po_box && <p>PO Box {rfq.buyer_po_box}</p>}
              {rfq.buyer_country && <p>{rfq.buyer_country}</p>}
            </div>

            <div className="rfq-address-cell">
              <p className="section-title">Delivery Address</p>
              <p className="font-medium">{rfq.delivery_company}</p>
              {rfq.delivery_street && <p>{rfq.delivery_street}</p>}
              {rfq.delivery_town && <p>{rfq.delivery_town} {rfq.delivery_post_code}</p>}
              {rfq.delivery_country && <p>{rfq.delivery_country}</p>}
            </div>

            <hr className="rfq-address-divider" />

            <div className="rfq-address-cell">
              <p className="section-title">Contact Details</p>
              {rfq.contact_person && <p><span className="font-medium">Contact:</span> {rfq.contact_person}</p>}
              {rfq.contact_email && <p>{rfq.contact_email}</p>}
              {rfq.contact_tel && <p><span className="font-medium">Tel:</span> {rfq.contact_tel}</p>}
              {rfq.contact_fax && <p><span className="font-medium">Fax:</span> {rfq.contact_fax}</p>}
            </div>

            <div className="rfq-address-cell">
              <p className="section-title">Vendor Details</p>
              <p className="font-medium">{rfq.vendor_name}</p>
              {rfq.vendor_address_line1 && <p>{rfq.vendor_address_line1}</p>}
              {rfq.vendor_city && <p>{rfq.vendor_city} {rfq.vendor_post_code}</p>}
              {rfq.vendor_country && <p>{rfq.vendor_country}</p>}
              {rfq.vendor_number && <p><span className="font-medium">Vendor No:</span> {rfq.vendor_number}</p>}
              {rfq.vendor_contact_person && <p><span className="font-medium">Contact:</span> {rfq.vendor_contact_person}</p>}
              {rfq.vendor_tel && <p><span className="font-medium">Tel:</span> {rfq.vendor_tel}</p>}
              {rfq.vendor_fax && <p><span className="font-medium">Fax:</span> {rfq.vendor_fax}</p>}
              {rfq.vendor_email && <p><span className="font-medium">Email:</span> {rfq.vendor_email}</p>}
            </div>
          </section>

          {/* Line Items — heading stays with the table */}
          {items.length > 0 && (
            <section className="rfq-items">
              <p className="section-title">Items</p>
              <div className="overflow-x-auto">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th>Item No</th>
                      <th>Item Code</th>
                      <th>Description</th>
                      <th>OEM</th>
                      <th>Part No</th>
                      <th className="text-right">Qty</th>
                      <th>Unit</th>
                      <th className="text-right">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="font-mono">{item.item_number}</td>
                        <td className="font-mono">{item.item_code}</td>
                        <td>
                          <p className="font-medium">{item.description_short}</p>
                          {item.description_full && <p className="text-gray-500 text-xs mt-0.5">{item.description_full}</p>}
                        </td>
                        <td>{item.oem}</td>
                        <td className="font-mono">{item.part_number}</td>
                        <td className="text-right font-medium">{item.quantity.toFixed(3)}</td>
                        <td>{item.unit}</td>
                        <td className="text-right text-gray-400 italic">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Comments */}
          {rfq.comments && (
            <div className="text-sm mt-6">
              <p className="section-title">Comments</p>
              <p className="text-gray-700">{rfq.comments}</p>
            </div>
          )}

          {rfq.submission_email && (
            <div className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
              <p><span className="font-medium">Please submit quotation to:</span> {rfq.submission_email}</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
