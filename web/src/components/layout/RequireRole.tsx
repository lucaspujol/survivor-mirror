import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth, type Role } from '@/lib/auth'

/**
 * Guards a section against the wrong role. Signed out, the visitor is sent to
 * the login page; signed in with another role, the route simply does not exist
 * for them, so they get the 404 rather than a screen they cannot use.
 */
export function RequireRole({ roles }: { roles: Role[] }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/introuvable" replace />
  }

  return <Outlet />
}
