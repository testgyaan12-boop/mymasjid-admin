import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Building2, Plus, Search, X, ChevronRight, Landmark, Users, ShieldCheck, ArrowUpRight, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function Tenants() {
  const [q, setQ] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<any>({ name:'', pincode:'', city:'', state:'', country:'India', phone:'', email:'', address:'', adminEmail:'', adminName:'', adminPhone:'', adminPassword:'', adminRole:'MANAGEMENT' })
  const [msg, setMsg] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const qc = useQueryClient()
  const { data: masjids, isLoading } = useQuery({ queryKey: ['masjids', q], queryFn: async () => (await masterApi.masjids.list(q || undefined)).data })
  const currentMasjidId = typeof window !== 'undefined' ? localStorage.getItem('current_masjid_id') : null
  const currentMasjid = masjids?.find((m:any) => String(m.id) === String(currentMasjidId))
  const createMut = useMutation({
    mutationFn: () => masterApi.masjids.create(form),
    onSuccess: (res:any) => { setMsg(`Created ${res.data.masjid?.name}`); setForm({ name:'', pincode:'', city:'', state:'', country:'India', phone:'', email:'', address:'', adminEmail:'', adminName:'', adminPhone:'', adminPassword:'', adminRole:'MANAGEMENT' }); setShowAdd(false); qc.invalidateQueries({queryKey:['masjids']}) },
    onError: (e:any) => setMsg(e.response?.data?.message || 'Create failed')
  })
  const list = masjids ?? []
  const activeCount = list.filter((m: any) => m.isActive).length
  const adminCount = list.reduce((acc: number, m: any) => acc + (m.adminCount || 0), 0)

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
            <Link to="/" className="hover:text-[#2563EB] transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">My Masjid Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] md:text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight">My Masjid Admin</h1>
            <Badge className="bg-[#DBEAFE] dark:bg-blue-900/30 text-[#2563EB] dark:text-blue-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">{list.length} Masjid{list.length !== 1 ? 's' : ''}</Badge>
          </div>
          <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8]">Manage your masjids, administrators, and mapped users from one place.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="h-11 px-5 rounded-[10px] text-[13px] font-semibold gap-2 shadow-sm self-start" variant={showAdd ? 'outline' : 'indigo'}>
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Close' : 'Add Masjid'}
        </Button>
      </div>

      {/* Current Masjid Selector */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <Landmark className="w-5 h-5 text-[#8B5CF6] dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8] mb-0.5">Currently Viewing</div>
            {currentMasjid ? (
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[#0F172A] dark:text-white truncate">{currentMasjid.name}</span>
                <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] shrink-0">{currentMasjid.city}{currentMasjid.pincode ? `, ${currentMasjid.pincode}` : ''}</span>
              </div>
            ) : (
              <span className="text-[13px] text-[#94A3B8]">Select a masjid from the list below</span>
            )}
          </div>
        </div>
        {currentMasjid && (
          <Link to={`/masjids/${currentMasjid.id}`} className="ml-auto text-[12px] font-semibold text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 transition-colors">
            Open Dashboard <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Masjids', value: list.length, icon: Building2, color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Active Masjids', value: activeCount, icon: ShieldCheck, color: '#10B981', bg: '#D1FAE5', sub: list.length > 0 ? `${Math.round((activeCount / list.length) * 100)}% Active` : undefined },
          { label: 'Total Admins', value: adminCount || list.length, icon: Users, color: '#8B5CF6', bg: '#EDE9FE' },
        ].map((s, i) => (
          <div key={s.label} className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-4 flex items-center gap-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[22px] font-bold text-[#0F172A] dark:text-white leading-none mb-0.5">{s.value}</div>
              <div className="text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8]">{s.label}</div>
              {s.sub && <div className="text-[10px] text-[#10B981] dark:text-emerald-400 font-semibold mt-0.5">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <Input placeholder="Search by name, city, pincode, email..." value={q} onChange={e => setQ(e.target.value)} className="pl-10 pr-9 h-10 rounded-[10px]" />
          {q && <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition"><X className="w-3.5 h-3.5 text-[#94A3B8]" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-[#1a1f2e] border border-[#E2E8F0] dark:border-[#2a3042] rounded-[10px] overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-[#F1F5F9] dark:bg-white/5 text-[#0F172A] dark:text-white' : 'text-[#94A3B8] hover:text-[#64748B]'}`} title="Grid view">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" /><rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" /></svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-[#F1F5F9] dark:bg-white/5 text-[#0F172A] dark:text-white' : 'text-[#94A3B8] hover:text-[#64748B]'}`} title="List view">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2.5" rx="1" /><rect x="1" y="6.75" width="14" height="2.5" rx="1" /><rect x="1" y="11.5" width="14" height="2.5" rx="1" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {msg && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-3 rounded-xl text-[13px] text-emerald-700 dark:text-emerald-400 font-medium animate-fade-in">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          {msg}
          <button onClick={() => setMsg('')} className="ml-auto"><X className="w-3.5 h-3.5 opacity-50 hover:opacity-100" /></button>
        </div>
      )}

      {/* Add Masjid Form */}
      {showAdd && (
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-[#F1F5F9] dark:border-[#2a3042] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] dark:bg-emerald-900/30 flex items-center justify-center">
              <Plus className="w-[18px] h-[18px] text-[#10B981] dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Add New Masjid + Admin</h3>
              <p className="text-[11px] text-[#94A3B8]">Fill in details to onboard a new masjid</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[12px]">Masjid Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Noor Masjid" className="h-10" /></div>
              <div className="space-y-1.5"><Label className="text-[12px]">Pincode *</Label><Input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} placeholder="110025" className="h-10" /></div>
              <div className="space-y-1.5 md:col-span-2"><Label className="text-[12px]">Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" className="h-10" /></div>
              <div className="space-y-1.5"><Label className="text-[12px]">City</Label><Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Mumbai" className="h-10" /></div>
              <div className="space-y-1.5"><Label className="text-[12px]">State</Label><Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="Maharashtra" className="h-10" /></div>
              <div className="space-y-1.5"><Label className="text-[12px]">Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="9876543210" className="h-10" /></div>
              <div className="space-y-1.5"><Label className="text-[12px]">Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="info@masjid.com" className="h-10" /></div>
            </div>
            <div className="border-t border-[#F1F5F9] dark:border-[#2a3042] pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#DBEAFE] dark:bg-blue-900/30 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-[#2563EB] dark:text-blue-400" /></div>
                <span className="text-[13px] font-semibold text-[#0F172A] dark:text-white">Admin for this masjid <span className="text-[#94A3B8] font-normal">(optional)</span></span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[12px]">Admin Email</Label><Input value={form.adminEmail} onChange={e => setForm({...form, adminEmail: e.target.value})} placeholder="imam@masjid.com" className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">Admin Name</Label><Input value={form.adminName} onChange={e => setForm({...form, adminName: e.target.value})} placeholder="Imam Sahab" className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">Admin Phone</Label><Input value={form.adminPhone} onChange={e => setForm({...form, adminPhone: e.target.value})} className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">Password (if new user)</Label><Input type="password" value={form.adminPassword} onChange={e => setForm({...form, adminPassword: e.target.value})} placeholder="Masjid@123" className="h-10" /></div>
                <div className="space-y-1.5"><Label className="text-[12px]">Masjid Role</Label>
                  <select value={form.adminRole} onChange={e => setForm({...form, adminRole: e.target.value})} className="h-10 w-full rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition">
                    <option value="MANAGEMENT">MANAGEMENT</option><option value="ADMIN">ADMIN</option><option value="EMPLOYEE">EMPLOYEE</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button onClick={() => createMut.mutate()} disabled={!form.name || !form.pincode || createMut.isPending} className="h-10 px-6 rounded-[10px] text-[13px] font-semibold gap-2" variant="indigo">
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {createMut.isPending ? 'Creating...' : 'Create Masjid'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="text-[13px] text-[#64748B]">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[200px] rounded-2xl bg-white dark:bg-[#1a1f2e] border border-[#E2E8F0] dark:border-[#2a3042] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && list.length === 0 && (
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-[#94A3B8]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">No masjids found</h3>
          <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-5 max-w-sm mx-auto">{q ? `No results for "${q}". Try a different search.` : 'Get started by adding your first masjid.'}</p>
          {!q && <Button onClick={() => setShowAdd(true)} className="h-10 px-5 rounded-[10px] text-[13px] font-semibold gap-2" variant="indigo"><Plus className="w-4 h-4" />Add Masjid</Button>}
        </div>
      )}

      {/* Masjid Cards */}
      {!isLoading && list.length > 0 && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
          {list.map((m: any) => {
            const isCurrent = String(currentMasjidId) === String(m.id)
            if (viewMode === 'list') {
              return (
                <Link key={m.id} to={`/masjids/${m.id}`} onClick={() => localStorage.setItem('current_masjid_id', String(m.id))} className="group block">
                  <div className={`bg-white dark:bg-[#1a1f2e] rounded-2xl border ${isCurrent ? 'border-[#2563EB] dark:border-blue-500/40 ring-1 ring-[#2563EB]/10 dark:ring-blue-500/20' : 'border-[#E2E8F0] dark:border-[#2a3042] hover:border-[#CBD5E1] dark:hover:border-[#3a4052]'} p-4 flex items-center gap-4 transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]`}>
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] dark:from-blue-900/40 dark:to-blue-800/30 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#0F172A] dark:text-white truncate">{m.name}</span>
                        <Badge variant={m.isActive ? 'success' : 'danger'} className="text-[10px] font-bold shrink-0">{m.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                        {isCurrent && <Badge className="bg-[#2563EB] text-white text-[9px] font-bold shrink-0">Current</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-[12px] text-[#64748B] dark:text-[#94A3B8]">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{m.city || '—'} {m.pincode ? `• ${m.pincode}` : ''}</span>
                        {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>}
                        {m.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{m.email}</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-all duration-200 group-hover:translate-x-0.5 shrink-0" />
                  </div>
                </Link>
              )
            }
            return (
              <Link key={m.id} to={`/masjids/${m.id}`} onClick={() => localStorage.setItem('current_masjid_id', String(m.id))} className="group block">
                <div className={`bg-white dark:bg-[#1a1f2e] rounded-2xl border ${isCurrent ? 'border-[#2563EB] dark:border-blue-500/40 ring-1 ring-[#2563EB]/10 dark:ring-blue-500/20' : 'border-[#E2E8F0] dark:border-[#2a3042] hover:border-[#CBD5E1] dark:hover:border-[#3a4052]'} transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 overflow-hidden`}>
                  {/* Card Header */}
                  <div className="p-5 pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] dark:from-blue-900/40 dark:to-blue-800/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Building2 className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold text-[#0F172A] dark:text-white truncate leading-tight">{m.name}</div>
                          <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />{m.address || m.city || 'No location'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={m.isActive ? 'success' : 'danger'} className="text-[10px] font-bold shrink-0">{m.isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-5 py-3 space-y-2.5">
                    <div className="flex items-center gap-2.5 text-[12px]">
                      <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center shrink-0"><MapPin className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" /></div>
                      <span className="text-[#64748B] dark:text-[#94A3B8] truncate">{m.city || '—'}{m.state ? `, ${m.state}` : ''}{m.pincode ? ` • ${m.pincode}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[12px]">
                      <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center shrink-0"><Phone className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" /></div>
                      <span className="text-[#64748B] dark:text-[#94A3B8]">{m.phone || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[12px]">
                      <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] dark:bg-white/5 flex items-center justify-center shrink-0"><Mail className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" /></div>
                      <span className="text-[#64748B] dark:text-[#94A3B8] truncate">{m.email || '—'}</span>
                    </div>
                    {isCurrent && (
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#2563EB] dark:text-blue-400 bg-[#DBEAFE]/60 dark:bg-blue-900/20 rounded-lg px-2.5 py-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400" />
                        Currently Selected
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3 mt-1 border-t border-[#F1F5F9] dark:border-[#2a3042] flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#2563EB] dark:text-blue-400 group-hover:underline">View Details</span>
                    <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2563EB] dark:group-hover:text-blue-400 transition-all duration-200 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
