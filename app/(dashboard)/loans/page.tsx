'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, getLoanStatusColor, calculateLoanInterest } from '@/lib/utils'
import { Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Loan { id: string; userId: string; user?: { name: string }; requestedAmount: number; approvedAmount: number | null; reason: string | null; interest: number; remaining: number; status: string; createdAt: string }

export default function LoansPage() {
  const { dbUser, getToken } = useAuth()
  const { toast } = useToast()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [repayAmount, setRepayAmount] = useState('')
  const [repayingId, setRepayingId] = useState<string | null>(null)

  const canApprove = ['LEADER', 'CO_LEADER'].includes(dbUser?.role || '')

  const fetchLoans = async () => {
    const token = await getToken()
    const res = await fetch('/api/loans', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setLoans((await res.json()).loans || [])
    setLoading(false)
  }

  useEffect(() => { fetchLoans() }, [])

  const requestLoan = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const token = await getToken()
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: parseFloat(amount), reason }),
    })
    if (res.ok) { toast({ title: 'Loan requested! ✅' }); setShowForm(false); setAmount(''); setReason(''); fetchLoans() }
    else toast({ variant: 'destructive', title: 'Failed to submit request' })
    setSubmitting(false)
  }

  const handleApprove = async (loanId: string, approve: boolean) => {
    const token = await getToken()
    const res = await fetch(`/api/loans/${loanId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ approved: approve }),
    })
    if (res.ok) { toast({ title: approve ? 'Loan approved ✅' : 'Loan rejected' }); fetchLoans() }
  }

  const handleRepay = async (loanId: string) => {
    if (!repayAmount) return; setRepayingId(loanId)
    const token = await getToken()
    const res = await fetch(`/api/loans/${loanId}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: parseFloat(repayAmount) }),
    })
    if (res.ok) { toast({ title: 'Repayment recorded ✅' }); setRepayAmount(''); fetchLoans() }
    setRepayingId(null)
  }

  const interest = amount ? calculateLoanInterest(parseFloat(amount) || 0, 10, 500) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <p className="text-slate-400 text-sm">{loans.length} loan{loans.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Request Loan
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">New Loan Request</h3>
          <form onSubmit={requestLoan} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount (₹)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="500" step="500" required placeholder="e.g. 1500"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                {amount && <p className="text-xs text-amber-400 mt-1">Interest: ₹{interest} (₹10 per ₹500)</p>}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Reason (optional)</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Medical emergency"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-50">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit Request
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card h-36 shimmer" />) :
          loans.length === 0 ? <div className="glass-card p-16 text-center"><p className="text-slate-500">No loans yet</p></div> :
          loans.map((loan) => (
            <div key={loan.id} className="glass-card p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  {loan.user && <p className="text-xs text-slate-400 mb-1">{loan.user.name}</p>}
                  <p className="text-lg font-bold text-white">Requested: {formatCurrency(loan.requestedAmount)}</p>
                  {loan.approvedAmount && <p className="text-sm text-emerald-400">Approved: {formatCurrency(loan.approvedAmount)}</p>}
                  {loan.reason && <p className="text-xs text-slate-400 mt-1">{loan.reason}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(loan.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getLoanStatusColor(loan.status)}`}>{loan.status}</span>
                  {loan.status === 'ACTIVE' && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400">Remaining: <span className="text-white font-medium">{formatCurrency(loan.remaining)}</span></p>
                      <p className="text-xs text-slate-400">Interest: <span className="text-amber-400">{formatCurrency(loan.interest)}</span></p>
                    </div>
                  )}
                </div>
              </div>
              {canApprove && loan.status === 'REQUESTED' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <button onClick={() => handleApprove(loan.id, true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm hover:bg-emerald-500/25 transition">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleApprove(loan.id, false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 text-red-400 text-sm hover:bg-red-500/25 transition">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
              {loan.status === 'ACTIVE' && loan.userId === dbUser?.id && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} placeholder="Repay amount" min="500" step="500"
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  <button onClick={() => handleRepay(loan.id)} disabled={repayingId === loan.id}
                    className="px-4 py-2 rounded-xl bg-blue-500/15 text-blue-400 text-sm hover:bg-blue-500/25 transition disabled:opacity-50">
                    {repayingId === loan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Repay'}
                  </button>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  )
}
