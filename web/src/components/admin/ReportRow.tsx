import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import {
  REPORT_STATUS_LABELS,
  reasonLabel,
  updateReportStatus,
  type Report,
} from '@/lib/reports'

type ReportRowProps = {
  report: Report
  onUpdated: (report: Report) => void
  /** Deleting the offer removes every report attached to it. */
  onOfferDeleted: () => void
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function ReportRow({ report, onUpdated, onOfferDeleted }: ReportRowProps) {
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action: () => Promise<void>) {
    setIsBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">{report.job_title}</CardTitle>
        <CardAction>
          <Badge variant={report.status === 'pending' ? 'destructive' : 'outline'}>
            {REPORT_STATUS_LABELS[report.status] ?? report.status}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{reasonLabel(report.reason)}</Badge>
          <Badge variant="outline">{report.company}</Badge>
        </div>

        {report.details && <p className="text-sm whitespace-pre-line">{report.details}</p>}

        <p className="text-xs text-muted-foreground">
          Signalée par {report.reporter_email} le {dateFormat.format(new Date(report.created_at))}
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {report.status === 'pending' && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={isBusy}
              onClick={() =>
                run(async () => {
                  // An admin may delete any offer; the reports cascade with it.
                  await api<void>(`/api/offres/${report.job_id}`, { method: 'DELETE' })
                  onOfferDeleted()
                })
              }
            >
              Supprimer l'offre
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => run(async () => onUpdated(await updateReportStatus(report.id, 'reviewed')))}
            >
              Marquer traité
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={() => run(async () => onUpdated(await updateReportStatus(report.id, 'dismissed')))}
            >
              Non fondé
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
