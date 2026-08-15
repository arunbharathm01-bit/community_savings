'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, getInitials } from '@/lib/utils'
import { Heart, MessageCircle, Plus, Send, X, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Comment { id: string; userId: string; user: { name: string }; message: string; createdAt: string }
interface Announcement { id: string; title: string; content: string; author: { name: string }; createdAt: string; _count: { likes: number; comments: number }; userLiked: boolean; comments: Comment[] }

export default function AnnouncementsPage() {
  const { dbUser, getToken } = useAuth()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState<Record<string, string>>({})

  const canPost = ['LEADER', 'CO_LEADER'].includes(dbUser?.role || '')

  const fetchAnnouncements = async () => {
    const token = await getToken()
    const res = await fetch('/api/announcements', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) setAnnouncements((await res.json()).announcements || [])
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    const token = await getToken()
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, content }),
    })
    if (res.ok) { toast({ title: 'Announcement posted ✅' }); setShowForm(false); setTitle(''); setContent(''); fetchAnnouncements() }
    else toast({ variant: 'destructive', title: 'Failed to post' })
    setSubmitting(false)
  }

  const toggleLike = async (annId: string) => {
    const token = await getToken()
    await fetch(`/api/announcements/${annId}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    fetchAnnouncements()
  }

  const postComment = async (annId: string) => {
    const msg = commentText[annId]?.trim()
    if (!msg) return
    const token = await getToken()
    const res = await fetch(`/api/announcements/${annId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: msg }),
    })
    if (res.ok) { setCommentText((p) => ({ ...p, [annId]: '' })); fetchAnnouncements() }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {canPost && (
        <div className="flex justify-end">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
        </div>
      )}

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Create Announcement</h3>
          <form onSubmit={postAnnouncement} className="space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement..." required rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none" />
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-50">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Post Announcement
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card h-40 shimmer" />)}</div>
      ) : announcements.length === 0 ? (
        <div className="glass-card p-16 text-center"><p className="text-slate-500">No announcements yet</p></div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div key={ann.id} className="glass-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {getInitials(ann.author.name)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{ann.author.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(ann.createdAt)}</p>
                </div>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{ann.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{ann.content}</p>

              <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border">
                <button onClick={() => toggleLike(ann.id)} className={`flex items-center gap-2 text-sm transition ${ann.userLiked ? 'text-red-400' : 'text-slate-400 hover:text-red-400'}`}>
                  <Heart className={`w-4 h-4 ${ann.userLiked ? 'fill-red-400' : ''}`} /> {ann._count.likes}
                </button>
                <button onClick={() => setExpandedId(expandedId === ann.id ? null : ann.id)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
                  <MessageCircle className="w-4 h-4" /> {ann._count.comments}
                </button>
              </div>

              {expandedId === ann.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {ann.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {getInitials(c.user.name)}
                      </div>
                      <div className="flex-1 bg-white/5 rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-white">{c.user.name}</p>
                        <p className="text-xs text-slate-300">{c.message}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input value={commentText[ann.id] || ''} onChange={(e) => setCommentText((p) => ({ ...p, [ann.id]: e.target.value }))}
                      placeholder="Write a comment..." onKeyDown={(e) => e.key === 'Enter' && postComment(ann.id)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                    <button onClick={() => postComment(ann.id)} className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
