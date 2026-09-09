import { useEffect, useState } from 'react'
import { UsersIcon } from 'lucide-react'
import { ApplicantCard } from '@/components/applications/ApplicantCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { ApiError, api } from '@/lib/api'
import type { Applicant } from '@/lib/applications'
import type { MyOffer } from '@/lib/my-offers'

type OfferApplicantsDialogProps = {
  offer: MyOffer
}

/** The candidates of one offer. Loaded when the dialog opens: the offers list
 * only carries how many there are. */
export function OfferApplicantsDialog({ offer }: OfferApplicantsDialogProps) {
  const [open, setOpen] = useState(false)
  const [applicants, setApplicants] = useState<Applicant[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setError('')
    api<Applicant[]>(`/api/mes-offres/${offer.id}/candidatures`)
      .then((data) => {
        if (!cancelled) setApplicants(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.message
            : 'La liste des candidats est indisponible.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [open, offer.id])

  const count = offer.application_count

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={count === 0}>
            <UsersIcon />
            {count === 0
              ? 'Aucune candidature'
              : `Voir ${count} candidature${count > 1 ? 's' : ''}`}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Candidatures reçues</DialogTitle>
          <DialogDescription>{offer.title}</DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!applicants && !error && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Chargement…
          </p>
        )}

        {applicants &&
          (applicants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Personne n'a encore postulé à cette offre.
            </p>
          ) : (
            <ul className="flex max-h-[65vh] flex-col gap-3 overflow-y-auto">
              {applicants.map((applicant) => (
                <li key={applicant.id}>
                  <ApplicantCard
                    applicant={applicant}
                    onStatusChanged={(updated) =>
                      setApplicants((current) =>
                        (current ?? []).map((entry) =>
                          entry.id === updated.id ? updated : entry,
                        ),
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          ))}
      </DialogContent>
    </Dialog>
  )
}
