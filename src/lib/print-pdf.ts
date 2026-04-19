/**
 * Open a server-generated PDF and trigger the browser's Print dialog
 * against it. We fetch the PDFKit output as a blob, load it in a
 * hidden iframe, then call `print()` on that iframe's window. The
 * browser's built-in PDF viewer handles the rest — so what the user
 * prints is byte-identical to the downloadable PDF (no HTML print
 * round-trip, no layout drift between screen and paper).
 */
export async function printPdf(url: string): Promise<void> {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) {
    window.alert('Could not generate PDF for printing.')
    return
  }
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)

  // Re-use any previously injected iframe so repeated prints don't
  // leak DOM nodes.
  const existing = document.getElementById('pdf-print-frame') as HTMLIFrameElement | null
  if (existing) existing.remove()

  const iframe = document.createElement('iframe')
  iframe.id = 'pdf-print-frame'
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.src = blobUrl
  document.body.appendChild(iframe)

  iframe.onload = () => {
    // Give the PDF plugin a moment to finish loading before we ask it
    // to print — some Chromium builds fail silently otherwise.
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {
        // Fall back to opening the PDF in a new tab if the embedded
        // viewer refuses to print (some mobile browsers).
        window.open(blobUrl, '_blank', 'noopener')
      }
    }, 350)
  }
}
