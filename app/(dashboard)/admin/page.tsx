'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'
import { Users, TrendingUp, Wallet, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { useRouter } from 'next/navigation'

interface AdminStats {
  totalCollection: number
  totalLoans: number
  pendingDues: number
  totalMembers: number
  monthlyCollection: { month: string; amount: number }[]
  loansByStatus: { status: string; count: number; amount: number }[]
  fineCollection: { month: string; amount: number }[]
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6']

export default function AdminPage() {
  const { dbUser, getToken } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (dbUser && !['LEADER', 'CO_LEADER'].includes(dbUser.role)) {
      router.push('/dashboard')
    }
  }, [dbUser, router])

  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      const res = await fetch('/api/admin/stats?full=true', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setStats(await res.json())
      setLoading(false)
    }
    load()
  }, [getToken])

  const summaryCards = [
    { label: 'Total Collection', value: stats?.totalCollection ?? 0, icon: TrendingUp, grad: 'from-emerald-500 to-teal-600', fmt: true },
    { label: 'Active Loans', value: stats?.totalLoans ?? 0, icon: Wallet, grad: 'from-purple-500 to-violet-600', fmt: true },
    { label: 'Pending Dues', value: stats?.pendingDues ?? 0, icon: AlertCircle, grad: 'from-amber-500 to-orange-600', fmt: true },
    { label: 'Total Members', value: stats?.totalMembers ?? 0, icon: Users, grad: 'from-blue-500 to-cyan-600', fmt: false },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => (
          <div key={i} className="glass-card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            {loading ? <div className="h-8 w-24 bg-white/10 rounded shimmer" /> :
              <p className="text-2xl font-bold text-white">{c.fmt ? formatCurrency(c.value) : c.value}</p>}
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Collection Chart */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-6">Monthly Collection</h3>
          {loading ? <div className="h-48 shimmer rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.monthlyCollection || []}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="amount" fill="url(#green)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Loan Status Pie */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-6">Outstanding Loans</h3>
          {loading ? <div className="h-48 shimmer rounded-xl" /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={stats?.loansByStatus || []} dataKey="amount" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {(stats?.loansByStatus || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {(stats?.loansByStatus || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div>
                      <p className="text-xs text-white font-medium">{item.status}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fine Collection Line */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="font-semibold text-white mb-6">Fine Collection Trend</h3>
          {loading ? <div className="h-40 shimmer rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={stats?.fineCollection || []}>
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Line type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
