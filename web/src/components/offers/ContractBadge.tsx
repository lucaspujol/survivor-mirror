import { BriefcaseIcon } from 'lucide-react'
import { CONTRACT_TYPES } from '@/components/contractTypes'
import { Badge } from '@/components/ui/badge'

export function contractLabel(type: string, duration: string | null): string {
  const label = CONTRACT_TYPES.find((option) => option.value === type)?.label ?? type
  return duration ? `${label} · ${duration}` : label
}

export function ContractBadge({
  type,
  duration,
}: {
  type: string
  duration: string | null
}) {
  return (
    <Badge variant="secondary">
      <BriefcaseIcon />
      {contractLabel(type, duration)}
    </Badge>
  )
}
