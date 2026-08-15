'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn, getInitials, getRoleLabel } from '@/lib/utils'
import {
  LayoutDashboard, Users, Calendar, ArrowLeftRight,
  CreditCard, Megaphone, Bell, Settings, LogOut,
  TrendingUp, Wallet, ChevronRight, Users2
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/collection', label: 'Collection', icon: Calendar },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/loans', label: 'Loans', icon: Wallet },
  { href: '/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/dues', label: 'My Dues', icon: CreditCard },
]

const adminItems = [
  { href: '/admin', label: 'Admin Panel', icon: TrendingUp },
]

export function Sidebar() {
  const pathname = usePathname()
  const { dbUser, logout } = useAuth()
  const isAdmin = dbUser?.role === 'LEADER' || dbUser?.role === 'CO_LEADER'

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-card border-r border-border fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Users2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Sunrise</p>
            <p className="text-xs text-muted-foreground">Community</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3">Main</p>
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white')} />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-emerald-400" />}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-3 mt-6">Admin</p>
            {adminItems.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    active
                      ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-yellow-400' : 'text-slate-500 group-hover:text-white')} />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {dbUser ? getInitials(dbUser.name) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{dbUser?.name || 'Loading...'}</p>
            <p className="text-xs text-muted-foreground truncate">{getRoleLabel(dbUser?.role || 'MEMBER')}</p>
          </div>
        </div>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">
          <Settings className="w-4 h-4" /> Settings
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  )
}
