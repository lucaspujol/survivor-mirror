import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth, type Role } from '@/lib/auth'

/**
 * Presentation-level guard only: every protected endpoint enforces the role
 * server-side as well.
 */
export function RequireRole({ allow }: { allow: Role[] }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return allow.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />
}
