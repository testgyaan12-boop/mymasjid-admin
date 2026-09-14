import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useRef, useEffect } from 'react'
import {
  Send, Mail, Bell, Users, Building2, Megaphone, History, ChevronRight,
  Search, Loader2, Plus, Filter, Trash2, X
} from 'lucide-react'

export default function Campaign() {
  const qc = useQueryClient()
  const [type, setType] = useState<'EMAIL'|'PUSH'|'BOTH'>('PUSH')
  const [targetType, setTargetType] = useState<'ALL'|'MASJID'|'USER'>('ALL')
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedMasjids, setSelectedMasjids] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedMasjidUsers, setSelectedMasjidUsers] = useState<number[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [msg, setMsg] = useState('')
  const [historyFilter, setHistoryFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [masjidSearch, setMasjidSearch] = useState('')
  const [masjidUserSearch, setMasjidUserSearch] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const { data: masjids } = useQuery({ queryKey:['masjids'], queryFn: async()=>(await masterApi.masjids.list()).data })
  const { data: users } = useQuery({ queryKey:['users-search', userSearch], queryFn: async()=>(await masterApi.users.list(userSearch || undefined)).data, enabled: targetType==='USER' })
  const { data: campaigns } = useQuery({ queryKey:['campaigns'], queryFn: async()=>(await masterApi.campaigns.list()).data })
  const { data: masjidUsersData } = useQuery({
    queryKey:['masjid-users-bulk', selectedMasjids.join(',')],
    enabled: targetType==='MASJID' && selectedMasjids.length>0,
    queryFn: async()=>{
      const all: any[] = []
      for(const mid of selectedMasjids){ try{ const r = await masterApi.masjids.users(mid); all.push(...(r.data||[])) } catch {} }
      const map = new Map(); all.forEach((u:any)=> map.set(u.userId, u)); return Array.from(map.values())
    }
  })

  const sendMut = useMutation({
    mutationFn: () => {
      let targetIds: any = null; let extra:any = {}
      if (targetType==='MASJID') { targetIds = JSON.stringify(selectedMasjids); if(selectedMasjidUsers.length>0) extra.userIds = JSON.stringify(selectedMasjidUsers) }
      if (targetType==='USER') targetIds = JSON.stringify(selectedUsers)
      return masterApi.campaigns.send({ title, subject, body, type, targetType, targetIds, ...extra })
    },
    onSuccess: (res:any) => { setMsg(`Sent ${res.data.type} campaign "${res.data.title}" to ${res.data.sentCount} recipients`); setTitle(''); setSubject(''); setBody(''); setSelectedMasjids([]); setSelectedUsers([]); setSelectedMasjidUsers([]); setShowComposer(false); qc.invalidateQueries({queryKey:['campaigns']}) },
    onError: (e:any)=> setMsg(e.response?.data?.message || 'Send failed')
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => masterApi.campaigns.delete(id),
    onSuccess: () => { setDeleteTarget(null); qc.invalidateQueries({queryKey:['campaigns']}) },
  })

  const toggleMasjid = (id:number) => setSelectedMasjids(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  const toggleUser = (id:number) => setSelectedUsers(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])

  const openComposer = () => {
    setShowComposer(true)
    setTimeout(() => titleRef.current?.focus(), 150)
  }

  useEffect(() => {
    if (!showComposer) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !sendMut.isPending) setShowComposer(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [showComposer, sendMut.isPending])

  const filteredCampaigns = (campaigns || []).filter((c: any) => {
    if (historyFilter !== 'ALL' && c.type !== historyFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return c.title?.toLowerCase().includes(q) || c.body?.toLowerCase().includes(q) || c.createdByEmail?.toLowerCase().includes(q)
    }
    return true
  })

  const typeBadge = (t: string) => {
    if (t === 'PUSH') return 'bg-[#ECFDF5] text-[#10B981] border border-[#D1FAE5] dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30'
    if (t === 'EMAIL') return 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30'
    return 'bg-[#FFF7ED] text-[#F97316] border border-[#FFEDD5] dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30'
  }

  const targetBadge = (t: string) => {
    if (t === 'MASJID') return 'bg-[#F5F3FF] text-[#8B5CF6] border border-[#EDE9FE] dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30'
    if (t === 'ALL') return 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30'
    return 'bg-[#FFF7ED] text-[#F97316] border border-[#FFEDD5] dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30'
  }

  return (
    <div className="max-w-[1350px] mx-auto space-y-5 animate-fade-in">

      {/* ─── BREADCRUMB ─── */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
        <span className="hover:text-[#2563EB] transition-colors cursor-pointer">Dashboard</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Campaign</span>
      </div>

      {/* ─── PAGE HEADER ─── */}
      <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
        {/* Mosque silhouette — subtle watermark */}
        <div className="absolute -right-10 -bottom-8 w-[420px] h-[220px] opacity-[0.045] dark:opacity-[0.06] pointer-events-none select-none" aria-hidden="true">
          <svg viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Main dome */}
            <ellipse cx="300" cy="120" rx="90" ry="70" fill="#2563EB" />
            {/* Dome crescent */}
            <path d="M300 42 c6 0 11 8 8 16 c-2 5-7 8-8 8 c-1 0-6-3-8-8 c-3-8 2-16 8-16z" fill="#2563EB" />
            {/* Minaret left */}
            <rect x="140" y="60" width="24" height="180" rx="4" fill="#2563EB" />
            <ellipse cx="152" cy="58" rx="16" ry="14" fill="#2563EB" />
            <path d="M152 38 c3 0 5 5 4 10 c-1 3-3 5-4 5 c-1 0-3-2-4-5 c-1-5 1-10 4-10z" fill="#2563EB" />
            {/* Minaret right */}
            <rect x="436" y="60" width="24" height="180" rx="4" fill="#2563EB" />
            <ellipse cx="448" cy="58" rx="16" ry="14" fill="#2563EB" />
            <path d="M448 38 c3 0 5 5 4 10 c-1 3-3 5-4 5 c-1 0-3-2-4-5 c-1-5 1-10 4-10z" fill="#2563EB" />
            {/* Base building */}
            <rect x="160" y="130" width="280" height="110" rx="6" fill="#2563EB" />
            {/* Windows */}
            <rect x="200" y="150" width="30" height="40" rx="15" fill="white" opacity="0.3" />
            <rect x="285" y="150" width="30" height="40" rx="15" fill="white" opacity="0.3" />
            <rect x="370" y="150" width="30" height="40" rx="15" fill="white" opacity="0.3" />
            {/* Small domes */}
            <ellipse cx="220" cy="130" rx="30" ry="20" fill="#2563EB" />
            <ellipse cx="380" cy="130" rx="30" ry="20" fill="#2563EB" />
            {/* Door */}
            <rect x="280" y="190" width="40" height="50" rx="20" fill="white" opacity="0.2" />
          </svg>
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-[#2563EB] dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight">Campaign</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30">
                  Email + Push
                </span>
              </div>
              <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">Send email and/or push notification to All, by Masjid, or select users.</p>
            </div>
          </div>
          <Button onClick={openComposer} className="h-10 px-5 rounded-[10px] text-[13px] font-semibold gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] shadow-lg shadow-blue-500/20 shrink-0">
            <Plus className="w-4 h-4" /> New Campaign
          </Button>
        </div>
      </div>

      {/* ─── TOOLBAR ─── */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#94A3B8]" />
          <span className="text-[13px] font-medium text-[#64748B] dark:text-[#94A3B8]">Current Masjid</span>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, title, or content..."
            className="w-full sm:w-[300px] h-9 pl-9 pr-4 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB]/10 transition-all dark:text-white dark:focus:bg-white/10"
          />
        </div>
      </div>

      {/* ─── SEND STATUS BANNER ─── */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-[13px] font-medium ${msg.includes('Sent') ? 'bg-[#ECFDF5] dark:bg-emerald-900/20 border-[#10B981]/25 text-[#065F46] dark:text-[#6EE7B7]' : 'bg-[#FEF2F2] dark:bg-red-900/20 border-[#EF4444]/25 text-[#991B1B] dark:text-[#FCA5A5]'}`}>
          {msg}
          <button onClick={() => setMsg('')} className="ml-auto p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── CAMPAIGN HISTORY ─── */}
      <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
        {/* Subtle mosque watermark */}
        <div className="absolute -right-6 -top-6 w-[200px] h-[140px] opacity-[0.03] dark:opacity-[0.045] pointer-events-none select-none" aria-hidden="true">
          <svg viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="300" cy="120" rx="90" ry="70" fill="#8B5CF6" />
            <path d="M300 42 c6 0 11 8 8 16 c-2 5-7 8-8 8 c-1 0-6-3-8-8 c-3-8 2-16 8-16z" fill="#8B5CF6" />
            <rect x="140" y="60" width="24" height="180" rx="4" fill="#8B5CF6" />
            <ellipse cx="152" cy="58" rx="16" ry="14" fill="#8B5CF6" />
            <path d="M152 38 c3 0 5 5 4 10 c-1 3-3 5-4 5 c-1 0-3-2-4-5 c-1-5 1-10 4-10z" fill="#8B5CF6" />
            <rect x="436" y="60" width="24" height="180" rx="4" fill="#8B5CF6" />
            <ellipse cx="448" cy="58" rx="16" ry="14" fill="#8B5CF6" />
            <path d="M448 38 c3 0 5 5 4 10 c-1 3-3 5-4 5 c-1 0-3-2-4-5 c-1-5 1-10 4-10z" fill="#8B5CF6" />
            <rect x="160" y="130" width="280" height="110" rx="6" fill="#8B5CF6" />
            <ellipse cx="220" cy="130" rx="30" ry="20" fill="#8B5CF6" />
            <ellipse cx="380" cy="130" rx="30" ry="20" fill="#8B5CF6" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] dark:border-[#2a3042]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] dark:bg-purple-900/20 flex items-center justify-center">
              <History className="w-5 h-5 text-[#8B5CF6] dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Campaign History</h3>
              <p className="text-[12px] text-[#94A3B8]">All your sent campaigns and their details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={historyFilter}
              onChange={e => setHistoryFilter(e.target.value)}
              className="h-8 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white text-[12px] font-medium text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              <option value="ALL">All Types</option>
              <option value="PUSH">Push</option>
              <option value="EMAIL">Email</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredCampaigns.length > 0 ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#141925] border-b border-[#E2E8F0] dark:border-[#2a3042]">
                  <th className="text-left px-6 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">Time</th>
                  <th className="text-left px-6 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">Title</th>
                  <th className="text-left px-6 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">Target</th>
                  <th className="text-left px-6 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">Sent</th>
                  <th className="text-left px-6 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">By</th>
                  <th className="text-right px-6 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((c: any) => (
                  <tr key={c.id} className="border-b border-[#F1F5F9] dark:border-[#1e2536] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-[12px] text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : '-'}
                      <br />
                      <span className="text-[11px] text-[#94A3B8]">
                        {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-semibold text-[#0F172A] dark:text-white">{c.title}</div>
                      <div className="text-[12px] text-[#94A3B8] truncate max-w-[260px]">{c.body}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${typeBadge(c.type)}`}>{c.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${targetBadge(c.targetType)}`}>{c.targetType}</span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-[#0F172A] dark:text-white">{c.sentCount}</td>
                    <td className="px-6 py-4 text-[12px] text-[#64748B] dark:text-[#94A3B8]">{c.createdByEmail}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg opacity-40 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-4 h-4 text-[#EF4444]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Empty State */
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center">
                <Megaphone className="w-8 h-8 text-[#94A3B8]" />
              </div>
              <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">No campaigns yet</h3>
              <p className="text-[13px] text-[#94A3B8] mb-4 max-w-[300px] mx-auto">Create your first campaign to start reaching your users.</p>
              <Button
                onClick={openComposer}
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-[10px] text-[12px] font-semibold gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Campaign
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* New Campaign popup */}
      {showComposer && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => !sendMut.isPending && setShowComposer(false)} />
          <div className="relative w-full max-w-[860px] max-h-[92vh] overflow-y-auto bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#1a1f2e] border-b border-[#E2E8F0] dark:border-[#2a3042] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white">New Campaign</h3>
                  <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">Send email and/or push notification.</p>
                </div>
              </div>
              <button onClick={() => !sendMut.isPending && setShowComposer(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Row 1: Type, Target, Title */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Type</Label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="h-[46px] w-full rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                  >
                    <option value="PUSH">Push Notification</option>
                    <option value="EMAIL">Email</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Target</Label>
                  <select
                    value={targetType}
                    onChange={e => setTargetType(e.target.value as any)}
                    className="h-[46px] w-full rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                  >
                    <option value="ALL">All Users</option>
                    <option value="MASJID">By Masjid</option>
                    <option value="USER">Select Users</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Title *</Label>
                    <span className="text-[11px] text-[#94A3B8]">{title.length}/100</span>
                  </div>
                  <Input
                    ref={titleRef as any}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter campaign title"
                    maxLength={100}
                    className="h-[46px] rounded-[10px] text-[13px] border-[#E2E8F0] dark:border-[#2a3042] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Email subject field */}
              {(type === 'EMAIL' || type === 'BOTH') && (
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Email Subject</Label>
                  <Input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Subject for email"
                    className="h-[46px] rounded-[10px] text-[13px] border-[#E2E8F0] dark:border-[#2a3042] focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              )}

              {/* Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Body *</Label>
                  <span className="text-[11px] text-[#94A3B8]">{body.length}/1000</span>
                </div>
                <Textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write your message here..."
                  maxLength={1000}
                  className="min-h-[120px] rounded-[10px] text-[13px] border-[#E2E8F0] dark:border-[#2a3042] focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none"
                />
              </div>

              {/* Target: MASJID */}
              {targetType === 'MASJID' && (
                <div className="space-y-3">
                  <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Select Masjids ({selectedMasjids.length} selected)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      value={masjidSearch}
                      onChange={e => setMasjidSearch(e.target.value)}
                      placeholder="Search masjids by name or pincode..."
                      className="w-full h-[42px] pl-10 pr-4 rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] text-[13px] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto border border-[#E2E8F0] dark:border-[#2a3042] p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/5">
                    {(masjids || []).filter((m: any) => {
                      const q = masjidSearch.toLowerCase()
                      return !q || m.name?.toLowerCase().includes(q) || m.pincode?.toLowerCase().includes(q)
                    }).map((m: any) => (
                      <label key={m.id} className="flex items-center gap-2.5 text-[13px] bg-white dark:bg-[#1a1f2e] p-2.5 rounded-lg border border-[#E2E8F0] dark:border-[#2a3042] cursor-pointer hover:border-[#2563EB]/30 dark:hover:border-blue-500/30 transition-all text-[#0F172A] dark:text-white">
                        <input type="checkbox" checked={selectedMasjids.includes(m.id)} onChange={() => { toggleMasjid(m.id); setSelectedMasjidUsers([]) }} className="accent-[#2563EB]" />
                        <Building2 className="w-4 h-4 text-[#64748B]" />
                        <span className="font-medium">{m.name}</span>
                        <span className="text-[11px] text-[#94A3B8]">({m.pincode})</span>
                      </label>
                    ))}
                  </div>
                  {selectedMasjids.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Filter specific users (optional)</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                          value={masjidUserSearch}
                          onChange={e => setMasjidUserSearch(e.target.value)}
                          placeholder="Search users by name or email..."
                          className="w-full h-[42px] pl-10 pr-4 rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] text-[13px] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                        />
                      </div>
                      <div className="border border-[#E2E8F0] dark:border-[#2a3042] rounded-xl bg-white dark:bg-[#1a1f2e] max-h-[200px] overflow-y-auto divide-y divide-[#F1F5F9] dark:divide-[#2a3042]">
                        {(masjidUsersData || []).filter((u: any) => {
                          const q = masjidUserSearch.toLowerCase()
                          return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
                        }).map((u: any) => (
                          <label key={u.userId} className="flex items-center gap-2.5 p-2.5 text-[13px] hover:bg-[#F8FAFC] dark:hover:bg-white/5 cursor-pointer text-[#0F172A] dark:text-white transition-colors">
                            <input type="checkbox" checked={selectedMasjidUsers.includes(u.userId)} onChange={() => { setSelectedMasjidUsers(prev => prev.includes(u.userId) ? prev.filter(x => x !== u.userId) : [...prev, u.userId]) }} className="accent-[#2563EB]" />
                            <Users className="w-4 h-4 text-[#64748B]" />
                            <span className="font-medium">{u.name}</span>
                            <span className="text-[11px] text-[#94A3B8]">{u.email}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Target: USER */}
              {targetType === 'USER' && (
                <div className="space-y-2">
                  <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Select Users ({selectedUsers.length} selected)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="pl-10 h-[42px] rounded-[10px] text-[13px]"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto border border-[#E2E8F0] dark:border-[#2a3042] rounded-xl divide-y divide-[#F1F5F9] dark:divide-[#2a3042] bg-white dark:bg-[#1a1f2e]">
                    {(users || []).slice(0, 50).map((u: any) => (
                      <label key={u.id} className="flex items-center gap-2.5 p-2.5 text-[13px] hover:bg-[#F8FAFC] dark:hover:bg-white/5 cursor-pointer text-[#0F172A] dark:text-white transition-colors">
                        <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)} className="accent-[#2563EB]" />
                        <Users className="w-4 h-4 text-[#64748B]" />
                        <span className="font-medium">{u.name}</span>
                        <span className="text-[11px] text-[#94A3B8]">{u.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" className="h-11 px-5 rounded-[10px] text-[13px] font-semibold" onClick={() => !sendMut.isPending && setShowComposer(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => sendMut.mutate()}
                  disabled={!title || !body || sendMut.isPending}
                  className="h-11 px-6 rounded-[10px] text-[13px] font-semibold gap-2 bg-[#10B981] hover:bg-[#059669] text-white shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {sendMut.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send {type === 'EMAIL' ? 'Email' : type === 'BOTH' ? 'Campaign' : 'Push'}</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-6 w-full max-w-[400px] border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#FEF2F2] dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#0F172A] dark:text-white">Delete Campaign</h3>
                <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-5 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-[#0F172A] dark:text-white">"{deleteTarget.title}"</span>? This will permanently remove the campaign record.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-[10px] gap-1.5"
                onClick={() => deleteMut.mutate(deleteTarget.id)}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {deleteMut.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
