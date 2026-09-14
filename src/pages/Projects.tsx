import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Download, Search, Building2, Clock, Eye, CheckCircle, MapPin,
  Phone, Mail, Globe, CalendarDays, X, AlertTriangle,
  Inbox, ArrowRight, Landmark, ExternalLink, FileText,
  Mosque, Info, Hash, TrendingUp, ShieldCheck, ChevronDown, Loader2, Users
} from 'lucide-react'

type MasjidLead = any

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; text: string }> = {
  NEW: { label: 'New Lead', color: '#2563EB', bg: '#DBEAFE', text: '#1E40AF' },
  PENDING: { label: 'Pending Review', color: '#F59E0B', bg: '#FEF3C7', text: '#92400E' },
  REVIEW: { label: 'Under Review', color: '#8B5CF6', bg: '#EDE9FE', text: '#5B21B6' },
  CHANGES: { label: 'Changes Requested', color: '#F59E0B', bg: '#FEF9C3', text: '#854D0E' },
  APPROVED: { label: 'Approved', color: '#10B981', bg: '#D1FAE5', text: '#065F46' },
  REJECTED: { label: 'Rejected', color: '#EF4444', bg: '#FEE2E2', text: '#991B1B' },
  LIVE: { label: 'Live', color: '#10B981', bg: '#D1FAE5', text: '#065F46' },
}

function normVerified(v: any) {
  if (v === 'APPROVE') return 'APPROVED'
  if (v === 'REJECT') return 'REJECTED'
  return v
}

function getLeadStatus(m: MasjidLead) {
  if (m.isDeleted === 1) return 'REJECTED'
  const v = normVerified(m.adminVerified)
  if (v === 'APPROVED') return 'LIVE'
  if (v === 'REJECTED') return 'REJECTED'
  return 'PENDING'
}

