'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Loader2, ShoppingCart, Receipt, FileCheck2,
  Package, FileText, Users, Tag, UserCircle, ChevronRight,
} from 'lucide-react'
import PageWrapper from '@/components/shared/PageWrapper'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResults {
  purchase_orders?: { id: string; po_number: string; ship_to_company: string | null; bill_to_company: string | null; status: string; po_date: string | null }[]
  commercial_invoices?: { id: string; invoice_number: string; consignee_name: string | null; purchase_order_number: string | null; status: string; invoice_date: string }[]
  tax_invoices?: { id: string; tax_invoice_number: string; customer_name: string | null; purchase_order_number: string | null; status: string; invoice_date: string }[]
  packing_lists?: { id: string; customer_po_number: string | null; our_order_number: string | null; final_destination: string | null; status: string }[]
  proforma_invoices?: { id: string; proforma_number: string; client_company: string | null; status: string; invoice_date: string }[]
  clients?: { id: string; name: string; email: string | null; contact_person: string | null; country: string | null }[]
  items?: { id: string; po_id: string; item_number: string; description_short: string | null; material_code: string | null; oem: string | null; part_number: string | null; purchase_orders: { po_number: string; ship_to_company: string | null } | null }[]
  users?: { id: string; full_name: string | null; email: string | null; role: string }[]
}

// ─── Result section component ─────────────────────────────────────────────────

function Section({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <h3 className="font-semibold text-[#1a2744]">{title}</h3>
        </div>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function ResultRow({ href, primary, secondary, badge }: {
  href: string; primary: string; secondary?: string | null; badge?: string | null
}) {
  return (
    <Link href={href}
      className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors group">
      <div className="min-w-0">
        <p className="font-medium text-sm text-[#1a2744] truncate">{primary}</p>
        {secondary && <p className="text-xs text-gray-500 truncate mt-0.5">{secondary}</p>}
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {badge && <StatusBadge status={badge} />}
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </Link>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') ?? ''

  const [inputValue, setInputValue] = useState(query)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setInputValue(query)
    if (!query || query.length < 2) { setResults(null); return }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [query])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = inputValue.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const totalResults = results
    ? Object.values(results).reduce((n, arr) => n + (arr?.length ?? 0), 0)
    : 0

  return (
    <PageWrapper title="Search">
      <div className="space-y-6 w-full">
        {/* Search bar */}
        <div className="card card-body">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Search purchase orders, invoices, items, clients…"
                className="w-full pl-10 pr-4 py-2.5 form-input text-base"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Searches across purchase orders, invoices, packing lists, items, clients, and users.
              Minimum 2 characters.
            </p>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        )}

        {/* No results */}
        {!loading && results && totalResults === 0 && (
          <div className="card card-body text-center py-12 text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-sm mt-1">Try a different search term.</p>
          </div>
        )}

        {/* Results */}
        {!loading && results && totalResults > 0 && (
          <>
            <p className="text-sm text-gray-500">
              {totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </p>

            {/* Purchase Orders */}
            {(results.purchase_orders?.length ?? 0) > 0 && (
              <Section icon={ShoppingCart} title="Purchase Orders" color="text-[#1a2744]">
                {results.purchase_orders!.map(po => (
                  <ResultRow key={po.id} href={`/purchase-orders/${po.id}`}
                    primary={po.po_number}
                    secondary={[po.ship_to_company, po.bill_to_company, formatDate(po.po_date)].filter(Boolean).join(' · ')}
                    badge={po.status} />
                ))}
              </Section>
            )}

            {/* Proforma Invoices */}
            {(results.proforma_invoices?.length ?? 0) > 0 && (
              <Section icon={FileText} title="Proforma Invoices" color="text-purple-500">
                {results.proforma_invoices!.map(pi => (
                  <ResultRow key={pi.id} href={`/proforma/${pi.id}`}
                    primary={pi.proforma_number}
                    secondary={[pi.client_company, formatDate(pi.invoice_date)].filter(Boolean).join(' · ')}
                    badge={pi.status} />
                ))}
              </Section>
            )}

            {/* Commercial Invoices */}
            {(results.commercial_invoices?.length ?? 0) > 0 && (
              <Section icon={Receipt} title="Commercial Invoices" color="text-blue-500">
                {results.commercial_invoices!.map(ci => (
                  <ResultRow key={ci.id} href={`/commercial-invoices/${ci.id}`}
                    primary={ci.invoice_number}
                    secondary={[ci.consignee_name, ci.purchase_order_number ? `PO: ${ci.purchase_order_number}` : null, formatDate(ci.invoice_date)].filter(Boolean).join(' · ')}
                    badge={ci.status} />
                ))}
              </Section>
            )}

            {/* Tax Invoices */}
            {(results.tax_invoices?.length ?? 0) > 0 && (
              <Section icon={FileCheck2} title="Tax Invoices" color="text-green-600">
                {results.tax_invoices!.map(ti => (
                  <ResultRow key={ti.id} href={`/tax-invoices/${ti.id}`}
                    primary={ti.tax_invoice_number}
                    secondary={[ti.customer_name, ti.purchase_order_number ? `PO: ${ti.purchase_order_number}` : null, formatDate(ti.invoice_date)].filter(Boolean).join(' · ')}
                    badge={ti.status} />
                ))}
              </Section>
            )}

            {/* Packing Lists */}
            {(results.packing_lists?.length ?? 0) > 0 && (
              <Section icon={Package} title="Packing Lists" color="text-[#c8a84b]">
                {results.packing_lists!.map(pl => (
                  <ResultRow key={pl.id} href={`/packing-lists/${pl.id}`}
                    primary={pl.customer_po_number ?? pl.our_order_number ?? pl.id.slice(0, 8)}
                    secondary={[pl.our_order_number ? `Order: ${pl.our_order_number}` : null, pl.final_destination].filter(Boolean).join(' · ')}
                    badge={pl.status} />
                ))}
              </Section>
            )}

            {/* Clients */}
            {(results.clients?.length ?? 0) > 0 && (
              <Section icon={Users} title="Clients" color="text-indigo-500">
                {results.clients!.map(c => (
                  <ResultRow key={c.id} href={`/clients/${c.id}`}
                    primary={c.name}
                    secondary={[c.contact_person, c.email, c.country].filter(Boolean).join(' · ')} />
                ))}
              </Section>
            )}

            {/* PO Items */}
            {(results.items?.length ?? 0) > 0 && (
              <Section icon={Tag} title="Line Items" color="text-orange-500">
                {results.items!.map(item => {
                  const po = item.purchase_orders
                  return (
                    <ResultRow key={item.id} href={`/purchase-orders/${item.po_id}`}
                      primary={[item.description_short, item.material_code].filter(Boolean).join(' — ')}
                      secondary={[
                        item.oem ? `OEM: ${item.oem}` : null,
                        item.part_number ? `Part: ${item.part_number}` : null,
                        po ? `PO: ${po.po_number}` : null,
                        po?.ship_to_company ?? null,
                      ].filter(Boolean).join(' · ')} />
                  )
                })}
              </Section>
            )}

            {/* Users */}
            {(results.users?.length ?? 0) > 0 && (
              <Section icon={UserCircle} title="Users" color="text-gray-500">
                {results.users!.map(u => (
                  <ResultRow key={u.id} href="/clients"
                    primary={u.full_name ?? u.email ?? 'Unknown'}
                    secondary={[u.email, u.role].filter(Boolean).join(' · ')} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-300" /></div>}><SearchContent /></Suspense>
}
