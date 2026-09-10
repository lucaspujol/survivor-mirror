import { Link } from 'react-router'
import { ApplicationDetailDialog } from '@/components/applications/ApplicationDetailDialog'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageShell } from '@/components/layout/PageShell'
import { useApiResource } from '@/hooks/use-api-resource'
import {
  STATUS_LABELS,
  STATUS_STYLES,
  formatDate,
  type Application,
} from '@/lib/applications'

export function ApplicationsPage() {
  const { status, data, error } = useApiResource<Application[]>('/api/candidatures')

  return (
    <PageShell
      title="Mes candidatures"
      description="Suivi des offres auxquelles vous avez postulé."
    >
      <div className="flex flex-col gap-4">
      {status === 'loading' && <PageLoading />}
      {status === 'error' && <PageError message={error} />}

      {status === 'ready' &&
        (data.length === 0 ? (
          <PageEmpty
            title="Aucune candidature pour le moment."
            hint="Les offres auxquelles vous postulez depuis la carte apparaîtront ici."
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {data.length} candidature{data.length > 1 ? 's' : ''}
            </p>
            <ul className="flex flex-col gap-3">
              {data.map((application) => (
                <li key={application.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Link to={`/?offre=${application.job_id}`} className="hover:underline">
                          {application.job_title}
                        </Link>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[application.status]}`}
                        >
                          {STATUS_LABELS[application.status]}
                        </span>
                      </CardTitle>
                      <CardAction>
                        <ApplicationDetailDialog application={application} />
                      </CardAction>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>
                        {application.company} - {application.city}
                      </p>
                      <p className="mt-1">
                        Envoyée le {formatDate(application.created_at)}
                        {application.updated_at !== application.created_at &&
                          ` · mise à jour le ${formatDate(application.updated_at)}`}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        ))}
      </div>
    </PageShell>
  )
}
