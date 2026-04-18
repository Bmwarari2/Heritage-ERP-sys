'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    rfqs: 0, proformas: 0, pos: 0, commercialInvoices: 0, taxInvoices: 0, packingLists: 0,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/rfq').then(r => r.json()),
      fetch('/api/proforma').then(r => r.json()),
      fetch('/api/purchase-orders').then(r => r.json()),
      fetch('/api/commercial-invoices').then(r => r.json()),
      fetch('/api/tax-invoices').then(r => r.json()),
      fetch('/api/packing-lists').then(r => r.json()),
    ]).then(([rfqs, proformas, pos, cis, tis, pls]) => {
      setStats({
        rfqs: Array.isArray(rfqs) ? rfqs.length : 0,
        proformas: Array.isArray(proformas) ? proformas.length : 0,
        pos: Array.isArray(pos) ? pos.length : 0,
        commercialInvoices: Array.isArray(cis) ? cis.length : 0,
        taxInvoices: Array.isArray(tis) ? tis.length : 0,
        packingLists: Array.isArray(pls) ? pls.length : 0,
      })
    }).catch(() => {})
  }, [])

  const modules = [
    { label: 'Request for Quotation', short: 'RFQs',          icon: ClipboardList, href: '/rfq',                 count: stats.rfqs,              desc: 'Create or upload RFQs — AI-parsed' },
    { label: 'Proforma Invoices',     short: 'Proformas',      icon: FileText,      href: '/proforma',            count: stats.proformas,         desc: 'Linked to parent RFQs' },
    { label: 'Purchase Orders',       short: 'POs',            icon: ShoppingCart,  href: '/purchase-orders',     count: stats.pos,               desc: 'Client & standalone — dispatch tracking' },
    { label: 'Commercial Invoices',   short: 'Commercial',     icon: Receipt,       href: '/commercial-invoices', count: stats.commercialInvoices,desc: 'Generated from PO dispatches' },
    { label: 'Tax Invoices',          short: 'Tax',            icon: FileCheck2,    href: '/tax-invoices',        count: stats.taxInvoices,       desc: 'VAT invoices from dispatches' },
    { label: 'Packing Lists',         short: 'Packing',        icon: Package,       href: '/packing-lists',       count: stats.packingLists,      desc: 'With box details per dispatch' },
  ]

  const workflow = [
    { label: 'Upload / Create RFQ',    tone: 'bg-heritage-100 text-heritage-800' },
    { label: 'Create Proforma',        tone: 'bg-heritage-200 text-heritage-900' },
    { label: 'Upload / Create PO',     tone: 'bg-heritage-300 text-heritage-900' },
    { label: 'Mark Items Ready',       tone: 'bg-slate2-200 text-slate2-800' },
    { label: 'Dispatch: CI + TI + PL', tone: 'bg-heritage-600 text-white' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Dashboard" subtitle="Heritage Global Solutions — Trade ERP" />

      <div className="flex-1 overflow-y-auto scroll-subtle">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full animate-fade-in">

          {/* Welcome banner */}
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--heritage-800)] via-[var(--heritage-700)] to-[var(--heritage-900)] p-6 sm:p-8 text-white shadow-lifted">
            <div className="absolute -right-8 -top-8 w-56 h-56 opacity-[0.12] pointer-events-none">
              <Image src="/logo-mark.svg" alt="" width={224} height={224} aria-hidden />
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 font-bold mb-2">Dashboard</p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back.</h2>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                  Manage RFQs, Proforma Invoices, Purchase Orders and all dispatch documents from one place.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href="/rfq/new?mode=upload"
                      className="btn btn-gold btn-sm gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload RFQ
                </Link>
                <Link href="/purchase-orders/new?mode=upload"
                      className="btn btn-sm bg-white/95 text-[var(--heritage-900)] hover:bg-white shadow-soft gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload PO
                </Link>
              </div>
            </div>
          </div>

          {/* Stats grid — scales from 2 cols (mobile) → 6 cols (xl) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
            {modules.map(m => {
              const Icon = m.icon
              return (
                <Link key={m.href} href={m.href}
                      className="card card-body flex flex-col items-center text-center gap-2 p-4 hover:border-[var(--heritage-400)] group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--heritage-500)] to-[var(--heritage-800)] flex items-center justify-center shadow-soft">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-[var(--heritage-900)] leading-none">{m.count}</p>
                  <p className="text-[11px] text-slate-500 leading-tight uppercase tracking-wider font-semibold">{m.short}</p>
                </Link>
              )
            })}
          </div>

          {/* Quick access */}
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-3">Quick Access</h2>
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
                    <p className="font-semibold text-[var(--heritage-900)] truncate">{m.label}</p>
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
