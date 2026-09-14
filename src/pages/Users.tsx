import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { useAuth, isSuperAdmin } from '@/store/auth'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useState, useMemo } from 'react'
import {
  Eye, EyeOff, Trash2, Plus, Unlock, Lock, Search, X, ChevronDown,
  ChevronLeft, ChevronRight, Users, ShieldCheck, Settings, User as UserIcon,
  MoreVertical, AlertTriangle, CalendarDays, Phone, Mail, Hash, Power
} from 'lucide-react'

const PAGE_SIZE = 10

function initials(name?: string, email?: string) {
  const src = (name || '').trim()
  if (src) {
    const parts = src.split(/\s+/)
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase()
  }
  return (email || '??').slice(0, 2).toUpperCase()
}

function isLocked(u: any) {
  return !u.isActive && ((u.failedAttempts || 0) >= 5 || !!u.lockTime)
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-[#EDE9FE] text-[#6D28D9] dark:bg-purple-900/30 dark:text-purple-300',
  ADMIN: 'bg-[#DBEAFE] text-[#1D4ED8] dark:bg-blue-900/30 dark:text-blue-300',
  USER: 'bg-[#F1F5F9] text-[#475569] dark:bg-white/10 dark:text-[#94A3B8]',
}

export default function UsersPage() {
  const { user } = useAuth()
  const superAdmin = isSuperAdmin(user?.systemRole)
  const [q, setQ] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', systemRole: 'USER' })
  const [showPwd, setShowPwd] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [action, setAction] = useState<{ type: 'toggle' | 'delete' | 'unlock', user: any, nextActive?: boolean } | null>(null)
  const [remark, setRemark] = useState('')
  const [err, setErr] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'USER'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'LOCKED'>('ALL')
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<number | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['users', q], queryFn: async () => (await masterApi.users.list(q || undefined)).data ?? [] })

  const roleMut = useMutation({ mutationFn: ({ id, role }: { id: number, role: string }) => masterApi.users.updateRole(id, role), onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) })
  const createMut = useMutation({
    mutationFn: () => masterApi.users.create(form),
    onSuccess: () => { setCreateMsg(`Created ${form.email} as ${form.systemRole}`); setForm({ name: '', email: '', password: '', phone: '', systemRole: 'USER' }); setShowCreate(false); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e: any) => setCreateMsg(e.response?.data?.message || 'Create failed')
  })
  const toggleMut = useMutation({
    mutationFn: () => {
      if (!action || action.type !== 'toggle') throw new Error('no action')
      return masterApi.users.toggle(action.user.id, action.nextActive!, remark)
    },
    onSuccess: () => { setAction(null); setRemark(''); setErr(''); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e: any) => setErr(e.response?.data?.message || e.message)
  })
  const deleteMut = useMutation({
    mutationFn: () => {
      if (!action || action.type !== 'delete') throw new Error('no action')
      return masterApi.users.delete(action.user.id, remark)
    },
    onSuccess: () => { setAction(null); setSelected(null); setRemark(''); setErr(''); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e: any) => setErr(e.response?.data?.message || e.message)
  })
  const unlockMut = useMutation({
    mutationFn: () => {
      if (!action || action.type !== 'unlock') throw new Error('no action')
      return masterApi.users.unlock(action.user.id, remark)
    },
    onSuccess: () => { setAction(null); setRemark(''); setErr(''); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e: any) => setErr(e.response?.data?.message || e.message)
  })

  const all = useMemo(() => data || [], [data])

  const counts = useMemo(() => ({
    all: all.length,
    super: all.filter((u: any) => u.systemRole === 'SUPER_ADMIN').length,
    admin: all.filter((u: any) => u.systemRole === 'ADMIN').length,
    user: all.filter((u: any) => u.systemRole === 'USER').length,
  }), [all])

  const filtered = useMemo(() => {
    return all.filter((u: any) => {
      if (roleFilter !== 'ALL' && u.systemRole !== roleFilter) return false
      if (statusFilter === 'ACTIVE' && !u.isActive) return false
      if (statusFilter === 'INACTIVE' && u.isActive) return false
      if (statusFilter === 'LOCKED' && !isLocked(u)) return false
      return true
    })
  }, [all, roleFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length)

  const openAction = (type: 'toggle' | 'delete' | 'unlock', u: any, nextActive?: boolean) => {
    setAction({ type, user: u, nextActive }); setRemark(''); setErr(''); setOpenMenu(null)
  }

  const changeRole = (u: any, role: string) => {
    if (role === u.systemRole) return
    if (confirm(`Change ${u.email} to ${role}?`)) {
      roleMut.mutate({ id: u.id, role })
      if (selected?.id === u.id) setSelected({ ...selected, systemRole: role })
    }
    setOpenMenu(null)
  }

  const resetFilters = () => { setQ(''); setRoleFilter('ALL'); setStatusFilter('ALL'); setPage(1) }

  return (
    <div className="relative max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 text-[12px] text-[#64748B] dark:text-[#94A3B8] mb-1.5">
            <span className="hover:text-[#2563EB] transition cursor-pointer">Dashboard</span>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-[#0F172A] dark:text-white font-medium">Users</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold text-[#0F172A] dark:text-white leading-tight">Users</h1>
            <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-300 text-[10px] font-bold tracking-wider">PORTAL</span>
          </div>
          <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">Manage portal users, roles and account access.</p>
        </div>
        {superAdmin && (
          <Button size="sm" className="gap-1.5 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] shadow-lg shadow-blue-500/20 self-start sm:self-auto" onClick={() => { setShowCreate(true); setCreateMsg('') }}>
            <Plus className="w-3.5 h-3.5" /> Create User
          </Button>
        )}
      </div>

      {createMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[13px] font-medium mb-5 ${createMsg.startsWith('Created') ? 'bg-[#ECFDF5] dark:bg-emerald-900/20 border-[#10B981]/25 text-[#065F46] dark:text-[#6EE7B7]' : 'bg-[#FEF2F2] dark:bg-red-900/20 border-[#EF4444]/25 text-[#991B1B] dark:text-[#FCA5A5]'}`}>
          {createMsg}
          <button onClick={() => setCreateMsg('')} className="ml-auto p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { icon: Users, label: 'Total Users', sub: 'All portal users', value: counts.all, color: '#2563EB', bg: '#EFF6FF' },
          { icon: ShieldCheck, label: 'Super Admins', sub: 'Full access', value: counts.super, color: '#8B5CF6', bg: '#EDE9FE' },
          { icon: Settings, label: 'Admins', sub: 'Manage access', value: counts.admin, color: '#F59E0B', bg: '#FFFBEB' },
          { icon: UserIcon, label: 'Users', sub: 'Standard access', value: counts.user, color: '#64748B', bg: '#F1F5F9' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536] p-4 min-h-[104px] flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] truncate">{s.label}</div>
              <div className="text-[22px] font-bold text-[#0F172A] dark:text-white leading-tight">{s.value}</div>
              <div className="text-[10px] text-[#94A3B8] dark:text-[#64748B] truncate">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-[#141925] rounded-xl border border-[#E2E8F0] dark:border-[#1e2536]">
        <div className="px-5 pt-4 pb-3 border-b border-[#F1F5F9] dark:border-[#1e2536] flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Users <span className="text-[#94A3B8] font-normal">({filtered.length})</span></h3>
          <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">Showing {rangeStart}–{rangeEnd} of {filtered.length}</span>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-[#F1F5F9] dark:border-[#1e2536] flex flex-col md:flex-row gap-2.5">
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input type="text" value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
              placeholder="Search by name or email..."
              className="w-full h-9 pl-9 pr-9 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[13px] text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#E2E8F0] dark:focus:border-[#2a3042] focus:ring-2 focus:ring-[#2563EB]/10 transition-all" />
            {q && <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#E2E8F0] dark:hover:bg-white/10 transition"><X className="w-3.5 h-3.5 text-[#94A3B8]" /></button>}
          </div>
          <div className="flex gap-2">
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value as any); setPage(1) }}
              className="h-9 px-3 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] focus:outline-none cursor-pointer">
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
              className="h-9 px-3 rounded-[10px] bg-[#F1F5F9] dark:bg-white/5 border border-transparent text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8] focus:outline-none cursor-pointer">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F1F5F9] dark:bg-white/5 shrink-0" />
                <div className="flex-1 space-y-1.5"><div className="h-3.5 bg-[#F1F5F9] dark:bg-white/5 rounded w-40" /><div className="h-3 bg-[#F1F5F9] dark:bg-white/5 rounded w-56" /></div>
                <div className="h-6 w-20 bg-[#F1F5F9] dark:bg-white/5 rounded-md hidden sm:block" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">Unable to load users</h3>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-4">Something went wrong while loading portal users.</p>
            <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => qc.invalidateQueries({ queryKey: ['users'] })}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-[#CBD5E1] dark:text-[#475569]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">No users found</h3>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-4">Try changing your search or filters.</p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="rounded-[10px]" onClick={resetFilters}>Clear Filters</Button>
              {superAdmin && <Button size="sm" className="rounded-[10px] gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6]" onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> Create User</Button>}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-[#F1F5F9] dark:border-[#1e2536] text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">
                    <th className="text-left font-semibold px-5 py-2.5">User</th>
                    <th className="text-left font-semibold px-3 py-2.5">Role</th>
                    <th className="text-left font-semibold px-3 py-2.5">Joined</th>
                    <th className="text-left font-semibold px-3 py-2.5">Status</th>
                    <th className="text-right font-semibold px-5 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] dark:divide-[#1e2536]">
                  {pageRows.map((u: any) => {
                    const locked = isLocked(u)
                    const menuOpen = openMenu === u.id
                    return (
                      <tr key={u.id}
                        onClick={() => setSelected(u)}
                        className={`transition-colors duration-150 cursor-pointer ${selected?.id === u.id ? 'bg-[#EFF6FF] dark:bg-blue-900/10' : 'hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02]'}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                              {initials(u.name, u.email)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[14px] font-semibold text-[#0F172A] dark:text-white truncate">{u.name}</span>
                                {locked && <span className="inline-flex items-center gap-0.5 px-1.5 py-px rounded bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold shrink-0"><Lock className="w-2.5 h-2.5" />Locked</span>}
                              </div>
                              <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] truncate">{u.email}{u.phone ? ` • ${u.phone}` : ''}</div>
                              <div className="text-[10px] text-[#94A3B8] dark:text-[#64748B]">#{u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <select disabled={!superAdmin} value={u.systemRole} onChange={e => changeRole(u, e.target.value)}
                            className={`h-8 rounded-lg border border-transparent px-2 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer disabled:cursor-default disabled:opacity-100 ${ROLE_STYLE[u.systemRole] || ROLE_STYLE.USER}`}>
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 text-[12px] text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">{formatDate(u.createdAt)}</td>
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${u.isActive ? 'text-[#059669] dark:text-emerald-400' : 'text-[#94A3B8]'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-[#10B981]' : 'bg-[#CBD5E1] dark:bg-[#475569]'}`} />
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <Switch checked={!!u.isActive} onCheckedChange={(v) => openAction('toggle', u, v)} disabled={!superAdmin} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <button onClick={() => setOpenMenu(menuOpen ? null : u.id)}
                              className={`p-1.5 rounded-lg transition ${menuOpen ? 'bg-[#F1F5F9] dark:bg-white/10' : 'hover:bg-[#F1F5F9] dark:hover:bg-white/5'}`}>
                              <MoreVertical className="w-4 h-4 text-[#64748B]" />
                            </button>
                            {menuOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1a1f2e] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#E2E8F0] dark:border-[#2a3042] py-1.5 z-50">
                                  <MenuItem label="View Details" onClick={() => { setSelected(u); setOpenMenu(null) }} />
                                  {locked && <MenuItem label="Unlock User" amber disabled={!superAdmin} onClick={() => openAction('unlock', u)} />}
                                  <MenuItem label={u.isActive ? 'Deactivate' : 'Activate'} disabled={!superAdmin} onClick={() => openAction('toggle', u, !u.isActive)} />
                                  <div className="border-t border-[#F1F5F9] dark:border-[#2a3042] mt-1 pt-1">
                                    <MenuItem label="Delete" danger disabled={!superAdmin} onClick={() => openAction('delete', u)} />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-[#F1F5F9] dark:divide-[#1e2536]">
              {pageRows.map((u: any) => {
                const locked = isLocked(u)
                return (
                  <div key={u.id} onClick={() => setSelected(u)} className="p-4 flex items-center gap-3 active:bg-[#F8FAFC] dark:active:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                      {initials(u.name, u.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-semibold text-[#0F172A] dark:text-white truncate">{u.name}</span>
                        {locked && <Lock className="w-3 h-3 text-[#F59E0B] shrink-0" />}
                      </div>
                      <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] truncate">{u.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-1.5 py-px rounded text-[10px] font-bold ${ROLE_STYLE[u.systemRole] || ROLE_STYLE.USER}`}>{u.systemRole}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${u.isActive ? 'text-[#059669]' : 'text-[#94A3B8]'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'}`} />{u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 -rotate-90 text-[#CBD5E1] shrink-0" />
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F1F5F9] dark:border-[#1e2536]">
                <span className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">Showing {rangeStart}–{rangeEnd} of {filtered.length} users</span>
                <div className="flex items-center gap-1.5">
                  <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                    className="p-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#2a3042] hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4 text-[#64748B]" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
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
        {!superAdmin && <p className="text-[12px] text-[#B45309] dark:text-amber-400 px-5 py-3 border-t border-[#F1F5F9] dark:border-[#1e2536]">Only SUPER_ADMIN can create / toggle / delete. ADMIN view only.</p>}
      </div>

      {/* Create User popup */}
      {superAdmin && showCreate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => !createMut.isPending && setShowCreate(false)} />
          <div className="relative w-full max-w-[520px] max-h-[92vh] overflow-y-auto bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#1a1f2e] border-b border-[#E2E8F0] dark:border-[#2a3042] px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Create User</h3>
                <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">SUPER_ADMIN only</p>
              </div>
              <button onClick={() => !createMut.isPending && setShowCreate(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ali Khan" className="h-10" /></div>
                <div className="space-y-1.5"><Label>Email *</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ali@example.com" className="h-10" /></div>
                <div className="space-y-1.5"><Label>Password *</Label>
                  <div className="relative">
                    <Input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" className="pr-10 h-10" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-[#F1F5F9] dark:hover:bg-white/10 rounded-lg"><Eye className="w-4 h-4 text-[#64748B]" /></button>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="98xxxx" className="h-10" /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>System Role *</Label>
                  <select value={form.systemRole} onChange={e => setForm({ ...form, systemRole: e.target.value })} className="h-10 w-full rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition">
                    <option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => setShowCreate(false)} disabled={createMut.isPending}>Cancel</Button>
                <Button size="sm" className="rounded-[10px] gap-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] min-w-[130px]"
                  onClick={() => createMut.mutate()} disabled={!form.name || !form.email || !form.password || createMut.isPending}>
                  <Plus className="w-3.5 h-3.5" /> {createMut.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User details drawer */}
      {selected && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-[420px] bg-white dark:bg-[#141925] shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#141925] border-b border-[#E2E8F0] dark:border-[#1e2536] px-6 py-4 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white">User Details</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-[16px] font-bold text-white shrink-0">
                  {initials(selected.name, selected.email)}
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-bold text-[#0F172A] dark:text-white truncate">{selected.name}</div>
                  <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] truncate">{selected.email}</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ROLE_STYLE[selected.systemRole] || ROLE_STYLE.USER}`}>{selected.systemRole}</span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${selected.isActive ? 'text-[#059669]' : 'text-[#94A3B8]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selected.isActive ? 'bg-[#10B981]' : 'bg-[#CBD5E1]'}`} />{selected.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <DrawerField icon={Hash} label="User ID" value={`#${selected.id}`} />
                <DrawerField icon={CalendarDays} label="Joined" value={formatDate(selected.createdAt)} />
                <DrawerField icon={Phone} label="Phone" value={selected.phone || '—'} />
                <DrawerField icon={Mail} label="Email" value={selected.email || '—'} />
                {(selected.failedAttempts != null || selected.lockTime) && (
                  <>
                    <DrawerField icon={Lock} label="Failed Attempts" value={String(selected.failedAttempts ?? 0)} />
                    <DrawerField icon={AlertTriangle} label="Lock Time" value={selected.lockTime ? formatDate(selected.lockTime) : '—'} />
                  </>
                )}
              </div>
              {superAdmin && (
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Actions</div>
                  <div className="flex flex-wrap gap-2">
                    <select value={selected.systemRole} disabled={!superAdmin}
                      onChange={e => changeRole(selected, e.target.value)}
                      className="h-9 rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-white/5 dark:text-white px-3 text-[12px] font-bold focus:outline-none cursor-pointer">
                      <option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                    <Button size="sm" variant="outline" className="rounded-[10px] gap-1.5 h-9"
                      onClick={() => { setSelected(null); openAction('toggle', selected, !selected.isActive) }}>
                      <Power className="w-3.5 h-3.5" /> {selected.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    {isLocked(selected) && (
                      <Button size="sm" variant="outline" className="rounded-[10px] gap-1.5 h-9 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        onClick={() => { setSelected(null); openAction('unlock', selected) }}>
                        <Unlock className="w-3.5 h-3.5" /> Unlock
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-[10px] gap-1.5 h-9 text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/5"
                      onClick={() => { setSelected(null); openAction('delete', selected) }}>
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toggle / Delete / Unlock confirmation with remark */}
      {action && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAction(null)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl w-full max-w-md border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="p-6">
              <h3 className="font-bold text-[16px] flex items-center gap-2 text-[#0F172A] dark:text-white">
                {action.type === 'delete' ? <><Trash2 className="w-5 h-5 text-[#EF4444]" /> Soft Delete User?</> : action.type === 'unlock' ? <><Unlock className="w-5 h-5 text-[#F59E0B]" /> Unlock User?</> : <><Power className="w-5 h-5 text-[#2563EB]" /> {action.nextActive ? 'Activate' : 'Deactivate'} User?</>}
              </h3>
              <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mt-1"><b className="text-[#0F172A] dark:text-white">{action.user.name}</b> ({action.user.email}) will be <b>{action.type === 'delete' ? 'soft-deleted (is_deleted=1)' : action.type === 'unlock' ? 'UNLOCKED and ACTIVE (reset 5 fails, auto-unlock 24h)' : action.nextActive ? 'ACTIVE' : 'INACTIVE'}</b>. Remark required.</p>
              <div className="mt-4 space-y-2">
                <Label>Remark *</Label>
                <Textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder={action.type === 'delete' ? 'e.g. Left organization' : action.type === 'unlock' ? 'e.g. Verified, unlock now' : 'e.g. Suspended for review'} />
                {err && <div className="text-[13px] text-[#EF4444]">{err}</div>}
              </div>
              <div className="flex gap-2 mt-5 justify-end">
                <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => setAction(null)}>Cancel</Button>
                {action.type === 'toggle' ? (
                  <Button size="sm" className="rounded-[10px]" variant={action.nextActive ? 'default' : 'destructive'} onClick={() => toggleMut.mutate()} disabled={!remark.trim() || toggleMut.isPending}>{toggleMut.isPending ? 'Saving...' : action.nextActive ? 'Activate' : 'Deactivate'}</Button>
                ) : action.type === 'unlock' ? (
                  <Button size="sm" className="rounded-[10px] bg-amber-600 hover:bg-amber-700" onClick={() => unlockMut.mutate()} disabled={!remark.trim() || unlockMut.isPending}>{unlockMut.isPending ? 'Unlocking...' : 'Confirm Unlock'}</Button>
                ) : (
                  <Button size="sm" className="rounded-[10px]" variant="destructive" onClick={() => deleteMut.mutate()} disabled={!remark.trim() || deleteMut.isPending}>{deleteMut.isPending ? 'Deleting...' : 'Confirm Delete'}</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ label, onClick, danger, amber, disabled }: { label: string; onClick: () => void; danger?: boolean; amber?: boolean; disabled?: boolean }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={`w-full text-left px-3.5 py-2 text-[13px] transition disabled:opacity-40 disabled:cursor-not-allowed ${danger ? 'text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20' : amber ? 'text-[#B45309] hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F8FAFC] dark:hover:bg-white/5'}`}>
      {label}
    </button>
  )
}

function DrawerField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03]">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#94A3B8] dark:text-[#64748B] uppercase tracking-wider"><Icon className="w-3 h-3" />{label}</div>
      <div className="text-[13px] text-[#0F172A] dark:text-white font-medium mt-1 break-words">{value}</div>
    </div>
  )
}
