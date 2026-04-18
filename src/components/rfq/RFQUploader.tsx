'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { ParsedRFQ } from '@/types'
import RFQForm from './RFQForm'

type Stage = 'upload' | 'parsing' | 'verify'

export default function RFQUploader() {
  const [stage, setStage] = useState<Stage>('upload')
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState<ParsedRFQ | null>(null)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(file: File) {
    const isPdf = file && (
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf')
    )
    if (!isPdf) {
      setError('Please upload a PDF file.')
      return
    }
    setFileName(file.name)
    setError('')
    setStage('parsing')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'rfq')

    try {
      const res = await fetch('/api/parse-document', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok || !result.data) {
        setError(result.error || 'Parsing failed. Please try again.')
        setStage('upload')
        return
      }
      setParsed(result.data)
      setStage('verify')
    } catch {
      setError('Network error. Please try again.')
      setStage('upload')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (stage === 'verify' && parsed) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">AI Extraction Complete</p>
            <p className="text-sm text-green-600">
              Extracted from <strong>{fileName}</strong>. Review and edit the data below before saving.
            </p>
          </div>
        </div>
        <RFQForm initialData={parsed} />
      </div>
    )
  }

  if (stage === 'parsing') {
    return (
      <div className="card card-body flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-lg font-semibold text-[#1a2744]">Parsing PDF with AI…</p>
        <p className="text-sm text-gray-500">Claude is extracting RFQ data from your document</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      {error && (
        <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <div
        className="card card-body border-2 border-dashed border-gray-300 hover:border-[#c8a84b] transition-colors cursor-pointer text-center py-16"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-lg font-semibold text-gray-700 mb-1">Drop your RFQ PDF here</p>
        <p className="text-sm text-gray-500 mb-4">or click to browse</p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <FileText className="w-4 h-4" />
          <span>PDF files only · Max 10MB</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      <p className="text-xs text-gray-500 text-center mt-4">
        The AI will extract all fields including RFQ number, addresses, contact details and line items.
        You can review and edit everything before saving.
      </p>
    </div>
  )
}
