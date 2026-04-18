import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), fmt)
  } catch {
    return dateStr
  }
}

export function formatCurrency(amount: number | null | undefined, currency = 'GBP'): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined) return '—'
  return n.toFixed(decimals)
}

/**
 * Status badge colour map — tuned to the Heritage palette.
 * Each entry uses tokens that print cleanly and stay legible in landscape PDFs.
 */
export const STATUS_COLOURS: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-700',
  sent:      'bg-[#E4EEF7] text-[#2F5F8F]',
  responded: 'bg-[#C7DCEC] text-[#1E3A5F]',
  accepted:  'bg-emerald-100 text-emerald-700',
  active:    'bg-[#9FC1DC]/40 text-[#1E3A5F]',
  partial:   'bg-amber-100 text-amber-800',
  complete:  'bg-emerald-100 text-emerald-800',
  closed:    'bg-slate-200 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
  issued:    'bg-[#E4EEF7] text-[#264D74]',
  paid:      'bg-emerald-100 text-emerald-800',
}

export function statusBadge(status: string) {
  return STATUS_COLOURS[status] ?? 'bg-slate-100 text-slate-600'
}

export function generateReference(prefix: string, date = new Date()): string {
  const yr = date.getFullYear().toString().slice(2)
  const ms = Date.now().toString().slice(-5)
  return `${prefix}${yr}-${ms}`
}
