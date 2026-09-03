import { BuildingIcon, MapPinIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Offer } from '@/lib/offers'

type MapSelectedCardProps = {
  offer: Offer
  onOpen: () => void
}

/** Compact preview shown over the map on narrow screens, where the side panel is hidden. */
export function MapSelectedCard({ offer, onOpen }: MapSelectedCardProps) {
  return (
    <div className="absolute inset-x-3 bottom-16 z-20 rounded-lg border bg-card p-3 shadow-lg lg:hidden">
      <p className="line-clamp-2 font-medium">{offer.title}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <BuildingIcon className="size-3.5 shrink-0" />
        <span className="truncate">{offer.company}</span>
        <MapPinIcon className="size-3.5 shrink-0" />
        <span className="truncate">{offer.city}</span>
      </p>
      <Button size="sm" className="mt-3 w-full" onClick={onOpen}>
        Voir l'offre
      </Button>
    </div>
  )
}
