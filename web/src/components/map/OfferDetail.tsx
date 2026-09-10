import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarClockIcon,
  CheckIcon,
  MapPinIcon,
} from 'lucide-react'
import { ApplyDialog } from '@/components/applications/ApplyDialog'
import { ContractBadge } from '@/components/offers/ContractBadge'
import { ReportOfferDialog } from '@/components/offers/ReportOfferDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import type { Application } from '@/lib/applications'
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

  // Whether this seeker already applied. The API refuses a second application
  // anyway, but a button that is going to fail is worse than the plain
  // statement that the application is already in.
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    if (user?.role !== 'seeker') return
    let cancelled = false

    api<Application[]>('/api/candidatures')
      .then((applications) => {
        if (!cancelled) {
          setApplied(applications.some((application) => application.job_id === offer.id))
        }
      })
      // A failed check just leaves the button available: the API stays the
      // authority on the duplicate.
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [user?.role, offer.id])

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
        <ContractBadge type={offer.contract_type} duration={offer.contract_duration} />
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
        {!user && (
          <Button render={<Link to="/login" state={{ from: location }} />}>
            Se connecter pour postuler
          </Button>
        )}
        {user?.role === 'seeker' &&
          (applied ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckIcon className="size-4" />
              Vous avez déjà postulé à cette offre.
            </p>
          ) : (
            <ApplyDialog
              jobId={offer.id}
              jobTitle={offer.title}
              company={offer.company}
              onApplied={() => setApplied(true)}
            />
          ))}

        {/* Reporting stays open to any signed-in account, seeker or
            employer - not tied to the applicant-specific block above. */}
        {user ? (
          <ReportOfferDialog offerId={offer.id} />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/login" state={{ from: location }} />}
          >
            Se connecter pour signaler
          </Button>
        )}
      </div>
    </div>
  )
}
