import { SearchXIcon } from 'lucide-react'
import { OfferListItem } from '@/components/map/OfferListItem'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import type { Offer } from '@/lib/offers'

type OfferListProps = {
  offers: Offer[]
  isLoading: boolean
  selectedId: number | null
  onSelect: (offer: Offer) => void
}

export function OfferList({ offers, isLoading, selectedId, onSelect }: OfferListProps) {
  if (isLoading && offers.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>Aucune offre ici</EmptyTitle>
          <EmptyDescription>
            Déplacez la carte ou élargissez la zone pour voir d'autres offres.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {offers.map((offer) => (
        <OfferListItem
          key={offer.id}
          offer={offer}
          isSelected={offer.id === selectedId}
          onSelect={() => onSelect(offer)}
        />
      ))}
    </div>
  )
}
