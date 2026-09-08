import { useRef, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SearchXIcon,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { Offer, SortKey } from '@/lib/offers'

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Plus récentes',
  oldest: 'Plus anciennes',
  city: 'Ville',
}

const PAGE_SIZE = 6
/** Numbered buttons around the current page; the rest collapse into ellipses. */
const PAGE_WINDOW = 1

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
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)

  // A new result set (map move, filter, sort) sends the reader back to page 1;
  // tracking the list it belongs to resets it during render, without an effect.
  const [pagedOffers, setPagedOffers] = useState(offers)
  if (pagedOffers !== offers) {
    setPagedOffers(offers)
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(offers.length / PAGE_SIZE))
  // Guards the render between that reset and the state catching up.
  const currentPage = Math.min(page, pageCount)

  const shown = offers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), pageCount))
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
          <div ref={listRef} className="flex flex-col gap-3 scroll-mt-4">
            {shown.map((offer) => (
              <OfferResultCard
                key={offer.id}
                offer={offer}
                isSelected={offer.id === selectedId}
                onSelect={() => onSelect(offer)}
              />
            ))}
          </div>

          {pageCount > 1 && (
            <Pagination page={currentPage} pageCount={pageCount} onChange={goToPage} />
          )}
        </>
      )}
    </section>
  )
}

/**
 * Builds the page buttons: first and last are always reachable, the pages
 * around the current one are listed, and the gaps collapse into ellipses.
 */
function pageItems(page: number, pageCount: number): (number | 'gap')[] {
  const pages = new Set([1, pageCount])
  for (let offset = -PAGE_WINDOW; offset <= PAGE_WINDOW; offset += 1) {
    const candidate = page + offset
    if (candidate >= 1 && candidate <= pageCount) pages.add(candidate)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((value, index) =>
    index > 0 && value - sorted[index - 1] > 1 ? ['gap' as const, value] : [value],
  )
}

type PaginationProps = {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

function Pagination({ page, pageCount, onChange }: PaginationProps) {
  return (
    <nav aria-label="Pagination des offres" className="mt-1 flex justify-center">
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Première page"
            disabled={page === 1}
            onClick={() => onChange(1)}
          >
            <ChevronsLeftIcon />
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Page précédente"
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
          >
            <ChevronLeftIcon />
          </Button>
        </li>

        {pageItems(page, pageCount).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onChange(item)}
                className={cn(
                  'font-medium',
                  item === page &&
                    'border-b-2 border-primary text-primary rounded-b-none hover:bg-transparent',
                )}
              >
                {item}
              </Button>
            </li>
          ),
        )}

        <li>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Page suivante"
            disabled={page === pageCount}
            onClick={() => onChange(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dernière page"
            disabled={page === pageCount}
            onClick={() => onChange(pageCount)}
          >
            <ChevronsRightIcon />
          </Button>
        </li>
      </ul>
    </nav>
  )
}
