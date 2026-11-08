import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import FullPageLoader from './components/common/FullPageLoader'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './routes/ProtectedRoute'
import RequirePermission from './routes/RequirePermission'
import { PERMISSIONS, REPORT_PERMISSION, type ReportType } from './types'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SubscriptionReportPage = lazy(() => import('./pages/SubscriptionReportPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'))
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const reportRoute = (type: ReportType) => (
  <RequirePermission permissions={[REPORT_PERMISSION[type]]}>
    <SubscriptionReportPage key={type} type={type} />
  </RequirePermission>
)

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/reports/medianet-tv" element={reportRoute('medianet-tv')} />
            <Route path="/reports/ott" element={reportRoute('ott')} />
            <Route
              path="/admin/users"
              element={
                <RequirePermission permissions={[PERMISSIONS.USERS_MANAGE]}>
                  <UsersPage />
                </RequirePermission>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <RequirePermission permissions={[PERMISSIONS.AUDIT_VIEW]}>
                  <AuditLogsPage />
                </RequirePermission>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
