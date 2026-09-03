import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'

export type Role = 'seeker' | 'employer' | 'admin'

export type User = {
  id: number
  email: string
  role: Role
  /** Full name of a seeker, company name of an employer. */
  display_name: string
  created_at: string
}

/** Admin is granted in the database, never chosen at signup. */
export type RegisterPayload =
  | { role: 'seeker'; email: string; password: string; first_name: string; last_name: string }
  | { role: 'employer'; email: string; password: string; company_name: string }

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // The token lives in an httpOnly cookie, so the only way to know who we are
  // is to ask the API once on boot.
  useEffect(() => {
    api<User>('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setUser(
      await api<User>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    )
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    setUser(
      await api<User>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    )
  }, [])

  const logout = useCallback(async () => {
    await api<void>('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return context
}
