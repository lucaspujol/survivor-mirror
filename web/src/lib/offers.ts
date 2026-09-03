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
  query: string
  city: string
  contractType: string
  /** 'all', or a number of days since publication. */
  period: string
}

export const ALL = 'all'

export function matchesFilters(offer: Offer, filters: OfferFilters): boolean {
  const needle = filters.query.trim().toLowerCase()
  const matchesText =
    !needle ||
    [offer.title, offer.company, offer.city].some((field) =>
      field.toLowerCase().includes(needle),
    )

  const matchesCity = filters.city === ALL || offer.city === filters.city
  const matchesContract =
    filters.contractType === ALL || offer.contract_type === filters.contractType
  const matchesPeriod =
    filters.period === ALL || daysSince(offer.created_at) <= Number(filters.period)

  return matchesText && matchesCity && matchesContract && matchesPeriod
}
