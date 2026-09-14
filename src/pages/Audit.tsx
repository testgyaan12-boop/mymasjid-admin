import { useQuery } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useState, useMemo } from 'react'
import {
  ChevronRight, Search, Shield, Activity, Users, Settings, Loader2,
  Plus, Pencil, Trash2, CheckCircle2, XCircle, LogIn, LogOut, Send,
  Lock, UserPlus, Eye, Clock, AlertTriangle, FileText, ChevronLeft,
  RefreshCw, Download, SlidersHorizontal, List, LayoutGrid
} from 'lucide-react'

const PAGE_SIZE = 20

const actionConfig: Record<string, { icon: any; color: string; bg: string }> = {
  CREATE: { icon: Plus, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]' },
  SOFT_DELETE: { icon: Trash2, color: 'text-[#F97316]', bg: 'bg-[#FFF7ED]' },
  DELETE: { icon: Trash2, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]' },
  UPDATE: { icon: Pencil, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]' },
  ACTIVATE: { icon: CheckCircle2, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
  DEACTIVATE: { icon: XCircle, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]' },
  LOGIN: { icon: LogIn, color: 'text-[#8B5CF6]', bg: 'bg-[#F5F3FF]' },
  LOGOUT: { icon: LogOut, color: 'text-[#64748B]', bg: 'bg-[#F1F5F9]' },
  SEND: { icon: Send, color: 'text-[#06B6D4]', bg: 'bg-[#ECFEFF]' },
  PASSWORD_CHANGE: { icon: Lock, color: 'text-[#8B5CF6]', bg: 'bg-[#F5F3FF]' },
  SECURITY: { icon: Shield, color: 'text-[#EF4444]', bg: 'bg-[#FEF2F2]' },
  SETTINGS: { icon: Settings, color: 'text-[#64748B]', bg: 'bg-[#F1F5F9]' },
  USER_CREATE: { icon: UserPlus, color: 'text-[#10B981]', bg: 'bg-[#ECFDF5]' },
}

const actionBadge: Record<string, string> = {
  CREATE: 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]',
  SOFT_DELETE: 'bg-[#FFF7ED] text-[#F97316] border border-[#FFEDD5]',
  DELETE: 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]',
  UPDATE: 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]',
  ACTIVATE: 'bg-[#ECFDF5] text-[#10B981] border border-[#D1FAE5]',
  DEACTIVATE: 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]',
  LOGIN: 'bg-[#F5F3FF] text-[#8B5CF6] border border-[#EDE9FE]',
  LOGOUT: 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]',
  SEND: 'bg-[#ECFEFF] text-[#06B6D4] border border-[#CFFAFE]',
  PASSWORD_CHANGE: 'bg-[#F5F3FF] text-[#8B5CF6] border border-[#EDE9FE]',
  SECURITY: 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]',
  SETTINGS: 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]',
  USER_CREATE: 'bg-[#ECFDF5] text-[#10B981] border border-[#D1FAE5]',
}

