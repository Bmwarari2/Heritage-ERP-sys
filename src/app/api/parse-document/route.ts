import { NextRequest, NextResponse } from 'next/server'
import { parseRFQFromText, parsePOFromText } from '@/lib/claude'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const MAX_FILE_BYTES = 10 * 1024 * 1024

// Import pdf-parse's internal entry point directly. The package's index.js
// runs debug code that tries to read a non-existent test PDF, which breaks
// in production bundles.
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdf = require('pdf-parse/lib/pdf-parse.js')
  const data = await pdf(buffer)
  return data.text
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docType = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!docType || !['rfq', 'po'].includes(docType)) {
      return NextResponse.json({ error: 'Invalid document type. Use rfq or po.' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File exceeds 10MB limit.' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let pdfText: string
    try {
      pdfText = await extractPdfText(buffer)
    } catch (err) {
      console.error('PDF extract error:', err)
      return NextResponse.json(
        { error: 'Failed to extract text from PDF. Ensure the file is a valid PDF.' },
        { status: 422 }
      )
    }

    if (!pdfText || pdfText.trim().length < 50) {
      return NextResponse.json(
        { error: 'PDF appears to be empty or scanned without text. Please use a text-based PDF.' },
        { status: 422 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured on the server.' },
        { status: 500 }
      )
    }

    let parsed
    try {
      parsed = docType === 'rfq' ? await parseRFQFromText(pdfText) : await parsePOFromText(pdfText)
    } catch (err) {
      console.error('Claude parsing error:', err)
      return NextResponse.json(
        { error: 'AI parsing failed. Please verify the document and try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: parsed, docType })
  } catch (err) {
    console.error('Parse document error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
