import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { useAuth, isSuperAdmin } from '@/store/auth'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { Eye, EyeOff, Trash2, Plus, Unlock, Lock, Search, X } from 'lucide-react'

export default function UsersPage() {
  const { user } = useAuth()
  const superAdmin = isSuperAdmin(user?.systemRole)
  const [q, setQ] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', systemRole:'USER' })
  const [showPwd, setShowPwd] = useState(false)
  const [createMsg, setCreateMsg] = useState('')
  const [action, setAction] = useState<{type:'toggle'|'delete'|'unlock', user:any, nextActive?:boolean}|null>(null)
  const [remark, setRemark] = useState('')
  const [err, setErr] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL'|'SUPER_ADMIN'|'ADMIN'|'USER'>('ALL')
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey:['users',q], queryFn: async()=>(await masterApi.users.list(q||undefined)).data })
  const roleMut = useMutation({ mutationFn: ({id,role}:{id:number,role:string})=> masterApi.users.updateRole(id,role), onSuccess: ()=>qc.invalidateQueries({queryKey:['users']}) })
  const createMut = useMutation({
    mutationFn: ()=> masterApi.users.create(form),
    onSuccess: ()=>{ setCreateMsg(`Created ${form.email} as ${form.systemRole}`); setForm({ name:'', email:'', password:'', phone:'', systemRole:'USER' }); setShowCreate(false); qc.invalidateQueries({queryKey:['users']}) },
    onError: (e:any)=> setCreateMsg(e.response?.data?.message || 'Create failed')
  })
  const toggleMut = useMutation({
    mutationFn: ()=> {
      if(!action || action.type!=='toggle') throw new Error('no action')
      return masterApi.users.toggle(action.user.id, action.nextActive!, remark)
    },
    onSuccess: ()=>{ setAction(null); setRemark(''); setErr(''); qc.invalidateQueries({queryKey:['users']}) },
    onError: (e:any)=> setErr(e.response?.data?.message || e.message)
  })
  const deleteMut = useMutation({
    mutationFn: ()=> {
      if(!action || action.type!=='delete') throw new Error('no action')
      return masterApi.users.delete(action.user.id, remark)
    },
    onSuccess: ()=>{ setAction(null); setRemark(''); setErr(''); qc.invalidateQueries({queryKey:['users']}) },
    onError: (e:any)=> setErr(e.response?.data?.message || e.message)
  })
  const unlockMut = useMutation({
    mutationFn: ()=> {
      if(!action || action.type!=='unlock') throw new Error('no action')
      return masterApi.users.unlock(action.user.id, remark)
    },
    onSuccess: ()=>{ setAction(null); setRemark(''); setErr(''); qc.invalidateQueries({queryKey:['users']}) },
    onError: (e:any)=> setErr(e.response?.data?.message || e.message)
  })

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-black text-[#0F172A] dark:text-white">Users — Portal</h1>
        {superAdmin && <Button onClick={()=>setShowCreate(!showCreate)} className="self-start"><Plus className="w-4 h-4 mr-2"/>{showCreate?'Close':'Create User'}</Button>}
      </div>

      {superAdmin && showCreate && (
        <Card className="border-2 border-primary/20 overflow-hidden">
          <CardHeader><CardTitle className="text-base text-[#0F172A] dark:text-white">Create User for this portal — with role</CardTitle><p className="text-xs text-[#64748B] dark:text-[#94A3B8]">SUPER_ADMIN only</p></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Ali Khan" /></div>
              <div className="space-y-1"><Label>Email *</Label><Input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="ali@example.com" /></div>
              <div className="space-y-1"><Label>Password *</Label><div className="relative"><Input type={showPwd?'text':'password'} value={form.password} onChange={e=>setForm({...form, password:e.target.value})} placeholder="Min 6 chars" className="pr-10" /><button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-lg">{showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="98xxxx" /></div>
              <div className="space-y-1"><Label>System Role *</Label><select value={form.systemRole} onChange={e=>setForm({...form, systemRole:e.target.value})} className="h-10 w-full rounded-xl border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-3"><option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="SUPER_ADMIN">SUPER_ADMIN</option></select></div>
            </div>
            <Button onClick={()=>createMut.mutate()} disabled={!form.name || !form.email || !form.password || createMut.isPending} className="w-full md:w-auto">{createMut.isPending?'Creating...':'Create User'}</Button>
            {createMsg && <div className="text-sm p-3 rounded-xl border bg-green-50 border-green-200">{createMsg}</div>}
          </CardContent>
        </Card>
      )}

      {/* Role wise count on top — click to filter, default ALL */}
      {(() => {
        const counts = {
          all: data?.length || 0,
          super: data?.filter((u:any)=>u.systemRole==='SUPER_ADMIN').length || 0,
          admin: data?.filter((u:any)=>u.systemRole==='ADMIN').length || 0,
          user: data?.filter((u:any)=>u.systemRole==='USER').length || 0,
        }
        const items: Array<{key:'ALL'|'SUPER_ADMIN'|'ADMIN'|'USER', label:string, count:number, color:string}> = [
          { key:'ALL', label:'All', count: counts.all, color:'bg-slate-900 text-white' },
          { key:'SUPER_ADMIN', label:'SUPER_ADMIN', count: counts.super, color:'bg-purple-100 text-purple-700 border-purple-200' },
          { key:'ADMIN', label:'ADMIN', count: counts.admin, color:'bg-blue-100 text-blue-700 border-blue-200' },
          { key:'USER', label:'USER', count: counts.user, color:'bg-gray-100 text-slate-700' },
        ]
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map(it=>(
              <button key={it.key} onClick={()=>setRoleFilter(it.key)} className={`p-4 rounded-2xl border-2 text-left transition ${roleFilter===it.key ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10' : 'border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#1a1f2e] hover:border-primary/30 hover:shadow-sm'}`}>
                <div className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-widest">{it.label}</div>
                <div className="text-2xl font-black mt-1 text-[#0F172A] dark:text-white">{it.count}</div>
                <Badge className={`mt-2 text-[10px] ${it.color} border`}>{it.key==='ALL' ? 'Default' : it.label}</Badge>
                {roleFilter===it.key && <div className="text-[11px] font-bold text-primary mt-1">● Selected</div>}
              </button>
            ))}
          </div>
        )
      })()}

      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search by name/email..." value={q} onChange={e=>setQ(e.target.value)} className="pl-10 h-11 text-base" />
            {q && <button onClick={()=>setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"><X className="w-4 h-4"/></button>}
          </div>
        </CardContent>
      </Card>

      {(() => {
        const filtered = (data||[]).filter((u:any)=> roleFilter==='ALL' || u.systemRole===roleFilter)
        return (
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-base flex flex-wrap items-center gap-2 text-[#0F172A] dark:text-white">{roleFilter==='ALL' ? 'All Users' : roleFilter} ({filtered.length}) <span className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]">— click top to filter</span></CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading? <div className="p-6 text-sm">Loading...</div> :
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead><tr className="border-b border-[#E2E8F0] dark:border-[#2a3042] text-[#64748B] dark:text-[#94A3B8] text-xs bg-[#F8FAFC] dark:bg-white/[0.02]"><th className="text-left p-3">User</th><th className="text-left p-2">Role</th><th className="text-left p-2">Joined</th><th className="text-left p-2">Active</th><th className="text-left p-2">Actions</th></tr></thead>
              <tbody>{filtered.map((u:any)=>{
                const isLocked = !u.isActive && ((u.failedAttempts||0) >=5 || !!u.lockTime)
                return (
                <tr key={u.id} className="border-b border-[#F1F5F9] dark:border-[#2a3042] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02]">
                  <td className="p-3"><div className="font-bold truncate max-w-[180px] flex items-center gap-1 text-[#0F172A] dark:text-white">{u.name} {isLocked && <Badge variant="danger" className="text-[10px]"><Lock className="w-3 h-3 mr-1"/>Locked</Badge>}</div><div className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate max-w-[220px]">{u.email} • {u.phone||'—'}</div><div className="text-[11px] text-[#94A3B8]">#{u.id}</div></td>
                  <td className="p-2"><Badge variant={u.systemRole==='SUPER_ADMIN'?'purple':u.systemRole==='ADMIN'?'info':'default'}>{u.systemRole}</Badge></td>
                  <td className="p-2 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                  <td className="p-2"><Switch checked={!!u.isActive} onCheckedChange={(v)=>{setAction({type:'toggle', user:u, nextActive:v}); setRemark(''); setErr('')}} disabled={!superAdmin} /></td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1 items-center">
                      <select disabled={!superAdmin} value={u.systemRole} onChange={e=>{ if(confirm(`Change ${u.email} to ${e.target.value}?`)) roleMut.mutate({id:u.id, role:e.target.value})}} className="h-8 rounded-lg border border-[#E2E8F0] dark:border-[#2a3042] bg-white dark:bg-[#141925] dark:text-white px-2 text-xs disabled:opacity-50"><option value="USER">USER</option><option value="ADMIN">ADMIN</option><option value="SUPER_ADMIN">SUPER_ADMIN</option></select>
                      {isLocked && <Button size="sm" variant="outline" className="h-8 px-2 text-xs border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" disabled={!superAdmin} onClick={()=>{setAction({type:'unlock', user:u}); setRemark(''); setErr('')}}><Unlock className="w-3.5 h-3.5 mr-1"/>Unlock</Button>}
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" disabled={!superAdmin} onClick={()=>{setAction({type:'delete', user:u}); setRemark(''); setErr('')}}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                  </td>
                </tr>
              )})}</tbody>
            </table>
          </div>}
          {!superAdmin && <p className="text-xs text-amber-600 p-3 border-t">Only SUPER_ADMIN can create / toggle / delete. ADMIN view only.</p>}
        </CardContent>
      </Card>
        )
      })()}

      {/* Active / Delete / Unlock confirmation with remark */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setAction(null)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-xl w-full max-w-md border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-[#0F172A] dark:text-white">
                {action.type==='delete' ? <><Trash2 className="w-5 h-5 text-red-600"/> Soft Delete User?</> : action.type==='unlock' ? <><Unlock className="w-5 h-5 text-amber-600"/> Unlock User?</> : <>{action.nextActive ? 'Activate' : 'Deactivate'} User?</>}
              </h3>
              <p className="text-sm text-muted-foreground mt-1"><b>{action.user.name}</b> ({action.user.email}) will be <b>{action.type==='delete' ? 'soft-deleted (is_deleted=1)' : action.type==='unlock' ? 'UNLOCKED and ACTIVE (reset 5 fails, auto-unlock 24h)' : action.nextActive ? 'ACTIVE' : 'INACTIVE'}</b>. Remark required.</p>
              <div className="mt-4 space-y-2">
                <Label>Remark *</Label>
                <Textarea value={remark} onChange={e=>setRemark(e.target.value)} placeholder={action.type==='delete' ? 'e.g. Left organization' : action.type==='unlock' ? 'e.g. Verified, unlock now' : 'e.g. Suspended for review'} />
                {err && <div className="text-sm text-red-600">{err}</div>}
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <Button variant="outline" onClick={()=>setAction(null)}>Cancel</Button>
                {action.type==='toggle' ? (
                  <Button variant={action.nextActive ? 'default' : 'destructive'} onClick={()=>toggleMut.mutate()} disabled={!remark.trim() || toggleMut.isPending}>{toggleMut.isPending ? 'Saving...' : action.nextActive ? 'Activate' : 'Deactivate'}</Button>
                ) : action.type==='unlock' ? (
                  <Button variant="default" className="bg-amber-600 hover:bg-amber-700" onClick={()=>unlockMut.mutate()} disabled={!remark.trim() || unlockMut.isPending}>{unlockMut.isPending ? 'Unlocking...' : 'Confirm Unlock'}</Button>
                ) : (
                  <Button variant="destructive" onClick={()=>deleteMut.mutate()} disabled={!remark.trim() || deleteMut.isPending}>{deleteMut.isPending ? 'Deleting...' : 'Confirm Delete'}</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
