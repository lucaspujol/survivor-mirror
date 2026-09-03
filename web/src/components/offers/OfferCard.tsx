import { CalendarClockIcon, MapPinIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { daysLeft, publishedLabel, type Offer } from '@/lib/offers'

export function OfferCard({ offer }: { offer: Offer }) {
  const remaining = daysLeft(offer)

  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-base">{offer.title}</CardTitle>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant="secondary">
            <MapPinIcon />
            {offer.city}
          </Badge>
          <Badge variant={remaining <= 5 ? 'destructive' : 'outline'}>
            <CalendarClockIcon />
            {remaining === 0 ? 'Expirée' : `Expire dans ${remaining} j`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">{offer.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {publishedLabel(offer.created_at)}
        </p>
      </CardContent>
    </Card>
  )
}
