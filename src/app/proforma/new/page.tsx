'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import ProformaForm from '@/components/proforma/ProformaForm'
import type { RFQ } from '@/types'

function NewProformaContent() {
  const params = useSearchParams()
  const rfqId = params.get('rfq_id')
  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [rfqLoading, setRfqLoading] = useState(!!rfqId)

  useEffect(() => {
    if (rfqId) {
      fetch(`/api/rfq/${rfqId}`)
        .then(r => r.json())
        .then(data => { setRfq(data); setRfqLoading(false) })
    }
  }, [rfqId])

  const subtitle = rfqLoading
    ? 'Loading linked RFQ…'
    : rfq
      ? `Linked to RFQ ${rfq.rfq_number} — fields pre-filled`
      : 'Create a new proforma invoice'

  return (
    <PageWrapper title="New Proforma Invoice" subtitle={subtitle}>
      {rfqLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <ProformaForm rfq={rfq} />
      )}
    </PageWrapper>
  )
}

export default function NewProformaPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
      <NewProformaContent />
    </Suspense>
  )
}
