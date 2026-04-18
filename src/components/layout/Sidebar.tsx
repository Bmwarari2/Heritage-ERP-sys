'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText, ShoppingCart, Receipt, Package,
  LayoutDashboard, ChevronRight, ClipboardList,
  PackageCheck, FileCheck2, Building2, LogOut, Users, Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: Users,
    description: 'Client directory',
  },
  {
    label: 'RFQ',
    href: '/rfq',
    icon: ClipboardList,
    description: 'Request for Quotation',
  },
  {
    label: 'Proforma Invoices',
    href: '/proforma',
    icon: FileText,
  },
  {
    label: 'Purchase Orders',
    href: '/purchase-orders',
    icon: ShoppingCart,
  },
  {
    label: 'Commercial Invoices',
    href: '/commercial-invoices',
    icon: Receipt,
  },
  {
    label: 'Tax Invoices',
    href: '/tax-invoices',
    icon: FileCheck2,
  },
  {
    label: 'Packing Lists',
    href: '/packing-lists',
    icon: Package,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); setSearchQuery('') }
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-[#1a2744] flex flex-col min-h-screen">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#c8a84b] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Heritage Global</p>
            <p className="text-white/50 text-xs">Solutions Ltd</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-white/10">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 bg-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
        </form>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-white/30 text-xs uppercase tracking-widest font-semibold">
          Documents
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-[#c8a84b] text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-70" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/10 space-y-2">
        {email && (
          <p className="px-3 text-white/50 text-xs truncate" title={email}>{email}</p>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
        <p className="text-white/30 text-xs text-center pt-1">ERP System v2.0</p>
      </div>
    </aside>
  )
}
