import { api } from './client'
import type { ManagedUser, Paginated, Permission, PermissionInfo, Role } from '../types'

export interface CreateUserPayload {
  username: string
  fullName: string
  email?: string
  role: Role
  permissions: Permission[]
  password: string
}

export type UpdateUserPayload = Partial<Pick<ManagedUser, 'fullName' | 'email' | 'role' | 'permissions' | 'isActive'>>

export const usersApi = {
  async list(params: { page: number; limit: number; search?: string }): Promise<Paginated<ManagedUser>> {
    const { data } = await api.get('/users', { params: { ...params, search: params.search || undefined } })
    return data
  },

  async create(payload: CreateUserPayload): Promise<ManagedUser> {
    const { data } = await api.post('/users', { ...payload, email: payload.email || undefined })
    return data.user
  },

  async update(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
    const { data } = await api.patch(`/users/${id}`, payload)
    return data.user
  },

  async resetPassword(id: string, password: string): Promise<void> {
    await api.post(`/users/${id}/reset-password`, { password })
  },

  async unlock(id: string): Promise<void> {
    await api.post(`/users/${id}/unlock`)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  async permissionCatalog(): Promise<PermissionInfo[]> {
    const { data } = await api.get<{ permissions: PermissionInfo[] }>('/meta/permissions')
    return data.permissions
  },
}
