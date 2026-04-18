import Image from 'next/image'

/**
 * Reusable document header for printed / exported documents.
 *
 * Layout:
 *   [ Company info + doc meta ]                           [ Heritage logo ]
 *
 * The logo sits top-right both on screen and on the printed PDF.
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
    <div className="flex items-start justify-between gap-4 sm:gap-8 mb-6 pb-4 border-b-2 border-[var(--heritage-700)]">
      {/* Left: Company + document meta */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-[var(--heritage-900)] leading-tight tracking-tight">
          Heritage Global Solutions Ltd
        </h2>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
        <h3 className="text-base sm:text-lg font-semibold text-[var(--heritage-600)] mt-3 uppercase tracking-wide">
          {title}
        </h3>
        <div className="mt-2 text-sm text-slate-700 space-y-0.5">
          {docNumber && (
            <p><span className="font-semibold text-slate-500 uppercase text-[11px] tracking-wider">No:</span>{' '}<span className="font-mono font-semibold">{docNumber}</span></p>
          )}
          {docDate && (
            <p><span className="font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Date:</span> {docDate}</p>
          )}
          {extra}
        </div>
      </div>

      {/* Right: Heritage logo */}
      <div className="flex-shrink-0 w-32 sm:w-44 md:w-52">
        <Image
          src="/logo.svg"
          alt="Heritage Global Solutions Ltd"
          width={420}
          height={200}
          className="w-full h-auto"
          priority
        />
      </div>
    </div>
  )
}
