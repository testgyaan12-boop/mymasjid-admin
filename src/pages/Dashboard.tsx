import { useQuery } from '@tanstack/react-query'
import { masterApi } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Badge } from '@/components/ui/badge'
import { Boxes, Building2, Users, ShieldCheck, TrendingUp, Activity, ArrowUpRight, Clock, Megaphone, Bell, ScrollText, Calendar, RefreshCw, User, Mosque, Inbox } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts'
import { Link } from 'react-router-dom'

function MiniSparkline({ data, color = '#2563EB', className = '' }: { data: number[]; color?: string; className?: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const w = 80, h = 28, pad = 2
  const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * (w - pad * 2)},${h - pad - (v / max) * (h - pad * 2)}`)
  const fillPts = [...pts, `${w - pad},${h}`, `${pad},${h}`]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <defs><linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.15" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={fillPts.join(' ')} fill={`url(#spark-${color.replace('#','')})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-7 w-52 rounded-lg bg-[#E2E8F0] dark:bg-white/10 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-[120px] rounded-2xl bg-[#E2E8F0] dark:bg-white/5 animate-pulse" />)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({ queryKey: ['overview'], queryFn: async () => (await masterApi.overview()).data })
  const { data: audits } = useQuery({ queryKey: ['audit'], queryFn: async () => (await masterApi.audit.list()).data })
  const { data: monthly } = useQuery({ queryKey: ['monthly'], queryFn: async () => (await masterApi.analytics.monthly()).data })
  const { data: masjids } = useQuery({ queryKey: ['masjids-all'], queryFn: async () => (await masterApi.masjids.list()).data ?? [] })

  if (isLoading) return <DashboardSkeleton />

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const leadCount = (masjids || []).filter((m: any) => m.isDeleted !== 1 && (!m.adminVerified || m.adminVerified === 'PENDING')).length

  const kpiData = [
    { label: 'Total Masjid', value: data?.totalMasjids ?? (masjids?.length || 0), icon: Mosque, color: '#8B5CF6', lightBg: '#EDE9FE', trend: '+12%', sparkData: [0, 1, 1, 2] },
    { label: 'Total Lead', value: leadCount, icon: Inbox, color: '#2563EB', lightBg: '#DBEAFE', trend: '+7%', sparkData: [1, 2, 2, 2] },
    { label: 'Total Users', value: data?.totalUsers ?? 0, icon: Users, color: '#F97316', lightBg: '#FFF7ED', trend: '+11%', sparkData: [8, 11, 14, 16] },
    { label: 'Total Tenants', value: data?.totalTenants ?? 0, icon: Building2, color: '#10B981', lightBg: '#D1FAE5', trend: '+10%', sparkData: [0, 1, 1, 1] },
  ]

  const masjidData = (monthly?.masjidOnboard || []).map((m: any) => ({ month: m.month, count: Number(m.count) }))
  const userData = (monthly?.activeUsers || monthly?.userOnboard || []).map((m: any) => ({ month: m.month, count: Number(m.count) }))

  const getActionBadge = (action: string) => {
    const a = action?.toUpperCase() || ''
    if (a.includes('CREATE')) return <Badge variant="success">CREATE</Badge>
    if (a.includes('DELETE') || a.includes('LOCK')) return <Badge variant="danger">DELETE</Badge>
    if (a.includes('ACTIVATE') || a.includes('UNLOCK')) return <Badge variant="info">ACTIVATE</Badge>
    return <Badge variant="default">{action}</Badge>
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] md:text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight">Welcome back, Admin! <span className="inline-block">&#x1F44B;</span></h1>
          <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mt-1">Here's what's happening with your SaaS control panel today.</p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1a1f2e] border border-[#E2E8F0] dark:border-[#2a3042] rounded-[10px] px-3 py-2">
            <Calendar className="w-3.5 h-3.5" /><span className="font-medium">{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#1a1f2e] border border-[#E2E8F0] dark:border-[#2a3042] rounded-full px-3 py-1.5">
            <RefreshCw className="w-3 h-3 text-[#10B981]" /><span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium">{timeStr}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#D1FAE5] dark:bg-emerald-900/30 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" /><span className="text-[11px] font-semibold text-[#059669] dark:text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((card, i) => (
          <div key={card.label} className="group relative bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-5 shadow-kpi hover:shadow-kpi-hover hover:-translate-y-0.5 transition-all duration-200 animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: card.lightBg }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-emerald-900/30 text-[#059669] dark:text-emerald-400">{card.trend}</span>
            </div>
            <div className="text-[28px] font-bold text-[#0F172A] dark:text-white tracking-tight leading-none mb-1">{card.value}</div>
            <div className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">{card.label}</div>
            <div className="absolute bottom-2 right-3 opacity-40 group-hover:opacity-70 transition-opacity"><MiniSparkline data={card.sparkData} color={card.color} className="w-20 h-7" /></div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Send Campaign', icon: Megaphone, path: '/campaign', primary: true },
          { label: 'View Audit', icon: ScrollText, path: '/audit', primary: false },
          { label: 'Notifications', icon: Bell, path: '/notifications', primary: false },
        ].map(a => (
          <Link key={a.path} to={a.path} className={`group flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] ${a.primary ? 'bg-[#10B981] text-white dark:bg-emerald-600' : 'bg-white dark:bg-[#1a1f2e] text-[#0F172A] dark:text-white border border-[#E2E8F0] dark:border-[#2a3042]'}`}>
            <a.icon className="w-4 h-4" />{a.label}
            <ArrowUpRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition" />
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] shadow-card overflow-hidden">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] dark:bg-emerald-900/30 flex items-center justify-center"><TrendingUp className="w-[18px] h-[18px] text-[#10B981] dark:text-emerald-400" /></div>
              <div><h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Masjid Onboard</h3><p className="text-[11px] text-[#94A3B8]">Monthly growth</p></div>
            </div>
            <Badge variant="success" className="gap-1"><TrendingUp className="w-3 h-3" />{masjidData.length > 1 ? `${masjidData.length - 1} new` : `${masjidData.length} months`}</Badge>
          </div>
          <div className="h-[250px] px-3 pb-4">
            {masjidData.length === 0 ? <div className="h-full flex items-center justify-center text-[13px] text-[#94A3B8]">No data yet</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={masjidData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} width={25} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12, background: '#fff', color: '#0F172A' }} cursor={{ fill: '#F0FDF4' }} />
                  <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] shadow-card overflow-hidden">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] dark:bg-blue-900/30 flex items-center justify-center"><Activity className="w-[18px] h-[18px] text-[#2563EB] dark:text-blue-400" /></div>
              <div><h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Active Users</h3><p className="text-[11px] text-[#94A3B8]">Monthly activity</p></div>
            </div>
            <Badge variant="info" className="gap-1"><TrendingUp className="w-3 h-3" />12%</Badge>
          </div>
          <div className="h-[250px] px-3 pb-4">
            {userData.length === 0 ? <div className="h-full flex items-center justify-center text-[13px] text-[#94A3B8]">No data yet</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userData} margin={{ left: -10, right: 10 }}>
                  <defs><linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.12} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} width={25} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12, background: '#fff', color: '#0F172A' }} cursor={{ stroke: '#2563EB', strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#blueGrad)" strokeWidth={2} dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: User + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Logged In User */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] shadow-card overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-[#F1F5F9] dark:border-[#2a3042]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] dark:bg-blue-900/30 flex items-center justify-center"><User className="w-[18px] h-[18px] text-[#2563EB] dark:text-blue-400" /></div>
              <div><h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Logged In User</h3><p className="text-[11px] text-[#94A3B8]">Current session details</p></div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-[22px] font-bold text-white shadow-lg shadow-blue-500/20">{user?.name?.slice(0,2).toUpperCase() || user?.email?.slice(0,2).toUpperCase() || 'AD'}</div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] border-[3px] border-white dark:border-[#1a1f2e]" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-[18px] font-bold text-[#0F172A] dark:text-white">{user?.name || 'Admin'}</h2>
                    <Badge variant={user?.systemRole === 'SUPER_ADMIN' ? 'info' : user?.systemRole === 'ADMIN' ? 'purple' : 'default'}>{user?.systemRole || 'ADMIN'}</Badge>
                  </div>
                  <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8]">{user?.email}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: ShieldCheck, label: 'Role', value: user?.systemRole || 'ADMIN', iconColor: 'text-[#2563EB] dark:text-blue-400' },
                    { icon: Clock, label: 'Session', value: 'Active', valueColor: 'text-[#10B981] dark:text-emerald-400', iconColor: 'text-[#10B981] dark:text-emerald-400' },
                    { icon: Boxes, label: 'User ID', value: `#${user?.id || '-'}`, iconColor: 'text-[#8B5CF6] dark:text-purple-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 bg-[#F8FAFC] dark:bg-white/5 rounded-xl px-3.5 py-2 border border-[#E2E8F0] dark:border-[#2a3042]">
                      <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                      <div><div className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wider">{item.label}</div><div className={`text-[12px] font-semibold ${item.valueColor || 'text-[#0F172A] dark:text-white'}`}>{item.value}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] shadow-card overflow-hidden">
          <div className="px-6 pt-5 pb-3 border-b border-[#F1F5F9] dark:border-[#2a3042] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] dark:bg-purple-900/30 flex items-center justify-center"><Clock className="w-[18px] h-[18px] text-[#8B5CF6] dark:text-purple-400" /></div>
              <div><h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Recent Activity</h3><p className="text-[11px] text-[#94A3B8]">Latest events</p></div>
            </div>
            <Link to="/audit" className="text-[12px] font-semibold text-[#2563EB] dark:text-blue-400 hover:underline flex items-center gap-1">View all <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#2a3042]">
            {audits?.slice(0, 8).map((a: any) => (
              <div key={a.id} className="px-6 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getActionBadge(a.action)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#0F172A] dark:text-white leading-snug"><span className="font-semibold">{a.entity}</span> <span className="text-[#94A3B8]">#{a.entityId}</span></p>
                    {a.detail && <p className="text-[11px] text-[#CBD5E1] mt-0.5 truncate">{a.detail}</p>}
                    <div className="flex items-center gap-1.5 mt-1"><span className="text-[10px] text-[#94A3B8]">{a.userEmail}</span><span className="text-[10px] text-[#CBD5E1]">&middot;</span><span className="text-[10px] text-[#CBD5E1]">{new Date(a.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
              </div>
            ))}
            {(!audits || audits.length === 0) && <div className="px-6 py-12 text-center text-[13px] text-[#94A3B8]">No activity yet</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
