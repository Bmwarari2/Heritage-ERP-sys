import Image from 'next/image'

/**
 * Reusable document header for printed / exported documents.
 *
 * Layout (enterprise invoice style):
 *   [ Logo + Company info ]                  [ Doc title + metadata box ]
 *
 * The same prop signature is used everywhere (RFQ, Proforma, PO, CI, TI, PL).
 * A subtle shield watermark is rendered behind the document body
 * via .print-page::before in globals.css.
 */
export default function DocumentHeader({
  title,
  subtitle,
  docNumber,
  docDate,
  extra,
}: {
  title: string
  subtitle?: string
  docNumber?: string
  docDate?: string
  extra?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8 pb-6 border-b-4 border-heritage-800 print:border-b-2 print:border-heritage-900">
      {/* Left: Heritage Logo & Company info */}
      <div className="flex-shrink-0 w-full sm:w-1/2">
        <div className="w-40 sm:w-48 md:w-56 mb-4">
          <Image
            src="/logo.svg"
            alt="Heritage Global Solutions Ltd"
            width={420}
            height={200}
            className="w-full h-auto"
            priority
          />
        </div>
        <div className="text-sm text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-800">Heritage Global Solutions Ltd</p>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {/* Right: Document title + metadata box */}
      <div className="flex-1 w-full text-left sm:text-right">
        <h1 className="text-2xl md:text-3xl font-extrabold text-heritage-900 tracking-wider uppercase mb-4">
          {title}
        </h1>

        <div
          className="inline-grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm text-left
                     bg-slate-50 p-4 rounded-lg border border-slate-200 w-full sm:w-auto
                     print:bg-slate-50 print:border-slate-300 print:w-auto"
        >
          {docNumber && (
            <>
              <div className="font-bold text-slate-500 uppercase text-xs tracking-wider self-center">
                Doc Number
              </div>
              <div className="font-mono font-bold text-slate-900 text-base">{docNumber}</div>
            </>
          )}
          {docDate && (
            <>
              <div className="font-bold text-slate-500 uppercase text-xs tracking-wider self-center">
                Date
              </div>
              <div className="text-slate-800 font-medium">{docDate}</div>
            </>
          )}
          {extra && (
            <div className="col-span-2 pt-2 mt-1 border-t border-slate-200 text-slate-700">
              {extra}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
