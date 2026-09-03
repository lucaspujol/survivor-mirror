import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ApiError } from '@/lib/api'

type LocationState = { from?: { pathname: string } } | null

/**
 * Shared submit plumbing for the login and signup forms: pending flag, error
 * message, and the redirect back to the URL RequireAuth bounced away from.
 */
export function useAuthSubmit(fallbackMessage: string) {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const from = (location.state as LocationState)?.from?.pathname ?? '/'

  async function submit(action: () => Promise<void>) {
    setError(null)
    setIsPending(true)
    try {
      await action()
      navigate(from, { replace: true })
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : fallbackMessage)
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, submit }
}
