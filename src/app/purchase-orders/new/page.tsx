'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PageWrapper from '@/components/shared/PageWrapper'
import POForm from '@/components/po/POForm'
import POUploader from '@/components/po/POUploader'
import type { RFQ } from '@/types'

function NewPOContent() {
  const params = useSearchParams()
  const mode = params.get('mode')
  const rfqId = params.get('rfq_id')
  const [rfq, setRfq] = useState<RFQ | null>(null)

  useEffect(() => {
    if (rfqId) fetch(`/api/rfq/${rfqId}`).then(r => r.json()).then(setRfq)
  }, [rfqId])

  if (mode === 'upload') {
    return (
      <PageWrapper title="Upload Purchase Order PDF" subtitle="AI will extract data from your PO PDF for review">
        <POUploader />
      </PageWrapper>
    )
  }

  if (mode === 'standalone') {
    return (
      <PageWrapper title="New Standalone Purchase Order" subtitle="Create a purchase order not linked to a client">
        <POForm poType="standalone" />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="New Client Purchase Order" subtitle={rfq ? `Linked to RFQ ${rfq.rfq_number}` : 'Create a client purchase order'}>
      <POForm poType="client" rfq={rfq} />
    </PageWrapper>
  )
}

export default function NewPOPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <NewPOContent />
    </Suspense>
  )
}
