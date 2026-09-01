export type Role = 'seeker' | 'employer' | 'admin'

export type User = {
  id: number
  email: string
  fullname: string
  role: Role
}

export function useAuth(): { user: User | null; isLoading: boolean } {
  return { user: null, isLoading: false }
}