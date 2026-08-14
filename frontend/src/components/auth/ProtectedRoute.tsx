import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { canAccessRoute } from '../../auth/permissions'
import { getDefaultRouteForRole } from '../../auth/mockUsers'

export function PublicRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f2]">
        <div className="w-8 h-8 border-2 border-[#2d8a4e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />
  }

  return <Outlet />
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f7f2]">
        <div className="w-8 h-8 border-2 border-[#2d8a4e] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function RoleGuard() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />

  if (!canAccessRoute(user.role, location.pathname)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />
  }

  return <Outlet />
}