function getStatusBadge(status: string) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEW
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function formatDate(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const PIPELINE_STAGES = [
  { key: 'new', label: 'New Lead', num: '01', color: '#2563EB' },
  { key: 'review', label: 'Review', num: '02', color: '#8B5CF6' },
  { key: 'approved', label: 'Approved', num: '03', color: '#10B981' },
  { key: 'created', label: 'Masjid Created', num: '04', color: '#0EA5E9' },
  { key: 'live', label: 'Live', num: '05', color: '#10B981' },
]

export default function Projects() {
  const qc = useQueryClient()
  const { data: masjids = [], isLoading, error } = useQuery({
    queryKey: ['master-masjids'],
    queryFn: async () => (await masterApi.masjids.list()).data ?? [],
    retry: 2,
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [view, setView] = useState<'list' | 'table'>('list')
  const [drawerMasjid, setDrawerMasjid] = useState<MasjidLead | null>(null)
  const [showApproveModal, setShowApproveModal] = useState<MasjidLead | null>(null)
  const [showRejectModal, setShowRejectModal] = useState<MasjidLead | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [verifyErr, setVerifyErr] = useState('')
  const [drawerTab, setDrawerTab] = useState<'info' | 'lead' | 'notes'>('info')
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<any>({ name: '', pincode: '', city: '', state: '', country: 'India', phone: '', email: '', address: '', adminEmail: '', adminName: '', adminPhone: '', adminPassword: '', adminRole: 'MANAGEMENT' })
  const [addErr, setAddErr] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  const allLeads = useMemo(() => masjids || [], [masjids])
  const drawerVerified = drawerMasjid ? normVerified(drawerMasjid.adminVerified) : null

  const verifyMut = useMutation({
    mutationFn: ({ id, action, remark }: { id: number; action: string; remark?: string }) =>
      masterApi.masjids.verify(id, action, remark),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-masjids'] }) },
  })

  const createMut = useMutation({
    mutationFn: () => masterApi.masjids.create(addForm),
    onSuccess: () => {
      setAddForm({ name: '', pincode: '', city: '', state: '', country: 'India', phone: '', email: '', address: '', adminEmail: '', adminName: '', adminPhone: '', adminPassword: '', adminRole: 'MANAGEMENT' })
      setAddErr('')
      setShowAdd(false)
      qc.invalidateQueries({ queryKey: ['master-masjids'] })
    },
    onError: (e: any) => setAddErr(e.response?.data?.message || 'Create failed'),
  })

  const openAdd = () => {
    setAddErr('')
    setShowAdd(true)
    setTimeout(() => nameRef.current?.focus(), 150)
  }

  useEffect(() => {
    if (!showAdd) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !createMut.isPending) setShowAdd(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [showAdd, createMut.isPending])

  const stats = useMemo(() => {
    const total = allLeads.length
    const pending = allLeads.filter((m: any) => ['PENDING', 'NEW'].includes(getLeadStatus(m))).length
    const review = allLeads.filter((m: any) => getLeadStatus(m) === 'PENDING').length
    const approved = allLeads.filter((m: any) => getLeadStatus(m) === 'LIVE').length
    const live = approved
    return { total, pending, review, approved, live }
  }, [allLeads])

  const pipelineCounts = useMemo(() => {
    const all = allLeads.filter((m: any) => getLeadStatus(m) !== 'REJECTED')
    const pendingCount = all.filter((m: any) => ['PENDING', 'NEW'].includes(getLeadStatus(m))).length
    const liveCount = all.filter((m: any) => getLeadStatus(m) === 'LIVE').length
    return {
      new: all.filter((m: any) => getLeadStatus(m) === 'NEW').length,
      review: pendingCount,
      approved: liveCount,
      created: liveCount,
      live: liveCount,
    }
  }, [allLeads])

  const filtered = useMemo(() => {
    let list = [...allLeads]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((m: any) =>
        m.name?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q) ||
        m.state?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.address?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((m: any) => getLeadStatus(m) === statusFilter)
    }
    return list
  }, [allLeads, search, statusFilter])

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">Unable to load onboarding leads</h3>
          <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-4">Something went wrong while retrieving Masjid applications.</p>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['master-masjids'] })}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      {/* Watermark */}
      <div className="absolute top-8 right-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
        <svg width="280" height="280" viewBox="0 0 200 200" fill="none">
          <path d="M100 10 L100 60 M80 60 L120 60 M100 60 L100 90 M70 90 L130 90 L130 120 L70 120Z M90 120 L90 150 L110 150 L110 120" stroke="currentColor" strokeWidth="3" className="text-[#2563EB] dark:text-[#60A5FA]" />
          <circle cx="100" cy="5" r="5" fill="currentColor" className="text-[#2563EB] dark:text-[#60A5FA]" />
          <path d="M40 150 L40 170 L160 170 L160 150" stroke="currentColor" strokeWidth="2" className="text-[#2563EB] dark:text-[#60A5FA]" />
        </svg>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[#64748B] dark:text-[#94A3B8] mb-1.5">
            <span className="cursor-pointer hover:text-[#2563EB] transition">Dashboard</span>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-[#0F172A] dark:text-white font-medium">Masjid Onboarding</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Mosque className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-[#0F172A] dark:text-white leading-tight">Masjid Onboarding</h1>
              <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8]">Manage Masjid leads, review applications, approve onboarding, and track live Masjids.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 rounded-[10px]">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-1.5 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] shadow-lg shadow-blue-500/20" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5" /> Add Masjid
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
          { icon: Inbox, label: 'Total Leads', value: stats.total, color: '#2563EB', bg: '#EFF6FF' },
          { icon: Clock, label: 'Pending Review', value: stats.pending, color: '#F59E0B', bg: '#FFFBEB' },
          { icon: Eye, label: 'Under Review', value: stats.review, color: '#8B5CF6', bg: '#F5F3FF' },
          { icon: CheckCircle, label: 'Approved', value: stats.approved, color: '#10B981', bg: '#ECFDF5' },
          { icon: Building2, label: 'Live Masjids', value: stats.live, color: '#0EA5E9', bg: '#F0F9FF' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536] p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                <s.icon className="w-[18px] h-[18px]" style={{ color: s.color }} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-[#10B981] opacity-60" />
            </div>
            <div className="text-[22px] font-bold text-[#0F172A] dark:text-white leading-none mb-0.5">{s.value}</div>
            <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536] p-5 mb-6">
        <h3 className="text-[13px] font-semibold text-[#0F172A] dark:text-white mb-4">Onboarding Pipeline</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, i) => {
            const count = pipelineCounts[stage.key as keyof typeof pipelineCounts] || 0
            return (
              <div key={stage.key} className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-center min-w-[120px]">
                  <div className="text-[10px] font-bold text-[#94A3B8] mb-1">{stage.num}</div>
                  <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed text-center transition-all duration-200 hover:shadow-sm"
                    style={{ borderColor: stage.color + '40', backgroundColor: stage.color + '08' }}>
                    <div className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] mb-1">{stage.label}</div>
                    <div className="text-[20px] font-bold" style={{ color: stage.color }}>{count}</div>
                  </div>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[#CBD5E1] dark:text-[#475569] shrink-0 mt-2" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536] p-3 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by Masjid name, contact person, phone, email, city..."
            className="w-full h-9 pl-9 pr-4 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[13px] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#E2E8F0] dark:focus:border-[#2a3042] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] focus:outline-none focus:bg-white dark:focus:bg-white/10 cursor-pointer">
            <option value="ALL">All Status</option>
            <option value="NEW">New</option>
            <option value="PENDING">Pending Review</option>
            <option value="REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="LIVE">Live</option>
          </select>
          <div className="flex items-center bg-[#F1F5F9] dark:bg-white/5 rounded-[10px] p-0.5">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition ${view === 'list' ? 'bg-white dark:bg-[#1a1f2e] text-[#0F172A] dark:text-white shadow-sm' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>List</button>
            <button onClick={() => setView('table')} className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition ${view === 'table' ? 'bg-white dark:bg-[#1a1f2e] text-[#0F172A] dark:text-white shadow-sm' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>Table</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536] overflow-hidden">
        <div className="p-5 border-b border-[#F1F5F9] dark:border-[#1e2536] flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white">Masjid Onboarding Leads</h3>
            <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">Review and manage incoming Masjid onboarding applications.</p>
          </div>
          <span className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">{filtered.length} leads</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-[#F1F5F9] dark:border-[#1e2536] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] dark:bg-white/5" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-[#F1F5F9] dark:bg-white/5 rounded-lg w-1/3" />
                    <div className="h-3 bg-[#F1F5F9] dark:bg-white/5 rounded-lg w-1/2" />
                    <div className="flex gap-4">
                      <div className="h-3 bg-[#F1F5F9] dark:bg-white/5 rounded-lg w-24" />
                      <div className="h-3 bg-[#F1F5F9] dark:bg-white/5 rounded-lg w-32" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Mosque className="w-8 h-8 text-[#CBD5E1] dark:text-[#475569]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">No onboarding leads yet</h3>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-4">New Masjid onboarding applications will appear here.</p>
            <Button size="sm" className="gap-1.5 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6]" onClick={openAdd}>
              <Plus className="w-3.5 h-3.5" /> Add Masjid
            </Button>
          </div>
        ) : view === 'list' ? (
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#1e2536]">
            {filtered.map((m: any) => {
              const status = getLeadStatus(m)
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEW
              return (
                <div key={m.id} className="p-5 hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cfg.bg }}>
                      <Mosque className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="text-[14px] font-semibold text-[#0F172A] dark:text-white flex items-center gap-2">
                            {m.name}
                            {normVerified(m.adminVerified) === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[10px] font-bold text-[#10B981]">
                                <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                              </span>
                            )}
                            {normVerified(m.adminVerified) !== 'APPROVED' && normVerified(m.adminVerified) !== 'REJECTED' && m.isDeleted !== 1 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[10px] font-bold text-[#F59E0B]">
                                <Info className="w-2.5 h-2.5" /> UNVERIFIED
                              </span>
                            )}
                            {normVerified(m.adminVerified) === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EF4444]/10 text-[10px] font-bold text-[#EF4444]">
                                <X className="w-2.5 h-2.5" /> REJECTED
                              </span>
                            )}
                          </h4>
                          <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {[m.city, m.state, m.country].filter(Boolean).join(', ') || '—'}
                          </p>
                        </div>
                        {getStatusBadge(status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1.5 text-[12px] mb-3">
                        {m.phone && (
                          <div className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                            <Phone className="w-3 h-3 shrink-0" /> {m.phone}
                          </div>
                        )}
                        {m.email && (
                          <div className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                            <Mail className="w-3 h-3 shrink-0" /> {m.email}
                          </div>
                        )}
                        {m.website && (
                          <div className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                            <Globe className="w-3 h-3 shrink-0" /> {m.website}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                          <CalendarDays className="w-3 h-3 shrink-0" /> Created {formatDate(m.createdAt)}
                        </div>
                      </div>

                      {m.address && (
                        <p className="text-[12px] text-[#94A3B8] dark:text-[#64748B] mb-3 line-clamp-1">
                          <MapPin className="w-3 h-3 inline mr-1" />{m.address}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="rounded-[8px] text-[12px] h-8 gap-1.5"
                          onClick={() => { setDrawerMasjid(m); setDrawerTab('info') }}>
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </Button>
                        {normVerified(m.adminVerified) !== 'APPROVED' && m.isDeleted !== 1 ? (
                          <Button size="sm" variant="outline" className="rounded-[8px] text-[12px] h-8 gap-1.5 border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/5"
                            onClick={() => { setDrawerMasjid(m); setDrawerTab('lead') }}>
                            <FileText className="w-3.5 h-3.5" /> {normVerified(m.adminVerified) === 'REJECTED' ? 'Re-review' : 'Review Application'}
                          </Button>
                        ) : null}
                        {normVerified(m.adminVerified) === 'APPROVED' && (
                          <Link to={`/masjids/${m.id}`}>
                            <Button size="sm" variant="outline" className="rounded-[8px] text-[12px] h-8 gap-1.5 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/5">
                              <ExternalLink className="w-3.5 h-3.5" /> Open Masjid
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#F1F5F9] dark:border-[#1e2536]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Masjid</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Location</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Created</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1e2536]">
                {filtered.map((m: any) => {
                  const status = getLeadStatus(m)
                  return (
                    <tr key={m.id} className="hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                            <Mosque className="w-4 h-4 text-[#2563EB]" />
                          </div>
                          <div>
                            <div className="font-semibold text-[#0F172A] dark:text-white text-[13px] flex items-center gap-1.5">
                              {m.name}
                              {normVerified(m.adminVerified) === 'APPROVED' && <ShieldCheck className="w-3 h-3 text-[#10B981]" />}
                              {normVerified(m.adminVerified) === 'REJECTED' && <X className="w-3 h-3 text-[#EF4444]" />}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12px] text-[#64748B] dark:text-[#94A3B8]">{[m.city, m.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">{m.phone || '—'}</div>
                        <div className="text-[11px] text-[#94A3B8] dark:text-[#64748B]">{m.email || ''}</div>
                      </td>
                      <td className="px-5 py-3">{getStatusBadge(status)}</td>
                      <td className="px-5 py-3 text-[12px] text-[#64748B] dark:text-[#94A3B8]">{formatDate(m.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setDrawerMasjid(m); setDrawerTab('info') }}
                            className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition" title="View Details">
                            <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                          </button>
                          {normVerified(m.adminVerified) !== 'APPROVED' && m.isDeleted !== 1 ? (
                            <button onClick={() => { setDrawerMasjid(m); setDrawerTab('lead') }}
                              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition" title="Review">
                              <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                            </button>
                          ) : null}
                          {normVerified(m.adminVerified) === 'APPROVED' && (
                            <Link to={`/masjids/${m.id}`} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition" title="Open Masjid">
                              <ExternalLink className="w-3.5 h-3.5 text-[#10B981]" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Drawer */}
      {drawerMasjid && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerMasjid(null)} />
          <div className="relative w-full max-w-[600px] bg-white dark:bg-[#141925] shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#141925] border-b border-[#E2E8F0] dark:border-[#1e2536] px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Review Masjid Application</h3>
                  <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{drawerMasjid.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(getLeadStatus(drawerMasjid))}
                  <button onClick={() => setDrawerMasjid(null)} className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
                    <X className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {[
                  { key: 'info' as const, label: 'Details' },
                  { key: 'lead' as const, label: 'Review' },
                  { key: 'notes' as const, label: 'Timeline' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setDrawerTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition ${drawerTab === tab.key ? 'bg-[#2563EB] text-white' : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-white/5'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {drawerTab === 'info' && (
                <>
                  {/* Masjid Info */}
                  <Section title="Masjid Information">
                    <InfoRow icon={Mosque} label="Masjid Name" value={drawerMasjid.name} />
                    {drawerMasjid.address && <InfoRow icon={MapPin} label="Address" value={drawerMasjid.address} />}
                    {drawerMasjid.city && <InfoRow icon={MapPin} label="City" value={[drawerMasjid.city, drawerMasjid.state].filter(Boolean).join(', ')} />}
                    {drawerMasjid.pincode && <InfoRow icon={Hash} label="Pincode" value={drawerMasjid.pincode} />}
                    {drawerMasjid.country && <InfoRow icon={Globe} label="Country" value={drawerMasjid.country} />}
                    {drawerMasjid.website && <InfoRow icon={Globe} label="Website" value={drawerMasjid.website} />}
                  </Section>

                  {/* Contact */}
                  <Section title="Contact Information">
                    {drawerMasjid.phone && <InfoRow icon={Phone} label="Phone" value={drawerMasjid.phone} />}
                    {drawerMasjid.email && <InfoRow icon={Mail} label="Email" value={drawerMasjid.email} />}
                  </Section>

                  {/* Verification */}
                  <Section title="Verification">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03]">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-[12px] font-bold text-white">
                        {drawerMasjid.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#0F172A] dark:text-white">{drawerMasjid.name}</div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {drawerVerified === 'APPROVED' ? 'Verified by Admin' : drawerVerified === 'REJECTED' ? 'Rejected by Admin' : 'Awaiting Verification'}
                        </div>
                        {drawerMasjid.adminVerifiedAt && (
                          <div className="text-[10px] text-[#94A3B8] dark:text-[#64748B] mt-0.5">
                            {drawerVerified === 'APPROVED' ? 'Approved' : drawerVerified === 'REJECTED' ? 'Rejected' : 'Last action'} on {formatDateTime(drawerMasjid.adminVerifiedAt)}
                          </div>
                        )}
                      </div>
                      <div className="ml-auto">
                        {drawerVerified === 'APPROVED' ? (
                          <span className="px-2 py-1 rounded-full bg-[#10B981]/10 text-[10px] font-bold text-[#10B981]">APPROVED</span>
                        ) : drawerVerified === 'REJECTED' ? (
                          <span className="px-2 py-1 rounded-full bg-[#EF4444]/10 text-[10px] font-bold text-[#EF4444]">REJECTED</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-[#F59E0B]/10 text-[10px] font-bold text-[#F59E0B]">PENDING</span>
                        )}
                      </div>
                    </div>
                  </Section>

                  {/* Timeline */}
                  <Section title="Onboarding Timeline">
                    <div className="space-y-0">
                      <TimelineStep icon={CheckCircle} label="Lead Received" date={drawerMasjid.createdAt} done />
                      {drawerVerified === 'APPROVED' && (
                        <>
                          <TimelineStep icon={CheckCircle} label="Verified by Admin" date={drawerMasjid.adminVerifiedAt} done />
                          <TimelineStep icon={CheckCircle} label="Masjid Live" date={drawerMasjid.adminVerifiedAt} done />
                        </>
                      )}
                      {drawerVerified === 'REJECTED' && (
                        <TimelineStep icon={X} label="Rejected" date={drawerMasjid.adminVerifiedAt} done={false} />
                      )}
                      {drawerVerified !== 'APPROVED' && drawerVerified !== 'REJECTED' && drawerMasjid.isDeleted !== 1 && (
                        <>
                          <TimelineStep icon={Clock} label="Awaiting Review" date={null} done={false} current />
                          <TimelineStep icon={Clock} label="Approval Pending" date={null} done={false} />
                          <TimelineStep icon={Clock} label="Masjid Live" date={null} done={false} />
                        </>
                      )}
                    </div>
                  </Section>
                </>
              )}

              {drawerTab === 'lead' && (
                <>
                  <Section title="Review Checklist">
                    <div className="space-y-3">
                      {[
                        { label: 'Masjid name is valid', checked: !!drawerMasjid.name },
                        { label: 'Address provided', checked: !!drawerMasjid.address },
                        { label: 'Contact information complete', checked: !!(drawerMasjid.phone || drawerMasjid.email) },
                        { label: 'City and state specified', checked: !!(drawerMasjid.city && drawerMasjid.state) },
                        { label: 'Pincode provided', checked: !!drawerMasjid.pincode },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03]">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${item.checked ? 'bg-[#10B981] border-[#10B981]' : 'border-[#CBD5E1] dark:border-[#475569]'}`}>
                            {item.checked && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-[13px] ${item.checked ? 'text-[#0F172A] dark:text-white' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Admin Notes">
                    <Textarea placeholder="Add internal review notes..." className="min-h-[100px] text-[13px]" />
                  </Section>
                </>
              )}

              {drawerTab === 'notes' && (
                <>
                  <Section title="Activity Timeline">
                    <div className="space-y-0">
                      <TimelineStep icon={CheckCircle} label="Lead Received" date={drawerMasjid.createdAt} done />
                      {drawerVerified === 'APPROVED' && (
                        <>
                          <TimelineStep icon={CheckCircle} label="Reviewed by Admin" date={drawerMasjid.adminVerifiedAt} done />
                          <TimelineStep icon={CheckCircle} label="Approved & Verified" date={drawerMasjid.adminVerifiedAt} done />
                          <TimelineStep icon={CheckCircle} label="Masjid is Live" date={drawerMasjid.adminVerifiedAt} done />
                        </>
                      )}
                      {drawerVerified === 'REJECTED' && (
                        <TimelineStep icon={X} label="Application Rejected" date={drawerMasjid.adminVerifiedAt} done={false} />
                      )}
                      {drawerVerified !== 'APPROVED' && drawerVerified !== 'REJECTED' && drawerMasjid.isDeleted !== 1 && (
                        <>
                          <TimelineStep icon={Clock} label="Awaiting Review" date={null} done={false} current />
                          <TimelineStep icon={Clock} label="Approval Pending" date={null} done={false} />
                          <TimelineStep icon={Clock} label="Masjid Live" date={null} done={false} />
                        </>
                      )}
                    </div>
                  </Section>

                  <Section title="Masjid Details">
                    <div className="grid grid-cols-2 gap-3">
                      <InfoRow icon={Hash} label="Masjid ID" value={`MASJID-${String(drawerMasjid.id).padStart(5, '0')}`} />
                      <InfoRow icon={CalendarDays} label="Created" value={formatDate(drawerMasjid.createdAt)} />
                      {drawerMasjid.updatedAt && <InfoRow icon={CalendarDays} label="Last Updated" value={formatDate(drawerMasjid.updatedAt)} />}
                      <InfoRow icon={ShieldCheck} label="Verified" value={drawerVerified === 'APPROVED' ? 'Approved' : drawerVerified === 'REJECTED' ? 'Rejected' : 'Pending'} />
                      {drawerMasjid.adminVerifiedAt && <InfoRow icon={CalendarDays} label="Verified At" value={formatDateTime(drawerMasjid.adminVerifiedAt)} />}
                      {drawerMasjid.adminVerifiedBy != null && <InfoRow icon={Hash} label="Verified By (User ID)" value={String(drawerMasjid.adminVerifiedBy)} />}
                    </div>
                  </Section>
                </>
              )}
            </div>
            {/* Sticky action footer — visible on every tab */}
            {drawerVerified !== 'APPROVED' && drawerMasjid.isDeleted !== 1 && (
              <div className="sticky bottom-0 z-10 bg-white dark:bg-[#141925] border-t border-[#E2E8F0] dark:border-[#1e2536] px-6 py-4">
                <div className="flex gap-3">
                  {drawerVerified !== 'REJECTED' && (
                    <Button variant="outline" size="sm" className="rounded-[10px] gap-1.5 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/5"
                      onClick={() => { setShowRejectModal(drawerMasjid); setDrawerMasjid(null) }}>
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                  )}
                  <div className="flex-1" />
                  <Button size="sm" className="rounded-[10px] gap-1.5 bg-gradient-to-r from-[#10B981] to-[#059669] shadow-lg shadow-emerald-500/20"
                    onClick={() => { setShowApproveModal(drawerMasjid); setDrawerMasjid(null) }}>
                    <CheckCircle className="w-3.5 h-3.5" /> {drawerVerified === 'REJECTED' ? 'Approve Anyway' : 'Verify & Approve'}
                  </Button>
                </div>
              </div>
            )}
            {drawerVerified === 'APPROVED' && (
              <div className="sticky bottom-0 z-10 bg-white dark:bg-[#141925] border-t border-[#E2E8F0] dark:border-[#1e2536] px-6 py-4">
                <Link to={`/masjids/${drawerMasjid.id}`}>
                  <Button size="sm" variant="outline" className="w-full rounded-[10px] gap-1.5 border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/5">
                    <ExternalLink className="w-3.5 h-3.5" /> View Masjid
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Masjid popup */}
      {showAdd && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => !createMut.isPending && setShowAdd(false)} />
          <div className="relative w-full max-w-[640px] max-h-[92vh] overflow-y-auto bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#1a1f2e] border-b border-[#E2E8F0] dark:border-[#2a3042] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] dark:bg-emerald-900/30 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#10B981] dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Add New Masjid + Admin</h3>
                  <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">Fill in details to onboard a new masjid</p>
                </div>
              </div>
              <button onClick={() => !createMut.isPending && setShowAdd(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[12px]">Masjid Name *</Label><Input ref={nameRef as any} value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="Noor Masjid" className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">Pincode *</Label><Input value={addForm.pincode} onChange={e => setAddForm({ ...addForm, pincode: e.target.value })} placeholder="110025" className="h-10" /></div>
                <div className="space-y-1.5 md:col-span-2"><Label className="text-[12px]">Address</Label><Input value={addForm.address} onChange={e => setAddForm({ ...addForm, address: e.target.value })} placeholder="Full address" className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">City</Label><Input value={addForm.city} onChange={e => setAddForm({ ...addForm, city: e.target.value })} placeholder="Mumbai" className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">State</Label><Input value={addForm.state} onChange={e => setAddForm({ ...addForm, state: e.target.value })} placeholder="Maharashtra" className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">Phone</Label><Input value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="9876543210" className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">Email</Label><Input value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="info@masjid.com" className="h-10" /></div>
              </div>
              <div className="border-t border-[#F1F5F9] dark:border-[#2a3042] pt-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#DBEAFE] dark:bg-blue-900/30 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" /></div>
                  <span className="text-[13px] font-semibold text-[#0F172A] dark:text-white">Admin for this masjid <span className="text-[#94A3B8] font-normal">(optional)</span></span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-[12px]">Admin Email</Label><Input value={addForm.adminEmail} onChange={e => setAddForm({ ...addForm, adminEmail: e.target.value })} placeholder="imam@masjid.com" className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[12px]">Admin Name</Label><Input value={addForm.adminName} onChange={e => setAddForm({ ...addForm, adminName: e.target.value })} placeholder="Imam Sahab" className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[12px]">Admin Phone</Label><Input value={addForm.adminPhone} onChange={e => setAddForm({ ...addForm, adminPhone: e.target.value })} className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[12px]">Password (if new user)</Label><Input type="password" value={addForm.adminPassword} onChange={e => setAddForm({ ...addForm, adminPassword: e.target.value })} placeholder="Masjid@123" className="h-10" /></div>
                  <div className="space-y-1.5"><Label className="text-[12px]">Masjid Role</Label>
                    <select value={addForm.adminRole} onChange={e => setAddForm({ ...addForm, adminRole: e.target.value })} className="h-10 w-full rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition">
                      <option value="MANAGEMENT">MANAGEMENT</option><option value="ADMIN">ADMIN</option><option value="EMPLOYEE">EMPLOYEE</option>
                    </select>
                  </div>
                </div>
              </div>
              {addErr && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FEF2F2] dark:bg-red-900/20 border border-[#EF4444]/20 text-[13px] font-medium text-[#991B1B] dark:text-[#FCA5A5]">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" /> {addErr}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <Button onClick={() => createMut.mutate()} disabled={!addForm.name || !addForm.pincode || createMut.isPending} className="h-10 px-6 rounded-[10px] text-[13px] font-semibold gap-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] shadow-lg shadow-blue-500/20">
                  {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {createMut.isPending ? 'Creating...' : 'Create Masjid'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => !createMut.isPending && setShowAdd(false)} className="text-[13px] text-[#64748B]">Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowApproveModal(null)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl p-6 w-full max-w-[420px] border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#ECFDF5] dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#0F172A] dark:text-white">Verify & Approve Masjid</h3>
                <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">{showApproveModal.name}</p>
              </div>
            </div>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-5 leading-relaxed">
              Are you sure you want to verify and approve this Masjid? Once approved, the Masjid will be marked as <strong>APPROVED</strong> and visible to users.
            </p>
            {verifyErr && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FEF2F2] dark:bg-red-900/20 border border-[#EF4444]/20 text-[12px] font-medium text-[#991B1B] dark:text-[#FCA5A5] mb-4">
                <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" /> {verifyErr}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => { setShowApproveModal(null); setVerifyErr('') }}>Cancel</Button>
              <Button size="sm" className="rounded-[10px] bg-gradient-to-r from-[#10B981] to-[#059669] gap-1.5"
                disabled={verifyMut.isPending}
                onClick={() => {
                  setVerifyErr('')
                  verifyMut.mutate(
                    { id: showApproveModal.id, action: 'APPROVE' },
                    {
                      onSuccess: () => { setShowApproveModal(null); setVerifyErr('') },
                      onError: (e: any) => setVerifyErr(e.response?.data?.message || 'Approval failed. Is the backend running with latest code?'),
                    }
                  )
                }}>
                <CheckCircle className="w-3.5 h-3.5" /> {verifyMut.isPending ? 'Approving...' : 'Approve Masjid'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowRejectModal(null); setRejectReason('') }} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl p-6 w-full max-w-[420px] border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#FEF2F2] dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#0F172A] dark:text-white">Reject Application</h3>
                <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">{showRejectModal.name}</p>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1.5">Reason for rejection *</label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..." className="min-h-[80px] text-[13px]" />
            </div>
            {verifyErr && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#FEF2F2] dark:bg-red-900/20 border border-[#EF4444]/20 text-[12px] font-medium text-[#991B1B] dark:text-[#FCA5A5] mb-4">
                <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" /> {verifyErr}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => { setShowRejectModal(null); setRejectReason(''); setVerifyErr('') }}>Cancel</Button>
              <Button variant="destructive" size="sm" className="rounded-[10px] gap-1.5" disabled={!rejectReason.trim() || verifyMut.isPending}
                onClick={() => {
                  setVerifyErr('')
                  verifyMut.mutate(
                    { id: showRejectModal.id, action: 'REJECT', remark: rejectReason },
                    {
                      onSuccess: () => { setShowRejectModal(null); setRejectReason(''); setVerifyErr('') },
                      onError: (e: any) => setVerifyErr(e.response?.data?.message || 'Rejection failed. Is the backend running with latest code?'),
                    }
                  )
                }}>
                <X className="w-3.5 h-3.5" /> {verifyMut.isPending ? 'Rejecting...' : 'Reject Application'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03]">
      <Icon className="w-4 h-4 text-[#94A3B8] dark:text-[#64748B] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider">{label}</div>
        <div className="text-[13px] text-[#0F172A] dark:text-white font-medium truncate">{value || '—'}</div>
      </div>
    </div>
  )
}

function TimelineStep({ icon: Icon, label, date, done, current }: { icon: any; label: string; date: string | null; done: boolean; current?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-[#10B981]' : current ? 'bg-[#2563EB] animate-pulse' : 'bg-[#E2E8F0] dark:bg-[#2a3042]'}`}>
          <Icon className={`w-3.5 h-3.5 ${done ? 'text-white' : current ? 'text-white' : 'text-[#94A3B8]'}`} />
        </div>
        <div className="w-px flex-1 bg-[#E2E8F0] dark:bg-[#2a3042] my-1" />
      </div>
      <div className="pb-4">
        <div className={`text-[13px] font-medium ${done ? 'text-[#0F172A] dark:text-white' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>{label}</div>
        {date && <div className="text-[11px] text-[#94A3B8] dark:text-[#64748B] mt-0.5">{formatDateTime(date)}</div>}
      </div>
    </div>
  )
}
