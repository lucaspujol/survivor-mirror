import { Link } from 'react-router'
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

/**
 * Full-width result row shown under the map.
 *
 * This is a div with role="button", not a real <button>, on purpose: a
 * <button> cannot contain other interactive content per the HTML spec, and
 * the company name below needs its own, independently focusable link. The
 * target === currentTarget check in onKeyDown exists so a key press that
 * bubbles up from that nested link doesn't also trigger card selection.
 */
export function OfferResultCard({ offer, isSelected, onSelect }: OfferResultCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      aria-current={isSelected}
      className={cn(
        'w-full cursor-pointer rounded-lg border border-l-4 bg-card p-4 text-left transition-colors',
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
          <Link
            to={`/entreprises/${offer.employer_id}`}
            onClick={(event) => event.stopPropagation()}
            className="underline underline-offset-4 hover:text-primary"
          >
            {offer.company}
          </Link>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPinIcon className="size-3.5 shrink-0" />
          {offer.city}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm">{offer.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">{publishedLabel(offer.created_at)}</p>
    </div>
  )
}
