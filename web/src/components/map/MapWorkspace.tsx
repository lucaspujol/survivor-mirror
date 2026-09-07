import { useCallback, useMemo, useState } from 'react'
import { SlidersHorizontalIcon } from 'lucide-react'
import { FilterSidebar, type FacetKey } from '@/components/map/FilterSidebar'
import { JobMap } from '@/components/map/JobMap'
import { OfferDetail } from '@/components/map/OfferDetail'
import { OfferResults } from '@/components/map/OfferResults'
import { SearchBanner } from '@/components/map/SearchBanner'
import { CreateOfferDialog } from '@/components/offers/CreateOfferDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { useOffersInBounds } from '@/hooks/use-offers-in-bounds'
import { useAuth } from '@/lib/auth'
import {
  EMPTY_FILTERS,
  listOffers,
  matchesFilters,
  sortOffers,
  type Bounds,
  type Offer,
  type OfferFilters,
  type SortKey,
} from '@/lib/offers'

export function MapWorkspace() {
  const { user } = useAuth()
  const { offers, isLoading, setBounds, refresh } = useOffersInBounds()

  // The banner is a search form: its fields only reach the results on submit.
  const [draft, setDraft] = useState({ query: '', location: '' })
  const [filters, setFilters] = useState<OfferFilters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('recent')
  const [selected, setSelected] = useState<Offer | null>(null)
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null)

  const [showAllOffers, setShowAllOffers] = useState(false)
  const [allOffers, setAllOffers] = useState<Offer[]>([])
  const [isLoadingAll, setIsLoadingAll] = useState(false)

  const handleShowAll = useCallback(() => {
    setShowAllOffers(true)
    setIsLoadingAll(true)
    listOffers()
      .then(setAllOffers)
      .catch(() => setAllOffers([]))
      .finally(() => setIsLoadingAll(false))
  }, [])

  const handleBackToMapArea = useCallback(() => {
    setShowAllOffers(false)
  }, [])

  const sourceOffers = showAllOffers ? allOffers : offers

  const visible = useMemo(
    () => sortOffers(sourceOffers.filter((offer) => matchesFilters(offer, filters)), sort),
    [sourceOffers, filters, sort],
  )

  const keywordSuggestions = useMemo(
    () => Array.from(new Set(sourceOffers.flatMap((offer) => [offer.title, offer.company]))),
    [sourceOffers],
  )

  // Focusing an offer zooms in, which would otherwise refetch a viewport
  // holding just that offer and empty the list behind it.
  const handleBoundsChange = useCallback(
    (bounds: Bounds) => {
      if (!selected && !showAllOffers) setBounds(bounds)
    },
    [selected, showAllOffers, setBounds],
  )

  const toggleFacet = useCallback((facet: FacetKey, value: string) => {
    setFilters((current) => {
      const values = current[facet]
      return {
        ...current,
        [facet]: values.includes(value)
          ? values.filter((entry) => entry !== value)
          : [...values, value],
      }
    })
  }, [])

  // Geocodes the "zone géographique" field and flies the map there. The
  // resulting `moveend` refetches offers for that viewport through the
  // existing bounds mechanism — no separate client-side text filter needed.
  const handleSearch = useCallback(async () => {
    setFilters((current) => ({ ...current, query: draft.query }))

    const place = draft.location.trim()
    if (!place) {
      setFocusLocation(null)
      return
    }

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(place)}&limit=1`,
      )
      const data = await response.json()
      const feature = data.features?.[0]
      if (feature) {
        const [lng, lat] = feature.geometry.coordinates
        setFocusLocation({ lat, lng })
      }
    } catch {
    }
  }, [draft])

  const reset = useCallback(() => {
    setDraft({ query: '', location: '' })
    setFilters(EMPTY_FILTERS)
    setFocusLocation(null)
    setShowAllOffers(false)
  }, [])

  const sidebar = <FilterSidebar offers={offers} filters={filters} onToggle={toggleFacet} />

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6">
      <SearchBanner
        query={draft.query}
        onQueryChange={(query) => setDraft((current) => ({ ...current, query }))}
        location={draft.location}
        onLocationChange={(location) => setDraft((current) => ({ ...current, location }))}
        onSearch={handleSearch}
        onReset={reset}
        keywordSuggestions={keywordSuggestions}
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-72 shrink-0 lg:block">{sidebar}</aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontalIcon />
                    Filtres
                  </Button>
                }
              />
              <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                <SheetHeader className="sr-only">
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                {sidebar}
              </SheetContent>
            </Sheet>

            {user?.role === 'employer' && (
              <CreateOfferDialog company={user.display_name} onCreated={refresh} />
            )}
          </div>

          <div className="relative h-[26rem] overflow-hidden rounded-xl border md:h-[32rem]">
            <JobMap
              offers={visible}
              selected={selected}
              onSelect={setSelected}
              onBoundsChange={handleBoundsChange}
              focusLocation={focusLocation}
            />

            {isLoading && (
              <Badge
                variant="outline"
                className="absolute top-3 right-3 z-20 h-7 gap-1.5 bg-background/90 px-2.5 backdrop-blur"
              >
                <Spinner className="size-3" />
                Chargement
              </Badge>
            )}
          </div>

          {selected ? (
            <div className="rounded-xl border bg-card">
              <OfferDetail offer={selected} onBack={() => setSelected(null)} />
            </div>
          ) : (
            <OfferResults
              offers={visible}
              isLoading={showAllOffers ? isLoadingAll : isLoading}
              sort={sort}
              onSortChange={setSort}
              selectedId={null}
              onSelect={setSelected}
              showingAll={showAllOffers}
              onShowAll={handleShowAll}
              onBackToMapArea={handleBackToMapArea}
            />
          )}
        </div>
      </div>
    </div>
  )
}
