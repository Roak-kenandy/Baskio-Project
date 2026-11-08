export type Role = 'admin' | 'user'

export const PERMISSIONS = {
  REPORT_MEDIANET_TV_VIEW: 'reports.medianet_tv.view',
  REPORT_OTT_VIEW: 'reports.ott.view',
  REPORT_EXPORT: 'reports.export',
  REPORT_PII_VIEW: 'reports.pii.view',
  USERS_MANAGE: 'users.manage',
  AUDIT_VIEW: 'audit.view',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export type ReportType = 'medianet-tv' | 'ott'

export const REPORT_PERMISSION: Record<ReportType, Permission> = {
  'medianet-tv': PERMISSIONS.REPORT_MEDIANET_TV_VIEW,
  ott: PERMISSIONS.REPORT_OTT_VIEW,
}

export interface SessionUser {
  id: string
  username: string
  fullName: string
  email?: string
  role: Role
  permissions: Permission[]
  mustChangePassword: boolean
  lastLoginAt?: string
}

export interface ManagedUser {
  id: string
  username: string
  fullName: string
  email?: string
  role: Role
  permissions: Permission[]
  isActive: boolean
  isLocked: boolean
  mustChangePassword: boolean
  lastLoginAt?: string
  lastLoginIp?: string
  createdAt: string
  updatedAt: string
}

export interface PermissionInfo {
  key: Permission
  group: string
  label: string
  description: string
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface ReportInfo {
  key: ReportType
  label: string
  tag: string
  products: string[]
}

export interface SubscriptionRow {
  contactId: string
  contactCode: string | null
  customerName: string | null
  customerType: string | null
  phone: string | null
  email: string | null
  island: string | null
  atoll: string | null
  address: string | null
  tag: string
  serviceId: string | null
  package: string | null
  status: string | null
  price: number | null
  startDate: string | null
  endDate: string | null
  daysRemaining: number | null
}

export interface SubscriptionPage extends Paginated<SubscriptionRow> {
  report: ReportInfo
  piiMasked: boolean
}

export type SortBy = 'startDate' | 'endDate' | 'customerName' | 'status' | 'package'

export interface ReportFilters {
  search: string
  state: string
  expiry: 'all' | 'active' | 'expired'
  startFrom: string
  startTo: string
  endFrom: string
  endTo: string
  sortBy: SortBy
  sortOrder: 'asc' | 'desc'
}

export interface ReportSummary extends ReportInfo {
  total: number
  customers: number
  active: number
  expired: number
  expiringIn30Days: number
}

export interface AuditLog {
  id: string
  actorUsername?: string
  action: string
  status: 'success' | 'failure'
  targetType?: string
  targetId?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  createdAt: string
}
