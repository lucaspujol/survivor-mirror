import { api } from '@/lib/api'

export type Offer = {
  id: number
  title: string
  company: string
  employer_id: number
  description: string
  contract_type: string
  contract_duration: string | null
  city: string
  address: string | null
  created_at: string
  lat: number
  lng: number
}

export type Bounds = {
  south: number
  west: number
  north: number
  east: number
}

/** Brief: an offer is archived 30 days after publication. */
export const OFFER_LIFETIME_DAYS = 30

export function listOffers(bounds?: Bounds): Promise<Offer[]> {
  const query = bounds
    ? `?${new URLSearchParams({
        south: String(bounds.south),
        west: String(bounds.west),
        north: String(bounds.north),
        east: String(bounds.east),
      })}`
    : ''
  return api<Offer[]>(`/api/offres${query}`)
}

export function daysSince(iso: string): number {
  const elapsed = Date.now() - new Date(iso).getTime()
  return Math.floor(elapsed / 86_400_000)
}

export function daysLeft(offer: { created_at: string }): number {
  return Math.max(0, OFFER_LIFETIME_DAYS - daysSince(offer.created_at))
}

export function publishedLabel(iso: string): string {
  const days = daysSince(iso)
  if (days <= 0) return "Publiée aujourd'hui"
  if (days === 1) return 'Publiée hier'
  return `Publiée il y a ${days} jours`
}

export type OfferFilters = {
  /** Free text matched against the title, the company and the description. */
  query: string
  /** Free text matched against the city and the address. */
  location: string
  /** Selected contract types; empty means no restriction. */
  contractTypes: string[]
  /** Selected windows, in days since publication; empty means no restriction. */
  periods: string[]
}

export const EMPTY_FILTERS: OfferFilters = {
  query: '',
  location: '',
  contractTypes: [],
  periods: [],
}

export const PERIODS = [
  { value: '1', label: "Publiées aujourd'hui" },
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
]

function matchesQuery(offer: Offer, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [offer.title, offer.company, offer.description].some((field) =>
    field.toLowerCase().includes(needle),
  )
}

function matchesLocation(offer: Offer, location: string): boolean {
  const needle = location.trim().toLowerCase()
  if (!needle) return true
  return [offer.city, offer.address ?? ''].some((field) =>
    field.toLowerCase().includes(needle),
  )
}

function matchesPeriods(offer: Offer, periods: string[]): boolean {
  if (periods.length === 0) return true
  return periods.some((days) => daysSince(offer.created_at) <= Number(days))
}

export function matchesFilters(offer: Offer, filters: OfferFilters): boolean {
  return (
    matchesQuery(offer, filters.query) &&
    matchesLocation(offer, filters.location) &&
    (filters.contractTypes.length === 0 ||
      filters.contractTypes.includes(offer.contract_type)) &&
    matchesPeriods(offer, filters.periods)
  )
}

/**
 * Offers left once every filter *except* `facet` is applied. Counting against
 * that subset is what keeps a facet's numbers meaningful: they say how many
 * results ticking the box would add, instead of collapsing to zero as soon as
 * a sibling box in the same section is ticked.
 */
export function facetPool(
  offers: Offer[],
  filters: OfferFilters,
  facet: keyof OfferFilters,
): Offer[] {
  const relaxed = { ...filters, [facet]: EMPTY_FILTERS[facet] }
  return offers.filter((offer) => matchesFilters(offer, relaxed))
}

export type SortKey = 'recent' | 'oldest' | 'city'

export function sortOffers(offers: Offer[], sort: SortKey): Offer[] {
  const byDate = (offer: Offer) => new Date(offer.created_at).getTime()
  return [...offers].sort((a, b) => {
    if (sort === 'city') return a.city.localeCompare(b.city)
    return sort === 'oldest' ? byDate(a) - byDate(b) : byDate(b) - byDate(a)
  })
}
