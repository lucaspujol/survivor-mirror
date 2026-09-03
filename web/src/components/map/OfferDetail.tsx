import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeftIcon, BuildingIcon, CalendarClockIcon, FlagIcon, MapPinIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth'
import { daysLeft, publishedLabel, type Offer } from '@/lib/offers'

type OfferDetailProps = {
  offer: Offer
  onBack: () => void
}

export function OfferDetail({ offer, onBack }: OfferDetailProps) {
  const { user } = useAuth()
  const location = useLocation()
  const remaining = daysLeft(offer)

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onBack}>
        <ArrowLeftIcon />
        Retour à la liste
      </Button>

      <div>
        <h2 className="text-lg leading-tight font-semibold">{offer.title}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <BuildingIcon className="size-3.5" />
          {offer.company}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">
          <MapPinIcon />
          {offer.city}
        </Badge>
        <Badge variant={remaining <= 5 ? 'destructive' : 'outline'}>
          <CalendarClockIcon />
          {remaining === 0 ? 'Expirée' : `Expire dans ${remaining} j`}
        </Badge>
      </div>

      <Separator />

      <p className="text-sm leading-relaxed whitespace-pre-line">{offer.description}</p>

      {offer.address && (
        <p className="text-sm text-muted-foreground">{offer.address}</p>
      )}
      <p className="text-xs text-muted-foreground">{publishedLabel(offer.created_at)}</p>

      <div className="flex flex-col gap-2">
        {user?.role === 'seeker' || !user ? (
          user ? (
            <Button onClick={() => toast.info('Les candidatures arrivent bientôt.')}>
              Postuler
            </Button>
          ) : (
            <Button render={<Link to="/login" state={{ from: location }} />}>
              Se connecter pour postuler
            </Button>
          )
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast.info('Signalement enregistré côté interface.')}
        >
          <FlagIcon />
          Signaler cette offre
        </Button>
      </div>
    </div>
  )
}
