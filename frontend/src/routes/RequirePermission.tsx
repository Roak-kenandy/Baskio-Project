import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import ForbiddenPage from '../pages/ForbiddenPage'
import type { Permission } from '../types'

export default function RequirePermission({ permissions, children }: { permissions: Permission[]; children: ReactNode }) {
  const { can } = useAuth()
  return can(...permissions) ? <>{children}</> : <ForbiddenPage />
}
