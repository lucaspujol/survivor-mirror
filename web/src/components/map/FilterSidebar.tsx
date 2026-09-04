import { FilterOption } from '@/components/map/FilterOption'
import { FilterSection } from '@/components/map/FilterSection'
import { CONTRACT_TYPES } from '@/components/contractTypes'
import { daysSince, facetPool, PERIODS, type Offer, type OfferFilters } from '@/lib/offers'

export type FacetKey = 'contractTypes' | 'periods'

type FilterSidebarProps = {
  offers: Offer[]
  filters: OfferFilters
  onToggle: (facet: FacetKey, value: string) => void
}

export function FilterSidebar({ offers, filters, onToggle }: FilterSidebarProps) {
  const byContract = facetPool(offers, filters, 'contractTypes')
  const byPeriod = facetPool(offers, filters, 'periods')

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold tracking-tight">Filtres</h2>

      <FilterSection title="Type de contrat">
        {CONTRACT_TYPES.map((option) => (
          <FilterOption
            key={option.value}
            label={option.label}
            count={byContract.filter((offer) => offer.contract_type === option.value).length}
            checked={filters.contractTypes.includes(option.value)}
            onToggle={() => onToggle('contractTypes', option.value)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Date de publication">
        {PERIODS.map((option) => (
          <FilterOption
            key={option.value}
            label={option.label}
            count={
              byPeriod.filter((offer) => daysSince(offer.created_at) <= Number(option.value))
                .length
            }
            checked={filters.periods.includes(option.value)}
            onToggle={() => onToggle('periods', option.value)}
          />
        ))}
      </FilterSection>
    </div>
  )
}
