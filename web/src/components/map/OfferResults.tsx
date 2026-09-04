import { SearchXIcon } from 'lucide-react'
import { OfferResultCard } from '@/components/map/OfferResultCard'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { Offer, SortKey } from '@/lib/offers'

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Plus récentes',
  oldest: 'Plus anciennes',
  city: 'Ville',
}

type OfferResultsProps = {
  offers: Offer[]
  isLoading: boolean
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  selectedId: number | null
  onSelect: (offer: Offer) => void
}

export function OfferResults({
  offers,
  isLoading,
  sort,
  onSortChange,
  selectedId,
  onSelect,
}: OfferResultsProps) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {offers.length} offre{offers.length > 1 ? 's' : ''} consultable
        {offers.length > 1 ? 's' : ''} dans la zone affichée
      </p>

      <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
        <Label htmlFor="sort" className="shrink-0 font-medium">
          Trier par
        </Label>
        <Select value={sort} onValueChange={(value) => onSortChange(value as SortKey)}>
          <SelectTrigger id="sort" className="h-9 flex-1 bg-background">
            <SelectValue>{(value) => SORT_LABELS[value as SortKey]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {SORT_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && offers.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Aucune offre ici</EmptyTitle>
            <EmptyDescription>
              Déplacez la carte, élargissez la zone ou retirez des filtres.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => (
            <OfferResultCard
              key={offer.id}
              offer={offer}
              isSelected={offer.id === selectedId}
              onSelect={() => onSelect(offer)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
