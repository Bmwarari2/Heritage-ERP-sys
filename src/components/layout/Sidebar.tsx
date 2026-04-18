'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText, ShoppingCart, Receipt, Package,
  LayoutDashboard, ChevronRight, ClipboardList,
  PackageCheck, FileCheck2, Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
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
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs text-center">ERP System v2.0</p>
      </div>
    </aside>
  )
}
