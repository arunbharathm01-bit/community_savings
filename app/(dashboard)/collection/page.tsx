'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, getInitials, getPaymentStatusColor } from '@/lib/utils'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Entry { id: string; userId: string; user: { name: string; email: string }; weekStart: string; amount: number; status: string; fine: number; paidAt: string | null }

export default function CollectionPage() {
  const { dbUser, getToken } = useAuth()
  const { toast } = useToast()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const canMark = ['LEADER', 'CO_LEADER', 'MANAGER'].includes(dbUser?.role || '')

  const fetchCollection = async () => {
    const token = await getToken()
    const res = await fetch('/api/collection', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setEntries((await res.json()).entries || [])
    setLoading(false)
  }

  useEffect(() => { fetchCollection() }, [])

  const markPaid = async (entryId: string) => {
    setUpdatingId(entryId)
    const token = await getToken()
    const res = await fetch('/api/collection/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paymentId: entryId, status: 'PAID' }),
    })
    if (res.ok) { toast({ title: 'Marked as paid ✅' }); fetchCollection() }
    else toast({ variant: 'destructive', title: 'Failed to update' })
    setUpdatingId(null)
  }

  const paid = entries.filter((e) => e.status === 'PAID').length
  const pending = entries.filter((e) => e.status === 'PENDING').length
  const late = entries.filter((e) => e.status === 'LATE').length
  const total = entries.filter((e) => e.status === 'PAID').reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[{ v: paid, l: 'Paid', c: 'text-emerald-400' }, { v: pending, l: 'Pending', c: 'text-amber-400' }, { v: late, l: 'Late', c: 'text-red-400' }, { v: formatCurrency(total), l: 'Collected', c: 'text-white' }].map((s, i) => (
          <div key={i} className="glass-card p-4">
            <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
            <p className="text-xs text-slate-400 mt-1">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-white">Current Week — {entries[0] ? formatDate(entries[0].weekStart) : 'Loading...'}</h3>
        </div>
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full bg-white/5 shimmer" />
                <div className="flex-1 space-y-2"><div className="h-3 w-32 bg-white/5 rounded shimmer" /><div className="h-2 w-20 bg-white/5 rounded shimmer" /></div>
                <div className="h-7 w-24 bg-white/5 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 p-4 hover:bg-white/2 transition">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {getInitials(entry.user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{entry.user.name}</p>
                  <p className="text-xs text-slate-400">{entry.user.email}</p>
                  {entry.fine > 0 && <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3" />Fine: {formatCurrency(entry.fine)}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getPaymentStatusColor(entry.status)}`}>{entry.status}</span>
                  {canMark && entry.status !== 'PAID' && (
                    <button onClick={() => markPaid(entry.id)} disabled={updatingId === entry.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition disabled:opacity-50">
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
