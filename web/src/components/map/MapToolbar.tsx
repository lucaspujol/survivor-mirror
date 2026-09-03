import { SearchIcon } from 'lucide-react'
import { MapFilters } from '@/components/map/MapFilters'
import { CreateOfferDialog } from '@/components/offers/CreateOfferDialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

type MapToolbarProps = {
  query: string
  onQueryChange: (query: string) => void
  cities: string[]
  city: string
  onCityChange: (city: string) => void
  period: string
  onPeriodChange: (period: string) => void
  onOfferCreated: () => void
}

/** Search and filters, spanning the full width above the list and the map. */
export function MapToolbar({
  query,
  onQueryChange,
  cities,
  city,
  onCityChange,
  period,
  onPeriodChange,
  onOfferCreated,
}: MapToolbarProps) {
  const { user } = useAuth()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Poste, entreprise, ville…"
          aria-label="Rechercher une offre"
          className="h-9 pl-9"
        />
      </div>

      <MapFilters
        cities={cities}
        city={city}
        onCityChange={onCityChange}
        period={period}
        onPeriodChange={onPeriodChange}
      />

      {user?.role === 'employer' && (
        <CreateOfferDialog company={user.display_name} onCreated={onOfferCreated} />
      )}
    </div>
  )
}
