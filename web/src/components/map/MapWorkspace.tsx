import { useCallback, useMemo, useState } from 'react'
import { ListIcon } from 'lucide-react'
import { JobMap } from '@/components/map/JobMap'
import { MapPanel } from '@/components/map/MapPanel'
import { MapSelectedCard } from '@/components/map/MapSelectedCard'
import { MapToolbar } from '@/components/map/MapToolbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { useOffersInBounds } from '@/hooks/use-offers-in-bounds'
import { ALL, matchesFilters, type Bounds, type Offer } from '@/lib/offers'

export function MapWorkspace() {
  const { offers, isLoading, setBounds, refresh } = useOffersInBounds()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState(ALL)
  const [period, setPeriod] = useState(ALL)
  const [selected, setSelected] = useState<Offer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const visible = useMemo(
    () => offers.filter((offer) => matchesFilters(offer, { query, city, period })),
    [offers, query, city, period],
  )

  // Focusing an offer zooms in, which would otherwise refetch a viewport
  // holding just that offer and empty the list behind it.
  const handleBoundsChange = useCallback(
    (bounds: Bounds) => {
      if (!selected) setBounds(bounds)
    },
    [selected, setBounds],
  )

  const cities = useMemo(
    () => [...new Set(offers.map((offer) => offer.city))].sort((a, b) => a.localeCompare(b)),
    [offers],
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <MapToolbar
        query={query}
        onQueryChange={setQuery}
        cities={cities}
        city={city}
        onCityChange={setCity}
        period={period}
        onPeriodChange={setPeriod}
        onOfferCreated={refresh}
      />

      <div className="flex min-h-0 flex-1 gap-4">
        <aside className="hidden w-88 shrink-0 flex-col overflow-hidden rounded-xl border bg-card lg:flex">
          <div className="flex h-11 shrink-0 items-center border-b px-4 text-sm text-muted-foreground">
            {visible.length} offre{visible.length > 1 ? 's' : ''} dans la zone affichée
          </div>
          <MapPanel
            offers={visible}
            isLoading={isLoading}
            selected={selected}
            onSelect={setSelected}
            onClearSelection={() => setSelected(null)}
          />
        </aside>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border">
          <JobMap
            offers={visible}
            selected={selected}
            onSelect={setSelected}
            onBoundsChange={handleBoundsChange}
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

          {selected && (
            <MapSelectedCard offer={selected} onOpen={() => setIsSheetOpen(true)} />
          )}

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger
              render={
                <Button
                  size="sm"
                  className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 shadow-lg lg:hidden"
                >
                  <ListIcon />
                  {visible.length} offre{visible.length > 1 ? 's' : ''}
                </Button>
              }
            />
            <SheetContent side="bottom" className="h-[70svh] p-0 lg:hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>Offres de la zone</SheetTitle>
              </SheetHeader>
              <MapPanel
                offers={visible}
                isLoading={isLoading}
                selected={selected}
                onSelect={setSelected}
                onClearSelection={() => setSelected(null)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
