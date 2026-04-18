'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText, ShoppingCart, Receipt, Package,
  LayoutDashboard, ClipboardList, FileCheck2,
  LogOut, Users, Search, X, Menu, Settings, UserCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const navItems = [
  { label: 'Dashboard',          href: '/',                    icon: LayoutDashboard, group: 'Overview' },
  { label: 'Clients',            href: '/clients',             icon: Users,           group: 'Overview' },
  { label: 'RFQ',                href: '/rfq',                 icon: ClipboardList,   group: 'Documents' },
  { label: 'Proforma Invoices',  href: '/proforma',            icon: FileText,        group: 'Documents' },
  { label: 'Purchase Orders',    href: '/purchase-orders',     icon: ShoppingCart,    group: 'Documents' },
  { label: 'Commercial Invoices',href: '/commercial-invoices', icon: Receipt,         group: 'Dispatch' },
  { label: 'Tax Invoices',       href: '/tax-invoices',        icon: FileCheck2,      group: 'Dispatch' },
  { label: 'Packing Lists',      href: '/packing-lists',       icon: Package,         group: 'Dispatch' },
  { label: 'Company Settings',   href: '/settings/company',   icon: Settings,        group: 'Admin' },
  { label: 'My Account',         href: '/account',             icon: UserCircle,      group: 'Admin' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); setSearchQuery(''); setMobileOpen(false) }
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    fetch('/api/auth/profile').then(r => r.json()).then(p => setDisplayName(p?.full_name ?? null)).catch(() => {})
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Group nav items
  const groups = Array.from(new Set(navItems.map(n => n.group)))

  const sidebarContent = (
    <aside className="h-full w-64 flex-shrink-0 flex flex-col bg-gradient-to-b from-[var(--heritage-900)] via-[#203c60] to-[var(--heritage-900)] text-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-white/95 shadow-inner flex items-center justify-center p-1.5">
            <Image src="/logo-mark.svg" alt="Heritage" width={36} height={38} priority />
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-sm tracking-wide">HERITAGE</p>
            <p className="text-white/60 text-[11px] italic font-light">Global Solutions Ltd</p>
          </div>
          <button
            className="ml-auto md:hidden text-white/70 hover:text-white p-1"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <form onSubmit={handleSearch} role="search">
          <label htmlFor="sidebar-search" className="sr-only">Search documents</label>
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            <input
              id="sidebar-search"
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents…"
              aria-label="Search documents"
              className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/45 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition"
            />
          </div>
        </form>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto scroll-subtle">
        {groups.map(group => (
          <div key={group} className="mb-4">
            <p className="px-3 mt-2 mb-2 text-white/40 text-[10px] uppercase tracking-[0.14em] font-bold">
              {group}
            </p>
            <div className="space-y-1">
              {navItems.filter(n => n.group === group).map(item => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                      active
                        ? 'bg-white/10 text-white shadow-inner'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--heritage-300)]" />}
                    <Icon className={cn('w-4 h-4 flex-shrink-0', active && 'text-[var(--heritage-200)]')} />
                    <span className="flex-1 truncate">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        {email && (
          <Link href="/account" className="flex items-center gap-2 px-1 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/80 text-xs font-bold">
              {(displayName || email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              {displayName && <p className="text-white/90 text-xs font-medium truncate">{displayName}</p>}
              <p className="text-white/50 text-[10px] truncate" title={email}>{email}</p>
            </div>
          </Link>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
        <p className="text-white/30 text-[10px] text-center tracking-wider pt-1">ERP v2.1</p>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile hamburger — visible only under md breakpoint */}
      <button
        onClick={() => setMobileOpen(true)}
        className="no-print md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-white shadow-card border border-slate-200 text-slate-700"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <div className="no-print hidden md:block sticky top-0 h-screen">
        {sidebarContent}
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="no-print md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative animate-slide-up">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
