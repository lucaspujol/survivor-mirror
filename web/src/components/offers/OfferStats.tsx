import { daysLeft, type Offer } from '@/lib/offers'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function OfferStats({ offers }: { offers: Offer[] }) {
  const expiringSoon = offers.filter((offer) => daysLeft(offer) <= 7).length
  const cities = new Set(offers.map((offer) => offer.city)).size

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat label="Offres en ligne" value={offers.length} />
      <Stat label="Expirent sous 7 jours" value={expiringSoon} />
      <Stat label="Villes couvertes" value={cities} />
    </div>
  )
}
