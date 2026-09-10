import { api } from '@/lib/api'

/** The job seeker's professional profile: what an employer reads next to an
 * application, and the only part of an account its owner can edit. */
/** One position held. `id` is absent on an entry not saved yet. */
export type SeekerExperience = {
  id?: number
  position: string
  contract_type: string
  company: string
  /** ISO date (yyyy-mm-dd). */
  start_date: string
  /** null while the position is still held. */
  end_date: string | null
  description: string | null
}

export type SeekerProfile = {
  first_name: string
  last_name: string
  skills: string[]
  /** Most recent position first. */
  experiences: SeekerExperience[]
  /** ISO date (yyyy-mm-dd), or null when not stated. */
  availability: string | null
}

/** Kept in sync with SeekerProfileIn in api/app/schemas.py. */
export const MAX_SKILLS = 30
export const MAX_EXPERIENCES = 30
export const MAX_DESCRIPTION_LENGTH = 2000

export function emptyExperience(): SeekerExperience {
  return {
    position: '',
    contract_type: 'cdi',
    company: '',
    start_date: '',
    end_date: null,
    description: null,
  }
}

/** Why an entry cannot be saved yet, or null when it is complete. Mirrors
 * SeekerExperienceIn in api/app/schemas.py, so the form catches what the API
 * would reject anyway. */
export function experienceProblem(experience: SeekerExperience): string | null {
  if (!experience.position.trim()) return "L'intitulé du poste est obligatoire."
  if (!experience.company.trim()) return "L'entreprise est obligatoire."
  if (!experience.start_date) return 'La date de début est obligatoire.'
  if (experience.end_date && experience.end_date < experience.start_date) {
    return 'La date de fin ne peut pas précéder la date de début.'
  }
  return null
}

/** "mars 2022 - aujourd'hui", the way a CV reads. */
export function formatPeriod(experience: SeekerExperience): string {
  const month = (iso: string) =>
    new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
      new Date(iso),
    )
  const start = experience.start_date ? month(experience.start_date) : ''
  const end = experience.end_date ? month(experience.end_date) : "aujourd'hui"
  return `${start} - ${end}`
}

export function getProfile(): Promise<SeekerProfile> {
  return api<SeekerProfile>('/api/profil')
}

/** Replaces the whole profile: an emptied field means the job seeker cleared
 * it, so the payload always carries every value. */
export function saveProfile(profile: SeekerProfile): Promise<SeekerProfile> {
  return api<SeekerProfile>('/api/profil', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}
