'use client'

import { Bell, User } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="no-print sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1 pl-12 md:pl-0">
          <h1 className="text-lg sm:text-xl font-bold text-[var(--heritage-900)] truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          <button
            className="hidden sm:inline-flex btn-icon text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--heritage-600)] to-[var(--heritage-900)] text-white flex items-center justify-center text-sm font-bold shadow-soft hover:brightness-110 transition"
            aria-label="Account"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
