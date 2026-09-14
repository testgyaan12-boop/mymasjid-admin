import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useAuth } from '@/store/auth'
import { authApi, masterApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import {
  Camera, Save, Loader2, User, Mail, Phone, Shield, CheckCircle2,
  ChevronRight, Pencil, Lock, Activity, Settings, Clock, LogIn,
  KeyRound, FileText, Headphones, ExternalLink, Circle
} from 'lucide-react'

const tabs = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const recentActivities = [
  { type: 'LOGIN', title: 'You logged in to the system', date: '9/14/2026', time: '11:42 AM', icon: LogIn, color: 'text-[#10B981] bg-[#ECFDF5]' },
  { type: 'PROFILE UPDATE', title: 'You updated your profile information', date: '9/14/2026', time: '10:15 AM', icon: FileText, color: 'text-[#2563EB] bg-[#EFF6FF]' },
  { type: 'PASSWORD CHANGE', title: 'You changed your password', date: '9/12/2026', time: '08:32 PM', icon: KeyRound, color: 'text-[#8B5CF6] bg-[#F5F3FF]' },
  { type: 'SETTINGS UPDATE', title: 'You updated account settings', date: '9/10/2026', time: '02:17 PM', icon: Settings, color: 'text-[#F97316] bg-[#FFF7ED]' },
]

export default function Profile() {
  const { user, setAuth } = useAuth()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await authApi.getProfile()).data,
  })

  const [form, setForm] = useState({ name: '', phone: '', avatar: '' })

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', phone: profile.phone || '', avatar: profile.avatar || '' })
      if (profile.avatar) setPreview(profile.avatar)
    }
  }, [profile])

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    try {
      const res = await masterApi.upload(file)
      setForm(f => ({ ...f, avatar: res.data.url || res.data }))
      setMsg('Image uploaded')
    } catch {
      setMsg('Upload failed')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const updateMut = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: (res) => {
      const data = res.data
      // Update query cache directly so UI re-renders immediately
      qc.setQueryData(['profile'], data)
      // Update form state
      setForm({ name: data.name || '', phone: data.phone || '', avatar: data.avatar || '' })
      if (data.avatar) setPreview(data.avatar)
      // Update auth store
      setAuth(
        { id: data.id, email: data.email, name: data.name, systemRole: data.systemRole },
        localStorage.getItem('master_access_token') || '',
        localStorage.getItem('master_refresh_token') || ''
      )
      setMsg('Profile updated successfully')
      setEditing(false)
    },
    onError: (e: any) => {
      setMsg(e.response?.data?.message || 'Update failed')
    },
  })

  const handleSave = () => {
    updateMut.mutate()
  }

  const initials = (profile?.name || user?.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const roleLabel = (role: string) => {
    const map: Record<string, { label: string; color: string }> = {
      SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40' },
      ADMIN: { label: 'Admin', color: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40' },
      USER: { label: 'User', color: 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/20 dark:text-gray-400 dark:border-gray-700/40' },
    }
    return map[role] || { label: role, color: 'bg-gray-50 text-gray-700 border border-gray-200' }
  }

  if (isLoading) {
    return (
      <div className="max-w-[1350px] mx-auto space-y-5">
        <div className="flex items-center gap-2 py-8 text-[13px] text-[#94A3B8]"><Loader2 className="w-4 h-4 animate-spin" /> Loading profile...</div>
      </div>
    )
  }

  const r = roleLabel(profile?.systemRole || user?.systemRole || '')
  const memberDate = profile?.id ? new Date(2026, 3, 9) : null

  return (
    <div className="max-w-[1350px] mx-auto space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
        <span className="hover:text-[#2563EB] transition-colors cursor-pointer">Dashboard</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Profile</span>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          HERO CARD
      ═══════════════════════════════════════════════════════════ */}
      <div className="relative bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
        {/* Subtle mosque silhouette background */}
        <div className="absolute right-0 top-0 bottom-0 w-[400px] opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <svg viewBox="0 0 400 200" fill="currentColor" className="w-full h-full text-[#2563EB]">
            <path d="M200 20c-30 0-55 25-55 55v10h-10v-5c0-25-20-45-45-45s-45 20-45 45v5h-10v-10c0-30-25-55-55-55S-70 75-70 105v10h-10v30c0 25 20 45 45 45h270c25 0 45-20 45-45v-30h-10v-10c0-30-25-55-55-55zm-200 65c0-17 13-30 30-30s30 13 30 30v10h-60V85zm100 0c0-17 13-30 30-30s30 13 30 30v10h-60V85zm50 55c-8 0-15-7-15-15s7-15 15-15 15 7 15 15-7 15-15 15z" />
            <path d="M155 110h-20v-5c0-3 2-5 5-5h10c3 0 5 2 5 5v5zm90 0h-20v-5c0-3 2-5 5-5h10c3 0 5 2 5 5v5z" />
          </svg>
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div
            className={`relative shrink-0 group ${dragOver ? 'scale-105' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white text-[28px] font-bold shadow-lg shadow-blue-500/20 cursor-pointer transition-transform duration-200 hover:scale-105">
              {preview ? (
                <img src={preview} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : initials}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-[22px] font-bold text-[#0F172A] dark:text-white tracking-tight">{profile?.name || user?.name || '—'}</h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${r.color}`}>
                <Shield className="w-3 h-3" />
                {r.label}
              </span>
            </div>
            <p className="text-[13px] text-[#64748B] dark:text-[#94A3B8] mb-1">{profile?.email || user?.email || '—'}</p>
            <p className="text-[12px] text-[#94A3B8]">Manage your personal information and preferences</p>
          </div>

          {/* Account Status */}
          <div className="shrink-0 bg-[#F0FDF4] dark:bg-emerald-900/10 border border-[#BBF7D0] dark:border-emerald-800/30 rounded-xl px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[13px] font-semibold text-[#10B981]">Account Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#64748B] dark:text-[#94A3B8]">
              <Clock className="w-3.5 h-3.5" />
              <span>Since {memberDate ? memberDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TABS
      ═══════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] px-2">
        <div className="flex overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === t.key
                  ? 'text-[#2563EB] dark:text-blue-400'
                  : 'text-[#94A3B8] hover:text-[#64748B] dark:hover:text-[#94A3B8]'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {activeTab === t.key && (
                <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#2563EB] dark:bg-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT — TWO COLUMN GRID
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* ─── LEFT COLUMN ─── */}
          <div className="space-y-6">

            {/* Personal Information Card */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] dark:border-[#2a3042]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-blue-900/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Personal Information</h3>
                    <p className="text-[12px] text-[#94A3B8]">Update your name and contact details</p>
                  </div>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>

              <div className="p-6">
                {editing ? (
                  /* ─── EDIT MODE ─── */
                  <div className="space-y-5">
                    {/* Avatar in edit mode */}
                    <div className="flex items-center gap-5">
                      <div
                        className="relative shrink-0 cursor-pointer group"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white text-[22px] font-bold shadow-lg shadow-blue-500/20 transition-transform duration-200 hover:scale-105">
                          {preview ? <img src={preview} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : initials}
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white">Profile Photo</p>
                        <p className="text-[12px] text-[#94A3B8]">JPG, PNG or GIF. Max 5MB.</p>
                        <button onClick={() => fileRef.current?.click()} className="mt-1 text-[12px] font-medium text-[#2563EB] hover:underline">Change Photo</button>
                      </div>
                    </div>

                    {/* Form fields */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" className="pl-10 h-[46px] rounded-[10px] text-[13px] border-[#E2E8F0] dark:border-[#2a3042] focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                          <Input value={profile?.email || ''} disabled className="pl-10 h-[46px] rounded-[10px] text-[13px] opacity-60 cursor-not-allowed bg-[#F8FAFC] dark:bg-[#141925]" />
                        </div>
                        <p className="text-[11px] text-[#94A3B8]">Email cannot be changed</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                          <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="pl-10 h-[46px] rounded-[10px] text-[13px] border-[#E2E8F0] dark:border-[#2a3042] focus:ring-[#2563EB]/20 focus:border-[#2563EB]" />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      {msg && (
                        <span className={`text-[13px] font-medium ${msg.includes('success') || msg.includes('uploaded') ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{msg}</span>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 px-4 rounded-[10px] text-[13px]" onClick={() => { setEditing(false); setMsg(''); if (profile) { setForm({ name: profile.name || '', phone: profile.phone || '', avatar: profile.avatar || '' }); if (profile.avatar) setPreview(profile.avatar) } }}>Cancel</Button>
                        <Button size="sm" onClick={handleSave} disabled={updateMut.isPending} className="h-9 px-5 rounded-[10px] text-[13px] font-semibold gap-1.5">
                          {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {updateMut.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ─── VIEW MODE ─── */
                  <div className="flex gap-6">
                    {/* Avatar */}
                    <div className="shrink-0">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white text-[22px] font-bold shadow-lg shadow-blue-500/20">
                        {preview ? <img src={preview} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : initials}
                      </div>
                    </div>

                    {/* Info list */}
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-start gap-3 pb-4 border-b border-[#F1F5F9] dark:border-[#2a3042]">
                        <User className="w-4 h-4 text-[#94A3B8] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-medium mb-0.5">Full Name</p>
                          <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white">{profile?.name || user?.name || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pb-4 border-b border-[#F1F5F9] dark:border-[#2a3042]">
                        <Mail className="w-4 h-4 text-[#94A3B8] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-medium mb-0.5">Email Address</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white">{profile?.email || user?.email || '—'}</p>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#10B981] dark:bg-emerald-900/20 dark:text-emerald-400">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 pb-4 border-b border-[#F1F5F9] dark:border-[#2a3042]">
                        <Phone className="w-4 h-4 text-[#94A3B8] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-medium mb-0.5">Phone Number</p>
                          <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white">{profile?.phone || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-[#94A3B8] mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-medium mb-0.5">Role</p>
                          <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white">{r.label}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[#F1F5F9] dark:border-[#2a3042]">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] dark:bg-emerald-900/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#10B981] dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Account Status</h3>
                  <p className="text-[12px] text-[#94A3B8]">Your account overview</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#141925]">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${profile?.active !== false ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                    <span className={`text-[12px] font-semibold ${profile?.active !== false ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {profile?.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#94A3B8]">Status</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#141925]">
                  <p className="text-[12px] font-semibold text-[#0F172A] dark:text-white mb-1">{r.label}</p>
                  <p className="text-[10px] text-[#94A3B8]">Role</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#141925]">
                  <p className="text-[12px] font-semibold text-[#0F172A] dark:text-white mb-1">
                    {memberDate ? memberDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                  <p className="text-[10px] text-[#94A3B8]">Member Since</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="space-y-6">

            {/* Recent Activity */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] dark:border-[#2a3042]">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#0F172A] dark:text-white">Recent Activity</h3>
                  <p className="text-[12px] text-[#94A3B8]">Latest actions and events</p>
                </div>
                <button className="text-[12px] font-medium text-[#2563EB] hover:underline flex items-center gap-1">
                  View all <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="p-6">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[17px] top-3 bottom-3 w-px bg-[#E2E8F0] dark:bg-[#2a3042]" />

                  <div className="space-y-5">
                    {recentActivities.map((a, i) => (
                      <div key={i} className="relative flex gap-4 group">
                        {/* Icon dot */}
                        <div className={`relative z-10 w-[35px] h-[35px] rounded-full flex items-center justify-center shrink-0 ${a.color} transition-transform duration-200 group-hover:scale-110`}>
                          <a.icon className="w-4 h-4" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${a.color}`}>{a.type}</span>
                          </div>
                          <p className="text-[13px] font-medium text-[#0F172A] dark:text-white">{a.title}</p>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">{a.date} &middot; {a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-br from-[#EFF6FF] to-[#F0F9FF] dark:from-blue-900/10 dark:to-[#1a1f2e] rounded-2xl border border-[#DBEAFE] dark:border-blue-800/20 p-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Headphones className="w-5 h-5 text-[#2563EB] dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-semibold text-[#0F172A] dark:text-white mb-1">Need help?</h4>
                  <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] mb-3 leading-relaxed">Contact support for assistance with your account.</p>
                  <Button size="sm" className="h-8 px-4 rounded-[10px] text-[12px] font-semibold gap-1.5">
                    Contact Support
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs — placeholder content */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-8 text-center">
          <Lock className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">Security Settings</h3>
          <p className="text-[13px] text-[#94A3B8]">Password, two-factor authentication, and session management coming soon.</p>
        </div>
      )}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-8 text-center">
          <Activity className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">Activity Log</h3>
          <p className="text-[13px] text-[#94A3B8]">Full activity history coming soon.</p>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-[#E2E8F0] dark:border-[#2a3042] p-8 text-center">
          <Settings className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white mb-1">Account Settings</h3>
          <p className="text-[13px] text-[#94A3B8]">Notification preferences and account settings coming soon.</p>
        </div>
      )}
    </div>
  )
}
