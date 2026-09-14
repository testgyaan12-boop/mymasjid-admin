import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      const d = res.data
      setAuth({ id: d.userId, email: d.email, name: d.name, systemRole: d.systemRole }, d.accessToken, d.refreshToken)
      nav('/')
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Login failed. Only SUPER_ADMIN/ADMIN allowed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex bg-[#0F172A] dark:bg-[#060a13]">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden sidebar-gradient items-center justify-center p-12">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20"><ShieldCheck className="w-6 h-6 text-white" /></div>
            <div><div className="text-xl font-bold text-white tracking-tight">My Masjid</div><div className="text-[12px] text-blue-200/60 font-medium">SaaS Control Panel</div></div>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">Manage your SaaS<br />platform with confidence</h2>
          <p className="text-[14px] text-blue-100/50 leading-relaxed mb-8">One unified control panel for all your masjid projects, tenants, users, and campaigns.</p>
          <div className="flex gap-4">
            {[{ v: '2+', l: 'Projects' }, { v: '16+', l: 'Users' }, { v: '2+', l: 'Masjids' }].map(s => (
              <div key={s.l} className="bg-white/[0.06] border border-white/[0.08] rounded-xl px-4 py-3"><div className="text-2xl font-bold text-white">{s.v}</div><div className="text-[11px] text-blue-200/50 mt-0.5">{s.l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20"><ShieldCheck className="w-5 h-5 text-white" /></div>
            <div><div className="text-lg font-bold text-[#0F172A] dark:text-white tracking-tight">My Masjid</div><div className="text-[11px] text-[#64748B] font-medium">SaaS Control Panel</div></div>
          </div>
          <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] p-8">
            <div className="mb-6">
              <h1 className="text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight">Sign in</h1>
              <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mt-1">Access your control panel. SUPER_ADMIN / ADMIN only.</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ansar@gmail.com" required className="h-10" /></div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="h-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 text-[#94A3B8] transition">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {err && <div className="text-[13px] text-[#DC2626] bg-[#FEF2F2] dark:bg-red-900/20 p-3 rounded-xl border border-[#FECACA] dark:border-red-800/30 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />{err}</div>}
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-[10px] text-[14px] font-semibold gap-2" variant="indigo">
                {loading ? <span className="flex items-center gap-2"><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>Signing in...</span> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
            <div className="mt-6 pt-5 border-t border-[#F1F5F9] dark:border-[#2a3042]"><p className="text-[11px] text-center text-[#94A3B8]">Same DB & JWT as noor-backend &middot; Port 8080</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}
