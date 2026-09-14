import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export default function ProjectDetail() {
  const { id } = useParams()
  const pid = Number(id)
  const qc = useQueryClient()
  const { data: project } = useQuery({ queryKey:['project',pid], queryFn: async()=>(await masterApi.projects.get(pid)).data })
  const { data: tenants } = useQuery({ queryKey:['tenants',pid], queryFn: async()=>(await masterApi.tenants.list(pid)).data })
  const { data: notifs } = useQuery({ queryKey:['notifs',pid], queryFn: async()=>(await masterApi.notifications.list(pid)).data })
  const [tenantName, setTenantName] = useState('')
  const [notif, setNotif] = useState({ title:'', body:'' })
  const tenantMut = useMutation({ mutationFn: ()=> masterApi.tenants.create({ projectId: pid, tenantName }), onSuccess: ()=>{qc.invalidateQueries({queryKey:['tenants']}); setTenantName('')} })
  const notifMut = useMutation({ mutationFn: ()=> masterApi.notifications.send({ projectId: pid, title: notif.title, body: notif.body }), onSuccess: ()=>{qc.invalidateQueries({queryKey:['notifs']}); setNotif({title:'',body:''})} })

  if (!project) return <div className="p-4 text-[#64748B] dark:text-[#94A3B8]">Loading...</div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-black text-[#0F172A] dark:text-white">{project.name} <Badge>{project.slug}</Badge></h1><p className="text-[#64748B] dark:text-[#94A3B8]">{project.description}</p><div className="text-xs text-[#64748B] dark:text-[#94A3B8]">Status: {project.status} | Tech: {project.techStack}</div></div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-[#0F172A] dark:text-white">Tenants / Masjids ({tenants?.length||0})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2"><Input placeholder="Tenant name or masjid" value={tenantName} onChange={e=>setTenantName(e.target.value)} /><Button onClick={()=>tenantMut.mutate()} disabled={!tenantName}>Add</Button></div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {tenants?.map((t:any)=><div key={t.id} className="flex justify-between border border-[#E2E8F0] dark:border-[#2a3042] p-2 rounded-xl text-sm text-[#0F172A] dark:text-white"><span>{t.tenantName||('Masjid #'+t.masjidId)} <Badge className="ml-2 text-[10px]">{t.status}</Badge></span><select value={t.status} onChange={e=>masterApi.tenants.updateStatus(t.id,e.target.value).then(()=>qc.invalidateQueries({queryKey:['tenants']}))} className="text-xs border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white rounded px-1"><option>ACTIVE</option><option>SUSPENDED</option><option>TRIAL</option></select></div>)}
              {(!tenants||tenants.length===0) && <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">No tenants yet</div>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-[#0F172A] dark:text-white">Send Notification</CardTitle><p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Broadcast to this project users</p></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Title</Label><Input value={notif.title} onChange={e=>setNotif({...notif,title:e.target.value})} /></div>
            <div className="space-y-1"><Label>Body</Label><Input value={notif.body} onChange={e=>setNotif({...notif,body:e.target.value})} /></div>
            <Button onClick={()=>notifMut.mutate()} disabled={!notif.title}>Send to Project</Button>
            <div className="space-y-2 pt-4 border-t border-[#E2E8F0] dark:border-[#2a3042]">
              <div className="text-xs font-bold text-[#0F172A] dark:text-white">History</div>
              {notifs?.slice(0,10).map((n:any)=><div key={n.id} className="text-xs border border-[#E2E8F0] dark:border-[#2a3042] p-2 rounded dark:text-white"><div className="font-bold">{n.title}</div><div>{n.body}</div><div className="text-[#64748B] dark:text-[#94A3B8]">{new Date(n.createdAt).toLocaleString()} by {n.createdByEmail}</div></div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
