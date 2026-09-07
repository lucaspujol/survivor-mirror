import { useState } from 'react'
import { CalendarIcon, MailIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_STYLES,
  updateApplicationStatus,
  type ApplicationStatus,
  type EmployerApplication,
} from '@/lib/applications'

type ApplicantCardProps = {
  application: EmployerApplication
  onStatusChange: (status: ApplicationStatus) => void
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** One applicant: the transmitted profile plus the status control. */
export function ApplicantCard({ application, onStatusChange }: ApplicantCardProps) {
  const { applicant } = application
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(status: ApplicationStatus) {
    setIsSaving(true)
    setError('')
    try {
      await updateApplicationStatus(application.id, status)
      onStatusChange(status)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise à jour impossible.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-primary">
            {applicant.first_name} {applicant.last_name}
          </p>
          <a
            href={`mailto:${applicant.email}`}
            className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4"
          >
            <MailIcon className="size-3.5 shrink-0" />
            {applicant.email}
          </a>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${APPLICATION_STATUS_STYLES[application.status]}`}
        >
          {APPLICATION_STATUS_LABELS[application.status]}
        </span>
      </div>

      {applicant.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {applicant.skills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {applicant.experience && (
        <p className="mt-3 text-sm whitespace-pre-line">{applicant.experience}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="size-3.5 shrink-0" />
          Postulé le {dateFormat.format(new Date(application.created_at))}
        </span>
        {applicant.availability && (
          <span>Disponible à partir du {dateFormat.format(new Date(applicant.availability))}</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Select
          value={application.status}
          onValueChange={(value) => handleChange(value as ApplicationStatus)}
          disabled={isSaving}
        >
          <SelectTrigger className="h-8 w-56" aria-label="Statut de la candidature">
            <SelectValue>
              {(value) => APPLICATION_STATUS_LABELS[value as ApplicationStatus]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>
    </div>
  )
}
