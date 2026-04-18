'use client'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

/**
 * Page-level header strip. Account controls live in the sidebar; we used to
 * render a non-functional bell + avatar button here — those were removed to
 * avoid misleading affordances. (Re-add once notifications & account menus
 * are wired up.)
 */
export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="no-print sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1 pl-12 md:pl-0">
          <h1 className="text-lg sm:text-xl font-bold text-[var(--heritage-900)] truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