export default function Audit() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['audit'], queryFn: async () => (await masterApi.audit.list()).data })
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [detailItem, setDetailItem] = useState<any>(null)

  const allLogs = useMemo(() => data || [], [data])

  // Summary stats
  const stats = useMemo(() => {
    const total = allLogs.length
    const userActions = allLogs.filter((a: any) => ['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'LOGIN', 'LOGOUT', 'SEND', 'PASSWORD_CHANGE'].includes(a.action)).length
    const systemActions = allLogs.filter((a: any) => ['SETTINGS', 'ACTIVATE', 'DEACTIVATE'].includes(a.action)).length
    const securityEvents = allLogs.filter((a: any) => ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'SECURITY', 'DEACTIVATE'].includes(a.action)).length
    return { total, userActions, systemActions, securityEvents }
  }, [allLogs])

  // Unique actions for filter dropdown
  const uniqueActions = useMemo(() => {
    const set = new Set(allLogs.map((a: any) => a.action))
    return Array.from(set).sort()
  }, [allLogs])

  // Unique users for filter
  const uniqueUsers = useMemo(() => {
    const set = new Set(allLogs.map((a: any) => a.userEmail))
    return Array.from(set).sort()
  }, [allLogs])

  // Filter
  const filtered = useMemo(() => {
    let result = allLogs

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((a: any) =>
        a.action?.toLowerCase().includes(q) ||
        a.entity?.toLowerCase().includes(q) ||
        a.detail?.toLowerCase().includes(q) ||
        a.userEmail?.toLowerCase().includes(q) ||
        String(a.entityId).includes(q)
      )
    }

    if (actionFilter !== 'ALL') {
      result = result.filter((a: any) => a.action === actionFilter)
    }

    if (dateFilter !== 'ALL') {
      const now = new Date()
      const cutoff = new Date()
      if (dateFilter === '7d') cutoff.setDate(now.getDate() - 7)
      else if (dateFilter === '30d') cutoff.setDate(now.getDate() - 30)
      else if (dateFilter === '90d') cutoff.setDate(now.getDate() - 90)
      result = result.filter((a: any) => new Date(a.createdAt) >= cutoff)
    }

    return result
  }, [allLogs, search, actionFilter, dateFilter])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getActionConfig = (action: string) => {
    const key = Object.keys(actionConfig).find(k => action?.toUpperCase().includes(k)) || 'SETTINGS'
    return actionConfig[key] || actionConfig.SETTINGS
  }

  const getActionBadge = (action: string) => {
    const key = Object.keys(actionBadge).find(k => action?.toUpperCase().includes(k)) || 'SETTINGS'
    return actionBadge[key] || actionBadge.SETTINGS
  }

  const getInitials = (email: string) => {
    if (!email) return '?'
    const name = email.split('@')[0]
    return name.slice(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="max-w-[1350px] mx-auto space-y-5 animate-fade-in">
        <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
          <span className="hover:text-[#2563EB] transition-colors cursor-pointer">Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Audit Logs</span>
        </div>
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-6">
          <div className="flex items-center gap-2 py-8 text-[13px] text-[#94A3B8]"><Loader2 className="w-4 h-4 animate-spin" /> Loading audit logs...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-[1350px] mx-auto space-y-5 animate-fade-in">
        <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
          <span className="hover:text-[#2563EB] transition-colors cursor-pointer">Dashboard</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Audit Logs</span>
        </div>
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">Unable to load audit logs</h3>
          <p className="text-[13px] text-[#94A3B8] mb-4">Something went wrong while retrieving activity.</p>
          <Button variant="outline" size="sm" className="h-9 px-4 rounded-[10px] text-[12px] font-semibold gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1350px] mx-auto space-y-5 animate-fade-in">

      {/* ─── BREADCRUMB ─── */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
        <span className="hover:text-[#2563EB] transition-colors cursor-pointer">Dashboard</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Audit Logs</span>
      </div>

      {/* ─── PAGE HEADER ─── */}
      <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
        {/* Mosque silhouette */}
        <div className="absolute -right-10 -top-8 w-[400px] h-[220px] opacity-[0.04] dark:opacity-[0.06] pointer-events-none select-none" aria-hidden="true">
          <svg viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="300" cy="120" rx="90" ry="70" fill="#2563EB" />
            <path d="M300 42 c6 0 11 8 8 16 c-2 5-7 8-8 8 c-1 0-6-3-8-8 c-3-8 2-16 8-16z" fill="#2563EB" />
            <rect x="140" y="60" width="24" height="180" rx="4" fill="#2563EB" />
            <ellipse cx="152" cy="58" rx="16" ry="14" fill="#2563EB" />
            <path d="M152 38 c3 0 5 5 4 10 c-1 3-3 5-4 5 c-1 0-3-2-4-5 c-1-5 1-10 4-10z" fill="#2563EB" />
            <rect x="436" y="60" width="24" height="180" rx="4" fill="#2563EB" />
            <ellipse cx="448" cy="58" rx="16" ry="14" fill="#2563EB" />
            <path d="M448 38 c3 0 5 5 4 10 c-1 3-3 5-4 5 c-1 0-3-2-4-5 c-1-5 1-10 4-10z" fill="#2563EB" />
            <rect x="160" y="130" width="280" height="110" rx="6" fill="#2563EB" />
            <rect x="200" y="150" width="30" height="40" rx="15" fill="white" opacity="0.3" />
            <rect x="285" y="150" width="30" height="40" rx="15" fill="white" opacity="0.3" />
            <rect x="370" y="150" width="30" height="40" rx="15" fill="white" opacity="0.3" />
            <ellipse cx="220" cy="130" rx="30" ry="20" fill="#2563EB" />
            <ellipse cx="380" cy="130" rx="30" ry="20" fill="#2563EB" />
            <rect x="280" y="190" width="40" height="50" rx="20" fill="white" opacity="0.2" />
          </svg>
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F5F3FF] dark:bg-purple-900/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#8B5CF6] dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight">Audit Logs</h1>
              <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">Track all system activities and user actions in one place.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(1) }}
              className="h-9 px-3 rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white text-[12px] font-medium text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              <option value="ALL">All Time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Actions', value: stats.total, icon: Activity, iconBg: 'bg-[#EFF6FF]', iconColor: 'text-[#2563EB]' },
          { label: 'User Actions', value: stats.userActions, icon: Users, iconBg: 'bg-[#ECFDF5]', iconColor: 'text-[#10B981]' },
          { label: 'System Actions', value: stats.systemActions, icon: Settings, iconBg: 'bg-[#F5F3FF]', iconColor: 'text-[#8B5CF6]' },
          { label: 'Security Events', value: stats.securityEvents, icon: Shield, iconBg: 'bg-[#FFF7ED]', iconColor: 'text-[#F97316]' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#1a1f2e] rounded-[14px] border border-[#E2E8F0] dark:border-[#2a3042] p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} dark:bg-white/5 flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </div>
            <div className="text-[22px] font-bold text-[#0F172A] dark:text-white">{s.value}</div>
            <div className="text-[12px] text-[#94A3B8] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── FILTER TOOLBAR ─── */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by action, user, module, or description..."
              className="w-full h-[44px] pl-10 pr-4 rounded-[10px] bg-[#F8FAFC] dark:bg-white/5 border border-transparent text-[13px] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB]/10 transition-all"
            />
          </div>
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
            className="h-[44px] px-3 rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white text-[13px] font-medium text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 min-w-[140px]"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* ─── AUDIT LOG LIST ─── */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] dark:border-[#2a3042]">
          <div>
            <h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Recent Activity</h3>
            <p className="text-[12px] text-[#94A3B8]">Latest system and user actions</p>
          </div>
          <span className="text-[12px] text-[#94A3B8]">Showing {filtered.length} results</span>
        </div>

        {paginated.length > 0 ? (
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#1e2536]">
            {paginated.map((a: any) => {
              const cfg = getActionConfig(a.action)
              const Icon = cfg.icon
              return (
                <div
                  key={a.id}
                  onClick={() => setDetailItem(a)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-all cursor-pointer group border-l-2 border-l-transparent hover:border-l-[#2563EB]"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-4.5 h-4.5 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${getActionBadge(a.action)}`}>{a.action}</span>
                      <span className="text-[13px] font-semibold text-[#0F172A] dark:text-white truncate">{a.entity} <span className="text-[#94A3B8] font-normal">#{a.entityId}</span></span>
                    </div>
                    {a.detail && <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] truncate max-w-[400px]">{a.detail}</p>}
                  </div>

                  {/* User */}
                  <div className="hidden md:flex items-center gap-2.5 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold">
                      {getInitials(a.userEmail)}
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-medium text-[#0F172A] dark:text-white">{a.userEmail?.split('@')[0]}</div>
                      <div className="text-[11px] text-[#94A3B8]">{a.userEmail}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-[11px] text-[#94A3B8]">{new Date(a.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center">
              <Activity className="w-8 h-8 text-[#94A3B8]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">No audit activity found</h3>
            <p className="text-[13px] text-[#94A3B8] mb-4 max-w-[300px] mx-auto">No system or user actions match your current filters.</p>
            {(search || actionFilter !== 'ALL' || dateFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-[10px] text-[12px] font-semibold gap-1.5"
                onClick={() => { setSearch(''); setActionFilter('ALL'); setDateFilter('ALL'); setPage(1) }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9] dark:border-[#1e2536]">
            <span className="text-[12px] text-[#94A3B8]">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) pageNum = i + 1
                else if (page <= 3) pageNum = i + 1
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = page - 2 + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-[12px] font-medium transition-all ${
                      page === pageNum
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-white/5'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── DETAIL MODAL ─── */}
      {detailItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailItem(null)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] w-full max-w-[480px] border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] dark:border-[#2a3042]">
              <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white">Audit Details</h3>
              <button onClick={() => setDetailItem(null)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
                <XCircle className="w-4 h-4 text-[#94A3B8]" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Action', value: detailItem.action, badge: true },
                { label: 'Entity', value: `${detailItem.entity} #${detailItem.entityId}` },
                { label: 'Performed By', value: detailItem.userEmail },
                { label: 'Timestamp', value: new Date(detailItem.createdAt).toLocaleString() },
                ...(detailItem.detail ? [{ label: 'Remark', value: detailItem.detail }] : []),
              ].map((field, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#F1F5F9] dark:border-[#2a3042] last:border-0 last:pb-0">
                  <span className="text-[12px] text-[#94A3B8] w-28 shrink-0 pt-0.5">{field.label}</span>
                  {field.badge ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${getActionBadge(detailItem.action)}`}>{field.value}</span>
                  ) : (
                    <span className="text-[13px] font-medium text-[#0F172A] dark:text-white">{field.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
