'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PageWrapper from '@/components/shared/PageWrapper'
import ProformaForm from '@/components/proforma/ProformaForm'
import type { RFQ } from '@/types'

function NewProformaContent() {
  const params = useSearchParams()
  const rfqId = params.get('rfq_id')
  const [rfq, setRfq] = useState<RFQ | null>(null)

  useEffect(() => {
    if (rfqId) {
      fetch(`/api/rfq/${rfqId}`).then(r => r.json()).then(setRfq)
    }
  }, [rfqId])

  return (
    <PageWrapper
      title="New Proforma Invoice"
      subtitle={rfq ? `Linked to RFQ ${rfq.rfq_number}` : 'Create a new proforma invoice'}
    >
      <ProformaForm rfq={rfq} />
    </PageWrapper>
  )
}

export default function NewProformaPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <NewProformaContent />
    </Suspense>
  )
}
