'use client'

import { Bell, User } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between no-print">
      <div>
        <h1 className="text-xl font-bold text-[#1a2744]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
        <button className="w-9 h-9 rounded-full bg-[#1a2744] text-white flex items-center justify-center text-sm font-bold hover:bg-[#243561] transition-colors">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
