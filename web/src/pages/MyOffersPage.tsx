import { BriefcaseIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { CreateOfferDialog } from '@/components/offers/CreateOfferDialog'
import { OfferCard } from '@/components/offers/OfferCard'
import { OfferStats } from '@/components/offers/OfferStats'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyOffers } from '@/hooks/use-my-offers'
import { useAuth } from '@/lib/auth'

export function MyOffersPage() {
  const { user } = useAuth()
  const { offers, isLoading, refresh } = useMyOffers(user?.id)

  return (
    <PageShell
      title="Mes offres"
      description="Les offres publiées par votre établissement."
      actions={
        user && <CreateOfferDialog company={user.display_name} onCreated={refresh} />
      }
    >
      <div className="flex flex-col gap-6">
        <OfferStats offers={offers} />

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BriefcaseIcon />
              </EmptyMedia>
              <EmptyTitle>Aucune offre publiée</EmptyTitle>
              <EmptyDescription>
                Publiez votre première offre : elle apparaîtra immédiatement sur la
                carte et restera visible 30 jours.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
