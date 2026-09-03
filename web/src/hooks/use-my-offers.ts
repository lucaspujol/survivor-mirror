import { useCallback, useEffect, useState } from 'react'
import { listOffers, type Offer } from '@/lib/offers'

/**
 * The offers list endpoint is public and returns `employer_id`, so an
 * employer's own offers are filtered client-side until a scoped endpoint
 * exists.
 */
export function useMyOffers(employerId: number | undefined) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(() => {
    if (employerId === undefined) return
    setIsLoading(true)
    listOffers()
      .then((all) => setOffers(all.filter((offer) => offer.employer_id === employerId)))
      .catch(() => setOffers([]))
      .finally(() => setIsLoading(false))
  }, [employerId])

  useEffect(load, [load])

  return { offers, isLoading, refresh: load }
}
