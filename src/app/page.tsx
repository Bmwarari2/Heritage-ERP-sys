'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ClipboardList, FileText, ShoppingCart, Receipt,
  FileCheck2, Package, ArrowRight, Upload, Briefcase,
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
    { label: 'Proforma Invoices',     short: 'Proformas',  icon: FileText,      href: '/proforma',            count: stats.proformas,          desc: 'Linked quotes based on RFQs' },
    { label: 'Purchase Orders',       short: 'POs',        icon: ShoppingCart,  href: '/purchase-orders',     count: stats.pos,                desc: 'Client & standalone — dispatch tracking' },
    { label: 'Commercial Invoices',   short: 'Commercial', icon: Receipt,       href: '/commercial-invoices', count: stats.commercialInvoices, desc: 'Auto-generated from PO dispatch' },
    { label: 'Tax Invoices',          short: 'Tax',        icon: FileCheck2,    href: '/tax-invoices',        count: stats.taxInvoices,        desc: 'VAT invoices from dispatches' },
    { label: 'Packing Lists',         short: 'Packing',    icon: Package,       href: '/packing-lists',       count: stats.packingLists,       desc: 'Box and weight details per dispatch' },
  ]

  const workflow = [
    { label: '1. RFQ',           tone: 'bg-white text-slate-600 border border-slate-200' },
    { label: '2. Proforma',      tone: 'bg-white text-slate-600 border border-slate-200' },
    { label: '3. PO',            tone: 'bg-white text-slate-600 border border-slate-200' },
    { label: '4. Dispatch',      tone: 'bg-heritage-100 text-heritage-800 border border-heritage-200' },
    { label: '5. Documentation', tone: 'bg-heritage-600 text-white shadow-md' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50/50">
      <Header title="Dashboard" subtitle="Heritage Global Solutions — Trade ERP" />

      <div className="flex-1 overflow-y-auto scroll-subtle">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-fade-in space-y-8">

          {/* Modernized welcome banner */}
          <div className="relative overflow-hidden rounded-2xl bg-heritage-900 text-white shadow-lg p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 opacity-10 pointer-events-none">
              <Briefcase className="w-96 h-96" />
            </div>

            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Welcome Back</h2>
              <p className="text-heritage-100 text-sm sm:text-base leading-relaxed">
                Streamline your trade operations. Manage RFQs, generate Proformas, and oversee PO dispatches seamlessly from one unified platform.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full sm:w-auto">
              <Link href="/rfq/new?mode=upload"
                    className="btn bg-heritage-500 hover:bg-heritage-400 text-white border-transparent w-full sm:w-auto shadow-md">
                <Upload className="w-4 h-4" /> Upload RFQ
              </Link>
              <Link href="/purchase-orders/new?mode=upload"
                    className="btn bg-white text-heritage-900 hover:bg-slate-100 border-transparent w-full sm:w-auto shadow-md">
                <Upload className="w-4 h-4" /> Upload PO
              </Link>
            </div>
          </div>

          {/* Module grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Core Modules</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {modules.map(m => {
                const Icon = m.icon
                return (
                  <Link key={m.href} href={m.href}
                        className="group flex flex-col p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-heritage-300 transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-heritage-50 group-hover:border-heritage-200 transition-colors">
                        <Icon className="w-6 h-6 text-slate-500 group-hover:text-heritage-600 transition-colors" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full group-hover:bg-heritage-50 group-hover:text-heritage-700 transition-colors">
                        {m.count} Records
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-heritage-700 transition-colors truncate">{m.label}</h4>
                        <p className="text-sm text-slate-500 mt-1">{m.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 mt-1.5 text-slate-300 group-hover:text-heritage-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Workflow visualizer */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">System Workflow</h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex items-center gap-2 sm:gap-4 flex-wrap">
              {workflow.map((step, i) => (
                <div key={i} className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <div className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide ${step.tone}`}>
                    {step.label}
                  </div>
                  {i < workflow.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-slate-300" />
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
