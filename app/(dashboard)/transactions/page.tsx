'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react'

interface Transaction { id: string; type: string; amount: number; description: string; date: string; balance: number }

const TYPE_LABELS: Record<string, string> = {
  WEEKLY_DEPOSIT: 'Weekly Deposit', FINE: 'Fine', LOAN_DISBURSED: 'Loan Disbursed',
  LOAN_REPAYMENT: 'Loan Repayment', INTEREST: 'Interest', ADJUSTMENT: 'Adjustment',
}
const TYPE_COLORS: Record<string, string> = {
  WEEKLY_DEPOSIT: 'bg-emerald-500/15 text-emerald-400', FINE: 'bg-red-500/15 text-red-400',
  LOAN_DISBURSED: 'bg-purple-500/15 text-purple-400', LOAN_REPAYMENT: 'bg-blue-500/15 text-blue-400',
  INTEREST: 'bg-orange-500/15 text-orange-400', ADJUSTMENT: 'bg-slate-500/15 text-slate-400',
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function TransactionsPage() {
  const { getToken } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const fetchTxns = async () => {
    setLoading(true)
    const token = await getToken()
    const p = new URLSearchParams()
    if (filterType) p.set('type', filterType)
    if (filterMonth) p.set('month', filterMonth)
    if (filterYear) p.set('year', filterYear)
    const res = await fetch(`/api/transactions?${p}`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setTransactions((await res.json()).transactions || [])
    setLoading(false)
  }

  useEffect(() => { fetchTxns() }, [filterType, filterMonth, filterYear])

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {[
            { value: filterType, set: setFilterType, opts: [['', 'All Types'], ...Object.entries(TYPE_LABELS)] },
            { value: filterMonth, set: setFilterMonth, opts: [['', 'All Months'], ...MONTHS.map((m, i) => [String(i + 1), m])] },
            { value: filterYear, set: setFilterYear, opts: [['', 'All Years'], ...years.map((y) => [String(y), String(y)])] },
          ].map((f, i) => (
            <select key={i} value={f.value} onChange={(e) => f.set(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {f.opts.map(([v, l]) => <option key={v} value={v} className="bg-slate-800">{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm text-slate-400">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 shimmer" />
                <div className="flex-1 space-y-2"><div className="h-3 w-40 bg-white/5 rounded shimmer" /><div className="h-2 w-24 bg-white/5 rounded shimmer" /></div>
                <div className="h-5 w-20 bg-white/5 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center"><p className="text-slate-500">No transactions found</p></div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((txn) => {
              const credit = txn.amount > 0
              return (
                <div key={txn.id} className="flex items-center gap-4 p-4 hover:bg-white/2 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${credit ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                    {credit ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{txn.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[txn.type] || 'bg-slate-500/15 text-slate-400'}`}>{TYPE_LABELS[txn.type] || txn.type}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(txn.date)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${credit ? 'text-emerald-400' : 'text-red-400'}`}>{credit ? '+' : ''}{formatCurrency(txn.amount)}</p>
                    <p className="text-xs text-muted-foreground">Bal: {formatCurrency(txn.balance)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
