import { useQuery } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Audit() {
  const { data } = useQuery({ queryKey:['audit'], queryFn: async()=>(await masterApi.audit.list()).data })
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-[#0F172A] dark:text-white">Audit Logs</h1>
      <Card><CardHeader><CardTitle className="text-[#0F172A] dark:text-white">Recent 100 actions (SUPER_ADMIN + ADMIN)</CardTitle></CardHeader><CardContent className="space-y-2 max-h-[700px] overflow-y-auto">
        {data?.map((a:any)=><div key={a.id} className="flex justify-between border border-[#E2E8F0] dark:border-[#2a3042] p-3 rounded-xl text-sm"><div><Badge className="mr-2">{a.action}</Badge> <span className="text-[#0F172A] dark:text-white">{a.entity}</span> <span className="text-[#94A3B8]">#{a.entityId}</span><div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{a.detail}</div><div className="text-xs text-[#94A3B8]">by {a.userEmail}</div></div><div className="text-xs text-[#94A3B8]">{new Date(a.createdAt).toLocaleString()}</div></div>)}
      </CardContent></Card>
    </div>
  )
}
