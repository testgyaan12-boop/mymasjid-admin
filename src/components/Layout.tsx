import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, ClipboardList, Users, Bell, ScrollText, Building2, LogOut, ShieldCheck, Menu, X, Megaphone, Search, ChevronDown, Sparkles, Sun, Moon, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const nav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'My Lead', icon: ClipboardList },
  { path: '/tenants', label: 'My Masjid', icon: Building2 },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/campaign', label: 'Campaign', icon: Megaphone },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/audit', label: 'Audit Logs', icon: ScrollText },
  { path: '/config', label: 'Config', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const loc = useLocation()
  const nav2 = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') === 'dark'
    return false
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as HTMLElement)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const handleLogout = () => { logout(); setShowLogoutConfirm(false); nav2('/login') }
  const initials = user?.name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'AD'

  return (
    <div className="h-screen flex bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`
        ${sidebarOpen ? 'w-[250px] translate-x-0' : 'w-[250px] -translate-x-full md:w-[68px] md:translate-x-0'}
        fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col shrink-0
        sidebar-gradient text-white
        transition-all duration-300 ease-in-out
        shadow-[1px_0_0_0_rgba(255,255,255,0.06)]
      `}>
        <div className={`h-16 flex items-center shrink-0 ${sidebarOpen ? 'px-5 gap-3' : 'md:justify-center md:px-0'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <ShieldCheck className="w-[18px] h-[18px] text-white" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-[14px] font-bold tracking-tight leading-tight">My Masjid</div>
              <div className="text-[10px] text-blue-200/70 font-medium leading-tight">SaaS Control Panel</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`${!sidebarOpen ? 'md:hidden' : ''} ml-auto p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white`}>
            <X className="w-4 h-4" />
          </button>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="hidden md:flex absolute top-4 right-2 p-1.5 rounded-lg hover:bg-white/10 transition text-white/60 hover:text-white">
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto py-2 ${sidebarOpen ? 'px-3' : 'md:px-2'}`}>
          <div className={`text-[9px] font-bold uppercase tracking-[0.12em] text-white/30 mb-2 ${sidebarOpen ? 'px-3' : 'md:text-center'}`}>
            {sidebarOpen ? 'Navigation' : '·'}
          </div>
          <div className="space-y-0.5">
            {nav.map(n => {
              const active = loc.pathname === n.path || (n.path !== '/' && loc.pathname.startsWith(n.path))
              return (
                <Link
                  key={n.path}
                  to={n.path}
                  onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-[10px] text-[13px] font-medium transition-all duration-150 ${sidebarOpen ? 'px-3 py-2.5' : 'md:justify-center md:px-0 md:py-2.5'} ${active ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-blue-500/20' : 'text-white/60 hover:text-white hover:bg-white/[0.07]'}`}
                  title={!sidebarOpen ? n.label : undefined}
                >
                  <n.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : ''}`} />
                  {sidebarOpen && <span>{n.label}</span>}
                </Link>
              )
            })}
          </div>
        </nav>

        {sidebarOpen && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-white/[0.06] border border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-[11px] font-bold text-white shadow-lg shadow-blue-500/20">{initials}</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#0F172A]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-white truncate">{user?.name || 'Admin'}</div>
                <div className="text-[10px] text-white/40 truncate">{user?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#93C5FD]">{user?.systemRole || 'ADMIN'}</span>
              <span className="text-[9px] text-white/30 flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-[#10B981]" /> Online</span>
            </div>
          </div>
        )}

        <div className={`p-3 border-t border-white/[0.06] shrink-0 ${sidebarOpen ? '' : 'md:px-2'}`}>
          <button onClick={() => setShowLogoutConfirm(true)} className={`flex items-center gap-3 w-full rounded-[10px] text-[13px] font-medium text-white/40 hover:text-[#F87171] hover:bg-[#F87171]/10 transition-all duration-150 ${sidebarOpen ? 'px-3 py-2.5' : 'md:justify-center md:px-0 md:py-2.5'}`}>
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-[#0B0F19]/80 glass border-b border-[#E2E8F0] dark:border-[#1e2536] h-14 px-4 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
            <Menu className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[13px] font-bold text-[#0F172A] dark:text-white">My Masjid</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
              {dark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-[#64748B]" />}
            </button>
            <button className="p-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 relative">
              <Bell className="w-4.5 h-4.5 text-[#64748B] dark:text-[#94A3B8]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
            </button>
          </div>
        </div>

        {/* Desktop top header */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/80 dark:bg-[#0B0F19]/80 glass border-b border-[#E2E8F0] dark:border-[#1e2536] h-14 px-6 items-center gap-4">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition">
              <Menu className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
            </button>
          )}
          <div className={`flex-1 max-w-md relative transition-all duration-200 ${searchFocused ? 'max-w-lg' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input type="text" placeholder="Search projects, users, campaigns..." className="w-full h-9 pl-9 pr-4 rounded-[10px] bg-[#F1F5F9] border border-transparent text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:bg-white focus:border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-[#64748B] dark:focus:bg-white/10" onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="hidden lg:flex items-center gap-1.5 h-8 px-3 rounded-[10px] bg-gradient-to-r from-[#8B5CF6]/10 to-[#6366F1]/10 text-[#7C3AED] text-[12px] font-semibold hover:from-[#8B5CF6]/15 hover:to-[#6366F1]/15 transition-all duration-150 border border-[#8B5CF6]/20 dark:from-purple-500/10 dark:to-indigo-500/10 dark:text-purple-400 dark:border-purple-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Ask Gemini
            </button>
            <button onClick={() => setDark(!dark)} className="p-2 rounded-[10px] hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition" title={dark ? 'Light mode' : 'Dark mode'}>
              {dark ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-[#64748B] dark:text-[#94A3B8]" />}
            </button>
            <Link to="/notifications" className="relative p-2 rounded-[10px] hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition group">
              <Bell className="w-[18px] h-[18px] text-[#64748B] group-hover:text-[#0F172A] dark:text-[#94A3B8] dark:group-hover:text-white transition" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white dark:ring-[#0B0F19]" />
            </Link>
            <div ref={userMenuRef} className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2.5 h-9 pl-1 pr-2.5 rounded-[10px] hover:bg-[#F1F5F9] dark:hover:bg-white/5 transition group">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-[10px] font-bold text-white">{initials}</div>
                <div className="hidden lg:block text-left">
                  <div className="text-[12px] font-semibold text-[#0F172A] dark:text-white leading-tight">My Masjid</div>
                  <div className="text-[10px] text-[#64748B] leading-tight">SaaS Control Panel</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] hidden lg:block" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-[#1a1f2e] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[#E2E8F0] dark:border-[#2a3042] py-1.5 z-50 animate-slide-in-right">
                  <div className="px-3 py-2 border-b border-[#F1F5F9] dark:border-[#2a3042] mb-1">
                    <div className="text-[12px] font-semibold text-[#0F172A] dark:text-white">{user?.name || 'Admin'}</div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{user?.email}</div>
                  </div>
                  <button onClick={() => { setShowUserMenu(false); nav2('/profile') }} className="w-full text-left px-3 py-2 text-[13px] text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-white/5 dark:text-[#94A3B8] dark:hover:text-white transition">Profile</button>
                  <button onClick={() => { setShowUserMenu(false); nav2('/audit') }} className="w-full text-left px-3 py-2 text-[13px] text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-white/5 dark:text-[#94A3B8] dark:hover:text-white transition">Audit Logs</button>
                  <div className="border-t border-[#F1F5F9] dark:border-[#2a3042] mt-1 pt-1">
                    <button onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true) }} className="w-full text-left px-3 py-2 text-[13px] text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 transition">Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] p-6 w-full max-w-[380px] border border-[#E2E8F0] dark:border-[#2a3042]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#FEF2F2] dark:bg-red-900/30 flex items-center justify-center shrink-0"><LogOut className="w-5 h-5 text-[#EF4444]" /></div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#0F172A] dark:text-white">Sign out</h3>
                <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">You'll be redirected to login</p>
              </div>
            </div>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-5 leading-relaxed">Are you sure you want to logout from My Masjid?</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" className="rounded-[10px]" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" className="rounded-[10px]" onClick={handleLogout}>Sign out</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
