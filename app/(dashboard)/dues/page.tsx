'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreditCard, AlertTriangle, CheckCircle, Loader2, ArrowUpRight } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface DuesInfo {
  weeklyAmount: number
  currentWeek: { id: string; weekStart: string; status: string; amount: number; fine: number } | null
  autoPayEnabled: boolean
}

export default function DuesPage() {
  const { getToken } = useAuth()
  const { toast } = useToast()
  const [dues, setDues] = useState<DuesInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [autoPay, setAutoPay] = useState(false)

  const fetchDues = async () => {
    const token = await getToken()
    const res = await fetch('/api/dues', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) { const d = await res.json(); setDues(d); setAutoPay(d.autoPayEnabled) }
    setLoading(false)
  }

  useEffect(() => { fetchDues() }, [])

  const totalAmountVal = (dues?.currentWeek?.amount || 0) + (dues?.currentWeek?.fine || 0)

  // Direct Google Pay UPI Intent URL
  const gpayUpiUrl = `upi://pay?pa=${encodeURIComponent(process.env.NEXT_PUBLIC_UPI_ID || 'community@okaxis')}&pn=${encodeURIComponent('Sunrise Community')}&am=${totalAmountVal}&cu=INR&tn=${encodeURIComponent('Weekly Due Collection')}`

  const handleGooglePayNow = async () => {
    if (!dues?.currentWeek) return
    setPaying(true)
    const token = await getToken()
    const totalAmount = totalAmountVal * 100 // paise
    
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentId: dues.currentWeek.id, amount: totalAmount }),
      })
      if (res.ok) {
        const { orderId, key } = await res.json()
        const options = {
          key,
          amount: totalAmount,
          currency: 'INR',
          name: 'Sunrise Community',
          description: 'Weekly Due Collection',
          order_id: orderId,
          upi: {
            flow: 'intent'
          },
          handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
            const v = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ ...r, paymentId: dues.currentWeek!.id }),
            })
            if (v.ok) { toast({ title: 'Google Pay payment successful! ✅' }); fetchDues() }
          },
          theme: { color: '#4285F4' },
        }
        // @ts-expect-error Razorpay loaded via CDN script
        if (window.Razorpay) {
          // @ts-expect-error Razorpay loaded via CDN script
          new window.Razorpay(options).open()
        } else {
          // Fallback direct GPay UPI App opening
          window.location.href = gpayUpiUrl
        }
      } else {
        // Direct UPI link fallback
        window.location.href = gpayUpiUrl
      }
    } catch {
      window.location.href = gpayUpiUrl
    } finally {
      setPaying(false)
    }
  }

  const isPaid = dues?.currentWeek?.status === 'PAID'
  const isLate = dues?.currentWeek?.status === 'LATE'

  return (
    <div className="space-y-6 animate-fade-in max-w-lg">
      {/* Current Week Card */}
      <div className={`glass-card p-6 border ${isPaid ? 'border-emerald-500/30' : isLate ? 'border-red-500/30' : 'border-amber-500/30'}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white mb-1">Current Week Dues</h3>
            {dues?.currentWeek && <p className="text-xs text-slate-400">{formatDate(dues.currentWeek.weekStart)}</p>}
          </div>
          {isPaid ? (
            <div className="flex items-center gap-2 text-emerald-400"><CheckCircle className="w-5 h-5" /><span className="font-semibold">Paid</span></div>
          ) : isLate ? (
            <div className="flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" /><span className="font-semibold">Late</span></div>
          ) : (
            <span className="text-amber-400 font-semibold">Pending</span>
          )}
        </div>

        {loading ? (
          <div className="mt-4"><div className="h-10 w-32 bg-white/5 rounded shimmer" /></div>
        ) : (
          <div className="mt-4">
            <p className="text-4xl font-bold text-white">{formatCurrency(totalAmountVal)}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-slate-400">Due: <span className="text-white">{formatCurrency(dues?.currentWeek?.amount || 0)}</span></span>
              {(dues?.currentWeek?.fine || 0) > 0 && (
                <span className="text-red-400">Fine: {formatCurrency(dues?.currentWeek?.fine || 0)}</span>
              )}
            </div>
          </div>
        )}

        {!isPaid && dues?.currentWeek && (
          <div className="space-y-3 mt-6">
            <button
              onClick={handleGooglePayNow}
              disabled={paying}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              )}
              {paying ? 'Opening GPay...' : 'Pay with Google Pay (UPI)'}
            </button>

            <a
              href={gpayUpiUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs hover:bg-white/10 transition flex items-center justify-center gap-1.5"
            >
              Direct Google Pay UPI Link <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* AutoPay Toggle */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Google Pay AutoPay Reminder</h3>
            <p className="text-sm text-slate-400 mt-1">Get Google Pay UPI reminder every Sunday for ₹{dues?.weeklyAmount || 50}</p>
          </div>
          <button onClick={() => setAutoPay(!autoPay)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${autoPay ? 'bg-blue-600' : 'bg-white/10'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${autoPay ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
        {autoPay && <p className="text-xs text-blue-400 mt-3">✓ Google Pay AutoPay Reminder active — notification sent every Sunday morning</p>}
      </div>

      {/* Info */}
      <div className="glass-card p-5 border-amber-500/20">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Late payment policy</p>
            <p className="text-xs text-slate-400 mt-1">Payments not made by Sunday will be marked <strong className="text-white">Late</strong> on Monday and a fine of <strong className="text-white">₹10</strong> will be automatically applied.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
