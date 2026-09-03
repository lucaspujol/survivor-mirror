import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiResource } from '@/hooks/use-api-resource'

type Application = {
  id: number
  job_id: number
  job_title: string
  company: string
  city: string
  status: 'sent' | 'under_review' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

const statusLabels: Record<Application['status'], string> = {
  sent: 'Envoyée',
  under_review: "En cours d'examen",
  accepted: 'Acceptée',
  rejected: 'Refusée',
}

const statusStyles: Record<Application['status'], string> = {
  sent: 'bg-muted text-muted-foreground',
  under_review: 'bg-amber-100 text-amber-900',
  accepted: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-destructive/10 text-destructive',
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function formatDate(iso: string) {
  return dateFormat.format(new Date(iso))
}

export function ApplicationsPage() {
  const { status, data, error } = useApiResource<Application[]>('/api/candidatures')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Mes candidatures</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Suivi des offres auxquelles vous avez postulé.
        </p>
      </div>

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
                        <span>{application.job_title}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[application.status]}`}
                        >
                          {statusLabels[application.status]}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <p>
                        {application.company} — {application.city}
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
  )
}
