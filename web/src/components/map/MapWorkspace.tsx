import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SlidersHorizontalIcon } from 'lucide-react'
import { FilterSidebar, type FacetKey } from '@/components/map/FilterSidebar'
import { JobMap } from '@/components/map/JobMap'
import { OfferDetail } from '@/components/map/OfferDetail'
import { OfferResults } from '@/components/map/OfferResults'
import { SearchBanner } from '@/components/map/SearchBanner'
import { CreateOfferDialog } from '@/components/offers/CreateOfferDialog'
import { SkipLink } from '@/components/SkipLink'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { useOffersInBounds } from '@/hooks/use-offers-in-bounds'
import { useAuth } from '@/lib/auth'
import {
  EMPTY_FILTERS,
  getOffer,
  listOffers,
  matchesFilters,
  sortOffers,
  type Bounds,
  type Offer,
  type OfferFilters,
  type SortKey,
} from '@/lib/offers'

/** Frames to wait for a pin to come back: the fly-back runs 0.6s (~40 frames). */
const MAX_FOCUS_FRAMES = 60

export function MapWorkspace() {
  const { user } = useAuth()
  const { offers, isLoading, setBounds, refresh } = useOffersInBounds()

  // The banner is a search form: its fields only reach the results on submit.
  const [draft, setDraft] = useState({ query: '', location: '' })
  const [filters, setFilters] = useState<OfferFilters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('recent')
  const [selected, setSelected] = useState<Offer | null>(null)
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const detailRef = useRef<HTMLDivElement>(null)
  const mapFocusRef = useRef<{ focusMarker: (id: number) => boolean } | null>(null)
  // Where the open offer was picked from, so closing it can return the focus
  // to the pin or the card the reader actually left.
  const originRef = useRef<{ id: number; from: 'map' | 'list' } | null>(null)

  const selectFrom = useCallback((offer: Offer, from: 'map' | 'list') => {
    originRef.current = { id: offer.id, from }
    setSelected(offer)
  }, [])

  // Selecting an offer swaps the list for the detail panel further down the
  // page: without moving focus, a keyboard user stays stranded on the pin.
  useEffect(() => {
    if (selected) detailRef.current?.focus({ preventScroll: true })
  }, [selected])

  const handleBack = useCallback(() => {
    const origin = originRef.current
    originRef.current = null
    setSelected(null)

    if (!origin) return

    // Closing the panel flies the map back, and Leaflet only re-attaches the
    // pins once that settles. So a marker origin waits for its pin across the
    // animation instead of taking the result card that is ready immediately;
    // the card stays the fallback for a pin that never returns (clustered
    // away, or panned out of view).
    let attempts = 0
    const restore = () => {
      if (origin.from === 'map') {
        if (mapFocusRef.current?.focusMarker(origin.id)) return
        if (attempts++ < MAX_FOCUS_FRAMES) {
          requestAnimationFrame(restore)
          return
        }
      }

      const card = document.querySelector<HTMLElement>(`[data-offer-id="${origin.id}"]`)
      if (card) {
        card.focus({ preventScroll: true })
        return
      }

      if (attempts++ < MAX_FOCUS_FRAMES) requestAnimationFrame(restore)
    }
    requestAnimationFrame(restore)
  }, [])

  // Deep link support: "/?offre=19" opens that offer directly, flown to on
  // the map, instead of requiring the person to find it themselves. Used by
  // the admin user-account page to jump straight from a job to its pin.
  useEffect(() => {
    const offerId = searchParams.get('offre')
    if (!offerId) return

    getOffer(Number(offerId))
      .then((offer) => {
        setSelected(offer)
        if (offer.lat != null && offer.lng != null) {
          setFocusLocation({ lat: offer.lat, lng: offer.lng })
        }
      })
      .catch(() => {
        // Deleted or invalid id in the URL: fail silently, stay on the map.
      })
      .finally(() => {
        // Drop the param once consumed, so reloading the page later doesn't
        // keep re-fetching and re-flying to the same offer forever.
        setSearchParams(
          (params) => {
            params.delete('offre')
            return params
          },
          { replace: true },
        )
      })
    // Deliberately runs once on mount only: it depends on the URL param as it
    // was on first load, not on searchParams after we clear it above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // "All offers" ignores the map's current viewport: a separate, on-demand
  // fetch, rather than mixing it with the bounds-based fetch that otherwise
  // follows every map movement.
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

  // Titles and companies already loaded, as the basis for keyword search
  // suggestions — no separate network call needed.
  const keywordSuggestions = useMemo(
    () => Array.from(new Set(sourceOffers.flatMap((offer) => [offer.title, offer.company]))),
    [sourceOffers],
  )

  // Focusing an offer zooms in, which would otherwise refetch a viewport
  // holding just that offer and empty the list behind it. Same idea for
  // "all offers" mode: no point refetching by area while looking at
  // everything, at the risk of losing that mode on the first map movement.
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
      // Address not found: leave the last valid recentring in place rather
      // than moving the map on a silent failure.
    } catch {
      // Network failure / Adresse API unavailable: same, no recentring.
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6">
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
        <aside className="hidden w-72 shrink-0 lg:block">
          <SkipLink targetId="offer-results">Passer la zone des filtres</SkipLink>
          {sidebar}
        </aside>

        <div id="offer-results" tabIndex={-1} className="flex min-w-0 flex-1 flex-col gap-4 outline-none">
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

          {/* Leaflet puts every marker in the tab order, so without this the
              keyboard crosses the whole map before reaching the results. */}
          <SkipLink targetId="offer-list">Passer la carte</SkipLink>

          <div className="relative h-[26rem] overflow-hidden rounded-xl border md:h-[32rem]">
            <JobMap
              offers={visible}
              selected={selected}
              onSelect={(offer) => selectFrom(offer, 'map')}
              focusRef={mapFocusRef}
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

          <div id="offer-list" tabIndex={-1} className="outline-none">
            {selected ? (
              // `key` forces a fresh OfferDetail (and everything inside it,
              // including ReportOfferDialog) whenever the offer changes —
              // without it, local state like "already reported" leaks from
              // one offer to the next since React just updates props on the
              // same instance instead of remounting it.
              <div
                key={selected.id}
                ref={detailRef}
                tabIndex={-1}
                className="rounded-xl border bg-card outline-none"
              >
                <OfferDetail offer={selected} onBack={handleBack} />
              </div>
            ) : (
              <OfferResults
                offers={visible}
                isLoading={showAllOffers ? isLoadingAll : isLoading}
                sort={sort}
                onSortChange={setSort}
                selectedId={null}
                onSelect={(offer) => selectFrom(offer, 'list')}
                showingAll={showAllOffers}
                onShowAll={handleShowAll}
                onBackToMapArea={handleBackToMapArea}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
