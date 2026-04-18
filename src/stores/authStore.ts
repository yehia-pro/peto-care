import { create } from 'zustand'
import { isFirebaseEnabled } from '../services/firebase'
import { authAPI, favoritesAPI } from '@/services/api'

interface ExtendedUser {
  role?: 'user' | 'vet' | 'admin' | 'petstore'
  fullName?: string
  id?: string
  phone?: string
  birthDate?: string
  avatarUrl?: string
  email: string
  favorites?: { itemId: string; itemType: 'product' | 'service' | 'disease' }[]
  // Vet specific
  specialization?: string
  experienceYears?: string | number
  clinicName?: string
  clinicAddress?: string
  clinicPhone?: string
  contact?: string // JSON string from backend
  // PetStore specific
  storeName?: string
  description?: string
  address?: string
  city?: string
  brands?: string
}

interface AuthState {
  user: ExtendedUser | null
  token: string | null
  loading: boolean
  isInitializing: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string, captcha?: { captchaId?: string, captchaAnswer?: string }) => Promise<void>
  register: (email: string, password: string, userData: any) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  toggleFavorite: (itemId: string, itemType: 'product' | 'service' | 'disease') => Promise<void>
  setUser: (user: ExtendedUser | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  initializeGoogleAuth: () => void
}

const fetchFullProfile = async (fallback: ExtendedUser): Promise<ExtendedUser> => {
  try {
    const profileRes = await authAPI.getProfile()
    const p = profileRes.data
    return {
      ...fallback,
      id: p.id,
      email: p.email ?? fallback.email,
      fullName: p.fullName ?? fallback.fullName,
      role: p.role ?? fallback.role,
      phone: p.phone ?? fallback.phone,
      avatarUrl: p.avatarUrl ?? fallback.avatarUrl,
      birthDate: fallback.birthDate,
      favorites: fallback.favorites
    }
  } catch {
    return fallback
  }
}

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
const initialUser = typeof window !== 'undefined' ? (() => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null
  } catch (e) {
    return null
  }
})() : null

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialToken,
  loading: false,
  isInitializing: true,
  error: null,
  isAuthenticated: !!initialToken && !!initialUser,

  login: async (email: string, password: string, captcha?: { captchaId?: string, captchaAnswer?: string }) => {
    set({ loading: true, error: null })
    try {
      const res = await authAPI.login({ email, password, ...(captcha || {}) })
      localStorage.setItem('token', res.data.token)
      const baseUser = (res.data.user || { email }) as ExtendedUser
      const userData = await fetchFullProfile(baseUser)
      localStorage.setItem('user', JSON.stringify(userData))
      set({ user: userData as any, token: res.data.token, loading: false, isAuthenticated: true })
    } catch (backendErr: any) {
      set({ error: backendErr?.response?.data?.message || backendErr?.message || 'login_failed', loading: false, isAuthenticated: false })
      throw backendErr
    }
  },

  register: async (email: string, password: string, userData: any) => {
    set({ loading: true, error: null })
    try {
      const backendRole = userData.role === 'vet' ? 'vet' : userData.role === 'petstore' ? 'petstore' : 'user'
      const res = await authAPI.register({
        email,
        password,
        fullName: userData.fullName || email.split('@')[0],
        role: backendRole,
        phone: userData.phone
      })
      if (res.data?.pendingApproval) {
        set({ loading: false, isAuthenticated: false, error: null })
        return
      }
      if (!res.data?.token) {
        set({ loading: false, isAuthenticated: false, error: 'register_no_token' })
        throw new Error('register_no_token')
      }
      localStorage.setItem('token', res.data.token)
      const baseCreated = (res.data.user || { email, role: backendRole, fullName: userData.fullName }) as ExtendedUser
      const createdUser = await fetchFullProfile(baseCreated)
      localStorage.setItem('user', JSON.stringify(createdUser))
      set({ user: createdUser as any, token: res.data.token, loading: false, isAuthenticated: true })
    } catch (error: any) {
      set({ error: error?.response?.data?.message || error.message, loading: false, isAuthenticated: false })
      throw error
    }
  },

  logout: async () => {
    set({ loading: true })
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ user: null, token: null, loading: false, isAuthenticated: false })
    } catch (error: any) {
      console.error('Logout error:', error)
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null })
    try {
      await authAPI.forgotPassword(email)
      set({ loading: false })
    } catch (error: any) {
      set({ error: error?.response?.data?.message || error.message, loading: false })
      throw error
    }
  },

  toggleFavorite: async (itemId: string, itemType: 'product' | 'service' | 'disease') => {
    try {
      const res = await favoritesAPI.toggle(itemId, itemType);
      
      set((state) => {
        if (!state.user) return state;
        const updatedUser = { ...state.user, favorites: res.data.favorites };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  },

  setUser: (user: ExtendedUser | null) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user, isAuthenticated: !!user });
  },
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),

  initializeGoogleAuth: () => {
    import('../lib/supabase').then(({ supabase }) => {
      // Check initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          set({ isInitializing: false });
        }
      });

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const newToken = session.access_token;
          localStorage.setItem('token', newToken);
          set({ token: newToken });
          
          // Fetch backend profile data via access token
          const baseUser: ExtendedUser = {
            email: session.user.email || '',
            id: session.user.id,
            fullName: session.user.user_metadata?.full_name || '',
            avatarUrl: session.user.user_metadata?.avatar_url || '',
            role: 'user'
          };
          
          const fullProfile = await fetchFullProfile(baseUser);
          
          localStorage.setItem('user', JSON.stringify(fullProfile));
          set({ user: fullProfile as any, isAuthenticated: true, isInitializing: false });
        } else if (event === 'SIGNED_OUT') {
          useAuthStore.getState().logout();
          set({ isInitializing: false });
        } else {
          set({ isInitializing: false });
        }
      });
    });
  }
}))
