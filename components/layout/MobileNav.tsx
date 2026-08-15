'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Calendar, ArrowLeftRight,
  CreditCard, Megaphone, Wallet
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/collection', label: 'Collection', icon: Calendar },
  { href: '/dues', label: 'Dues', icon: CreditCard },
  { href: '/loans', label: 'Loans', icon: Wallet },
  { href: '/announcements', label: 'News', icon: Megaphone },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200',
                active ? 'text-emerald-400' : 'text-slate-500'
              )}
            >
              <item.icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
