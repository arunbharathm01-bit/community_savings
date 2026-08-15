'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, getInitials, getRoleBadgeColor, getRoleLabel } from '@/lib/utils'
import { Search, UserPlus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Member { id: string; name: string; email: string; phone: string | null; role: string; joinDate: string }

const ROLES = ['LEADER', 'CO_LEADER', 'MANAGER', 'MEMBER']

export default function MembersPage() {
  const { dbUser, getToken } = useAuth()
  const { toast } = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const isLeader = dbUser?.role === 'LEADER'
  const canManage = ['LEADER', 'CO_LEADER'].includes(dbUser?.role || '')

  const fetchMembers = async () => {
    const token = await getToken()
    const res = await fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setMembers((await res.json()).members || [])
    setLoading(false)
  }

  useEffect(() => { fetchMembers() }, [])

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdatingId(memberId)
    const token = await getToken()
    const res = await fetch(`/api/members/${memberId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m))
      toast({ title: 'Role updated ✅', description: `Promoted to ${getRoleLabel(newRole)}` })
    } else {
      toast({ variant: 'destructive', title: 'Failed to update role' })
    }
    setUpdatingId(null)
  }

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{members.length} members</p>
        {isLeader && (
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition">
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition" />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card h-40 shimmer" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <div key={member.id} className="glass-card p-5 hover:border-white/20 transition">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{member.name}</p>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                  {member.phone && <p className="text-xs text-slate-500">{member.phone}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Joined {formatDate(member.joinDate)}</p>
                </div>
              </div>
              <div className="mt-4">
                {canManage && member.id !== dbUser?.id ? (
                  <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={updatingId === member.id}
                    className={`text-xs px-2 py-1 rounded-lg border ${getRoleBadgeColor(member.role)} bg-transparent cursor-pointer focus:outline-none`}>
                    {ROLES.map((r) => <option key={r} value={r} className="bg-slate-800 text-white">{getRoleLabel(r)}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${getRoleBadgeColor(member.role)}`}>
                    {getRoleLabel(member.role)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
