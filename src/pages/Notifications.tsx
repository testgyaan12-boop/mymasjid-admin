import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { useState } from 'react'

export default function Notifications() {
  const qc = useQueryClient()
  const { data: projects } = useQuery({ queryKey:['projects'], queryFn: async()=>(await masterApi.projects.list()).data })
  const { data: notifs } = useQuery({ queryKey:['notifs-all'], queryFn: async()=>(await masterApi.notifications.list()).data })
  const [form, setForm] = useState({ projectId:'', title:'', body:'', targetAudience:'ALL' })
  const mut = useMutation({ mutationFn: ()=> masterApi.notifications.send({ projectId: form.projectId?Number(form.projectId):null, title: form.title, body: form.body, targetAudience: form.targetAudience }), onSuccess: ()=>{qc.invalidateQueries({queryKey:['notifs-all']}); setForm({ projectId:'', title:'', body:'', targetAudience:'ALL'})} })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#0F172A] dark:text-white">Notifications</h1>
      <Card><CardHeader><CardTitle className="text-[#0F172A] dark:text-white">Send Broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Project (optional)</Label><select value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} className="h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3"><option value="">Global (All)</option>{projects?.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="space-y-1"><Label>Audience</Label><select value={form.targetAudience} onChange={e=>setForm({...form,targetAudience:e.target.value})} className="h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3"><option>ALL</option><option>TENANT</option><option>USER</option></select></div>
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
            <div className="space-y-1"><Label>Body</Label><Textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value as any})} /></div>
          </div>
          <Button onClick={()=>mut.mutate()} disabled={!form.title}>Send Notification</Button>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle className="text-[#0F172A] dark:text-white">History ({notifs?.length||0})</CardTitle></CardHeader><CardContent className="space-y-2 max-h-[600px] overflow-y-auto">{notifs?.map((n:any)=><div key={n.id} className="border border-[#E2E8F0] dark:border-[#2a3042] p-3 rounded-xl text-sm"><div className="font-bold text-[#0F172A] dark:text-white">{n.title} <span className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]">Project #{n.projectId||'Global'} • {n.targetAudience}</span></div><div className="text-[#0F172A] dark:text-white">{n.body}</div><div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{new Date(n.createdAt).toLocaleString()} by {n.createdByEmail}</div></div>)}</CardContent></Card>
    </div>
  )
}
