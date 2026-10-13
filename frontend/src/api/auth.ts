import api from './client'

export interface User {
  id: string
  email: string
  full_name: string
  role: 'student' | 'admin'
  student_id: string | null
  department: string
  avatar_initials: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { email, password }),

  me: () => api.get<User>('/api/auth/me'),
}
