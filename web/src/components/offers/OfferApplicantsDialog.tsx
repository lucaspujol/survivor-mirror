import { useEffect, useState } from 'react'
import { UsersIcon } from 'lucide-react'
import { ApplicantCard } from '@/components/offers/ApplicantCard'
import { PageError, PageLoading } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  listOfferApplications,
  type ApplicationStatus,
  type EmployerApplication,
} from '@/lib/applications'

type OfferApplicantsDialogProps = {
  offerId: number
  offerTitle: string
  applicationCount: number
}

/**
 * Brief: the employer receives and handles applications (sorting, status,
 * contact). Loaded on open so the offers list stays one request.
 */
export function OfferApplicantsDialog({
  offerId,
  offerTitle,
  applicationCount,
}: OfferApplicantsDialogProps) {
  const [open, setOpen] = useState(false)
  const [applications, setApplications] = useState<EmployerApplication[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setApplications(null)
    setError('')
    listOfferApplications(offerId)
      .then((rows) => {
        if (!cancelled) setApplications(rows)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Chargement impossible.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, offerId])

  function handleStatusChange(id: number, status: ApplicationStatus) {
    setApplications((current) =>
      current?.map((entry) => (entry.id === id ? { ...entry, status } : entry)) ?? null,
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={applicationCount === 0}>
            <UsersIcon />
            {applicationCount} candidature{applicationCount > 1 ? 's' : ''}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Candidatures — {offerTitle}</DialogTitle>
          <DialogDescription>
            Le profil professionnel de chaque candidat vous est transmis avec sa candidature.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          {error && <PageError message={error} />}
          {!error && applications === null && <PageLoading rows={2} />}
          {applications?.map((application) => (
            <ApplicantCard
              key={application.id}
              application={application}
              onStatusChange={(status) => handleStatusChange(application.id, status)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
