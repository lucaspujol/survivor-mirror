import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { CONTRACT_TYPES } from '@/components/contractTypes'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { REPORT_REASONS } from '@/components/reportReasons'
import { REPORT_STATUSES } from '@/components/reportStatuses'
import { TIME_COMMITMENTS } from '@/components/timeCommitments'
import { WORK_MODES } from '@/components/workModes'
import { PageShell } from '@/components/layout/PageShell'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useApiResource } from '@/hooks/use-api-resource'
import { api } from '@/lib/api'

type OfferDetail = {
  id: number
  title: string
  description: string
  contract_type: string
  contract_duration: string | null
  work_mode: string
  time_commitment: string
  address: string | null
  city: string
  employer_id: number
  employer_email: string
  company: string
  created_at: string
}

type Report = {
  id: number
  job_id: number
  reason: string
  comment: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  reporter_email: string
  created_at: string
}

type OfferApplication = {
  id: number
  job_seeker_id: number
  applicant_name: string
  applicant_email: string
  status: string
  created_at: string
}

const applicationStatusLabels: Record<string, string> = {
  sent: 'Envoyée',
  under_review: "En cours d'examen",
  accepted: 'Acceptée',
  rejected: 'Refusée',
}

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function AdminReportDetailPage() {
  const { offerId } = useParams<{ offerId: string }>()
  const navigate = useNavigate()

  const offerResource = useApiResource<OfferDetail>(`/api/admin/offres/${offerId}`)
  const reportsResource = useApiResource<Report[]>(`/api/admin/signalements?job_id=${offerId}`)
  const applicationsResource = useApiResource<OfferApplication[]>(
    `/api/admin/offres/${offerId}/candidatures`,
  )

  const [reports, setReports] = useState<Report[]>([])
  useEffect(() => {
    if (reportsResource.status === 'ready') setReports(reportsResource.data)
  }, [reportsResource.status, reportsResource.data])

  const [actionError, setActionError] = useState('')
  const [savingReportId, setSavingReportId] = useState<number | null>(null)

  const [isDeletingOffer, setIsDeletingOffer] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  const [warningReason, setWarningReason] = useState('')
  const [isWarning, setIsWarning] = useState(false)
  const [warningError, setWarningError] = useState('')
  const [warningOpen, setWarningOpen] = useState(false)

  async function handleStatusChange(reportId: number, status: string) {
    setSavingReportId(reportId)
    setActionError('')
    try {
      const updated = await api<Report>(`/api/admin/signalements/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setReports((current) =>
        current.map((report) => (report.id === reportId ? updated : report)),
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.')
    } finally {
      setSavingReportId(null)
    }
  }

  async function handleDeleteOffer() {
    setIsDeletingOffer(true)
    setActionError('')
    try {
      await api<void>(`/api/offres/${offerId}`, { method: 'DELETE' })
      navigate('/admin/signalements')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de la suppression de l'offre.")
      setIsDeletingOffer(false)
    }
  }

  async function handleDeleteUser() {
    if (offerResource.status !== 'ready') return
    setIsDeletingUser(true)
    setActionError('')
    try {
      await api<void>(`/api/admin/utilisateurs/${offerResource.data.employer_id}`, {
        method: 'DELETE',
      })
      navigate('/admin/signalements')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de la suppression du compte.")
      setIsDeletingUser(false)
    }
  }

  async function handleWarnUser() {
    if (offerResource.status !== 'ready') return
    setIsWarning(true)
    setWarningError('')
    try {
      await api(`/api/admin/utilisateurs/${offerResource.data.employer_id}/avertissements`, {
        method: 'POST',
        body: JSON.stringify({ reason: warningReason }),
      })
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
      title="Modération d'une offre"
      description="Offre complète, signalements et candidatures reçues, et actions de modération."
      actions={
        <Button variant="ghost" size="sm" render={<Link to="/admin/signalements" />}>
          <ArrowLeftIcon />
          Retour aux signalements
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {actionError && <p className="text-sm text-destructive">{actionError}</p>}

        {offerResource.status === 'loading' && <PageLoading />}
        {offerResource.status === 'error' && <PageError message={offerResource.error} />}

        {offerResource.status === 'ready' && (
          <Card>
            <CardHeader>
              <CardTitle>{offerResource.data.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">
                  {labelOf(CONTRACT_TYPES, offerResource.data.contract_type)}
                  {offerResource.data.contract_duration
                    ? ` · ${offerResource.data.contract_duration}`
                    : ''}
                </Badge>
                <Badge variant="secondary">{labelOf(WORK_MODES, offerResource.data.work_mode)}</Badge>
                <Badge variant="secondary">
                  {labelOf(TIME_COMMITMENTS, offerResource.data.time_commitment)}
                </Badge>
              </div>

              <p className="text-sm">{offerResource.data.description}</p>

              <p className="text-sm text-muted-foreground">
                <Link
                  to={`/admin/utilisateurs/${offerResource.data.employer_id}`}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {offerResource.data.company}
                </Link>
                {' '}- {offerResource.data.employer_email}
              </p>
              <p className="text-sm text-muted-foreground">
                {offerResource.data.address ?? offerResource.data.city}
              </p>
              <p className="text-xs text-muted-foreground">
                Publiée le {dateFormat.format(new Date(offerResource.data.created_at))}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button variant="destructive" size="sm" disabled={isDeletingOffer}>
                        {isDeletingOffer ? 'Suppression…' : "Supprimer l'offre"}
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Supprimer « {offerResource.data.title} » ?</DialogTitle>
                      <DialogDescription>
                        L'offre est retirée de la carte définitivement.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button type="button" variant="outline">Annuler</Button>} />
                      <Button variant="destructive" onClick={handleDeleteOffer} disabled={isDeletingOffer}>
                        {isDeletingOffer ? 'Suppression…' : 'Supprimer'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger
                    render={
                      <Button variant="destructive" size="sm" disabled={isDeletingUser}>
                        {isDeletingUser ? 'Suppression…' : "Supprimer le compte employeur"}
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Supprimer le compte « {offerResource.data.company} » ?</DialogTitle>
                      <DialogDescription>
                        Ses offres, candidatures reçues et signalements associés sont supprimés
                        avec le compte. Cette action est définitive.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose render={<Button type="button" variant="outline">Annuler</Button>} />
                      <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeletingUser}>
                        {isDeletingUser ? 'Suppression…' : 'Supprimer'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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
                      <DialogTitle>Avertir « {offerResource.data.company} »</DialogTitle>
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
                      <Button
                        onClick={handleWarnUser}
                        disabled={isWarning || !warningReason.trim()}
                      >
                        {isWarning ? 'Envoi…' : "Envoyer l'avertissement"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="mb-3 text-lg font-semibold">
            Signalements reçus
            {reportsResource.status === 'ready' && ` (${reports.length})`}
          </h2>

          {reportsResource.status === 'loading' && <PageLoading rows={2} />}
          {reportsResource.status === 'error' && <PageError message={reportsResource.error} />}

          {reportsResource.status === 'ready' &&
            (reports.length === 0 ? (
              <PageEmpty title="Aucun signalement pour cette offre." />
            ) : (
              <ul className="flex flex-col gap-3">
                {reports.map((report) => (
                  <li key={report.id}>
                    <Card>
                      <CardContent className="flex flex-col gap-2 pt-6">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{labelOf(REPORT_REASONS, report.reason)}</span>
                          <Select
                            value={report.status}
                            onValueChange={(value) => handleStatusChange(report.id, value as string)}
                          >
                            <SelectTrigger
                              className="w-44"
                              disabled={savingReportId === report.id}
                            >
                              <SelectValue>
                                {(value) => labelOf(REPORT_STATUSES, value as string)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {REPORT_STATUSES.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {report.comment && <p className="text-sm">{report.comment}</p>}
                        <p className="text-xs text-muted-foreground">
                          Signalé par {report.reporter_email} le{' '}
                          {dateFormat.format(new Date(report.created_at))}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            ))}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">
            Candidatures reçues
            {applicationsResource.status === 'ready' && ` (${applicationsResource.data.length})`}
          </h2>

          {applicationsResource.status === 'loading' && <PageLoading rows={2} />}
          {applicationsResource.status === 'error' && (
            <PageError message={applicationsResource.error} />
          )}

          {applicationsResource.status === 'ready' &&
            (applicationsResource.data.length === 0 ? (
              <PageEmpty title="Aucune candidature reçue pour cette offre." />
            ) : (
              <ul className="flex flex-col gap-3">
                {applicationsResource.data.map((application) => (
                  <li key={application.id}>
                    <Card>
                      <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6">
                        <div>
                          <Link
                            to={`/admin/utilisateurs/${application.job_seeker_id}`}
                            className="font-medium underline underline-offset-4 hover:text-primary"
                          >
                            {application.applicant_name}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {application.applicant_email} · envoyée le{' '}
                            {dateFormat.format(new Date(application.created_at))}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {applicationStatusLabels[application.status] ?? application.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </div>
    </PageShell>
  )
}
