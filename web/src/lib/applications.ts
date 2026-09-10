import type { SeekerExperience } from '@/lib/profile'

/** Applications, as the two sides of the exchange see them. */

export type ApplicationStatus = 'sent' | 'under_review' | 'accepted' | 'rejected'

export type ApplicationDocument = {
  id: number
  kind: 'cv' | 'cover_letter'
  original_name: string
  mime_type: string
  size_bytes: number
}

/** One row of the job seeker's list. */
export type Application = {
  id: number
  job_id: number
  job_title: string
  company: string
  city: string
  status: ApplicationStatus
  created_at: string
  updated_at: string
}

/** What the job seeker sent, replayed on the application's detail screen. */
export type ApplicationDetail = Application & {
  first_name: string
  last_name: string
  phone: string | null
  message: string | null
  contract_type: string
  work_mode: string
  address: string | null
  job_description: string
  documents: ApplicationDocument[]
}

/** One candidate, as the employer who published the offer sees them. */
export type Applicant = {
  id: number
  job_id: number
  job_title: string
  status: ApplicationStatus
  first_name: string
  last_name: string
  email: string
  phone: string | null
  message: string | null
  skills: string[]
  experiences: SeekerExperience[]
  availability: string | null
  documents: ApplicationDocument[]
  created_at: string
  updated_at: string
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  sent: 'Envoyée',
  under_review: "En cours d'examen",
  accepted: 'Acceptée',
  rejected: 'Refusée',
}

export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  sent: 'bg-muted text-muted-foreground',
  under_review: 'bg-amber-100 text-amber-900',
  accepted: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-destructive/10 text-destructive',
}

/** The order an employer walks an application through. */
export const STATUS_ORDER: ApplicationStatus[] = [
  'sent',
  'under_review',
  'accepted',
  'rejected',
]

export const DOCUMENT_LABELS: Record<ApplicationDocument['kind'], string> = {
  cv: 'CV',
  cover_letter: 'Lettre de motivation',
}

/** Accepted uploads, kept in sync with `ALLOWED_MIME_TYPES` in api/app/storage.py. */
export const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx'
export const ACCEPTED_FILE_LABEL = 'PDF, DOC ou DOCX'
export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MAX_FILE_SIZE_LABEL = '5 Mo'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/** Where a document is downloaded from. Same route for both sides: the API
 * decides who is entitled to the file. */
export function documentUrl(applicationId: number, documentId: number): string {
  return `/api/candidatures/${applicationId}/documents/${documentId}`
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}
