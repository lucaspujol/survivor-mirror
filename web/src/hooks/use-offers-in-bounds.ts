import { useCallback, useRef, useState } from 'react'
import { listOffers, type Bounds, type Offer } from '@/lib/offers'

const DEBOUNCE_MS = 150

/**
 * Offers inside the viewport. The map drives `setBounds` on every pan and
 * zoom, so the fetch is debounced and the in-flight request is dropped when a
 * newer one starts.
 */
export function useOffersInBounds() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestRef = useRef(0)
  const lastBoundsRef = useRef<Bounds | null>(null)

  const setBounds = useCallback((bounds: Bounds) => {
    lastBoundsRef.current = bounds
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const request = ++requestRef.current
      setIsLoading(true)
      listOffers(bounds)
        .then((data) => {
          if (request === requestRef.current) setOffers(data)
        })
        .catch(() => {
          if (request === requestRef.current) setOffers([])
        })
        .finally(() => {
          if (request === requestRef.current) setIsLoading(false)
        })
    }, DEBOUNCE_MS)
  }, [])

  const refresh = useCallback(() => {
    if (lastBoundsRef.current) setBounds(lastBoundsRef.current)
  }, [setBounds])

  return { offers, isLoading, setBounds, refresh }
}
