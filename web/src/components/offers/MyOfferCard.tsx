import {
  CalendarClockIcon,
  ClockIcon,
  LaptopIcon,
  MapPinIcon,
  UsersIcon,
} from 'lucide-react'
import { OfferApplicantsDialog } from '@/components/applications/OfferApplicantsDialog'
import { ContractBadge } from '@/components/offers/ContractBadge'
import { DeleteOfferDialog } from '@/components/offers/DeleteOfferDialog'
import { EditOfferDialog } from '@/components/offers/EditOfferDialog'
import { TIME_COMMITMENTS } from '@/components/timeCommitments'
import { WORK_MODES } from '@/components/workModes'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { daysLeft, publishedLabel } from '@/lib/offers'
import { LOCATION_STATUS_LABELS, type MyOffer } from '@/lib/my-offers'

type MyOfferCardProps = {
  offer: MyOffer
  onSaved: (offer: MyOffer) => void
  onDeleted: () => void
}

function labelOf(options: { value: string; label: string }[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

export function MyOfferCard({ offer, onSaved, onDeleted }: MyOfferCardProps) {
  const remaining = daysLeft(offer)
  const isRemote = offer.work_mode === 'remote'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">{offer.title}</CardTitle>
        <CardAction className="flex flex-wrap gap-2">
          <OfferApplicantsDialog offer={offer} />
          <EditOfferDialog offer={offer} onSaved={onSaved} />
          <DeleteOfferDialog offer={offer} onDeleted={onDeleted} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <ContractBadge type={offer.contract_type} duration={offer.contract_duration} />
          {!isRemote && (
            <Badge variant="secondary">
              <MapPinIcon />
              {offer.address ?? offer.city}
            </Badge>
          )}
          <Badge variant="secondary">
            <LaptopIcon />
            {labelOf(WORK_MODES, offer.work_mode)}
          </Badge>
          <Badge variant="secondary">
            <ClockIcon />
            {labelOf(TIME_COMMITMENTS, offer.time_commitment)}
          </Badge>
          {!isRemote && (
            <Badge variant={offer.location_status === 'to_verify' ? 'destructive' : 'outline'}>
              {LOCATION_STATUS_LABELS[offer.location_status]}
            </Badge>
          )}
          <Badge variant="outline">
            <UsersIcon />
            {offer.application_count} candidature{offer.application_count > 1 ? 's' : ''}
          </Badge>
          <Badge variant={remaining <= 5 ? 'destructive' : 'outline'}>
            <CalendarClockIcon />
            {remaining === 0 ? 'Expirée' : `Expire dans ${remaining} j`}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm">{offer.description}</p>
        <p className="text-xs text-muted-foreground">{publishedLabel(offer.created_at)}</p>
      </CardContent>
    </Card>
  )
}
