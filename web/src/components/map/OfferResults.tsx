import { useEffect, useState } from 'react'
import { SearchXIcon } from 'lucide-react'
import { OfferResultCard } from '@/components/map/OfferResultCard'
import { Button } from '@/components/ui/button'
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

const PAGE_SIZE = 10

type OfferResultsProps = {
  offers: Offer[]
  isLoading: boolean
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  selectedId: number | null
  onSelect: (offer: Offer) => void
  showingAll: boolean
  onShowAll: () => void
  onBackToMapArea: () => void
}

export function OfferResults({
  offers,
  isLoading,
  sort,
  onSortChange,
  selectedId,
  onSelect,
  showingAll,
  onShowAll,
  onBackToMapArea,
}: OfferResultsProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [offers])

  const shown = offers.slice(0, visibleCount)
  const hasMore = visibleCount < offers.length

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {offers.length} offre{offers.length > 1 ? 's' : ''} consultable
          {offers.length > 1 ? 's' : ''} {showingAll ? 'au total' : 'dans la zone affichée'}
        </p>

        {showingAll ? (
          <Button variant="outline" size="sm" onClick={onBackToMapArea}>
            Revenir aux offres de la zone affichée
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onShowAll}>
            Voir toutes les offres
          </Button>
        )}
      </div>

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
              {showingAll
                ? 'Retirez des filtres pour voir plus de résultats.'
                : 'Déplacez la carte, élargissez la zone, retirez des filtres, ou consultez toutes les offres.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {shown.map((offer) => (
              <OfferResultCard
                key={offer.id}
                offer={offer}
                isSelected={offer.id === selectedId}
                onSelect={() => onSelect(offer)}
              />
            ))}
          </div>

          {hasMore && (
            <Button
              variant="outline"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="self-center"
            >
              Charger plus d'offres ({offers.length - shown.length} restantes)
            </Button>
          )}
        </>
      )}
    </section>
  )
}
