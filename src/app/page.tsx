'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, FileText, ShoppingCart, Receipt, FileCheck2, Package, ArrowRight, TrendingUp } from 'lucide-react'
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
  const [stats, setStats] = useState<Stats>({ rfqs: 0, proformas: 0, pos: 0, commercialInvoices: 0, taxInvoices: 0, packingLists: 0 })

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
    { label: 'Request for Quotation', icon: ClipboardList, href: '/rfq', count: stats.rfqs, colour: 'bg-blue-500', desc: 'Create or upload RFQs — AI-parsed' },
    { label: 'Proforma Invoices', icon: FileText, href: '/proforma', count: stats.proformas, colour: 'bg-violet-500', desc: 'Linked to parent RFQs' },
    { label: 'Purchase Orders', icon: ShoppingCart, href: '/purchase-orders', count: stats.pos, colour: 'bg-indigo-500', desc: 'Client & standalone POs — dispatch tracking' },
    { label: 'Commercial Invoices', icon: Receipt, href: '/commercial-invoices', count: stats.commercialInvoices, colour: 'bg-teal-500', desc: 'Generated from PO dispatches' },
    { label: 'Tax Invoices', icon: FileCheck2, href: '/tax-invoices', count: stats.taxInvoices, colour: 'bg-emerald-500', desc: 'VAT invoices from dispatches' },
    { label: 'Packing Lists', icon: Package, href: '/packing-lists', count: stats.packingLists, colour: 'bg-amber-500', desc: 'With box details per dispatch' },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header
        title="Dashboard"
        subtitle="Heritage Global Solutions — Trade ERP"
      />
      <div className="flex-1 overflow-y-auto p-8">
        {/* Welcome banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#1a2744] to-[#243561] p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome to Heritage ERP</h2>
            <p className="text-white/60 text-sm">
              Manage RFQs, Proforma Invoices, Purchase Orders and all dispatch documents in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-2">
              <Link href="/rfq/new?mode=upload" className="btn btn-gold btn-sm">Upload RFQ</Link>
              <Link href="/purchase-orders/new?mode=upload" className="btn bg-white text-[#1a2744] btn-sm hover:bg-gray-100">Upload PO</Link>
            </div>
            <TrendingUp className="w-16 h-16 text-white/10" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {modules.map(m => {
            const Icon = m.icon
            return (
              <Link key={m.href} href={m.href}
                className="card card-body flex flex-col items-center text-center gap-2 hover:border-[#c8a84b] hover:shadow-md transition-all group">
                <div className={`w-10 h-10 rounded-xl ${m.colour} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-[#1a2744]">{m.count}</p>
                <p className="text-xs text-gray-500 leading-tight">{m.label}</p>
              </Link>
            )
          })}
        </div>

        {/* Module cards */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Quick Access</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(m => {
            const Icon = m.icon
            return (
              <Link key={m.href} href={m.href}
                className="card card-body flex items-center gap-4 hover:border-[#c8a84b] hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-xl ${m.colour} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1a2744]">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#c8a84b] transition-colors flex-shrink-0" />
              </Link>
            )
          })}
        </div>

        {/* Workflow guide */}
        <div className="mt-8 card card-body">
          <h3 className="font-semibold text-[#1a2744] mb-4">Document Workflow</h3>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {[
              { label: 'Upload / Create RFQ', colour: 'bg-blue-100 text-blue-700' },
              { label: '→', colour: 'text-gray-400' },
              { label: 'Create Proforma Invoice', colour: 'bg-violet-100 text-violet-700' },
              { label: '→', colour: 'text-gray-400' },
              { label: 'Upload / Create PO', colour: 'bg-indigo-100 text-indigo-700' },
              { label: '→', colour: 'text-gray-400' },
              { label: 'Mark Items Ready', colour: 'bg-amber-100 text-amber-700' },
              { label: '→', colour: 'text-gray-400' },
              { label: 'Dispatch: CI + TI + PL', colour: 'bg-emerald-100 text-emerald-700' },
            ].map((step, i) => (
              <span key={i} className={`px-3 py-1 rounded-full font-medium ${step.colour}`}>
                {step.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
