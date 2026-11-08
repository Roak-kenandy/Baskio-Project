import { api, setCsrfToken } from './client'
import type { SessionUser } from '../types'

export const authApi = {
  async login(username: string, password: string): Promise<SessionUser> {
    const { data } = await api.post<{ user: SessionUser; csrfToken: string }>('/auth/login', { username, password })
    setCsrfToken(data.csrfToken)
    return data.user
  },

  async me(): Promise<SessionUser> {
    const { data } = await api.get<{ user: SessionUser }>('/auth/me')
    return data.user
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      setCsrfToken(null)
    }
  },

  async changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const { data } = await api.post<{ user: SessionUser }>('/auth/change-password', payload)
    return data.user
  },
}
