import { create } from 'zustand'
import type { User } from '../api/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

// Rehydrate from localStorage on load
const storedToken = localStorage.getItem('exam_token')
const storedUser = localStorage.getItem('exam_user')

export const useAuthStore = create<AuthState>((set) => ({
  token: storedToken,
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,

  login: (token, user) => {
    localStorage.setItem('exam_token', token)
    localStorage.setItem('exam_user', JSON.stringify(user))
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('exam_token')
    localStorage.removeItem('exam_user')
    set({ token: null, user: null, isAuthenticated: false })
  },
}))
