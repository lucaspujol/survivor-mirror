import { useEffect, useState } from 'react'
import { ShieldCheckIcon } from 'lucide-react'
import { PageError, PageLoading } from '@/components/PageState'
import { PageShell } from '@/components/layout/PageShell'
import { ReportRow } from '@/components/admin/ReportRow'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useApiResource } from '@/hooks/use-api-resource'
import type { Report } from '@/lib/reports'

export function AdminReportsPage() {
  const { status, data, error } = useApiResource<Report[]>('/api/admin/signalements')
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    if (status === 'ready') setReports(data)
  }, [status, data])

  const pending = reports.filter((report) => report.status === 'pending')

  return (
    <PageShell
      title="Modération"
      description="Les offres signalées par les utilisateurs."
    >
      <div className="flex flex-col gap-4">
        {status === 'loading' && <PageLoading />}
        {status === 'error' && <PageError message={error} />}

        {status === 'ready' &&
          (reports.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheckIcon />
                </EmptyMedia>
                <EmptyTitle>Aucun signalement</EmptyTitle>
                <EmptyDescription>
                  Les offres signalées comme frauduleuses ou non conformes arriveront ici.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {pending.length} signalement{pending.length > 1 ? 's' : ''} à traiter sur{' '}
                {reports.length}
              </p>
              <ul className="flex flex-col gap-3">
                {reports.map((report) => (
                  <li key={report.id}>
                    <ReportRow
                      report={report}
                      onUpdated={(updated) =>
                        setReports((current) =>
                          current.map((entry) => (entry.id === updated.id ? updated : entry)),
                        )
                      }
                      onOfferDeleted={() =>
                        setReports((current) =>
                          current.filter((entry) => entry.job_id !== report.job_id),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            </>
          ))}
      </div>
    </PageShell>
  )
}
