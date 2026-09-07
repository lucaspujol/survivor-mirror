import { useEffect, useState } from 'react'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { PageShell } from '@/components/layout/PageShell'
import { CreateOfferDialog } from '@/components/offers/CreateOfferDialog'
import { MyOfferCard } from '@/components/offers/MyOfferCard'
import { useApiResource } from '@/hooks/use-api-resource'
import { useAuth } from '@/lib/auth'
import type { MyOffer } from '@/lib/my-offers'

export function MyOffersPage() {
  const { user } = useAuth()

  // useApiResource refetches when its path changes, so bumping this counter is
  // how a freshly published offer gets pulled in.
  const [version, setVersion] = useState(0)
  const { status, data, error } = useApiResource<MyOffer[]>(`/api/mes-offres?v=${version}`)

  // Mirrored locally so an edit or a delete updates the list without a refetch.
  const [offers, setOffers] = useState<MyOffer[]>([])

  useEffect(() => {
    if (status === 'ready') setOffers(data)
  }, [status, data])

  return (
    <PageShell
      title="Mes offres"
      description="Les offres publiées par votre établissement et les candidatures reçues."
      actions={
        <CreateOfferDialog
          company={user?.display_name ?? 'votre établissement'}
          onCreated={() => setVersion((current) => current + 1)}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {status === 'loading' && <PageLoading />}
        {status === 'error' && <PageError message={error} />}

        {status === 'ready' &&
          (offers.length === 0 ? (
            <PageEmpty
              title="Vous n'avez pas encore publié d'offre."
              hint="Publiez votre première offre depuis le bouton en haut de cette page."
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {offers.length} offre{offers.length > 1 ? 's' : ''} publiée
                {offers.length > 1 ? 's' : ''}
              </p>
              <ul className="flex flex-col gap-3">
                {offers.map((offer) => (
                  <li key={offer.id}>
                    <MyOfferCard
                      offer={offer}
                      onSaved={(updated) =>
                        setOffers((current) =>
                          current.map((entry) => (entry.id === updated.id ? updated : entry)),
                        )
                      }
                      onDeleted={() =>
                        setOffers((current) => current.filter((entry) => entry.id !== offer.id))
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          ))}
      </div>
    </PageShell>
  )
}
