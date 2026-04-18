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

export const STATUS_COLOURS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  responded: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  active: 'bg-indigo-100 text-indigo-700',
  partial: 'bg-amber-100 text-amber-700',
  complete: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-gray-200 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  issued: 'bg-teal-100 text-teal-700',
  paid: 'bg-green-100 text-green-800',
}

export function statusBadge(status: string) {
  return STATUS_COLOURS[status] ?? 'bg-gray-100 text-gray-600'
}

export function generateReference(prefix: string, date = new Date()): string {
  const yr = date.getFullYear().toString().slice(2)
  const ms = Date.now().toString().slice(-5)
  return `${prefix}${yr}-${ms}`
}
