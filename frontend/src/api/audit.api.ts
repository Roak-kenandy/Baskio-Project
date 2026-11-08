import { api } from './client'
import type { AuditLog, Paginated } from '../types'

export interface AuditQuery {
  page: number
  limit: number
  action?: string
  username?: string
  status?: string
  from?: string
  to?: string
}

export const auditApi = {
  async list(query: AuditQuery): Promise<Paginated<AuditLog>> {
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '' && v !== undefined))
    const { data } = await api.get('/audit-logs', { params })
    return data
  },

  async actions(): Promise<string[]> {
    const { data } = await api.get<{ actions: string[] }>('/audit-logs/actions')
    return data.actions
  },
}
