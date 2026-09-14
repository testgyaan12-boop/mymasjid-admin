import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Plus, Search, Bell, BellRing, Send, X, ChevronDown, ChevronLeft, ChevronRight,
  CheckCircle, Clock, AlertTriangle, CalendarDays, Eye, Eraser,
  Globe, Building2, User
} from 'lucide-react'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '  ' +
    dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function isToday(d: string | null) {
  if (!d) return false
  const dt = new Date(d)
  const now = new Date()
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate()
}

const AUDIENCE_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  ALL: { label: 'All Users', icon: Globe, color: '#2563EB', bg: '#EFF6FF' },
  TENANT: { label: 'Tenant', icon: Building2, color: '#8B5CF6', bg: '#F5F3FF' },
  USER: { label: 'User', icon: User, color: '#0EA5E9', bg: '#F0F9FF' },
}

function StatusBadge({ sent }: { sent?: boolean }) {
  return sent
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#D1FAE5] text-[#065F46]">Sent</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E]">Pending</span>
}

const PAGE_SIZE = 9

export default function Notifications() {
  const qc = useQueryClient()
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: async () => (await masterApi.projects.list()).data ?? [] })
  const { data: notifs, isLoading, error } = useQuery({ queryKey: ['notifs-all'], queryFn: async () => (await masterApi.notifications.list()).data ?? [] })
  const [form, setForm] = useState({ projectId: '', title: '', body: '', targetAudience: 'ALL' })
  const [sentOk, setSentOk] = useState(false)
  const [search, setSearch] = useState('')
  const [targetFilter, setTargetFilter] = useState('ALL_TARGETS')
  const [statusFilter, setStatusFilter] = useState('ALL_STATUS')
  const [projectFilter, setProjectFilter] = useState('ALL_PROJECTS')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const mut = useMutation({
    mutationFn: () => masterApi.notifications.send({
      projectId: form.projectId ? Number(form.projectId) : null,
      title: form.title, body: form.body, targetAudience: form.targetAudience,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifs-all'] })
      setForm({ projectId: '', title: '', body: '', targetAudience: 'ALL' })
      setShowComposer(false)
      setSentOk(true)
      setTimeout(() => setSentOk(false), 4000)
    },
  })

  const all = useMemo(() => notifs || [], [notifs])

  const stats = useMemo(() => ({
    total: all.length,
    today: all.filter((n: any) => isToday(n.createdAt)).length,
    sent: all.filter((n: any) => n.isSent).length,
    pending: all.filter((n: any) => !n.isSent).length,
  }), [all])

  const projectMap = useMemo(() => {
    const m = new Map<number, string>()
    ;(projects || []).forEach((p: any) => m.set(p.id, p.name))
    return m
  }, [projects])

  const filtered = useMemo(() => {
    let list = [...all]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((n: any) =>
        n.title?.toLowerCase().includes(q) ||
        n.body?.toLowerCase().includes(q) ||
        n.createdByEmail?.toLowerCase().includes(q)
      )
    }
    if (targetFilter !== 'ALL_TARGETS') list = list.filter((n: any) => (n.targetAudience || 'ALL') === targetFilter)
    if (statusFilter === 'SENT') list = list.filter((n: any) => n.isSent)
    if (statusFilter === 'PENDING') list = list.filter((n: any) => !n.isSent)
    if (projectFilter === 'GLOBAL') list = list.filter((n: any) => !n.projectId)
    if (projectFilter !== 'ALL_PROJECTS' && projectFilter !== 'GLOBAL') list = list.filter((n: any) => String(n.projectId) === projectFilter)
    return list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [all, search, targetFilter, statusFilter, projectFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const clearForm = () => { setForm({ projectId: '', title: '', body: '', targetAudience: 'ALL' }); setSentOk(false) }
  const openComposer = () => {
    setSentOk(false)
    setShowComposer(true)
    setTimeout(() => titleRef.current?.focus(), 150)
  }

  useEffect(() => {
    if (!showComposer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowComposer(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [showComposer])

  const previewAud = AUDIENCE_META[form.targetAudience] || AUDIENCE_META.ALL

  return (
    <div className="relative">
      {/* Watermark */}
      <div className="absolute top-6 right-6 opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none">
        <svg width="220" height="220" viewBox="0 0 200 200" fill="none">
          <path d="M100 10 L100 60 M80 60 L120 60 M100 60 L100 90 M70 90 L130 90 L130 120 L70 120Z M90 120 L90 150 L110 150 L110 120" stroke="currentColor" strokeWidth="3" className="text-[#2563EB] dark:text-[#60A5FA]" />
          <circle cx="100" cy="5" r="5" fill="currentColor" className="text-[#2563EB] dark:text-[#60A5FA]" />
          <path d="M40 150 L40 170 L160 170 L160 150" stroke="currentColor" strokeWidth="2" className="text-[#2563EB] dark:text-[#60A5FA]" />
        </svg>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[#64748B] dark:text-[#94A3B8] mb-1.5">
            <span className="hover:text-[#2563EB] transition cursor-pointer">Dashboard</span>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-[#0F172A] dark:text-white font-medium">Notifications</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-[#0F172A] dark:text-white leading-tight">Notifications</h1>
              <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8]">Send notifications to your Masjid users and track delivery history.</p>
            </div>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] shadow-lg shadow-blue-500/20 self-start sm:self-auto" onClick={openComposer}>
          <Plus className="w-3.5 h-3.5" /> New Notification
        </Button>
      </div>

      {/* Success banner */}
      {sentOk && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#ECFDF5] dark:bg-emerald-900/20 border border-[#10B981]/25 text-[13px] font-medium text-[#065F46] dark:text-[#6EE7B7] mb-6">
          <CheckCircle className="w-4 h-4 text-[#10B981] shrink-0" /> Notification sent successfully
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536] p-4 min-h-[96px] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-[#F1F5F9] dark:bg-white/5 rounded-lg w-12" />
                <div className="h-3 bg-[#F1F5F9] dark:bg-white/5 rounded-lg w-20" />
              </div>
            </div>
          ))
        ) : ([
          { icon: BellRing, label: 'Total Sent', value: stats.total, color: '#2563EB', bg: '#EFF6FF' },
          { icon: CalendarDays, label: 'Sent Today', value: stats.today, color: '#8B5CF6', bg: '#F5F3FF' },
          { icon: CheckCircle, label: 'Delivered', value: stats.sent, color: '#10B981', bg: '#ECFDF5' },
          { icon: Clock, label: 'Pending', value: stats.pending, color: '#F59E0B', bg: '#FFFBEB' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536] p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[96px] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <div className="text-[22px] font-bold text-[#0F172A] dark:text-white leading-none mb-1">{s.value}</div>
              <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] truncate">{s.label}</div>
            </div>
          </div>
        )))}
      </div>

      {/* History */}
      <div className="bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536]">
        <div className="p-5 border-b border-[#F1F5F9] dark:border-[#1e2536] flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white">Notification History</h3>
            <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">View previously sent notifications and delivery information.</p>
          </div>
          <span className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] shrink-0">{filtered.length} notifications</span>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-[#F1F5F9] dark:border-[#1e2536] flex flex-col md:flex-row gap-2.5">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by title, message, sender..."
              className="w-full h-9 pl-9 pr-4 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[13px] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#E2E8F0] dark:focus:border-[#2a3042] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={targetFilter} onChange={e => { setTargetFilter(e.target.value); setPage(1) }}
              className="h-9 px-3 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] focus:outline-none cursor-pointer">
              <option value="ALL_TARGETS">All Targets</option>
              <option value="ALL">All Users</option>
              <option value="TENANT">Tenant</option>
              <option value="USER">User</option>
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="h-9 px-3 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] focus:outline-none cursor-pointer">
              <option value="ALL_STATUS">All Status</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
            </select>
            <select value={projectFilter} onChange={e => { setProjectFilter(e.target.value); setPage(1) }}
              className="h-9 px-3 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] focus:outline-none cursor-pointer max-w-[160px]">
              <option value="ALL_PROJECTS">All Projects</option>
              <option value="GLOBAL">Global</option>
              {(projects || []).map((p: any) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 py-3 border-b border-[#F8FAFC] dark:border-white/5 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] dark:bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-[#F1F5F9] dark:bg-white/5 rounded-lg w-1/3" />
                  <div className="h-3 bg-[#F1F5F9] dark:bg-white/5 rounded-lg w-2/3" />
                </div>
                <div className="h-6 bg-[#F1F5F9] dark:bg-white/5 rounded-md w-16 hidden sm:block" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">Unable to load notifications</h3>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-4">Something went wrong while loading notification history.</p>
            <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => qc.invalidateQueries({ queryKey: ['notifs-all'] })}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[#CBD5E1] dark:text-[#475569]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">No notifications yet</h3>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-4">Notifications you send will appear here.</p>
            <Button size="sm" className="gap-1.5 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6]" onClick={openComposer}>
              <Plus className="w-3.5 h-3.5" /> Send Notification
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-[1fr_130px_90px_170px_130px_110px] gap-3 px-5 py-2.5 border-b border-[#F1F5F9] dark:border-[#1e2536] text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              <span>Notification</span><span>Target</span><span>Status</span><span>Sent By</span><span>Date</span><span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-[#F1F5F9] dark:divide-[#1e2536]">
              {pageRows.map((n: any) => {
                const aud = AUDIENCE_META[n.targetAudience] || AUDIENCE_META.ALL
                return (
                  <div key={n.id}
                    className="px-5 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelected(n)}>
                    <div className="grid md:grid-cols-[1fr_130px_90px_170px_130px_110px] gap-2 md:gap-3 md:items-center">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: aud.bg }}>
                          <Bell className="w-[18px] h-[18px]" style={{ color: aud.color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-[#0F172A] dark:text-white truncate">{n.title}</div>
                          <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] truncate">{n.body}</div>
                          <div className="md:hidden flex items-center gap-2 mt-1.5 flex-wrap">
                            <StatusBadge sent={n.isSent} />
                            <span className="text-[11px] text-[#94A3B8]">{aud.label} • {formatDateTime(n.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="hidden md:flex items-center gap-1.5 text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                        <aud.icon className="w-3.5 h-3.5" style={{ color: aud.color }} />
                        {n.targetAudience || 'ALL'}
                      </div>
                      <div className="hidden md:block"><StatusBadge sent={n.isSent} /></div>
                      <div className="hidden md:block text-[12px] text-[#64748B] dark:text-[#94A3B8] truncate">{n.createdByEmail || '—'}</div>
                      <div className="hidden md:block text-[12px] text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">{formatDate(n.createdAt)}</div>
                      <div className="hidden md:flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(n)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition" title="View details">
                          <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                        </button>
                      </div>
                    </div>
                    {/* Mobile meta row */}
                    <div className="md:hidden flex items-center gap-2 mt-2 text-[11px] text-[#94A3B8] dark:text-[#64748B] flex-wrap">
                      <span className="inline-flex items-center gap-1"><aud.icon className="w-3 h-3" />{aud.label}</span>
                      <span>•</span><span>{n.projectId ? (projectMap.get(n.projectId) || `Project #${n.projectId}`) : 'Global'}</span>
                      <span>•</span><span className="truncate">{n.createdByEmail}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F1F5F9] dark:border-[#1e2536]">
                <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">
                  Page {safePage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2a3042] hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4 text-[#64748B]" />
                  </button>
                  {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-[12px] font-semibold transition ${safePage === i + 1 ? 'bg-[#2563EB] text-white' : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2a3042] hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition disabled:opacity-40">
                    <ChevronRight className="w-4 h-4 text-[#64748B]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Notification popup */}
      {showComposer && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => !mut.isPending && setShowComposer(false)} />
          <div className="relative w-full max-w-[880px] max-h-[92vh] overflow-y-auto bg-white dark:bg-[#141925] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-[#2a3042] animate-slide-in-right">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#141925] border-b border-[#E2E8F0] dark:border-[#1e2536] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#2563EB]" /> New Notification
                </h3>
                <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">Create and send a notification to your users.</p>
              </div>
              <button onClick={() => !mut.isPending && setShowComposer(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="p-6 grid md:grid-cols-[1fr_300px] gap-6">
              {/* Left: form */}
              <div className="space-y-4 min-w-0">
                <div>
                  <div className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2">Send to</div>
                  <div className="flex gap-2 flex-wrap">
                    {(['ALL', 'TENANT', 'USER'] as const).map(a => {
                      const meta = AUDIENCE_META[a]
                      const active = form.targetAudience === a
                      return (
                        <button key={a} type="button" onClick={() => setForm({ ...form, targetAudience: a })}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold border-2 transition-all ${active ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-blue-900/20 text-[#2563EB] dark:text-[#93C5FD]' : 'border-[#E2E8F0] dark:border-[#2a3042] text-[#64748B] dark:text-[#94A3B8] hover:border-[#CBD5E1] dark:hover:border-[#475569]'}`}>
                          <meta.icon className="w-3.5 h-3.5" />
                          {a === 'ALL' ? 'All Users' : a === 'TENANT' ? 'Tenant' : 'Specific User'}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Project (optional)</Label>
                    <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}
                      className="h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition">
                      <option value="">Global (All)</option>
                      {projects?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Audience</Label>
                    <select value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })}
                      className="h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition">
                      <option value="ALL">ALL — All Users</option>
                      <option value="TENANT">TENANT — Tenant users</option>
                      <option value="USER">USER — Specific user</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input ref={titleRef as any} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter notification title..." />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Message *</Label>
                    <span className="text-[11px] text-[#94A3B8] dark:text-[#64748B]">{form.body.length} chars</span>
                  </div>
                  <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write your notification message..." className="min-h-[96px]" />
                </div>
                {(mut.isError) && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FEF2F2] dark:bg-red-900/20 border border-[#EF4444]/20 text-[13px] font-medium text-[#991B1B] dark:text-[#FCA5A5]">
                    <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" /> Failed to send. Please try again.
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" className="rounded-[10px] gap-1.5" onClick={clearForm} disabled={mut.isPending}>
                    <Eraser className="w-3.5 h-3.5" /> Clear
                  </Button>
                  <div className="flex-1" />
                  <Button size="sm" className="rounded-[10px] gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] shadow-lg shadow-blue-500/20 min-w-[160px]"
                    onClick={() => mut.mutate()} disabled={!form.title.trim() || !form.body.trim() || mut.isPending}>
                    <Send className="w-3.5 h-3.5" /> {mut.isPending ? 'Sending...' : 'Send Notification'}
                  </Button>
                </div>
              </div>
              {/* Right: live preview */}
              <div className="md:pl-6 md:border-l border-[#F1F5F9] dark:border-[#1e2536]">
                <div className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-3">Live Preview</div>
                <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] bg-[#F8FAFC] dark:bg-white/[0.02] p-4">
                  <div className="rounded-xl bg-white dark:bg-[#1a1f2e] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#E2E8F0] dark:border-[#2a3042] p-3.5">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-[#0F172A] dark:text-white">My Masjid</div>
                        <div className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">Just now</div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: previewAud.bg, color: previewAud.color }}>
                        {form.targetAudience}
                      </span>
                    </div>
                    <div className="text-[13px] font-semibold text-[#0F172A] dark:text-white leading-snug">
                      {form.title || <span className="text-[#CBD5E1] dark:text-[#475569] font-normal">Notification title...</span>}
                    </div>
                    <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed mt-0.5 line-clamp-3">
                      {form.body || <span className="text-[#CBD5E1] dark:text-[#475569]">Your message will appear here...</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#94A3B8] dark:text-[#64748B]">
                    <previewAud.icon className="w-3 h-3" />
                    {form.projectId ? `Project: ${projectMap.get(Number(form.projectId)) || `#${form.projectId}`} • ` : 'Global • '}
                    {previewAud.label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details drawer */}
      {selected && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-[440px] bg-white dark:bg-[#141925] shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#141925] border-b border-[#E2E8F0] dark:border-[#1e2536] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Notification Details</h3>
                <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">#{selected.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge sent={selected.isSent} />
                <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
                  <X className="w-4 h-4 text-[#64748B]" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-[#0F172A] dark:text-white">{selected.title}</div>
                  <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">ID #{selected.id}</div>
                </div>
              </div>
              <DrawerSection title="Message">
                <p className="text-[13px] text-[#0F172A] dark:text-white leading-relaxed whitespace-pre-wrap">{selected.body || '—'}</p>
              </DrawerSection>
              <div className="grid grid-cols-2 gap-2.5">
                <DrawerField label="Target" value={selected.targetAudience || 'ALL'} />
                <DrawerField label="Project" value={selected.projectId ? (projectMap.get(selected.projectId) || `Project #${selected.projectId}`) : 'Global'} />
                {selected.targetId != null && <DrawerField label="Target ID" value={String(selected.targetId)} />}
                <DrawerField label="Sent By" value={selected.createdByEmail || '—'} />
                <DrawerField label="Sent" value={formatDateTime(selected.createdAt)} />
                {selected.sentAt && <DrawerField label="Delivered At" value={formatDateTime(selected.sentAt)} />}
              </div>
              {selected.image && (
                <DrawerSection title="Attachment">
                  <img src={selected.image} alt="notification" className="rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] max-h-48 object-cover" />
                </DrawerSection>
              )}
              <Button variant="outline" size="sm" className="w-full rounded-[10px]" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  )
}

function DrawerField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03]">
      <div className="text-[10px] font-semibold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">{label}</div>
      <div className="text-[13px] text-[#0F172A] dark:text-white font-medium mt-0.5 break-words">{value}</div>
    </div>
  )
}
