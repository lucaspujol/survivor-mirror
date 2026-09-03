import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ALL } from '@/lib/offers'

type MapFiltersProps = {
  cities: string[]
  city: string
  onCityChange: (city: string) => void
  period: string
  onPeriodChange: (period: string) => void
}

export function MapFilters({
  cities,
  city,
  onCityChange,
  period,
  onPeriodChange,
}: MapFiltersProps) {
  return (
    <>
      <Select value={city} onValueChange={(value) => onCityChange(String(value))}>
        <SelectTrigger className="h-9 min-w-40" aria-label="Filtrer par ville">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes les villes</SelectItem>
          {cities.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={(value) => onPeriodChange(String(value))}>
        <SelectTrigger className="h-9 min-w-44" aria-label="Filtrer par date de publication">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes les dates</SelectItem>
          <SelectItem value="1">Publiées aujourd'hui</SelectItem>
          <SelectItem value="7">7 derniers jours</SelectItem>
          <SelectItem value="30">30 derniers jours</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}
