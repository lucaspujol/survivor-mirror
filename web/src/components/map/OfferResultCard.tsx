import { BuildingIcon, MapPinIcon } from 'lucide-react'
import { contractLabel } from '@/components/offers/ContractBadge'
import { Badge } from '@/components/ui/badge'
import { publishedLabel, type Offer } from '@/lib/offers'
import { cn } from '@/lib/utils'

type OfferResultCardProps = {
  offer: Offer
  isSelected: boolean
  onSelect: () => void
}

/** Full-width result row shown under the map. */
export function OfferResultCard({ offer, isSelected, onSelect }: OfferResultCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected}
      className={cn(
        'w-full rounded-lg border border-l-4 bg-card p-4 text-left transition-colors',
        'hover:border-primary/40 hover:bg-primary/5',
        isSelected ? 'border-primary bg-primary/5' : 'border-border border-l-primary/30',
      )}
    >
      <Badge variant="secondary" className="mb-2 uppercase">
        {contractLabel(offer.contract_type, offer.contract_duration)}
      </Badge>

      <p className="font-semibold text-primary">{offer.title}</p>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BuildingIcon className="size-3.5 shrink-0" />
          {offer.company}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPinIcon className="size-3.5 shrink-0" />
          {offer.city}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm">{offer.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">{publishedLabel(offer.created_at)}</p>
    </button>
  )
}
