import { Navigate, Outlet, useLocation } from 'react-router-dom'
import FullPageLoader from '../components/common/FullPageLoader'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }
  return <Outlet />
}
