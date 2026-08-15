'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, Menu, X } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import Link from 'next/link'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/members': 'Members',
  '/collection': 'Weekly Collection',
  '/transactions': 'Transactions',
  '/loans': 'Loans',
  '/announcements': 'Announcements',
  '/dues': 'My Dues',
  '/admin': 'Admin Panel',
  '/settings': 'Settings',
}

export function Header() {
  const { dbUser } = useAuth()
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const title = pageTitles[pathname] || 'Community'

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Title */}
        <div>
          <h1 className="text-lg font-bold text-white">{title}</h1>
          {dbUser && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              Welcome back, {dbUser.name.split(' ')[0]}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
            {dbUser ? getInitials(dbUser.name) : 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}
