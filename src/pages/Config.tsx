import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cmsApi, masterApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Settings, Clock, CalendarDays, Moon, Heart, SearchX, Bell, HandHeart, CreditCard, Receipt, BookOpen, Users, Info, Plus, Pencil, Trash2, X, ChevronRight, Loader2, Landmark, ToggleLeft, ToggleRight, Building2 } from 'lucide-react'

type Tab = {
  key: string
  label: string
  icon: any
  color: string
  bg: string
}

const tabs: Tab[] = [
  { key: 'prayer', label: 'Prayer Times', icon: Clock, color: '#2563EB', bg: '#DBEAFE' },
  { key: 'jumuah', label: 'Jumuah', icon: CalendarDays, color: '#10B981', bg: '#D1FAE5' },
  { key: 'ramadan', label: 'Ramadan', icon: Moon, color: '#8B5CF6', bg: '#EDE9FE' },
  { key: 'janazahs', label: 'Janazahs', icon: Heart, color: '#EF4444', bg: '#FEE2E2' },
  { key: 'gumshudas', label: 'Gumshudas', icon: SearchX, color: '#F97316', bg: '#FFF7ED' },
  { key: 'announcements', label: 'Announcements', icon: Bell, color: '#EC4899', bg: '#FCE7F3' },
  { key: 'causes', label: 'Donation Causes', icon: HandHeart, color: '#10B981', bg: '#D1FAE5' },
  { key: 'donations', label: 'Monthly Donations', icon: CreditCard, color: '#2563EB', bg: '#DBEAFE' },
  { key: 'expenses', label: 'Expenses', icon: Receipt, color: '#EF4444', bg: '#FEE2E2' },
  { key: 'services', label: 'Services', icon: Info, color: '#8B5CF6', bg: '#EDE9FE' },
  { key: 'team', label: 'Team Members', icon: Users, color: '#2563EB', bg: '#DBEAFE' },
  { key: 'sunnahs', label: 'Sunnahs', icon: BookOpen, color: '#F97316', bg: '#FFF7ED' },
]

function FormField({ label, value, onChange, type = 'text', placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px]">{label}{required && ' *'}</Label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition resize-none" />
      ) : type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} className="h-10 w-full rounded-[10px] border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition">
          <option value="true">Active</option><option value="false">Inactive</option>
        </select>
      ) : (
        <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="h-10" />
      )}
    </div>
  )
}

