'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PageWrapper from '@/components/shared/PageWrapper'
import RFQForm from '@/components/rfq/RFQForm'
import RFQUploader from '@/components/rfq/RFQUploader'

function NewRFQContent() {
  const params = useSearchParams()
  const mode = params.get('mode')

  if (mode === 'upload') {
    return (
      <PageWrapper title="Upload RFQ PDF" subtitle="AI will extract data from your PDF for review">
        <RFQUploader />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Create RFQ" subtitle="Manually enter Request for Quotation details">
      <RFQForm />
    </PageWrapper>
  )
}

export default function NewRFQPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <NewRFQContent />
    </Suspense>
  )
}
