import { create } from 'zustand'

interface User { id: number; email: string; name: string; systemRole: string }
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  hydrated: boolean
  setAuth: (user: User, token: string, refresh: string) => void
  logout: () => void
  init: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,
  setAuth: (user, token, refresh) => {
    localStorage.setItem('master_access_token', token)
    localStorage.setItem('master_refresh_token', refresh)
    localStorage.setItem('master_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true, hydrated: true })
  },
  logout: () => {
    localStorage.removeItem('master_access_token')
    localStorage.removeItem('master_refresh_token')
    localStorage.removeItem('master_user')
    set({ user: null, token: null, isAuthenticated: false, hydrated: true })
  },
  init: () => {
    const token = localStorage.getItem('master_access_token')
    const userStr = localStorage.getItem('master_user')
    if (token && userStr) {
      try { set({ user: JSON.parse(userStr), token, isAuthenticated: true, hydrated: true }) } catch { set({ hydrated: true }) }
    } else {
      set({ hydrated: true })
    }
  },
}))

export const isSuperAdmin = (role?: string) => role === 'SUPER_ADMIN'
export const isAdmin = (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN'
