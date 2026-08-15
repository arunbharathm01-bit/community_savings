'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase'
import { sendEmailVerification } from 'firebase/auth'
import { useToast } from '@/components/ui/use-toast'
import { Mail, RefreshCw, LogOut } from 'lucide-react'

export default function VerifyEmailPage() {
  const { firebaseUser, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (firebaseUser?.emailVerified) {
      router.push('/dashboard')
    }
  }, [firebaseUser, router])

  const handleResend = async () => {
    if (!auth.currentUser) return
    try {
      await sendEmailVerification(auth.currentUser)
      toast({ title: 'Email sent!', description: 'Check your inbox for the verification link.' })
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Too many requests. Try again later.' })
    }
  }

  const handleRefresh = async () => {
    if (!auth.currentUser) return
    await auth.currentUser.reload()
    if (auth.currentUser.emailVerified) {
      router.push('/dashboard')
    } else {
      toast({ description: 'Email not yet verified. Please check your inbox.' })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="glass-card p-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 mb-6 animate-pulse-glow">
            <Mail className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Verify your email</h1>
          <p className="text-slate-400 mb-2">
            We sent a verification link to
          </p>
          <p className="text-emerald-400 font-medium mb-6">{firebaseUser?.email}</p>
          <p className="text-slate-500 text-sm mb-8">
            Check your inbox and click the link, then come back and click &quot;I&apos;ve verified&quot; below.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleRefresh}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> I&apos;ve verified my email
            </button>

            <button
              onClick={handleResend}
              className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-white font-medium hover:bg-white/10 transition"
            >
              Resend verification email
            </button>

            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 text-slate-500 hover:text-white text-sm transition mt-2"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
