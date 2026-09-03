import { useEffect, useState } from 'react'
import { ApiError, api } from '@/lib/api'

type State<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: null; error: string }

const LOADING = { status: 'loading', data: null, error: null } as const

/**
 * Fetches a screen's data once and exposes the three states every signed-in
 * page has to render: loading, failed, and loaded (possibly empty).
 *
 * The result is stored with the path it came from, so a path change reads as
 * "loading" during render rather than briefly showing the previous screen's
 * rows.
 */
export function useApiResource<T>(path: string): State<T> {
  const [entry, setEntry] = useState<{ path: string; state: State<T> }>({
    path,
    state: LOADING,
  })

  useEffect(() => {
    let cancelled = false

    api<T>(path)
      .then((data) => {
        if (!cancelled) setEntry({ path, state: { status: 'ready', data, error: null } })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message =
          error instanceof ApiError
            ? error.message
            : 'Le serveur est injoignable. Réessayez dans un instant.'
        setEntry({ path, state: { status: 'error', data: null, error: message } })
      })

    return () => {
      cancelled = true
    }
  }, [path])

  return entry.path === path ? entry.state : LOADING
}
