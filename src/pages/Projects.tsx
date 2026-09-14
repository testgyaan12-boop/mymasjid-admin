import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { useAuth, isSuperAdmin } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Projects() {
  const { user } = useAuth()
  const superAdmin = isSuperAdmin(user?.systemRole)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['projects'], queryFn: async () => (await masterApi.projects.list()).data })
  const [form, setForm] = useState({ name:'', slug:'', description:'', liveUrl:'', repoUrl:'', techStack:'', status:'ACTIVE' })
  const [editId, setEditId] = useState<number|null>(null)
  const createMut = useMutation({
    mutationFn: () => editId ? masterApi.projects.update(editId, form) : masterApi.projects.create(form),
    onSuccess: () => { qc.invalidateQueries({queryKey:['projects']}); setForm({ name:'', slug:'', description:'', liveUrl:'', repoUrl:'', techStack:'', status:'ACTIVE' }); setEditId(null) }
  })
  const delMut = useMutation({ mutationFn: (id:number) => masterApi.projects.delete(id), onSuccess: ()=>qc.invalidateQueries({queryKey:['projects']}) })
  const startEdit = (p:any) => { setEditId(p.id); setForm({ name:p.name, slug:p.slug, description:p.description||'', liveUrl:p.liveUrl||'', repoUrl:p.repoUrl||'', techStack:p.techStack||'', status:p.status||'ACTIVE' }) }

  if (isLoading) return <div className="p-4 text-[#64748B] dark:text-[#94A3B8]">Loading projects...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h1 className="text-2xl font-black text-[#0F172A] dark:text-white">Projects ({data?.length||0})</h1><Badge className="bg-primary text-white">{user?.systemRole} view</Badge></div>
      <Card>
        <CardHeader><CardTitle className="text-[#0F172A] dark:text-white">{editId ? 'Edit Project' : 'Add New SaaS Project'} {!superAdmin && editId===null && <span className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]"> (only SUPER_ADMIN can create)</span>}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Noor Al Masjid" /></div>
            <div className="space-y-1"><Label>Slug (unique)</Label><Input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase().replace(/\s+/g,'-')})} placeholder="noor-masjid" disabled={!!editId} /></div>
            <div className="space-y-1"><Label>Live URL</Label><Input value={form.liveUrl} onChange={e=>setForm({...form,liveUrl:e.target.value})} /></div>
            <div className="space-y-1"><Label>Tech Stack</Label><Input value={form.techStack} onChange={e=>setForm({...form,techStack:e.target.value})} placeholder="Spring Boot + React" /></div>
            <div className="space-y-1 md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
            <div className="space-y-1"><Label>Status</Label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3"><option>ACTIVE</option><option>MAINTENANCE</option><option>SUSPENDED</option></select></div>
          </div>
          <div className="flex gap-2">
            <Button disabled={!superAdmin && !editId} onClick={()=>createMut.mutate()}>{createMut.isPending?'Saving...':editId?'Update':'Create Project'}</Button>
            {editId && <Button variant="outline" onClick={()=>{setEditId(null); setForm({ name:'', slug:'', description:'', liveUrl:'', repoUrl:'', techStack:'', status:'ACTIVE' })}}>Cancel</Button>}
          </div>
          {!superAdmin && !editId && <p className="text-xs text-amber-600 dark:text-amber-400">ADMIN can only edit, not create/delete. Ask SUPER_ADMIN.</p>}
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {data?.map((p:any)=>(
          <Card key={p.id} className="hover:shadow-md transition">
            <CardHeader>
              <div className="flex justify-between"><CardTitle className="flex items-center gap-2 text-[#0F172A] dark:text-white">{p.name}<Badge variant={p.status==='ACTIVE'?'success':'warning'}>{p.status}</Badge></CardTitle><span className="text-xs text-[#64748B] dark:text-[#94A3B8]">/{p.slug}</span></div>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{p.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-1 text-[#64748B] dark:text-[#94A3B8]"><div>Tech: {p.techStack||'-'}</div><div>Live: {p.liveUrl||'-'}</div></div>
              <div className="flex gap-2 flex-wrap">
                <Link to={`/projects/${p.id}`}><Button size="sm" variant="outline">View Details</Button></Link>
                <Button size="sm" variant="outline" onClick={()=>startEdit(p)}>Edit</Button>
                <Button size="sm" variant="destructive" disabled={!superAdmin} onClick={()=>{ if(confirm(`Delete ${p.name}?`)) delMut.mutate(p.id)}}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
