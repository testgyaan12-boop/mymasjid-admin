import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'
import Tenants from '@/pages/Tenants'
import TenantDetail from '@/pages/TenantDetail'
import MasjidDetail from '@/pages/MasjidDetail'
import UsersPage from '@/pages/Users'
import Campaign from '@/pages/Campaign'
import Notifications from '@/pages/Notifications'
import Audit from '@/pages/Audit'
import Config from '@/pages/Config'
import Profile from '@/pages/Profile'

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated, init } = useAuth()
  useEffect(() => { init() }, [])

  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px] text-[#64748B] font-medium">Loading...</span>
      </div>
    </div>
  )

  if (!isAuthenticated) return <Navigate to="/login" />
  return <Layout>{children}</Layout>
}

export default function App() {
  const { init } = useAuth()
  useEffect(() => {
    init()
    // Restore dark mode on page load
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }, [])
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/projects" element={<Protected><Projects /></Protected>} />
        <Route path="/projects/:id" element={<Protected><ProjectDetail /></Protected>} />
        <Route path="/tenants" element={<Protected><Tenants /></Protected>} />
        <Route path="/my-masjid-admin" element={<Protected><Tenants /></Protected>} />
        <Route path="/tenants/:tenantId" element={<Protected><TenantDetail /></Protected>} />
        <Route path="/masjids/:masjidId" element={<Protected><MasjidDetail /></Protected>} />
        <Route path="/users" element={<Protected><UsersPage /></Protected>} />
        <Route path="/campaign" element={<Protected><Campaign /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="/audit" element={<Protected><Audit /></Protected>} />
        <Route path="/config" element={<Protected><Config /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
      </Routes>
    </BrowserRouter>
  )
}
