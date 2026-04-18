'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList, FileText, ShoppingCart, Receipt,
  FileCheck2, Package, ArrowRight, Upload,
} from 'lucide-react'
import Header from '@/components/layout/Header'

interface Stats {
  rfqs: number
  proformas: number
  pos: number
  commercialInvoices: number
  taxInvoices: number
  packingLists: number
}

/**
 * Fetch a count for a table via the cheap HEAD-only path on /api/<x>?count=1.
 * Falls back to the list endpoint if the server doesn't short-circuit counts.
 * Using Array.isArray(data) ? data.length : data.count keeps this robust.
 */
async function fetchCount(url: string): Promise<number> {
  try {
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) return 0
    const data = await r.json()
    if (Array.isArray(data)) return data.length
    if (typeof data?.count === 'number') return data.count
    return 0
  } catch {
    return 0
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    rfqs: 0, proformas: 0, pos: 0, commercialInvoices: 0, taxInvoices: 0, packingLists: 0,
  })

  useEffect(() => {
    Promise.all([
      fetchCount('/api/rfq?limit=200'),
      fetchCount('/api/proforma?limit=200'),
      fetchCount('/api/purchase-orders?limit=200'),
      fetchCount('/api/commercial-invoices?limit=200'),
      fetchCount('/api/tax-invoices?limit=200'),
      fetchCount('/api/packing-lists?limit=200'),
    ]).then(([rfqs, proformas, pos, cis, tis, pls]) => {
      setStats({ rfqs, proformas, pos, commercialInvoices: cis, taxInvoices: tis, packingLists: pls })
    })
  }, [])

  const modules = [
    { label: 'Request for Quotation', short: 'RFQs',       icon: ClipboardList, href: '/rfq',                 count: stats.rfqs,               desc: 'Create or upload RFQs — AI-parsed' },
    { label: 'Proforma Invoices',     short: 'Proformas',  icon: FileText,      href: '/proforma',            count: stats.proformas,          desc: 'Linked to parent RFQs' },
    { label: 'Purchase Orders',       short: 'POs',        icon: ShoppingCart,  href: '/purchase-orders',     count: stats.pos,                desc: 'Client & standalone — dispatch tracking' },
    { label: 'Commercial Invoices',   short: 'Commercial', icon: Receipt,       href: '/commercial-invoices', count: stats.commercialInvoices, desc: 'Generated from PO dispatches' },
    { label: 'Tax Invoices',          short: 'Tax',        icon: FileCheck2,    href: '/tax-invoices',        count: stats.taxInvoices,        desc: 'VAT invoices from dispatches' },
    { label: 'Packing Lists',         short: 'Packing',    icon: Package,       href: '/packing-lists',       count: stats.packingLists,       desc: 'With box details per dispatch' },
  ]

  const workflow = [
    { label: 'Upload / Create RFQ',    tone: 'bg-heritage-100 text-heritage-800' },
    { label: 'Create Proforma',        tone: 'bg-heritage-200 text-heritage-900' },
    { label: 'Upload / Create PO',     tone: 'bg-heritage-300 text-heritage-900' },
    { label: 'Mark Items Ready',       tone: 'bg-slate-200 text-slate-800' },
    { label: 'Dispatch: CI + TI + PL', tone: 'bg-heritage-600 text-white' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Dashboard" subtitle="Heritage Global Solutions — Trade ERP" />

      <div className="flex-1 overflow-y-auto scroll-subtle">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-fade-in">

          {/* Compact welcome banner */}
          <div className="mb-6 rounded-xl bg-gradient-to-r from-[var(--heritage-800)] to-[var(--heritage-600)] px-5 py-4 text-white shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Welcome back</h2>
              <p className="text-white/70 text-sm">
                Manage RFQs, Proformas, POs and dispatch documents from one place.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/rfq/new?mode=upload"
                    className="btn btn-primary btn-sm gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload RFQ
              </Link>
              <Link href="/purchase-orders/new?mode=upload"
                    className="btn btn-sm bg-white/95 text-[var(--heritage-900)] hover:bg-white shadow-soft gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload PO
              </Link>
            </div>
          </div>

          {/* Unified module grid — count + label + description in one tile. */}
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-3">Modules</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
            {modules.map(m => {
              const Icon = m.icon
              return (
                <Link key={m.href} href={m.href}
                      className="card card-body flex items-center gap-4 hover:border-[var(--heritage-400)] group">
                  <div className="w-12 h-12 rounded-xl bg-[var(--heritage-50)] border border-[var(--heritage-200)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--heritage-600)] group-hover:border-[var(--heritage-600)] transition-colors">
                    <Icon className="w-6 h-6 text-[var(--heritage-700)] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="font-semibold text-[var(--heritage-900)] truncate">{m.label}</p>
                      <span className="text-xs font-bold text-[var(--heritage-700)]">({m.count})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{m.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[var(--heritage-600)] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              )
            })}
          </div>

          {/* Workflow guide */}
          <div className="card card-body">
            <h3 className="font-bold text-[var(--heritage-900)] mb-4 text-sm uppercase tracking-wider">Document Workflow</h3>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-sm">
              {workflow.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`px-3 py-1.5 rounded-full font-semibold text-xs ${step.tone}`}>
                    {step.label}
                  </span>
                  {i < workflow.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
