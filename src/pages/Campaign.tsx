import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Send, Mail, Bell, Users, Building2, Megaphone, History } from 'lucide-react'

export default function Campaign() {
  const qc = useQueryClient()
  const [type, setType] = useState<'EMAIL'|'PUSH'|'BOTH'>('PUSH')
  const [targetType, setTargetType] = useState<'ALL'|'MASJID'|'USER'>('ALL')
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedMasjids, setSelectedMasjids] = useState<number[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedMasjidUsers, setSelectedMasjidUsers] = useState<number[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [msg, setMsg] = useState('')

  const { data: masjids } = useQuery({ queryKey:['masjids'], queryFn: async()=>(await masterApi.masjids.list()).data })
  const { data: users } = useQuery({ queryKey:['users-search', userSearch], queryFn: async()=>(await masterApi.users.list(userSearch || undefined)).data, enabled: targetType==='USER' })
  const { data: campaigns } = useQuery({ queryKey:['campaigns'], queryFn: async()=>(await masterApi.campaigns.list()).data })
  const { data: masjidUsersData } = useQuery({
    queryKey:['masjid-users-bulk', selectedMasjids.join(',')],
    enabled: targetType==='MASJID' && selectedMasjids.length>0,
    queryFn: async()=>{
      const all: any[] = []
      for(const mid of selectedMasjids){ try{ const r = await masterApi.masjids.users(mid); all.push(...(r.data||[])) } catch {} }
      const map = new Map(); all.forEach((u:any)=> map.set(u.userId, u)); return Array.from(map.values())
    }
  })

  const sendMut = useMutation({
    mutationFn: () => {
      let targetIds: any = null; let extra:any = {}
      if (targetType==='MASJID') { targetIds = JSON.stringify(selectedMasjids); if(selectedMasjidUsers.length>0) extra.userIds = JSON.stringify(selectedMasjidUsers) }
      if (targetType==='USER') targetIds = JSON.stringify(selectedUsers)
      return masterApi.campaigns.send({ title, subject, body, type, targetType, targetIds, ...extra })
    },
    onSuccess: (res:any) => { setMsg(`Sent ${res.data.type} campaign "${res.data.title}" to ${res.data.sentCount} recipients`); setTitle(''); setSubject(''); setBody(''); setSelectedMasjids([]); setSelectedUsers([]); setSelectedMasjidUsers([]); qc.invalidateQueries({queryKey:['campaigns']}) },
    onError: (e:any)=> setMsg(e.response?.data?.message || 'Send failed')
  })

  const toggleMasjid = (id:number) => setSelectedMasjids(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  const toggleUser = (id:number) => setSelectedUsers(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><Megaphone className="w-6 h-6 text-primary" /><h1 className="text-2xl font-black text-[#0F172A] dark:text-white">Campaign</h1><Badge>Email + Push</Badge></div>
      <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Send email and/or push notification to All, by Masjid, or select users.</p>

      <Card className="border-2 border-primary/10">
        <CardHeader><CardTitle className="flex items-center gap-2 text-[#0F172A] dark:text-white"><Send className="w-5 h-5"/> New Campaign</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1"><Label>Type</Label><select value={type} onChange={e=>setType(e.target.value as any)} className="h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3"><option value="PUSH">Push Notification</option><option value="EMAIL">Email</option><option value="BOTH">Both</option></select></div>
            <div className="space-y-1"><Label>Target</Label><select value={targetType} onChange={e=>setTargetType(e.target.value as any)} className="h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3"><option value="ALL">All Users</option><option value="MASJID">By Masjid</option><option value="USER">Select Users</option></select></div>
            <div className="space-y-1"><Label>Title *</Label><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Eid Mubarak" /></div>
          </div>
          {(type==='EMAIL' || type==='BOTH') && <div className="space-y-1"><Label>Email Subject</Label><Input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Subject for email" /></div>}
          <div className="space-y-1"><Label>Body *</Label><Textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Message body..." className="min-h-[100px]" /></div>

          {targetType==='MASJID' && (
            <div className="space-y-3">
              <Label>Select Masjids ({selectedMasjids.length} selected)</Label>
              <div className="grid md:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto border border-[#E2E8F0] dark:border-[#2a3042] p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/5">
                {masjids?.map((m:any)=>(
                  <label key={m.id} className="flex items-center gap-2 text-sm bg-white dark:bg-[#1a1f2e] p-2 rounded-lg border border-[#E2E8F0] dark:border-[#2a3042] cursor-pointer hover:bg-primary/5 dark:hover:bg-white/5 text-[#0F172A] dark:text-white">
                    <input type="checkbox" checked={selectedMasjids.includes(m.id)} onChange={()=>{toggleMasjid(m.id); setSelectedMasjidUsers([])}} />
                    <Building2 className="w-4 h-4 text-[#64748B]" /> {m.name} <span className="text-xs text-[#94A3B8]">({m.pincode})</span>
                  </label>
                ))}
              </div>
              {selectedMasjids.length>0 && (
                <div className="space-y-2">
                  <Label>Filter specific users (optional)</Label>
                  <div className="border border-[#E2E8F0] dark:border-[#2a3042] rounded-xl bg-white dark:bg-[#1a1f2e] max-h-[200px] overflow-y-auto divide-y divide-[#F1F5F9] dark:divide-[#2a3042]">
                    {(masjidUsersData||[]).map((u:any)=>(
                      <label key={u.userId} className="flex items-center gap-2 p-2 text-sm hover:bg-[#F8FAFC] dark:hover:bg-white/5 cursor-pointer text-[#0F172A] dark:text-white">
                        <input type="checkbox" checked={selectedMasjidUsers.includes(u.userId)} onChange={()=>{setSelectedMasjidUsers(prev=> prev.includes(u.userId) ? prev.filter(x=>x!==u.userId) : [...prev, u.userId])}} />
                        <Users className="w-4 h-4 text-[#64748B]" /> {u.name} <span className="text-xs text-[#94A3B8]">{u.email}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {targetType==='USER' && (
            <div className="space-y-2">
              <Label>Select Users ({selectedUsers.length} selected)</Label>
              <Input placeholder="Search users..." value={userSearch} onChange={e=>setUserSearch(e.target.value)} />
              <div className="max-h-[200px] overflow-y-auto border border-[#E2E8F0] dark:border-[#2a3042] rounded-xl divide-y divide-[#F1F5F9] dark:divide-[#2a3042] bg-white dark:bg-[#1a1f2e]">
                {(users||[]).slice(0,50).map((u:any)=>(
                  <label key={u.id} className="flex items-center gap-2 p-2 text-sm hover:bg-[#F8FAFC] dark:hover:bg-white/5 cursor-pointer text-[#0F172A] dark:text-white">
                    <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={()=>toggleUser(u.id)} />
                    <Users className="w-4 h-4 text-[#64748B]" /> {u.name} <span className="text-xs text-[#94A3B8]">{u.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={()=>sendMut.mutate()} disabled={!title || !body || sendMut.isPending} className="min-w-[140px]">
              {sendMut.isPending ? 'Sending...' : <><Send className="w-4 h-4 mr-2"/>Send {type}</>}
            </Button>
          </div>
          {msg && <div className="text-sm p-3 rounded-xl border bg-green-50 dark:bg-emerald-900/20 border-green-200 dark:border-emerald-800/30 text-green-700 dark:text-emerald-400">{msg}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-[#0F172A] dark:text-white"><History className="w-5 h-5"/> Campaign History</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#E2E8F0] dark:border-[#2a3042] text-xs text-[#64748B] dark:text-[#94A3B8]"><th className="text-left p-2">Time</th><th className="text-left p-2">Title</th><th className="text-left p-2">Type</th><th className="text-left p-2">Target</th><th className="text-left p-2">Sent</th><th className="text-left p-2">By</th></tr></thead>
              <tbody>
                {campaigns?.map((c:any)=>(
                  <tr key={c.id} className="border-b border-[#F1F5F9] dark:border-[#2a3042] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02]">
                    <td className="p-2 text-xs text-[#64748B] dark:text-[#94A3B8]">{c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'}</td>
                    <td className="p-2 text-[#0F172A] dark:text-white"><div className="font-bold">{c.title}</div><div className="text-xs text-[#94A3B8] truncate max-w-[260px]">{c.body}</div></td>
                    <td className="p-2"><Badge variant={c.type==='EMAIL'?'info':c.type==='PUSH'?'success':'warning'}>{c.type}</Badge></td>
                    <td className="p-2"><Badge>{c.targetType}</Badge></td>
                    <td className="p-2 font-bold text-[#0F172A] dark:text-white">{c.sentCount}</td>
                    <td className="p-2 text-xs text-[#64748B] dark:text-[#94A3B8]">{c.createdByEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!campaigns || campaigns.length===0) && <div className="text-center text-sm text-[#64748B] dark:text-[#94A3B8] py-8">No campaigns yet</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
