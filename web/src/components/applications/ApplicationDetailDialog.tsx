import { useEffect, useState } from 'react'
import { DocumentList } from '@/components/applications/DocumentList'
import { ContractBadge } from '@/components/offers/ContractBadge'
import { WORK_MODES } from '@/components/workModes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import { ApiError, api } from '@/lib/api'
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  type Application,
  type ApplicationDetail,
} from '@/lib/applications'

type ApplicationDetailDialogProps = {
  application: Application
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  )
}

/**
 * Everything one application holds: the details as they were sent, and the
 * documents. Fetched when the dialog opens rather than with the list, so the
 * screen stays one request.
 */
export function ApplicationDetailDialog({ application }: ApplicationDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<ApplicationDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false

    setError('')
    api<ApplicationDetail>(`/api/candidatures/${application.id}`)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.message
            : 'Le détail de la candidature est indisponible.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [open, application.id])

  const workModeLabel = detail
    ? (WORK_MODES.find((mode) => mode.value === detail.work_mode)?.label ?? detail.work_mode)
    : ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Voir le détail
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{application.job_title}</DialogTitle>
          <DialogDescription>
            {application.company} — {application.city}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {!detail && !error && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Chargement…
          </p>
        )}

        {detail && (
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[detail.status]}`}
              >
                {STATUS_LABELS[detail.status]}
              </span>
              <ContractBadge type={detail.contract_type} duration={null} />
              <Badge variant="secondary">{workModeLabel}</Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Envoyée le {formatDate(detail.created_at)}
              {detail.updated_at !== detail.created_at &&
                ` · mise à jour le ${formatDate(detail.updated_at)}`}
            </p>

            <Separator />

            <Section title="Vos coordonnées">
              <p className="text-sm">
                {detail.first_name} {detail.last_name}
              </p>
              {detail.phone && <p className="text-sm">{detail.phone}</p>}
            </Section>

            <Section title="Documents envoyés">
              <DocumentList applicationId={detail.id} documents={detail.documents} />
            </Section>

            {detail.message && (
              <Section title="Votre message">
                <p className="text-sm whitespace-pre-line">{detail.message}</p>
              </Section>
            )}

            <Separator />

            <Section title="L'offre">
              <p className="text-sm whitespace-pre-line">{detail.job_description}</p>
              {detail.address && (
                <p className="text-sm text-muted-foreground">{detail.address}</p>
              )}
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
