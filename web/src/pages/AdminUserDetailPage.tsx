import { Link, useParams } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { PageShell } from '@/components/layout/PageShell'
import { WORK_MODES } from '@/components/workModes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiResource } from '@/hooks/use-api-resource'

type UserJob = {
  id: number
  title: string
  city: string
  work_mode: string
  application_count: number
  created_at: string
}

type UserApplication = {
  id: number
  job_id: number
  job_title: string
  company: string
  city: string
  status: string
  created_at: string
}

type UserDetail = {
  id: number
  email: string
  role: 'seeker' | 'employer' | 'admin'
  display_name: string
  created_at: string
  activity_verified: boolean | null
  jobs: UserJob[]
  applications: UserApplication[]
}

const roleLabels: Record<UserDetail['role'], string> = {
  seeker: 'Candidat',
  employer: 'Employeur',
  admin: 'Administrateur',
}

const applicationStatusLabels: Record<string, string> = {
  sent: 'Envoyée',
  under_review: "En cours d'examen",
  accepted: 'Acceptée',
  rejected: 'Refusée',
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { status, data, error } = useApiResource<UserDetail>(`/api/admin/utilisateurs/${userId}`)

  return (
    <PageShell
      title="Compte utilisateur"
      description="Informations complètes, offres publiées ou candidatures envoyées."
      actions={
        <Button variant="ghost" size="sm" render={<Link to="/admin/utilisateurs" />}>
          <ArrowLeftIcon />
          Retour aux utilisateurs
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {status === 'loading' && <PageLoading />}
        {status === 'error' && <PageError message={error} />}

        {status === 'ready' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{data.display_name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{roleLabels[data.role]}</Badge>
                  {data.activity_verified !== null && (
                    <Badge variant={data.activity_verified ? 'outline' : 'destructive'}>
                      {data.activity_verified ? 'Activité vérifiée' : 'Activité à vérifier'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{data.email}</p>
                <p className="text-xs text-muted-foreground">
                  Inscrit le {dateFormat.format(new Date(data.created_at))}
                </p>
              </CardContent>
            </Card>

            {data.role === 'employer' && (
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Offres publiées ({data.jobs.length})
                </h2>
                {data.jobs.length === 0 ? (
                  <PageEmpty title="Aucune offre publiée." />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {data.jobs.map((job) => (
                      <li key={job.id}>
                        <Link to={`/admin/signalements/${job.id}`}>
                          <Card className="transition-colors hover:border-primary/40">
                            <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6">
                              <div>
                                <p className="font-medium text-primary">{job.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {labelOf(WORK_MODES, job.work_mode)} · {job.city}
                                </p>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                <p>
                                  {job.application_count} candidature
                                  {job.application_count > 1 ? 's' : ''}
                                </p>
                                <p>{dateFormat.format(new Date(job.created_at))}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {data.role === 'seeker' && (
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Candidatures envoyées ({data.applications.length})
                </h2>
                {data.applications.length === 0 ? (
                  <PageEmpty title="Aucune candidature envoyée." />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {data.applications.map((application) => (
                      <li key={application.id}>
                        <Link to={`/admin/signalements/${application.job_id}`}>
                          <Card className="transition-colors hover:border-primary/40">
                            <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6">
                              <div>
                                <p className="font-medium text-primary">{application.job_title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {application.company} — {application.city}
                                </p>
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                <p>{applicationStatusLabels[application.status] ?? application.status}</p>
                                <p>{dateFormat.format(new Date(application.created_at))}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  )
}
