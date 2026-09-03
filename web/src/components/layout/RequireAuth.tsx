import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/lib/auth'

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  // if (!user) {
  //   return <Navigate to="/login" state={{ from: location }} replace />
  // }

  void user
  void location

  return <Outlet />
}
