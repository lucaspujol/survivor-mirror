import { api } from '@/lib/api'

export const APPLICATION_STATUSES = ['sent', 'under_review', 'accepted', 'rejected'] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: 'Envoyée',
  under_review: "En cours d'examen",
  accepted: 'Acceptée',
  rejected: 'Refusée',
}

export const APPLICATION_STATUS_STYLES: Record<ApplicationStatus, string> = {
  sent: 'bg-muted text-muted-foreground',
  under_review: 'bg-amber-100 text-amber-900',
  accepted: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-destructive/10 text-destructive',
}

/** The profile the brief transmits to the employer when a seeker applies. */
export type SeekerProfile = {
  first_name: string
  last_name: string
  email: string
  skills: string[]
  experience: string | null
  availability: string | null
}

export type EmployerApplication = {
  id: number
  job_id: number
  job_title: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
  applicant: SeekerProfile
}

export function applyToOffer(jobId: number) {
  return api<unknown>('/api/candidatures', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId }),
  })
}

export function listOfferApplications(offerId: number) {
  return api<EmployerApplication[]>(`/api/offres/${offerId}/candidatures`)
}

export function updateApplicationStatus(applicationId: number, status: ApplicationStatus) {
  return api<EmployerApplication>(`/api/candidatures/${applicationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
