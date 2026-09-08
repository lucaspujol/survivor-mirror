import { Link } from 'react-router'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { PageShell } from '@/components/layout/PageShell'
import { REPORT_REASONS } from '@/components/reportReasons'
import { useApiResource } from '@/hooks/use-api-resource'

type Report = {
  id: number
  job_id: number
  job_title: string
  reason: string
  comment: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  reporter_email: string
  created_at: string
}

const statusLabels: Record<Report['status'], string> = {
  pending: 'À traiter',
  reviewed: 'Examiné',
  dismissed: 'Classé sans suite',
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

function reasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value
}

export function AdminReportsPage() {
  const { status, data, error } = useApiResource<Report[]>('/api/admin/signalements')

  return (
    <PageShell
      title="Signalements"
      description="Offres signalées par les utilisateurs, en attente de modération. Sélectionnez une ligne pour voir l'offre complète et agir."
    >
      <div className="flex flex-col gap-4">
        {status === 'loading' && <PageLoading rows={4} />}
        {status === 'error' && <PageError message={error} />}

        {status === 'ready' &&
          (data.length === 0 ? (
            <PageEmpty title="Aucun signalement pour le moment." />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {data.length} signalement{data.length > 1 ? 's' : ''}
              </p>
              <div
                className="overflow-x-auto rounded-md border"
                tabIndex={0}
                role="region"
                aria-label="Tableau des signalements, défilement horizontal si nécessaire"
              >
                <table className="w-full min-w-[52rem] border-collapse text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Offre</th>
                      <th scope="col" className="px-3 py-2 font-medium">Motif</th>
                      <th scope="col" className="px-3 py-2 font-medium">Commentaire</th>
                      <th scope="col" className="px-3 py-2 font-medium">Signalé par</th>
                      <th scope="col" className="px-3 py-2 font-medium">Statut</th>
                      <th scope="col" className="px-3 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((report) => (
                      <tr key={report.id} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          <Link
                            to={`/admin/signalements/${report.job_id}`}
                            className="underline underline-offset-4 hover:text-primary"
                          >
                            {report.job_title}
                          </Link>
                        </td>
                        <td className="px-3 py-2">{reasonLabel(report.reason)}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {report.comment ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {report.reporter_email}
                        </td>
                        <td className="px-3 py-2">{statusLabels[report.status]}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {dateFormat.format(new Date(report.created_at))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ))}
      </div>
    </PageShell>
  )
}