function CrudTable({ columns, data, onEdit, onDelete, onToggle, loading }: { columns: { key: string; label: string }[]; data: any[]; onEdit: (item: any) => void; onDelete: (item: any) => void; onToggle?: (item: any) => void; loading: boolean }) {
  if (loading) return <div className="flex items-center gap-2 py-8 text-[13px] text-[#94A3B8]"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
  if (data.length === 0) return <div className="py-10 text-center text-[13px] text-[#94A3B8]">No records found. Add one above.</div>

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-[#2a3042]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-[#F8FAFC] dark:bg-[#141925] border-b border-[#E2E8F0] dark:border-[#2a3042]">
            {columns.map(c => <th key={c.key} className="text-left px-4 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">{c.label}</th>)}
            <th className="text-right px-4 py-3 font-semibold text-[#64748B] dark:text-[#94A3B8] text-[11px] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, i: number) => (
            <tr key={item.id || i} className="border-b border-[#F1F5F9] dark:border-[#1e2536] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-colors">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0] max-w-[200px] truncate">
                  {c.key === 'active' || c.key === 'isActive' ? (
                    <Badge variant={item[c.key] ? 'success' : 'danger'} className="text-[10px]">{item[c.key] ? 'Active' : 'Inactive'}</Badge>
                  ) : c.key === 'found' ? (
                    <Badge variant={item[c.key] ? 'info' : 'warning'} className="text-[10px]">{item[c.key] ? 'Found' : 'Missing'}</Badge>
                  ) : c.key === 'isRead' ? (
                    <Badge variant={item[c.key] ? 'success' : 'warning'} className="text-[10px]">{item[c.key] ? 'Read' : 'Unread'}</Badge>
                  ) : (
                    item[c.key] ?? '—'
                  )}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  {onToggle && (
                    <button onClick={() => onToggle(item)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition" title={item.active !== false ? 'Deactivate' : 'Activate'}>
                      {item.active !== false ? <ToggleRight className="w-4 h-4 text-[#10B981]" /> : <ToggleLeft className="w-4 h-4 text-[#94A3B8]" />}
                    </button>
                  )}
                  <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition" title="Edit"><Pencil className="w-3.5 h-3.5 text-[#64748B]" /></button>
                  <button onClick={() => onDelete(item)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Delete"><Trash2 className="w-3.5 h-3.5 text-[#EF4444]" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl p-6 w-full max-w-[380px] border border-[#E2E8F0] dark:border-[#2a3042]">
        <h3 className="font-semibold text-[15px] text-[#0F172A] dark:text-white mb-2">{title}</h3>
        <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  )
}

export default function Config() {
  const [activeTab, setActiveTab] = useState('prayer')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [msg, setMsg] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const rawMasjidId = typeof window !== 'undefined' ? localStorage.getItem('current_masjid_id') : null
  const [masjidId, setMasjidId] = useState<number | null>(rawMasjidId ? Number(rawMasjidId) : null)
  const { data: masjids } = useQuery({ queryKey: ['masjids-config'], queryFn: async () => (await masterApi.masjids.list()).data })

  const selectMasjid = (id: number) => {
    localStorage.setItem('current_masjid_id', String(id))
    setMasjidId(id)
    setRefreshKey(k => k + 1)
  }

  if (!masjidId) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-5">
        <div className="space-y-1.5">
          <h1 className="text-[26px] md:text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight">Masjid Configuration</h1>
          <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8]">Select a masjid to manage its CMS configuration</p>
        </div>
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] dark:bg-blue-900/30 flex items-center justify-center"><Building2 className="w-5 h-5 text-[#2563EB] dark:text-blue-400" /></div>
            <div><h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Choose a Masjid</h3><p className="text-[12px] text-[#94A3B8]">Pick which masjid to configure</p></div>
          </div>
          {masjids?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {masjids.map((m: any) => (
                <button key={m.id} onClick={() => selectMasjid(m.id)} className="text-left bg-[#F8FAFC] dark:bg-[#141925] border border-[#E2E8F0] dark:border-[#2a3042] rounded-xl p-4 hover:border-[#2563EB] dark:hover:border-blue-500/40 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] dark:from-blue-900/40 dark:to-blue-800/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"><Building2 className="w-4 h-4 text-[#2563EB] dark:text-blue-400" /></div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#0F172A] dark:text-white truncate">{m.name}</div>
                      <div className="text-[11px] text-[#94A3B8]">{m.city || 'No city'}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[13px] text-[#94A3B8]">No masjids found. Create one from My Masjid Admin first.</div>
          )}
        </div>
      </div>
    )
  }

  const cms = cmsApi(masjidId)
  const refresh = () => setRefreshKey(k => k + 1)

  const currentTab = tabs.find(t => t.key === activeTab)!

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
            <span className="hover:text-[#2563EB] transition-colors cursor-pointer">Dashboard</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Config</span>
          </div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight">Masjid Configuration</h1>
          <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8]">Configure CMS tables for masjid #{masjidId}</p>
        </div>
        <button onClick={() => { localStorage.removeItem('current_masjid_id'); setMasjidId(null) }} className="flex items-center gap-2 text-[13px] font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-blue-400 bg-white dark:bg-[#1a1f2e] border border-[#E2E8F0] dark:border-[#2a3042] rounded-[10px] px-4 py-2.5 transition self-start">
          <Building2 className="w-4 h-4" /> Change Masjid
        </button>
      </div>

      {msg && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-3 rounded-xl text-[13px] text-emerald-700 dark:text-emerald-400 font-medium">
          {msg}<button onClick={() => setMsg('')} className="ml-auto"><X className="w-3.5 h-3.5 opacity-50" /></button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Tab Sidebar */}
        <div className="lg:w-[220px] shrink-0">
          <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            {tabs.map(t => (
              <button key={t.key} onClick={() => { setActiveTab(t.key); setShowForm(false); setEditItem(null) }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-[#F1F5F9] dark:bg-white/5 text-[#0F172A] dark:text-white' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02]'}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: activeTab === t.key ? t.bg : 'transparent' }}>
                  <t.icon className="w-3.5 h-3.5" style={{ color: activeTab === t.key ? t.color : 'inherit' }} />
                </div>
                <span className="hidden lg:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <TabContent key={`${activeTab}-${refreshKey}`} tab={activeTab} cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} msg={msg} setMsg={setMsg} refresh={refresh} />
        </div>
      </div>

      <ConfirmModal open={!!deleteTarget} title="Delete Record" message="This action cannot be undone. Are you sure?" onConfirm={async () => {
        if (deleteTarget) {
          try {
            await deleteTarget.onDelete()
            setMsg('Record deleted successfully')
            refresh()
          } catch (e: any) {
            setMsg(e.response?.data?.message || 'Delete failed')
          }
          setDeleteTarget(null)
        }
      }} onCancel={() => setDeleteTarget(null)} />
    </div>
  )
}

function TabContent({ tab, cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, msg, setMsg, refresh }: any) {
  switch (tab) {
    case 'prayer': return <PrayerTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'jumuah': return <JumuahTab cms={cms} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'ramadan': return <RamadanTab cms={cms} setMsg={setMsg} refresh={refresh} />
    case 'janazahs': return <JanazahTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'gumshudas': return <GumshudaTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'announcements': return <AnnouncementTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'causes': return <CausesTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'donations': return <DonationsTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'expenses': return <ExpensesTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'services': return <ServicesTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'team': return <TeamTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    case 'sunnahs': return <SunnahTab cms={cms} showForm={showForm} setShowForm={setShowForm} editItem={editItem} setEditItem={setEditItem} setDeleteTarget={setDeleteTarget} setMsg={setMsg} refresh={refresh} />
    default: return null
  }
}

function FormModal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl w-full max-w-[520px] max-h-[85vh] overflow-y-auto border border-[#E2E8F0] dark:border-[#2a3042]">
        <div className="sticky top-0 bg-white dark:bg-[#1a1f2e] px-6 py-4 border-b border-[#F1F5F9] dark:border-[#2a3042] flex items-center justify-between z-10">
          <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition"><X className="w-4 h-4 text-[#64748B]" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ========== PRAYER TIMES ==========
function PrayerTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ prayerName: '', azaanTime: '', prayerTime: '' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.prayerTimes.get(); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    let updated = editItem ? data.map(d => d.id === editItem.id ? { ...d, ...form } : d) : [...data, { ...form, sortOrder: data.length }]
    try { await cms.prayerTimes.save(updated); setMsg(editItem ? 'Updated' : 'Added'); setShowForm(false); setEditItem(null); setForm({ prayerName: '', azaanTime: '', prayerTime: '' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Prayer Times</h2><p className="text-[12px] text-[#94A3B8]">{data.length} entries</p></div>
        <Button size="sm" onClick={() => { setForm({ prayerName: '', azaanTime: '', prayerTime: '' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'name', label: 'Prayer' }, { key: 'azaan', label: 'Azaan' }, { key: 'time', label: 'Jamaat' }]} data={data} loading={loading}
        onEdit={(item: any) => { setForm({ prayerName: item.name, azaanTime: item.azaan, prayerTime: item.time }); setEditItem(item); setShowForm(true) }}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { const updated = data.filter(d => d.id !== item.id); await cms.prayerTimes.save(updated); fetchData() } })} />
      <FormModal open={showForm} title={editItem ? 'Edit Prayer Time' : 'Add Prayer Time'} onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Prayer Name" value={form.prayerName} onChange={v => setForm({...form, prayerName: v})} placeholder="Fajr" required />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Azaan Time" value={form.azaanTime} onChange={v => setForm({...form, azaanTime: v})} placeholder="5:00 AM" />
            <FormField label="Jamaat Time" value={form.prayerTime} onChange={v => setForm({...form, prayerTime: v})} placeholder="5:30 AM" />
          </div>
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">{editItem ? 'Update' : 'Add'}</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== JUMUAH ==========
function JumuahTab({ cms, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ prayerTime: '', azaanTime: '' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.jumuahs.get(); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    const entry: any = { time: form.prayerTime || form.azaanTime }
    try { await cms.jumuahs.save(data.length ? [...data, entry] : [entry]); setShowForm(false); setForm({ prayerTime: '', azaanTime: '' }); setMsg('Added'); fetchData() } catch {}
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Jumuah Settings</h2><p className="text-[12px] text-[#94A3B8]">{data.length} jamaat(s), max 3</p></div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 rounded-[10px]" disabled={data.length >= 3}><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'time', label: 'Jamaat Time' }]} data={data} loading={loading}
        onEdit={(item: any) => { setForm({ prayerTime: item.time || '', azaanTime: '' }); setShowForm(true) }}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { const updated = data.filter((d: any) => d.id !== item.id); await cms.jumuahs.save(updated); fetchData() } })} />
      <FormModal open={showForm} title="Add Jumuah" onClose={() => setShowForm(false)}>
        <div className="space-y-4">
          <FormField label="Jamaat Time" value={form.prayerTime} onChange={v => setForm({...form, prayerTime: v})} placeholder="1:00 PM" />
          <FormField label="Azaan Time (optional)" value={form.azaanTime} onChange={v => setForm({...form, azaanTime: v})} placeholder="12:30 PM" />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">Add</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== RAMADAN ==========
function RamadanTab({ cms }: any) {
  const [config, setConfig] = useState<any>(null)
  const [days, setDays] = useState<any[]>([])
  const [showDaysForm, setShowDaysForm] = useState(false)
  const [dayForm, setDayForm] = useState({ dayNo: '', sehriEnd: '', iftarTime: '' })
  const [cfgForm, setCfgForm] = useState({ taraweeh: '', note: '', iftarMessage: '', fitraRate: '' })

  useEffect(() => {
    cms.ramadan.get().then((r: any) => { if (r.data) { setConfig(r.data); setCfgForm({ taraweeh: r.data.taraweeh || '', note: r.data.note || '', iftarMessage: r.data.iftarMessage || '', fitraRate: r.data.fitraRate || '' }) } })
    cms.ramadanDays.get().then((r: any) => setDays(r.data || [])).catch(() => {})
  }, [cms])

  const saveConfig = async () => { try { await cms.ramadan.save(cfgForm); setConfig({ ...config, ...cfgForm }) } catch {} }
  const addDay = async () => { try { await cms.ramadanDays.save([...days, { ...dayForm, dayNo: Number(dayForm.dayNo) }]); setShowDaysForm(false); setDayForm({ dayNo: '', sehriEnd: '', iftarTime: '' }); cms.ramadanDays.get().then((r: any) => setDays(r.data || [])) } catch {} }

  return (
    <div className="space-y-5 animate-fade-in">
      <h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Ramadan Config</h2>
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Taraweeh" value={cfgForm.taraweeh} onChange={v => setCfgForm({...cfgForm, taraweeh: v})} placeholder="After Isha" />
          <FormField label="Fitra Rate" value={cfgForm.fitraRate} onChange={v => setCfgForm({...cfgForm, fitraRate: v})} placeholder="₹30" type="number" />
        </div>
        <FormField label="Note" value={cfgForm.note} onChange={v => setCfgForm({...cfgForm, note: v})} type="textarea" placeholder="Ramadan note..." />
        <FormField label="Iftar Message" value={cfgForm.iftarMessage} onChange={v => setCfgForm({...cfgForm, iftarMessage: v})} type="textarea" placeholder="Iftar message..." />
        <Button onClick={saveConfig} className="rounded-[10px] text-[13px] font-semibold" variant="indigo" size="sm">Save Config</Button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[#0F172A] dark:text-white">Ramadan Days ({days.length})</h3>
        <Button size="sm" onClick={() => setShowDaysForm(true)} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add Day</Button>
      </div>
      {days.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-[#2a3042]">
          <table className="w-full text-[13px]">
            <thead><tr className="bg-[#F8FAFC] dark:bg-[#141925] border-b border-[#E2E8F0] dark:border-[#2a3042]">
              <th className="text-left px-4 py-3 font-semibold text-[#64748B] text-[11px] uppercase tracking-wider">Day</th>
              <th className="text-left px-4 py-3 font-semibold text-[#64748B] text-[11px] uppercase tracking-wider">Sehri End</th>
              <th className="text-left px-4 py-3 font-semibold text-[#64748B] text-[11px] uppercase tracking-wider">Iftar Time</th>
            </tr></thead>
            <tbody>{days.map((d: any, i: number) => <tr key={i} className="border-b border-[#F1F5F9] dark:border-[#1e2536]"><td className="px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0]">Day {d.dayNo}</td><td className="px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0]">{d.sehriEnd || '—'}</td><td className="px-4 py-3 text-[#0F172A] dark:text-[#E2E8F0]">{d.iftarTime || '—'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <FormModal open={showDaysForm} title="Add Ramadan Day" onClose={() => setShowDaysForm(false)}>
        <div className="space-y-4">
          <FormField label="Day Number" value={dayForm.dayNo} onChange={v => setDayForm({...dayForm, dayNo: v})} type="number" placeholder="1" required />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Sehri End" value={dayForm.sehriEnd} onChange={v => setDayForm({...dayForm, sehriEnd: v})} placeholder="4:30 AM" />
            <FormField label="Iftar Time" value={dayForm.iftarTime} onChange={v => setDayForm({...dayForm, iftarTime: v})} placeholder="6:45 PM" />
          </div>
          <Button onClick={addDay} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">Add Day</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== JANAZAH ==========
function JanazahTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', time: '', location: '', active: 'true' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.janazahs.get(true); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try {
      if (editItem) { await cms.janazahs.toggle(editItem.id) } else { await cms.janazahs.create({ ...form, active: form.active === 'true' }) }
      setMsg(editItem ? 'Toggled' : 'Added'); setShowForm(false); setEditItem(null); setForm({ title: '', time: '', location: '', active: 'true' }); fetchData()
    } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Janazahs</h2><p className="text-[12px] text-[#94A3B8]">{data.length} records</p></div>
        <Button size="sm" onClick={() => { setForm({ title: '', time: '', location: '', active: 'true' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'title', label: 'Title' }, { key: 'time', label: 'Time' }, { key: 'location', label: 'Location' }, { key: 'active', label: 'Status' }]} data={data} loading={loading}
        onEdit={(item: any) => cms.janazahs.toggle(item.id).then(() => { setMsg('Toggled'); fetchData() })}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.janazahs.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title="Add Janazah" onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Janazah announcement" required />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Time" value={form.time} onChange={v => setForm({...form, time: v})} placeholder="10:00 AM" />
            <FormField label="Location" value={form.location} onChange={v => setForm({...form, location: v})} placeholder="Masjid campus" />
          </div>
          <FormField label="Active" value={form.active} onChange={v => setForm({...form, active: v})} type="select" />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">Add Janazah</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== GUMSHUDA ==========
function GumshudaTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', contact: '', description: '', active: 'true' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.gumshudas.get(true); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try { await cms.gumshudas.create({ ...form, active: form.active === 'true' }); setMsg('Added'); setShowForm(false); setForm({ title: '', contact: '', description: '', active: 'true' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Gumshudas</h2><p className="text-[12px] text-[#94A3B8]">{data.length} records</p></div>
        <Button size="sm" onClick={() => { setForm({ title: '', contact: '', description: '', active: 'true' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'title', label: 'Title' }, { key: 'contact', label: 'Contact' }, { key: 'description', label: 'Description' }, { key: 'active', label: 'Status' }]} data={data} loading={loading}
        onEdit={(item: any) => cms.gumshudas.toggle(item.id).then(() => { setMsg('Toggled'); fetchData() })}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.gumshudas.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title="Add Gumshuda" onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Missing person" required />
          <FormField label="Contact" value={form.contact} onChange={v => setForm({...form, contact: v})} placeholder="9876543210" />
          <FormField label="Description" value={form.description} onChange={v => setForm({...form, description: v})} type="textarea" placeholder="Details..." />
          <FormField label="Active" value={form.active} onChange={v => setForm({...form, active: v})} type="select" />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">Add Gumshuda</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== ANNOUNCEMENTS ==========
function AnnouncementTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', active: 'true' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.announcements.get(true); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try { await cms.announcements.create({ ...form, active: form.active === 'true' }); setMsg('Added'); setShowForm(false); setForm({ title: '', description: '', active: 'true' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Announcements</h2><p className="text-[12px] text-[#94A3B8]">{data.length} records</p></div>
        <Button size="sm" onClick={() => { setForm({ title: '', description: '', active: 'true' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }, { key: 'active', label: 'Status' }]} data={data} loading={loading}
        onEdit={(item: any) => cms.announcements.toggle(item.id).then(() => { setMsg('Toggled'); fetchData() })}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.announcements.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title="Add Announcement" onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Announcement title" required />
          <FormField label="Description" value={form.description} onChange={v => setForm({...form, description: v})} type="textarea" placeholder="Details..." />
          <FormField label="Active" value={form.active} onChange={v => setForm({...form, active: v})} type="select" />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">Add Announcement</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== DONATION CAUSES ==========
function CausesTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', amount: '' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.donationCauses.get(); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try { await cms.donationCauses.create({ ...form, amount: Number(form.amount) || 0 }); setMsg('Added'); setShowForm(false); setForm({ title: '', description: '', amount: '' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Donation Causes</h2><p className="text-[12px] text-[#94A3B8]">{data.length} causes</p></div>
        <Button size="sm" onClick={() => { setForm({ title: '', description: '', amount: '' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }, { key: 'amount', label: 'Amount' }]} data={data} loading={loading}
        onEdit={(item: any) => { setForm({ title: item.title || '', description: item.description || '', amount: String(item.amount || '') }); setEditItem(item); setShowForm(true) }}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.donationCauses.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title={editItem ? 'Edit Cause' : 'Add Donation Cause'} onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Masjid Construction" required />
          <FormField label="Description" value={form.description} onChange={v => setForm({...form, description: v})} type="textarea" placeholder="Details..." />
          <FormField label="Target Amount" value={form.amount} onChange={v => setForm({...form, amount: v})} type="number" placeholder="50000" />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">{editItem ? 'Update' : 'Add Cause'}</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== MONTHLY DONATIONS ==========
function DonationsTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', amount: '', contact: '' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.monthlyDonations.get(); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try { await cms.monthlyDonations.create({ ...form, amount: Number(form.amount) || 0 }); setMsg('Added'); setShowForm(false); setForm({ title: '', amount: '', contact: '' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Monthly Donations</h2><p className="text-[12px] text-[#94A3B8]">{data.length} donors</p></div>
        <Button size="sm" onClick={() => { setForm({ title: '', amount: '', contact: '' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'title', label: 'Name' }, { key: 'amount', label: 'Amount' }, { key: 'contact', label: 'Contact' }]} data={data} loading={loading}
        onEdit={(item: any) => { setForm({ title: item.title || '', amount: String(item.amount || ''), contact: item.contact || '' }); setEditItem(item); setShowForm(true) }}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.monthlyDonations.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title={editItem ? 'Edit Donation' : 'Add Monthly Donation'} onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Name" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Donor name" required />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount" value={form.amount} onChange={v => setForm({...form, amount: v})} type="number" placeholder="1000" />
            <FormField label="Contact" value={form.contact} onChange={v => setForm({...form, contact: v})} placeholder="Phone" />
          </div>
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">{editItem ? 'Update' : 'Add Donation'}</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== EXPENSES ==========
function ExpensesTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', amount: '', description: '' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.expenses.get(); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try { await cms.expenses.create({ ...form, amount: Number(form.amount) || 0 }); setMsg('Added'); setShowForm(false); setForm({ title: '', amount: '', description: '' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Expenses</h2><p className="text-[12px] text-[#94A3B8]">{data.length} records</p></div>
        <Button size="sm" onClick={() => { setForm({ title: '', amount: '', description: '' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'title', label: 'Title' }, { key: 'amount', label: 'Amount' }, { key: 'description', label: 'Description' }]} data={data} loading={loading}
        onEdit={(item: any) => { setForm({ title: item.title || '', amount: String(item.amount || ''), description: item.description || '' }); setEditItem(item); setShowForm(true) }}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.expenses.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title={editItem ? 'Edit Expense' : 'Add Expense'} onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Electricity bill" required />
          <FormField label="Amount" value={form.amount} onChange={v => setForm({...form, amount: v})} type="number" placeholder="5000" />
          <FormField label="Description" value={form.description} onChange={v => setForm({...form, description: v})} type="textarea" placeholder="Details..." />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">{editItem ? 'Update' : 'Add Expense'}</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== SERVICES ==========
function ServicesTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.services.get(); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try { await cms.services.create(form); setMsg('Added'); setShowForm(false); setForm({ title: '', description: '' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Services</h2><p className="text-[12px] text-[#94A3B8]">{data.length} services</p></div>
        <Button size="sm" onClick={() => { setForm({ title: '', description: '' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description' }]} data={data} loading={loading}
        onEdit={(item: any) => { setForm({ title: item.title || '', description: item.description || '' }); setEditItem(item); setShowForm(true) }}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.services.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title={editItem ? 'Edit Service' : 'Add Service'} onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Service name" required />
          <FormField label="Description" value={form.description} onChange={v => setForm({...form, description: v})} type="textarea" placeholder="Details..." />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">{editItem ? 'Update' : 'Add Service'}</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== TEAM MEMBERS ==========
function TeamTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', role: '', phone: '', email: '', image: '' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.teamMembers.get(); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try { await cms.teamMembers.create(form); setMsg('Added'); setShowForm(false); setForm({ name: '', role: '', phone: '', email: '', image: '' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Team Members</h2><p className="text-[12px] text-[#94A3B8]">{data.length} members</p></div>
        <Button size="sm" onClick={() => { setForm({ name: '', role: '', phone: '', email: '', image: '' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' }]} data={data} loading={loading}
        onEdit={(item: any) => { setForm({ name: item.name || '', role: item.role || '', phone: item.phone || '', email: item.email || '', image: item.image || '' }); setEditItem(item); setShowForm(true) }}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.teamMembers.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title={editItem ? 'Edit Team Member' : 'Add Team Member'} onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Name" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="Full name" required />
          <FormField label="Role" value={form.role} onChange={v => setForm({...form, role: v})} placeholder="Imam, Muazzin..." />
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone" value={form.phone} onChange={v => setForm({...form, phone: v})} placeholder="Phone" />
            <FormField label="Email" value={form.email} onChange={v => setForm({...form, email: v})} placeholder="Email" />
          </div>
          <FormField label="Image URL" value={form.image} onChange={v => setForm({...form, image: v})} placeholder="https://..." />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">{editItem ? 'Update' : 'Add Member'}</Button>
        </div>
      </FormModal>
    </div>
  )
}

// ========== SUNNAHS ==========
function SunnahTab({ cms, showForm, setShowForm, editItem, setEditItem, setDeleteTarget, setMsg, refresh }: any) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', arabic: '', transliteration: '', meaning: '', category: '' })
  const fetchData = useCallback(async () => { setLoading(true); try { const r = await cms.sunnahs.get(); setData(r.data || []) } catch {} setLoading(false) }, [cms])
  useEffect(() => { fetchData() }, [fetchData, refresh])

  const handleSave = async () => {
    try { await cms.sunnahs.create(form); setMsg('Added'); setShowForm(false); setForm({ title: '', arabic: '', transliteration: '', meaning: '', category: '' }); fetchData() } catch (e: any) { setMsg(e.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h2 className="text-[16px] font-bold text-[#0F172A] dark:text-white">Sunnahs</h2><p className="text-[12px] text-[#94A3B8]">{data.length} sunnahs</p></div>
        <Button size="sm" onClick={() => { setForm({ title: '', arabic: '', transliteration: '', meaning: '', category: '' }); setEditItem(null); setShowForm(true) }} className="gap-1.5 rounded-[10px]"><Plus className="w-3.5 h-3.5" /> Add</Button>
      </div>
      <CrudTable columns={[{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'meaning', label: 'Meaning' }]} data={data} loading={loading}
        onEdit={(item: any) => { setForm({ title: item.title || '', arabic: item.arabic || '', transliteration: item.transliteration || '', meaning: item.meaning || '', category: item.category || '' }); setEditItem(item); setShowForm(true) }}
        onDelete={(item: any) => setDeleteTarget({ onDelete: async () => { await cms.sunnahs.delete(item.id); fetchData() } })} />
      <FormModal open={showForm} title={editItem ? 'Edit Sunnah' : 'Add Sunnah'} onClose={() => { setShowForm(false); setEditItem(null) }}>
        <div className="space-y-4">
          <FormField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="Sunnah title" required />
          <FormField label="Category" value={form.category} onChange={v => setForm({...form, category: v})} placeholder="Daily, Food..." />
          <FormField label="Arabic" value={form.arabic} onChange={v => setForm({...form, arabic: v})} type="textarea" placeholder="Arabic text" />
          <FormField label="Transliteration" value={form.transliteration} onChange={v => setForm({...form, transliteration: v})} type="textarea" placeholder="Transliteration" />
          <FormField label="Meaning" value={form.meaning} onChange={v => setForm({...form, meaning: v})} type="textarea" placeholder="Meaning / translation" />
          <Button onClick={handleSave} className="w-full h-10 rounded-[10px] text-[13px] font-semibold" variant="indigo">{editItem ? 'Update' : 'Add Sunnah'}</Button>
        </div>
      </FormModal>
    </div>
  )
}
