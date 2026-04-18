import { NextRequest, NextResponse } from 'next/server'
import { parseRFQFromText, parsePOFromText } from '@/lib/claude'

// Dynamic import of pdf-parse to avoid bundling issues
async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const data = await pdfParse(buffer)
  return data.text
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docType = formData.get('type') as string | null  // 'rfq' | 'po'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!docType || !['rfq', 'po'].includes(docType)) {
      return NextResponse.json({ error: 'Invalid document type. Use rfq or po.' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    let pdfText: string
    try {
      pdfText = await extractPdfText(buffer)
    } catch {
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

    // Parse with Claude AI
    let parsed
    try {
      if (docType === 'rfq') {
        parsed = await parseRFQFromText(pdfText)
      } else {
        parsed = await parsePOFromText(pdfText)
      }
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
