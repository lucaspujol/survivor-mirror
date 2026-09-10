import { api } from '@/lib/api'

/** The job seeker's professional profile: what an employer reads next to an
 * application, and the only part of an account its owner can edit. */
export type SeekerProfile = {
  first_name: string
  last_name: string
  skills: string[]
  /** Free text. */
  experience: string | null
  /** ISO date (yyyy-mm-dd), or null when not stated. */
  availability: string | null
}

/** Kept in sync with SeekerProfileIn in api/app/schemas.py. */
export const MAX_SKILLS = 30
export const MAX_EXPERIENCE_LENGTH = 5000

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
