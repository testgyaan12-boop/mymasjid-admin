import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { ArrowLeft, Users, Bell, Heart, Megaphone, Building2 } from 'lucide-react'

export default function TenantDetail() {
  const { tenantId } = useParams()
  const id = Number(tenantId)
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview'|'users'|'notify'|'raw'>('overview')
  const [notif, setNotif] = useState({ title:'', body:'' })

  const { data: detail } = useQuery({ queryKey:['tenant-detail',id], queryFn: async()=>(await masterApi.tenants.detail(id)).data })
  const { data: stats } = useQuery({ queryKey:['tenant-stats',id], queryFn: async()=>(await masterApi.tenants.stats(id)).data })
  const { data: users } = useQuery({ queryKey:['tenant-users',id], enabled: tab==='users', queryFn: async()=>(await masterApi.tenants.users(id)).data })

  const notifMut = useMutation({ mutationFn: ()=> masterApi.notifications.send({ projectId: detail?.project?.id, title: notif.title, body: notif.body, targetAudience:'TENANT', targetId: id }), onSuccess: ()=>setNotif({title:'',body:''}) })

  if (!detail) return <div className="p-4">Loading tenant...</div>
  const tenant = detail.tenant
  const masjid = detail.masjid
  const project = detail.project

  return (
    <div className="space-y-6">
      <Link to="/tenants" className="inline-flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"><ArrowLeft className="w-4 h-4"/> Back to Tenants</Link>
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 text-[#0F172A] dark:text-white">{masjid?.name || tenant.tenantName} <Badge variant={tenant.status==='ACTIVE'?'success':'warning'}>{tenant.status}</Badge></h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Project: {project?.name} ({project?.slug}) • Tenant #{tenant.id}</p>
          {masjid && <p className="text-xs text-muted-foreground">{masjid.address} • {masjid.phone} • {masjid.email}</p>}
        </div>
        <select value={tenant.status} onChange={e=> masterApi.tenants.updateStatus(tenant.id, e.target.value).then(()=>qc.invalidateQueries({queryKey:['tenant-detail']}))} className="h-10 rounded-xl border px-3 self-start dark:bg-[#1a1f2e] dark:border-[#2a3042] dark:text-[#E2E8F0]">
          <option>ACTIVE</option><option>SUSPENDED</option><option>TRIAL</option>
        </select>
      </div>

      <div className="flex gap-2 border-b overflow-x-auto">
        {[
          {k:'overview', label:'Overview', icon: Building2},
          {k:'users', label:'Users', icon: Users},
          {k:'notify', label:'Notify', icon: Bell},
          {k:'raw', label:'Raw', icon: Megaphone},
        ].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)} className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${tab===t.k?'border-primary text-primary':'border-transparent text-muted-foreground'}`}><t.icon className="w-4 h-4"/>{t.label}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">{stats?.users ?? '-'}</div><div className="text-xs text-muted-foreground">via user_masjid_roles</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Donations</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">{stats?.donations ?? '-'}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Causes</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">{stats?.causes ?? '-'}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Janazahs</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">{stats?.janazahs ?? '-'}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Gumshuda</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">{stats?.gumshudas ?? '-'}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Announcements</CardTitle></CardHeader><CardContent><div className="text-2xl font-black">{stats?.announcements ?? '-'}</div></CardContent></Card>
          {masjid && (
            <Card className="md:col-span-3"><CardHeader><CardTitle>Masjid Full Record</CardTitle></CardHeader><CardContent className="text-sm space-y-1"><div><b>Name:</b> {masjid.name}</div><div><b>Address:</b> {masjid.address}</div><div><b>City:</b> {masjid.city} {masjid.state} {masjid.country} {masjid.pincode}</div><div><b>Contact:</b> {masjid.phone} / {masjid.email} / {masjid.website}</div><div className="text-xs text-muted-foreground">id:{masjid.id} • created:{masjid.createdAt}</div></CardContent></Card>
          )}
        </div>
      )}

      {tab==='users' && (
        <Card><CardHeader><CardTitle>Users for this Masjid ({users?.length||0})</CardTitle><p className="text-xs text-muted-foreground">Click any tab – ADMIN sees same as SUPER (all view)</p></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-xs text-muted-foreground"><th className="text-left p-2">User</th><th className="text-left p-2">Masjid Role</th><th className="text-left p-2">System Role</th></tr></thead>
                <tbody>{users?.map((u:any)=><tr key={u.userId} className="border-b"><td className="p-2"><div className="font-bold">{u.name}</div><div className="text-xs text-muted-foreground">{u.email} • {u.phone||'-'}</div></td><td className="p-2"><Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{u.masjidRole}</Badge></td><td className="p-2"><Badge>{u.systemRole}</Badge></td></tr>)}</tbody>
              </table>
              {(!users || users.length===0) && <div className="text-sm text-muted-foreground py-6 text-center">No users linked to this masjid</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab==='notify' && (
        <Card><CardHeader><CardTitle>Send Notification to this Tenant</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-w-xl">
            <div className="space-y-1"><Label>Title</Label><Input value={notif.title} onChange={e=>setNotif({...notif,title:e.target.value})} placeholder="Jumma timing updated" /></div>
            <div className="space-y-1"><Label>Body</Label><Textarea value={notif.body} onChange={e=>setNotif({...notif,body:e.target.value})} placeholder="Message for this masjid users" /></div>
            <Button onClick={()=>notifMut.mutate()} disabled={!notif.title}><Bell className="w-4 h-4 mr-2"/>Send to Tenant #{tenant.id}</Button>
            <p className="text-xs text-muted-foreground">Stored in saas_notifications with targetAudience=TENANT, projectId={project?.id}</p>
          </CardContent>
        </Card>
      )}

      {tab==='raw' && (
        <Card><CardHeader><CardTitle>Raw Records</CardTitle></CardHeader><CardContent className="text-xs space-y-2"><div>tenant: <pre className="bg-muted p-3 rounded-xl overflow-auto">{JSON.stringify(tenant,null,2)}</pre></div><div>masjid: <pre className="bg-muted p-3 rounded-xl overflow-auto">{JSON.stringify(masjid,null,2)}</pre></div></CardContent></Card>
      )}
    </div>
  )
}
