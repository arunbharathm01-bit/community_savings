import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
}

export function getLastSunday(weeksAgo = 0): Date {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day - weeksAgo * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getNextSunday(): Date {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() + (7 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

export function calculateLoanInterest(amount: number, rate: number, unitAmount: number): number {
  const units = Math.ceil(amount / unitAmount)
  return units * rate
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'LEADER': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'CO_LEADER': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'MANAGER': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'LEADER': return 'Leader'
    case 'CO_LEADER': return 'Co-Leader'
    case 'MANAGER': return 'Manager'
    default: return 'Member'
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'PAID': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'LATE': return 'bg-red-500/20 text-red-400 border-red-500/30'
    default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
}

export function getLoanStatusColor(status: string): string {
  switch (status) {
    case 'APPROVED':
    case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }
}
