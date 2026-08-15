'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDateShort, getNextSunday } from '@/lib/utils'
import { Wallet, Clock, AlertCircle, CreditCard, TrendingDown, CalendarDays, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Link from 'next/link'

interface Stats { balance: number; pendingDue: number; fine: number; loanBalance: number; interest: number }
interface Transaction { id: string; type: string; amount: number; description: string; date: string; balance: number }
interface Announcement { id: string; title: string; content: string; createdAt: string }

export default function DashboardPage() {
  const { dbUser, getToken } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      const h = { Authorization: `Bearer ${token}` }
      const [s, t, a] = await Promise.all([
        fetch('/api/admin/stats', { headers: h }),
        fetch('/api/transactions?limit=5', { headers: h }),
        fetch('/api/announcements?limit=2', { headers: h }),
      ])
      if (s.ok) setStats(await s.json())
      if (t.ok) setRecentTxns((await t.json()).transactions || [])
      if (a.ok) setAnnouncements((await a.json()).announcements || [])
      setLoading(false)
    }
    load()
  }, [getToken])

  const nextSunday = getNextSunday()
  const daysUntil = Math.ceil((nextSunday.getTime() - Date.now()) / 86400000)

  const cards = [
    { label: 'Community Balance', value: stats?.balance ?? 0, icon: Wallet, grad: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20' },
    { label: 'Pending Due', value: stats?.pendingDue ?? 0, icon: Clock, grad: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/20' },
    { label: 'Fine Amount', value: stats?.fine ?? 0, icon: AlertCircle, grad: 'from-red-500 to-rose-600', glow: 'shadow-red-500/20' },
    { label: 'Loan Balance', value: stats?.loanBalance ?? 0, icon: CreditCard, grad: 'from-purple-500 to-violet-600', glow: 'shadow-purple-500/20' },
    { label: 'Loan Interest', value: stats?.interest ?? 0, icon: TrendingDown, grad: 'from-blue-500 to-cyan-600', glow: 'shadow-blue-500/20' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="glass-card p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome, {dbUser?.name?.split(' ')[0]} 👋</h2>
            <p className="text-slate-400 mt-1">Here&apos;s your community overview.</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 mb-1">Next collection</div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CalendarDays className="w-4 h-4" />
              {daysUntil === 0 ? 'Today!' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <div key={i} className={`glass-card p-5 shadow-lg ${c.glow}`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-3 shadow-lg`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            {loading ? (
              <div className="h-7 w-20 bg-white/10 rounded-lg shimmer" />
            ) : (
              <p className="text-2xl font-bold text-white">{formatCurrency(c.value)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Recent Transactions</h3>
            <Link href="/transactions" className="text-xs text-emerald-400 hover:text-emerald-300 transition">View all</Link>
          </div>
          <div className="space-y-2">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-3 w-32 bg-white/5 rounded shimmer" /><div className="h-2 w-20 bg-white/5 rounded shimmer" /></div>
                <div className="h-4 w-16 bg-white/5 rounded shimmer" />
              </div>
            )) : recentTxns.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No transactions yet</p>
            ) : recentTxns.map((txn) => {
              const credit = txn.amount > 0
              return (
                <div key={txn.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${credit ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                    {credit ? <ArrowUpRight className="w-5 h-5 text-emerald-400" /> : <ArrowDownRight className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateShort(txn.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${credit ? 'text-emerald-400' : 'text-red-400'}`}>{credit ? '+' : ''}{formatCurrency(txn.amount)}</p>
                    <p className="text-xs text-muted-foreground">Bal: {formatCurrency(txn.balance)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Announcements */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-white">Announcements</h3>
            <Link href="/announcements" className="text-xs text-emerald-400 hover:text-emerald-300 transition">See all</Link>
          </div>
          <div className="space-y-4">
            {loading ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2"><div className="h-4 w-3/4 bg-white/5 rounded shimmer" /><div className="h-3 w-full bg-white/5 rounded shimmer" /></div>
            )) : announcements.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-sm">No announcements</p>
            ) : announcements.map((a) => (
              <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-sm font-semibold text-white mb-1">{a.title}</p>
                <p className="text-xs text-slate-400 line-clamp-3">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatDateShort(a.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
