import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { ArrowLeft, Users, Building2, Clock, HandHeart, Bell, AlertTriangle, SearchX, Trash2, Search, X } from 'lucide-react'

type DetailType = null | 'prayer' | 'causes' | 'janazahs' | 'gumshudas' | 'announcements' | 'expenses'

function PrayerTimesView({ masjidId, rows }: { masjidId: number; rows: any[] }) {
  const { data: jumuah } = useQuery({ queryKey: ['jumuah', masjidId], queryFn: async () => (await masterApi.masjids.jumuah(masjidId)).data })
  const hasJumuah = jumuah && (jumuah.prayer_time || jumuah.azaan_time)
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="text-xs font-black text-emerald-700 mb-2">Daily Prayer Times</div>
        <div className="grid gap-2">
          {rows.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between bg-white dark:bg-[#141925] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2a3042]">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-black text-emerald-700 dark:text-emerald-400">{r.prayer_name?.slice(0, 2).toUpperCase()}</span>
                <div>
                  <div className="font-bold text-sm text-[#0F172A] dark:text-white">{r.prayer_name}</div>
                  <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">Azaan: {r.azaan_time || '—'} • Jamaat: {r.prayer_time || '—'}</div>
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No prayer times configured</div>}
        </div>
      </div>
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
        <div className="text-xs font-black text-slate-700 mb-2">Jumuah (Friday)</div>
        {hasJumuah ? (
          <div className="bg-white p-3 rounded-xl border flex justify-between items-center">
            <div><div className="font-bold text-sm">Jumuah</div><div className="text-xs text-muted-foreground">Azaan: {jumuah.azaan_time || '—'} • Jamaat: {jumuah.prayer_time || '—'}</div></div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No Jumuah time set for this masjid</div>
        )}
      </div>
    </div>
  )
}

