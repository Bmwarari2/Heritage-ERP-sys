/**
 * Reusable document header for printed documents.
 * Leaves top-right space for the Heritage Global Solutions logo.
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
    <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-[#1a2744]">
      {/* Left: Company info */}
      <div>
        <h2 className="text-xl font-bold text-[#1a2744] leading-tight">
          Heritage Global Solutions Ltd
        </h2>
        {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
        <h3 className="text-lg font-semibold text-[#c8a84b] mt-2">{title}</h3>
        {docNumber && (
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">No:</span> {docNumber}
          </p>
        )}
        {docDate && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Date:</span> {docDate}
          </p>
        )}
        {extra}
      </div>

      {/* Right: Logo placeholder — kept empty for logo placement */}
      <div className="w-48 h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center ml-8 flex-shrink-0">
        <span className="text-gray-300 text-xs text-center leading-tight">
          LOGO<br />PLACEHOLDER
        </span>
      </div>
    </div>
  )
}
