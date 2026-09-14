import axios from 'axios'

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8082/api'

const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('master_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('master_access_token')
      localStorage.removeItem('master_refresh_token')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/master/auth/login', data),
  refresh: (refreshToken: string) => api.post('/master/auth/refresh', { refreshToken }),
}

export const masterApi = {
  overview: () => api.get('/master/overview'),
  projects: {
    list: () => api.get('/master/projects'),
    get: (id: number) => api.get(`/master/projects/${id}`),
    bySlug: (slug: string) => api.get(`/master/projects/slug/${slug}`),
    create: (data: any) => api.post('/master/projects', data),
    update: (id: number, data: any) => api.put(`/master/projects/${id}`, data),
    delete: (id: number) => api.delete(`/master/projects/${id}`),
  },
  tenants: {
    list: (projectId?: number) => api.get('/master/tenants', { params: projectId ? { projectId } : {} }),
    detail: (id: number) => api.get(`/master/tenants/${id}`),
    stats: (id: number) => api.get(`/master/tenants/${id}/stats`),
    users: (id: number) => api.get(`/master/tenants/${id}/users`),
    backfill: (projectId: number) => api.post(`/master/tenants/backfill/${projectId}`),
    create: (data: any) => api.post('/master/tenants', data),
    updateStatus: (id: number, status: string) => api.put(`/master/tenants/${id}/status`, { status }),
  },
  analytics: {
    monthly: () => api.get('/master/analytics/monthly'),
    activeUsers: () => api.get('/master/analytics/active-users'),
  },
  masjids: {
    list: (q?:string)=> api.get('/master/masjids', { params: q?{q}:{} }),
    detail: (id:number)=> api.get(`/master/masjids/${id}`),
    stats: (id:number)=> api.get(`/master/masjids/${id}/stats`),
    users: (id:number)=> api.get(`/master/masjids/${id}/users`),
    userDetail: (masjidId:number, userId:number)=> api.get(`/master/masjids/${masjidId}/users/${userId}`),
    toggleUser: (masjidId:number, userId:number, active:boolean, remark:string)=> api.put(`/master/masjids/${masjidId}/users/${userId}/status`, { active, remark }),
    deleteUser: (masjidId:number, userId:number, remark:string)=> api.delete(`/master/masjids/${masjidId}/users/${userId}`, { data: { remark } } as any),
    create: (data:any)=> api.post('/master/masjids', data),
    donations: (id:number)=> api.get(`/master/masjids/${id}/donations`),
    causes: (id:number)=> api.get(`/master/masjids/${id}/causes`),
    janazahs: (id:number)=> api.get(`/master/masjids/${id}/janazahs`),
    gumshudas: (id:number)=> api.get(`/master/masjids/${id}/gumshudas`),
    announcements: (id:number)=> api.get(`/master/masjids/${id}/announcements`),
    expenses: (id:number)=> api.get(`/master/masjids/${id}/expenses`),
    prayerTimes: (id:number)=> api.get(`/master/masjids/${id}/prayer-times`),
    jumuah: (id:number)=> api.get(`/master/masjids/${id}/jumuah`),
    toggleJanazah: (masjidId:number, janazahId:number, active:boolean, remark:string)=> api.put(`/master/masjids/${masjidId}/janazahs/${janazahId}/status`, { active, remark }),
    toggleGumshuda: (masjidId:number, gumshudaId:number, active:boolean, remark:string)=> api.put(`/master/masjids/${masjidId}/gumshudas/${gumshudaId}/status`, { active, remark }),
    toggleAnnouncement: (masjidId:number, annId:number, active:boolean, remark:string)=> api.put(`/master/masjids/${masjidId}/announcements/${annId}/status`, { active, remark }),
    toggleCause: (masjidId:number, causeId:number, active:boolean, remark:string)=> api.put(`/master/masjids/${masjidId}/causes/${causeId}/status`, { active, remark }),
    toggleDonation: (masjidId:number, donationId:number, status:string, remark:string)=> api.put(`/master/masjids/${masjidId}/donations/${donationId}/status`, { status, remark }),
    createCause: (masjidId:number, data:any)=> api.post(`/master/masjids/${masjidId}/causes`, data),
    createDonation: (masjidId:number, data:any)=> api.post(`/master/masjids/${masjidId}/donations`, data),
    deleteCause: (masjidId:number, causeId:number, remark:string)=> api.delete(`/master/masjids/${masjidId}/causes/${causeId}`, { data: { remark } } as any),
    deleteDonation: (masjidId:number, donationId:number, remark:string)=> api.delete(`/master/masjids/${masjidId}/donations/${donationId}`, { data: { remark } } as any),
    deleteJanazah: (masjidId:number, jid:number, remark:string)=> api.delete(`/master/masjids/${masjidId}/janazahs/${jid}`, { data: { remark } } as any),
    deleteGumshuda: (masjidId:number, gid:number, remark:string)=> api.delete(`/master/masjids/${masjidId}/gumshudas/${gid}`, { data: { remark } } as any),
    deleteAnnouncement: (masjidId:number, aid:number, remark:string)=> api.delete(`/master/masjids/${masjidId}/announcements/${aid}`, { data: { remark } } as any),
  },
  users: {
    list: (q?: string) => api.get('/master/users', { params: q ? { q } : {} }),
    create: (data:any) => api.post('/master/users', data),
    updateRole: (id: number, systemRole: string) => api.put(`/master/users/${id}/role`, { systemRole }),
    toggle: (id:number, active:boolean, remark:string) => api.put(`/master/users/${id}/status`, { active, remark }),
    delete: (id:number, remark:string) => api.delete(`/master/users/${id}`, { data: { remark } } as any),
    unlock: (id:number, remark:string) => api.post(`/master/users/${id}/unlock`, { remark }),
  },
  notifications: {
    list: (projectId?: number) => api.get('/master/notifications', { params: projectId ? { projectId } : {} }),
    send: (data: any) => api.post('/master/notifications', data),
  },
  audit: { list: () => api.get('/master/audit') },
  campaigns: {
    list: () => api.get('/master/campaigns'),
    send: (data:any) => api.post('/master/campaigns', data),
  },
  upload: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/master/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const cmsApi = (masjidId: number) => {
  const h = { 'X-Masjid-Id': String(masjidId) }
  return {
    branding: {
      get: () => api.get('/cms/branding', { headers: h }),
      save: (data: any) => api.put('/cms/branding', data, { headers: h }),
    },
    homeAnnouncement: {
      get: () => api.get('/cms/home-announcement', { headers: h }),
      save: (data: any) => api.put('/cms/home-announcement', data, { headers: h }),
    },
    prayerTimes: {
      get: () => api.get('/cms/prayer-times', { headers: h }),
      save: (data: any[]) => api.put('/cms/prayer-times', data, { headers: h }),
    },
    jumuah: {
      get: () => api.get('/cms/jumuah', { headers: h }),
      save: (data: any) => api.put('/cms/jumuah', data, { headers: h }),
    },
    jumuahs: {
      get: () => api.get('/cms/jumuahs', { headers: h }),
      save: (data: any[]) => api.put('/cms/jumuahs', data, { headers: h }),
    },
    ramadan: {
      get: () => api.get('/cms/ramadan', { headers: h }),
      save: (data: any) => api.put('/cms/ramadan', data, { headers: h }),
    },
    ramadanDays: {
      get: () => api.get('/cms/ramadan/days', { headers: h }),
      save: (data: any[]) => api.post('/cms/ramadan/days', data, { headers: h }),
    },
    janazahs: {
      get: (inc?: boolean) => api.get('/cms/janazahs', { headers: h, params: { includeInactive: inc } }),
      create: (data: any) => api.post('/cms/janazahs', data, { headers: h }),
      toggle: (id: number) => api.put(`/cms/janazahs/${id}/toggle`, {}, { headers: h }),
      delete: (id: number) => api.delete(`/cms/janazahs/${id}`, { headers: h }),
    },
    gumshudas: {
      get: (inc?: boolean) => api.get('/cms/gumshudas', { headers: h, params: { includeInactive: inc } }),
      create: (data: any) => api.post('/cms/gumshudas', data, { headers: h }),
      toggle: (id: number) => api.put(`/cms/gumshudas/${id}/toggle`, {}, { headers: h }),
      delete: (id: number) => api.delete(`/cms/gumshudas/${id}`, { headers: h }),
    },
    announcements: {
      get: (inc?: boolean) => api.get('/cms/announcements', { headers: h, params: { includeInactive: inc } }),
      create: (data: any) => api.post('/cms/announcements', data, { headers: h }),
      toggle: (id: number) => api.put(`/cms/announcements/${id}/toggle`, {}, { headers: h }),
      delete: (id: number) => api.delete(`/cms/announcements/${id}`, { headers: h }),
    },
    donationCauses: {
      get: () => api.get('/cms/donation-causes', { headers: h }),
      create: (data: any) => api.post('/cms/donation-causes', data, { headers: h }),
      delete: (id: number) => api.delete(`/cms/donation-causes/${id}`, { headers: h }),
    },
    monthlyDonations: {
      get: () => api.get('/cms/monthly-donations', { headers: h }),
      create: (data: any) => api.post('/cms/monthly-donations', data, { headers: h }),
      delete: (id: number) => api.delete(`/cms/monthly-donations/${id}`, { headers: h }),
    },
    expenses: {
      get: () => api.get('/cms/expenses', { headers: h }),
      create: (data: any) => api.post('/cms/expenses', data, { headers: h }),
      delete: (id: number) => api.delete(`/cms/expenses/${id}`, { headers: h }),
    },
    services: {
      get: () => api.get('/cms/services', { headers: h }),
      create: (data: any) => api.post('/cms/services', data, { headers: h }),
      delete: (id: number) => api.delete(`/cms/services/${id}`, { headers: h }),
    },
    teamMembers: {
      get: () => api.get('/cms/team-members', { headers: h }),
      create: (data: any) => api.post('/cms/team-members', data, { headers: h }),
      delete: (id: number) => api.delete(`/cms/team-members/${id}`, { headers: h }),
    },
    sunnahs: {
      get: () => api.get('/cms/sunnahs', { headers: h }),
      create: (data: any) => api.post('/cms/sunnahs', data, { headers: h }),
      delete: (id: number) => api.delete(`/cms/sunnahs/${id}`, { headers: h }),
    },
  }
}

export default api