export default function MasjidDetail() {
  const { masjidId } = useParams()
  const id = Number(masjidId)
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview'|'users'>('overview')
  const [detailType, setDetailType] = useState<DetailType>(null)
  const [confirm, setConfirm] = useState<{type:'janazah'|'gumshuda'|'announcement'|'cause', row:any, nextActive:boolean} | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{type:'cause'|'janazah'|'gumshuda'|'announcement', row:any} | null>(null)
  const [addCauseForm, setAddCauseForm] = useState({ title:'', upi:'', badge:'Sadaqah', description:'', qr_image:'' })
  const [remark, setRemark] = useState('')
  const [deleteRemark, setDeleteRemark] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [showCauseSaveConfirm, setShowCauseSaveConfirm] = useState(false)
  const [causeSaveRemark, setCauseSaveRemark] = useState('')
  const [qrUploading, setQrUploading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number|null>(null)
  const [userConfirm, setUserConfirm] = useState<{type:'toggle'|'delete', user:any, nextActive?:boolean} | null>(null)
  const [userRemark, setUserRemark] = useState('')
  const [userError, setUserError] = useState('')
  const [masjidRoleFilter, setMasjidRoleFilter] = useState<string>('ALL')
  const [masjidUserSearch, setMasjidUserSearch] = useState('')

  const { data: detail } = useQuery({ queryKey:['masjid-detail',id], queryFn: async()=>(await masterApi.masjids.detail(id)).data })
  const { data: stats } = useQuery({ queryKey:['masjid-stats',id], queryFn: async()=>(await masterApi.masjids.stats(id)).data })
  const { data: users } = useQuery({ queryKey:['masjid-users',id], enabled: tab==='users', queryFn: async()=>(await masterApi.masjids.users(id)).data })
  const filteredMasjidUsers = (users||[]).filter((u:any)=> (masjidRoleFilter==='ALL' || u.masjidRole===masjidRoleFilter) && (!masjidUserSearch || u.name?.toLowerCase().includes(masjidUserSearch.toLowerCase()) || u.email?.toLowerCase().includes(masjidUserSearch.toLowerCase())))
  const { data: userDetail } = useQuery({ queryKey:['user-detail', id, selectedUserId], enabled: !!selectedUserId, queryFn: async()=>(await masterApi.masjids.userDetail(id, selectedUserId!)).data })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey:['masjid-detail-data',id, detailType],
    enabled: !!detailType,
    queryFn: async()=>{
      if(detailType==='prayer') return (await masterApi.masjids.prayerTimes(id)).data
      if(detailType==='causes') return (await masterApi.masjids.causes(id)).data
      if(detailType==='janazahs') return (await masterApi.masjids.janazahs(id)).data
      if(detailType==='gumshudas') return (await masterApi.masjids.gumshudas(id)).data
      if(detailType==='announcements') return (await masterApi.masjids.announcements(id)).data
      if(detailType==='expenses') return (await masterApi.masjids.expenses(id)).data
      return []
    }
  })

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5*1024*1024) { alert('File too large, max 5MB'); return }
    setQrUploading(true)
    try {
      const res = await masterApi.upload(file)
      const url = res.data?.url
      if (url) setAddCauseForm(prev => ({ ...prev, qr_image: url }))
      else {
        const reader = new FileReader()
        reader.onloadend = () => setAddCauseForm(prev => ({ ...prev, qr_image: reader.result as string }))
        reader.readAsDataURL(file)
      }
    } catch (err:any) {
      const reader = new FileReader()
      reader.onloadend = () => setAddCauseForm(prev => ({ ...prev, qr_image: reader.result as string }))
      reader.readAsDataURL(file)
    } finally {
      setQrUploading(false)
      e.target.value = ''
    }
  }

  const addCauseMut = useMutation({
    mutationFn: () => masterApi.masjids.createCause(id, { ...addCauseForm, remarks: causeSaveRemark }),
    onSuccess: () => { setAddCauseForm({ title:'', upi:'', badge:'Sadaqah', description:'', qr_image:'' }); setCauseSaveRemark(''); setShowCauseSaveConfirm(false); qc.invalidateQueries({queryKey:['masjid-detail-data']}); qc.invalidateQueries({queryKey:['masjid-stats']}) }
  })

  const toggleMut = useMutation({
    mutationFn: async () => {
      if (!confirm) throw new Error('no confirm')
      if (!remark.trim()) throw new Error('Remark required')
      if (confirm.type === 'janazah') return masterApi.masjids.toggleJanazah(id, confirm.row.id, confirm.nextActive, remark)
      if (confirm.type === 'gumshuda') return masterApi.masjids.toggleGumshuda(id, confirm.row.id, confirm.nextActive, remark)
      if (confirm.type === 'announcement') return masterApi.masjids.toggleAnnouncement(id, confirm.row.id, confirm.nextActive, remark)
      if (confirm.type === 'cause') return masterApi.masjids.toggleCause(id, confirm.row.id, confirm.nextActive, remark)
      throw new Error('unknown')
    },
    onSuccess: () => {
      setConfirm(null); setRemark(''); setConfirmError('')
      qc.invalidateQueries({ queryKey: ['masjid-detail-data'] })
      qc.invalidateQueries({ queryKey: ['masjid-stats'] })
    },
    onError: (e:any) => setConfirmError(e.response?.data?.message || e.message || 'Failed')
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!deleteConfirm) throw new Error('no confirm')
      if (!deleteRemark.trim()) throw new Error('Remark required')
      if (deleteConfirm.type === 'cause') return masterApi.masjids.deleteCause(id, deleteConfirm.row.id, deleteRemark)
      if (deleteConfirm.type === 'janazah') return masterApi.masjids.deleteJanazah(id, deleteConfirm.row.id, deleteRemark)
      if (deleteConfirm.type === 'gumshuda') return masterApi.masjids.deleteGumshuda(id, deleteConfirm.row.id, deleteRemark)
      if (deleteConfirm.type === 'announcement') return masterApi.masjids.deleteAnnouncement(id, deleteConfirm.row.id, deleteRemark)
      throw new Error('unknown')
    },
    onSuccess: () => {
      setDeleteConfirm(null); setDeleteRemark(''); setDeleteError('')
      qc.invalidateQueries({ queryKey: ['masjid-detail-data'] })
      qc.invalidateQueries({ queryKey: ['masjid-stats'] })
    },
    onError: (e:any) => setDeleteError(e.response?.data?.message || e.message || 'Failed')
  })

  const userToggleMut = useMutation({
    mutationFn: async () => {
      if (!userConfirm || userConfirm.type!=='toggle') throw new Error('no confirm')
      if (!userRemark.trim()) throw new Error('Remark required')
      return masterApi.masjids.toggleUser(id, userConfirm.user.userId, userConfirm.nextActive!, userRemark)
    },
    onSuccess: () => { setUserConfirm(null); setUserRemark(''); setUserError(''); qc.invalidateQueries({queryKey:['masjid-users']}); if(selectedUserId) qc.invalidateQueries({queryKey:['user-detail']}) },
    onError: (e:any)=> setUserError(e.response?.data?.message || e.message || 'Failed')
  })
  const userDeleteMut = useMutation({
    mutationFn: async () => {
      if (!userConfirm || userConfirm.type!=='delete') throw new Error('no confirm')
      if (!userRemark.trim()) throw new Error('Remark required')
      return masterApi.masjids.deleteUser(id, userConfirm.user.userId, userRemark)
    },
    onSuccess: () => { setUserConfirm(null); setUserRemark(''); setUserError(''); setSelectedUserId(null); qc.invalidateQueries({queryKey:['masjid-users']}); qc.invalidateQueries({queryKey:['masjid-stats']}) },
    onError: (e:any)=> setUserError(e.response?.data?.message || e.message || 'Failed')
  })

  if (!detail) return <div className="p-4">Loading masjid...</div>
  const masjid = detail.masjid

  const cards = [
    { key:'users', label:'Users', value: stats?.users, icon: Users, color:'bg-blue-500' },
    { key:'prayer', label:'Prayer Times', value: stats?.prayerTimes, icon: Clock, color:'bg-emerald-600' },
    { key:'causes', label:'Donate', value: stats?.causes, icon: HandHeart, color:'bg-amber-500' },
    { key:'janazahs', label:'Janazahs', value: stats?.janazahs, icon: Bell, color:'bg-slate-700' },
    { key:'gumshudas', label:'Gumshuda', value: stats?.gumshudas, icon: SearchX, color:'bg-orange-500' },
    { key:'announcements', label:'Alerts', value: stats?.announcements, icon: AlertTriangle, color:'bg-purple-500' },
  ]

  const renderDetail = () => {
    if(!detailType) return null
    const rows: any[] = Array.isArray(detailData) ? detailData : []
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={()=>setDetailType(null)} />
        <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
          <div className="p-4 border-b border-[#E2E8F0] dark:border-[#2a3042] flex justify-between items-center bg-[#F8FAFC] dark:bg-white/[0.02] sticky top-0 z-10">
            <h3 className="font-black capitalize flex items-center gap-2 text-[#0F172A] dark:text-white">{detailType==='prayer' ? 'Prayer Times' : detailType} <Badge>{rows.length}</Badge></h3>
            <Button variant="outline" size="sm" onClick={()=>setDetailType(null)} className="rounded-full px-4 border-2">✕ Close</Button>
          </div>
          <div className="p-4 overflow-y-auto space-y-2">
            {detailLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
            {!detailLoading && rows.length===0 && <div className="text-sm text-muted-foreground py-8 text-center">No {detailType} found for this masjid</div>}
            {detailType==='prayer' && <PrayerTimesView masjidId={id} rows={rows} />}
            {detailType==='causes' && (
              <>
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2 text-amber-700"><HandHeart className="w-4 h-4"/>Add Cause — UPI + QR Scanner</CardTitle><p className="text-xs text-muted-foreground">Cloudinary upload (5MB max)</p></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">Title *</Label><Input placeholder="e.g. Masjid Construction Fund" value={addCauseForm.title} onChange={e=>setAddCauseForm({...addCauseForm,title:e.target.value})} className="bg-white" /></div>
                      <div className="space-y-1"><Label className="text-xs">UPI ID</Label><Input placeholder="masjid@upi" value={addCauseForm.upi} onChange={e=>setAddCauseForm({...addCauseForm,upi:e.target.value})} className="bg-white font-mono" /></div>
                      <div className="space-y-1"><Label className="text-xs">Badge</Label><Input placeholder="Sadaqah / Zakat" value={addCauseForm.badge} onChange={e=>setAddCauseForm({...addCauseForm,badge:e.target.value})} className="bg-white" /></div>
                      <div className="space-y-1">
                        <Label className="text-xs">QR Scanner Image</Label>
                        <div className="flex gap-2 items-center">
                          <Input type="file" accept="image/*" onChange={handleQrUpload} className="bg-white text-xs h-10" disabled={qrUploading} />
                          {qrUploading && <span className="text-xs text-amber-600 animate-pulse">Uploading...</span>}
                          {addCauseForm.qr_image && !qrUploading && <img src={addCauseForm.qr_image} alt="preview" className="w-12 h-12 object-contain border rounded bg-white shrink-0" />}
                          {addCauseForm.qr_image && !qrUploading && <Button variant="ghost" size="sm" onClick={()=>setAddCauseForm(p=>({...p,qr_image:''}))}>✕</Button>}
                        </div>
                      </div>
                      <div className="space-y-1 md:col-span-2"><Label className="text-xs">Description</Label><Textarea placeholder="Purpose..." value={addCauseForm.description} onChange={e=>setAddCauseForm({...addCauseForm,description:e.target.value})} className="bg-white" /></div>
                    </div>
                    <Button size="sm" onClick={()=>setShowCauseSaveConfirm(true)} disabled={!addCauseForm.title || qrUploading} className="w-full md:w-auto">Save Cause — Confirm</Button>
                  </CardContent>
                </Card>
                {rows.map((r:any)=>(
                  <div key={r.id} className="border p-3 rounded-xl text-sm">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <div className="font-bold">{r.title} <Badge>{r.badge||''}</Badge> <Badge className={r.is_active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}>{r.is_active?'ACTIVE':'INACTIVE'}</Badge></div>
                        <div className="text-xs">{r.description}</div>
                        <div className="text-xs text-muted-foreground">UPI: <span className="font-mono font-bold">{r.upi||'—'}</span> {r.remarks && `• remark: ${r.remarks}`}</div>
                      </div>
                      {r.qr_image && <img src={r.qr_image} alt="QR scanner" className="w-20 h-20 object-contain border rounded bg-white" />}
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={!!r.is_active} onCheckedChange={(v)=>{setConfirm({type:'cause', row:r, nextActive: v}); setRemark(''); setConfirmError('')}} />
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={()=>{setDeleteConfirm({type:'cause', row:r}); setDeleteRemark(''); setDeleteError('')}}><Trash2 className="w-4 h-4"/></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {detailType==='janazahs' && rows.map((r:any)=>(
              <div key={r.id} className="border p-3 rounded-xl text-sm">
                <div className="flex justify-between gap-2">
                  <div><div className="font-bold">{r.title}</div><div className="text-xs">{r.time} • {r.location} • <Badge className={r.active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}>{r.active?'ACTIVE':'INACTIVE'}</Badge></div><div className="text-xs text-muted-foreground">{r.event_date} • {r.created_at} {r.remarks && `• remark: ${r.remarks}`}</div></div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={!!r.active} onCheckedChange={(v)=>{setConfirm({type:'janazah', row:r, nextActive: v}); setRemark(''); setConfirmError('')}} />
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={()=>{setDeleteConfirm({type:'janazah', row:r}); setDeleteRemark(''); setDeleteError('')}}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </div>
              </div>
            ))}
            {detailType==='gumshudas' && rows.map((r:any)=>(
              <div key={r.id} className="border p-3 rounded-xl text-sm">
                <div className="flex gap-3">
                  <div className="flex-1"><div className="font-bold">{r.title} {r.found&&<Badge className="bg-green-100 text-green-700">FOUND</Badge>} <Badge className={r.active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}>{r.active?'ACTIVE':'INACTIVE'}</Badge></div><div className="text-xs">{r.details}</div><div className="text-xs text-muted-foreground">contact:{r.contact} {r.remarks && `• remark: ${r.remarks}`}</div></div>
                  {r.image&&<img src={r.image} className="w-16 h-16 rounded object-cover border"/>}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={!!r.active} onCheckedChange={(v)=>{setConfirm({type:'gumshuda', row:r, nextActive: v}); setRemark(''); setConfirmError('')}} />
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={()=>{setDeleteConfirm({type:'gumshuda', row:r}); setDeleteRemark(''); setDeleteError('')}}><Trash2 className="w-4 h-4"/></Button>
                  </div>
                </div>
              </div>
            ))}
            {detailType==='announcements' && rows.map((r:any)=>(
              <div key={r.id} className="border p-3 rounded-xl text-sm">
                <div className="flex justify-between gap-2"><div><div className="font-bold">{r.title} <Badge>{r.icon||''}</Badge> <Badge className={r.active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}>{r.active?'ACTIVE':'INACTIVE'}</Badge></div><div className="text-xs">{r.description}</div><div className="text-xs text-muted-foreground">{r.created_at} {r.remarks && `• remark: ${r.remarks}`}</div></div><div className="flex items-center gap-2 shrink-0"><Switch checked={!!r.active} onCheckedChange={(v)=>{setConfirm({type:'announcement', row:r, nextActive: v}); setRemark(''); setConfirmError('')}} /><Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={()=>{setDeleteConfirm({type:'announcement', row:r}); setDeleteRemark(''); setDeleteError('')}}><Trash2 className="w-4 h-4"/></Button></div></div>
              </div>
            ))}
            {detailType==='expenses' && rows.map((r:any)=><div key={r.id} className="border p-3 rounded-xl text-sm flex justify-between"><span>{r.label}</span><span className="font-bold">₹{r.value}</span></div>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/tenants" className="inline-flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"><ArrowLeft className="w-4 h-4"/> Back to Masjids</Link>
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2 text-[#0F172A] dark:text-white">{masjid?.name} <Badge>{masjid?.pincode}</Badge></h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{masjid?.address} • {masjid?.city} {masjid?.state}</p>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{masjid?.phone} • {masjid?.email}</p>
      </div>

      <div className="flex gap-2 border-b border-[#E2E8F0] dark:border-[#2a3042]">
        <button onClick={()=>setTab('overview')} className={`px-4 py-3 text-sm font-bold border-b-2 ${tab==='overview'?'border-primary text-primary':'border-transparent text-[#64748B] dark:text-[#94A3B8]'}`}>Overview</button>
        <button onClick={()=>setTab('users')} className={`px-4 py-3 text-sm font-bold border-b-2 flex items-center gap-2 ${tab==='users'?'border-primary text-primary':'border-transparent text-[#64748B] dark:text-[#94A3B8]'}`}><Users className="w-4 h-4"/>Users</button>
      </div>

      {tab==='overview' && (
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map(c=>{
            const clickable = c.key !== 'users'
            return (
              <Card key={c.key} onClick={()=> clickable && setDetailType(c.key as DetailType)} className={`${clickable?'cursor-pointer hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition' : ''} dark:bg-[#1a1f2e] dark:border-[#2a3042]`}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-2"><span className={`w-7 h-7 rounded-lg ${c.color} flex items-center justify-center text-white`}><c.icon className="w-3.5 h-3.5"/></span>{c.label}</CardTitle>
                  {clickable && <span className="text-[10px] text-primary font-bold">View →</span>}
                </CardHeader>
                <CardContent><div className="text-2xl font-black">{c.value ?? '-'}</div><div className="text-[10px] text-muted-foreground">{clickable ? 'Click to see as it is' : 'via users tab'}</div></CardContent>
              </Card>
            )
          })}
          <Card className="md:col-span-3"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4"/>Full Record</CardTitle></CardHeader><CardContent className="text-sm space-y-1"><div><b>{masjid.name}</b> — {masjid.address}</div><div>{masjid.city} {masjid.state} {masjid.country} {masjid.pincode}</div><div>{masjid.phone} / {masjid.email} / {masjid.website}</div></CardContent></Card>
        </div>
      )}

      {tab==='users' && (
        <div className="space-y-4">
          {/* Role wise cards - default ALL, search without impact on counts */}
          {(() => {
            const counts = {
              all: users?.length || 0,
              management: users?.filter((u:any)=>u.masjidRole==='MANAGEMENT').length || 0,
              admin: users?.filter((u:any)=>u.masjidRole==='ADMIN').length || 0,
              employee: users?.filter((u:any)=>u.masjidRole==='EMPLOYEE').length || 0,
              member: users?.filter((u:any)=>u.masjidRole==='MEMBER').length || 0,
            }
            const items = [
              { key:'ALL', label:'All', count: counts.all, color:'bg-slate-900 text-white' },
              { key:'MANAGEMENT', label:'MANAGEMENT', count: counts.management, color:'bg-purple-100 text-purple-700 border-purple-200' },
              { key:'ADMIN', label:'ADMIN', count: counts.admin, color:'bg-blue-100 text-blue-700 border-blue-200' },
              { key:'EMPLOYEE', label:'EMPLOYEE', count: counts.employee, color:'bg-amber-100 text-amber-700 border-amber-200' },
              { key:'MEMBER', label:'MEMBER', count: counts.member, color:'bg-gray-100 text-slate-700' },
            ]
            return (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {items.map(it=>(
                  <button key={it.key} onClick={()=>setMasjidRoleFilter(it.key)} className={`p-3 rounded-2xl border-2 text-left transition ${masjidRoleFilter===it.key ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10' : 'border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#1a1f2e] hover:border-primary/30 hover:shadow-sm'}`}>
                    <div className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest truncate">{it.label}</div>
                    <div className="text-xl font-black mt-1 text-[#0F172A] dark:text-white">{it.count}</div>
                    <Badge className={`mt-1 text-[10px] ${it.color} border truncate`}>{it.key==='ALL' ? 'Default' : it.label}</Badge>
                    {masjidRoleFilter===it.key && <div className="text-[11px] font-bold text-primary mt-1">● Selected</div>}
                  </button>
                ))}
              </div>
            )
          })()}
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Search by name/email..." value={masjidUserSearch} onChange={e=>setMasjidUserSearch(e.target.value)} className="pl-10 h-11 text-base" />
                {masjidUserSearch && <button onClick={()=>setMasjidUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"><X className="w-4 h-4"/></button>}
              </div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-[#0F172A] dark:text-white">Users ({filteredMasjidUsers.length}/{users?.length||0}) — {masjidRoleFilter==='ALL' ? 'All' : masjidRoleFilter}</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#E2E8F0] dark:border-[#2a3042] text-xs text-[#64748B] dark:text-[#94A3B8]"><th className="text-left p-2">User</th><th className="text-left p-2">Role</th><th className="text-left p-2">Joined</th><th className="text-left p-2">Active</th><th className="text-left p-2">Actions</th></tr></thead>
                <tbody>{filteredMasjidUsers.map((u:any)=>(
                  <tr key={u.userId} className="border-b border-[#F1F5F9] dark:border-[#2a3042] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] cursor-pointer" onClick={()=>setSelectedUserId(u.userId)}>
                    <td className="p-2"><div className="font-bold text-[#0F172A] dark:text-white">{u.name}</div><div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{u.email}</div></td>
                    <td className="p-2"><div className="flex items-center gap-1 flex-wrap"><Badge>{u.masjidRole}</Badge><span className="text-xs text-muted-foreground">@ {masjid?.name}</span><Badge className="bg-slate-100 text-slate-700">{u.systemRole}</Badge></div></td>
                    <td className="p-2 text-xs">{u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : '-'}</td>
                    <td className="p-2" onClick={e=>e.stopPropagation()}>
                      <Switch checked={!!u.umrActive} onCheckedChange={(v)=>{setUserConfirm({type:'toggle', user:u, nextActive: v}); setUserRemark(''); setUserError('')}} />
                    </td>
                    <td className="p-2" onClick={e=>e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={()=>setSelectedUserId(u.userId)}>View</Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" onClick={()=>{setUserConfirm({type:'delete', user:u}); setUserRemark(''); setUserError('')}}><Trash2 className="w-3.5 h-3.5"/></Button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {filteredMasjidUsers.length===0 && users && users.length>0 && <div className="text-center text-sm text-muted-foreground py-4">No users match filter/search — try All or clear search</div>}
            {(!users || users.length===0) && <div className="text-center text-sm text-muted-foreground py-6">No users linked — add via Tenants → Add Masjid → admin</div>}
          </CardContent></Card>

          {/* User detail popup */}
          {selectedUserId && userDetail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={()=>setSelectedUserId(null)} />
              <Card className="relative w-full max-w-2xl max-h-[85vh] flex flex-col border-2 border-[#E2E8F0] dark:border-[#2a3042] shadow-xl overflow-hidden">
                <CardHeader className="flex flex-row justify-between items-start border-b border-[#E2E8F0] dark:border-[#2a3042] bg-[#F8FAFC] dark:bg-white/[0.02]">
                  <div>
                    <CardTitle className="flex items-center gap-2">{userDetail.name} <Badge>{userDetail.masjidRole}</Badge> <Badge className={userDetail.is_active ? 'bg-green-100 text-green-700':'bg-red-100 text-red-700'}>{userDetail.is_active?'ACTIVE':'INACTIVE'}</Badge></CardTitle>
                    <p className="text-xs text-muted-foreground">{userDetail.email} • {userDetail.phone||'—'} • Joined: {userDetail.joinedAt ? new Date(userDetail.joinedAt).toLocaleString() : '-'}</p>
                    <p className="text-xs text-muted-foreground">System: {userDetail.system_role} • Role desc: {userDetail.roleDesc||'—'} {userDetail.remarks && `• remark: ${userDetail.remarks}`}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={()=>setSelectedUserId(null)} className="rounded-full">✕</Button>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto p-4">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 text-sm"><span>Active</span><Switch checked={!!userDetail.is_active} onCheckedChange={(v)=>{setUserConfirm({type:'toggle', user:{userId: userDetail.id}, nextActive: v}); setUserRemark(''); setUserError('')}} /></div>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={()=>{setUserConfirm({type:'delete', user:{userId: userDetail.id}}); setUserRemark(''); setUserError('')}}><Trash2 className="w-4 h-4 mr-1"/>Delete from Masjid</Button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-black mb-2">Recent Activity (what saved)</div>
                      <div className="space-y-1 max-h-[280px] overflow-y-auto">
                        {(userDetail.recentAudits as any[] || []).length===0 && <div className="text-xs text-muted-foreground">No activity</div>}
                        {(userDetail.recentAudits as any[] || []).map((a:any, i:number)=>(
                          <div key={i} className="border p-2 rounded-lg text-xs"><div className="font-bold">{a.action} {a.entity} #{a.entity_id}</div><div className="text-muted-foreground">{a.detail}</div><div className="text-[10px] text-muted-foreground">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div></div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-black mb-1">Recent Donations</div>
                        {(userDetail.recentDonations as any[] || []).length===0 ? <div className="text-xs text-muted-foreground">None</div> : (userDetail.recentDonations as any[]).map((d:any)=><div key={d.id} className="border p-2 rounded text-xs flex justify-between"><span>₹{d.amount} {d.status}</span><span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span></div>)}
                      </div>
                      <div>
                        <div className="text-xs font-black mb-1">Tasbih Logs</div>
                        {(userDetail.recentTasbih as any[] || []).length===0 ? <div className="text-xs text-muted-foreground">None</div> : (userDetail.recentTasbih as any[]).map((t:any,i:number)=><div key={i} className="border p-2 rounded text-xs">{t.dhikr} — {t.count} ({t.session_date ? new Date(t.session_date).toLocaleDateString():''})</div>)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {renderDetail()}

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setConfirm(null)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl w-full max-w-md border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="p-6">
              <h3 className="font-bold text-lg text-[#0F172A] dark:text-white">{confirm.nextActive ? 'Activate' : 'Deactivate'} {confirm.type}?</h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1"><b>{confirm.row.title}</b> will be <b>{confirm.nextActive ? 'ACTIVE' : 'INACTIVE'}</b>. Provide a remark.</p>
              <div className="mt-4 space-y-2">
                <Label>Remark *</Label>
                <Textarea value={remark} onChange={e=>setRemark(e.target.value)} placeholder="e.g. Verified by admin..." />
                {confirmError && <div className="text-sm text-red-600">{confirmError}</div>}
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <Button variant="outline" onClick={()=>setConfirm(null)}>Cancel</Button>
                <Button variant={confirm.nextActive ? 'default' : 'destructive'} onClick={()=>toggleMut.mutate()} disabled={!remark.trim() || toggleMut.isPending}>{toggleMut.isPending ? 'Saving...' : confirm.nextActive ? 'Activate' : 'Deactivate'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCauseSaveConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setShowCauseSaveConfirm(false)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl w-full max-w-md border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="p-6">
              <h3 className="font-bold text-lg text-[#0F172A] dark:text-white">Confirm Save Cause?</h3>
              <p className="text-sm text-muted-foreground mt-1"><b>{addCauseForm.title}</b> — UPI <b>{addCauseForm.upi||'—'}</b> will be saved. Add a remark for audit.</p>
              {addCauseForm.qr_image && <img src={addCauseForm.qr_image} alt="QR preview" className="mt-3 w-28 h-28 object-contain border rounded mx-auto" />}
              <div className="mt-4 space-y-2">
                <Label>Remark *</Label>
                <Textarea value={causeSaveRemark} onChange={e=>setCauseSaveRemark(e.target.value)} placeholder="e.g. New cause for Ramadan fund" />
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <Button variant="outline" onClick={()=>setShowCauseSaveConfirm(false)}>Cancel</Button>
                <Button onClick={()=>addCauseMut.mutate()} disabled={!causeSaveRemark.trim() || addCauseMut.isPending}>{addCauseMut.isPending?'Saving...':'Confirm & Save'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl w-full max-w-md border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-[#0F172A] dark:text-white"><Trash2 className="w-5 h-5 text-red-600"/> Soft Delete {deleteConfirm.type}?</h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1"><b>{deleteConfirm.row.title}</b> will be soft-deleted. Provide a remark.</p>
              <div className="mt-4 space-y-2">
                <Label>Remark *</Label>
                <Textarea value={deleteRemark} onChange={e=>setDeleteRemark(e.target.value)} placeholder="e.g. Duplicate entry, incorrect info..." />
                {deleteError && <div className="text-sm text-red-600">{deleteError}</div>}
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <Button variant="outline" onClick={()=>setDeleteConfirm(null)}>Cancel</Button>
                <Button variant="destructive" onClick={()=>deleteMut.mutate()} disabled={!deleteRemark.trim() || deleteMut.isPending}>{deleteMut.isPending ? 'Deleting...' : 'Confirm Delete'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {userConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setUserConfirm(null)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl w-full max-w-md border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-[#0F172A] dark:text-white">
                {userConfirm.type==='delete' ? <><Trash2 className="w-5 h-5 text-red-600"/> Soft Delete User?</> : <>{userConfirm.nextActive ? 'Activate' : 'Deactivate'} User?</>}
              </h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                <b>{userConfirm.user.name || userConfirm.user.email}</b> will be <b>{userConfirm.type==='delete' ? 'soft-deleted' : (userConfirm.nextActive ? 'ACTIVE' : 'INACTIVE')}</b>. Remark required.
              </p>
              <div className="mt-4 space-y-2">
                <Label>Remark *</Label>
                <Textarea value={userRemark} onChange={e=>setUserRemark(e.target.value)} placeholder={userConfirm.type==='delete' ? 'e.g. User left masjid' : 'e.g. Suspended for review'} />
                {userError && <div className="text-sm text-red-600">{userError}</div>}
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <Button variant="outline" onClick={()=>setUserConfirm(null)}>Cancel</Button>
                {userConfirm.type==='toggle' ? (
                  <Button variant={userConfirm.nextActive ? 'default' : 'destructive'} onClick={()=>userToggleMut.mutate()} disabled={!userRemark.trim() || userToggleMut.isPending}>{userToggleMut.isPending ? 'Saving...' : userConfirm.nextActive ? 'Activate' : 'Deactivate'}</Button>
                ) : (
                  <Button variant="destructive" onClick={()=>userDeleteMut.mutate()} disabled={!userRemark.trim() || userDeleteMut.isPending}>{userDeleteMut.isPending ? 'Deleting...' : 'Confirm Delete'}</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
