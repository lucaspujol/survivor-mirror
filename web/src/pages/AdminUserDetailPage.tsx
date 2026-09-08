import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { PageShell } from '@/components/layout/PageShell'
import { WORK_MODES } from '@/components/workModes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { useApiResource } from '@/hooks/use-api-resource'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

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

type UserWarning = {
  id: number
  reason: string
  issued_by_email: string | null
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
  warnings: UserWarning[]
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
  const navigate = useNavigate()
  const { user: currentAdmin } = useAuth()
  const { status, data, error } = useApiResource<UserDetail>(`/api/admin/utilisateurs/${userId}`)

  // Mirrored locally so a freshly sent warning shows up immediately, without
  // a full refetch — same pattern used for offers elsewhere in the app.
  const [warnings, setWarnings] = useState<UserWarning[]>([])
  useEffect(() => {
    if (status === 'ready') setWarnings(data.warnings)
  }, [status, data])

  const [actionError, setActionError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const [warningReason, setWarningReason] = useState('')
  const [isWarning, setIsWarning] = useState(false)
  const [warningError, setWarningError] = useState('')
  const [warningOpen, setWarningOpen] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    setActionError('')
    try {
      await api<void>(`/api/admin/utilisateurs/${userId}`, { method: 'DELETE' })
      navigate('/admin/utilisateurs')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
      setIsDeleting(false)
    }
  }

  async function handleWarn() {
    setIsWarning(true)
    setWarningError('')
    try {
      const created = await api<{ id: number; reason: string; created_at: string }>(
        `/api/admin/utilisateurs/${userId}/avertissements`,
        { method: 'POST', body: JSON.stringify({ reason: warningReason }) },
      )
      setWarnings((current) => [
        {
          id: created.id,
          reason: created.reason,
          issued_by_email: currentAdmin?.email ?? null,
          created_at: created.created_at,
        },
        ...current,
      ])
      setWarningOpen(false)
      setWarningReason('')
    } catch (err) {
      setWarningError(err instanceof Error ? err.message : "Erreur lors de l'envoi de l'avertissement.")
    } finally {
      setIsWarning(false)
    }
  }

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
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{roleLabels[data.role]}</Badge>
                  {data.activity_verified !== null && (
                    <Badge variant={data.activity_verified ? 'outline' : 'destructive'}>
                      {data.activity_verified ? 'Activité vérifiée' : 'Activité à vérifier'}
                    </Badge>
                  )}
                  {data.role !== 'admin' && (
                    <Badge variant={warnings.length > 0 ? 'destructive' : 'outline'}>
                      {warnings.length} avertissement{warnings.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{data.email}</p>
                <p className="text-xs text-muted-foreground">
                  Inscrit le {dateFormat.format(new Date(data.created_at))}
                </p>

                {actionError && <p className="text-sm text-destructive">{actionError}</p>}

                {data.role !== 'admin' && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Dialog
                      open={warningOpen}
                      onOpenChange={(next) => {
                        if (next) setWarningError('')
                        setWarningOpen(next)
                      }}
                    >
                      <DialogTrigger render={<Button variant="outline" size="sm">Avertir l'utilisateur</Button>} />
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Avertir « {data.display_name} »</DialogTitle>
                          <DialogDescription>
                            L'avertissement est enregistré sur le compte, sans le suspendre.
                          </DialogDescription>
                        </DialogHeader>
                        <FieldGroup>
                          <Field>
                            <FieldLabel htmlFor="warning-reason">Motif de l'avertissement</FieldLabel>
                            <Textarea
                              id="warning-reason"
                              value={warningReason}
                              onChange={(event) => setWarningReason(event.target.value)}
                              rows={3}
                              required
                            />
                          </Field>
                          <FieldError>{warningError}</FieldError>
                        </FieldGroup>
                        <DialogFooter>
                          <DialogClose render={<Button type="button" variant="outline">Annuler</Button>} />
                          <Button onClick={handleWarn} disabled={isWarning || !warningReason.trim()}>
                            {isWarning ? 'Envoi…' : "Envoyer l'avertissement"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button variant="destructive" size="sm" disabled={isDeleting}>
                            {isDeleting ? 'Suppression…' : 'Supprimer le compte'}
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Supprimer « {data.display_name} » ?</DialogTitle>
                          <DialogDescription>
                            {data.role === 'employer'
                              ? 'Ses offres, les candidatures reçues et les signalements associés sont supprimés avec le compte.'
                              : 'Ses candidatures et signalements envoyés sont supprimés avec le compte.'}
                            {' '}Cette action est définitive.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose render={<Button type="button" variant="outline">Annuler</Button>} />
                          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Suppression…' : 'Supprimer'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {data.role !== 'admin' && (
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Avertissements reçus ({warnings.length})
                </h2>
                {warnings.length === 0 ? (
                  <PageEmpty title="Aucun avertissement reçu." />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {warnings.map((warning) => (
                      <li key={warning.id}>
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-sm">{warning.reason}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Envoyé le {dateFormat.format(new Date(warning.created_at))}
                              {' '}par{' '}
                              {warning.issued_by_email ?? 'un compte administrateur supprimé depuis'}
                            </p>
                          </CardContent>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

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
