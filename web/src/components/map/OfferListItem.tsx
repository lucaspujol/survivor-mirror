import { BuildingIcon, MapPinIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { contractLabel } from '@/components/offers/ContractBadge'
import { publishedLabel, type Offer } from '@/lib/offers'

type OfferListItemProps = {
  offer: Offer
  isSelected: boolean
  onSelect: () => void
}

export function OfferListItem({ offer, isSelected, onSelect }: OfferListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isSelected}
      className={cn(
        'w-full rounded-lg border p-3 text-left transition-colors',
        'hover:border-primary/40 hover:bg-accent/50',
        isSelected ? 'border-primary bg-accent' : 'border-border bg-card',
      )}
    >
      <p className="line-clamp-2 font-medium">{offer.title}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
        <BuildingIcon className="size-3.5 shrink-0" />
        <span className="truncate">{offer.company}</span>
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPinIcon className="size-3.5 shrink-0" />
        <span className="truncate">{offer.city}</span>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {contractLabel(offer.contract_type, offer.contract_duration)} ·{' '}
        {publishedLabel(offer.created_at)}
      </p>
    </button>
  )
}
