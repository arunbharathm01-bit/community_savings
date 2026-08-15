'use client'

import { useToast } from './use-toast'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isDestructive = t.variant === 'destructive'
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl backdrop-blur-xl border transition-all animate-fade-in ${
              isDestructive
                ? 'bg-red-950/90 border-red-500/30 text-white'
                : 'bg-slate-900/90 border-emerald-500/30 text-white'
            }`}
          >
            {isDestructive ? (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-sm font-semibold">{t.title}</p>}
              {t.description && <p className="text-xs text-slate-300 mt-0.5">{t.description}</p>}
            </div>
            {t.id && (
              <button
                onClick={() => dismiss(t.id!)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
