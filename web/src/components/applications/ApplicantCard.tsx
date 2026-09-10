import { useState } from 'react'
import { CalendarIcon, MailIcon, PhoneIcon } from 'lucide-react'
import { DocumentList } from '@/components/applications/DocumentList'
import { ContractBadge } from '@/components/offers/ContractBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ApiError, api } from '@/lib/api'
import { formatPeriod } from '@/lib/profile'
import {
  STATUS_LABELS,
  STATUS_ORDER,
  STATUS_STYLES,
  formatDate,
  type Applicant,
  type ApplicationStatus,
} from '@/lib/applications'

type ApplicantCardProps = {
  applicant: Applicant
  onStatusChanged: (applicant: Applicant) => void
}

const availabilityFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** One candidate on the employer's side: their contact details, their profile,
 * their documents, and the decision to take on them. */
export function ApplicantCard({ applicant, onStatusChanged }: ApplicantCardProps) {
  const [saving, setSaving] = useState<ApplicationStatus | null>(null)
  const [error, setError] = useState('')

  const changeStatus = async (status: ApplicationStatus) => {
    setSaving(status)
    setError('')
    try {
      const updated = await api<Applicant>(`/api/candidatures/${applicant.id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      onStatusChanged(updated)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Le statut n'a pas pu être modifié.",
      )
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            {applicant.first_name} {applicant.last_name}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[applicant.status]}`}
          >
            {STATUS_LABELS[applicant.status]}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 text-sm">
          <p className="flex items-center gap-1.5">
            <MailIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <a href={`mailto:${applicant.email}`} className="underline-offset-2 hover:underline">
              {applicant.email}
            </a>
          </p>
          {applicant.phone && (
            <p className="flex items-center gap-1.5">
              <PhoneIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <a href={`tel:${applicant.phone.replace(/\s/g, '')}`} className="underline-offset-2 hover:underline">
                {applicant.phone}
              </a>
            </p>
          )}
          {applicant.availability && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="size-3.5 shrink-0" />
              Disponible à partir du{' '}
              {availabilityFormat.format(new Date(applicant.availability))}
            </p>
          )}
        </div>

        {applicant.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {applicant.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {applicant.experiences.length > 0 && (
          <div>
            <h4 className="text-sm font-medium">Expériences professionnelles</h4>
            <ul className="mt-2 flex flex-col gap-3">
              {applicant.experiences.map((experience) => (
                <li key={experience.id} className="border-l-2 pl-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">{experience.position}</span>
                    <ContractBadge type={experience.contract_type} duration={null} />
                  </div>
                  <p className="text-sm text-muted-foreground">{experience.company}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPeriod(experience)}
                  </p>
                  {experience.description && (
                    <p className="mt-1 text-sm whitespace-pre-line">
                      {experience.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {applicant.message && (
          <div>
            <h4 className="text-sm font-medium">Message du candidat</h4>
            <p className="mt-1 text-sm whitespace-pre-line">{applicant.message}</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium">Documents</h4>
          <div className="mt-2">
            <DocumentList applicationId={applicant.id} documents={applicant.documents} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Candidature reçue le {formatDate(applicant.created_at)}
        </p>

        <Separator />

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium" id={`status-${applicant.id}`}>
            Suivi de la candidature
          </h4>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`status-${applicant.id}`}>
            {STATUS_ORDER.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={applicant.status === status ? 'default' : 'outline'}
                aria-pressed={applicant.status === status}
                disabled={saving !== null || applicant.status === status}
                onClick={() => void changeStatus(status)}
              >
                {saving === status ? 'Enregistrement…' : STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
