/** An offer as the employer sees it: no coordinates, but a candidature count. */
export type MyOffer = {
  id: number
  title: string
  description: string
  city: string
  address: string | null
  contract_type: string
  contract_duration: string | null
  work_mode: string
  time_commitment: string
  location_status: 'pending' | 'geocoded' | 'to_verify'
  application_count: number
  created_at: string
  expires_at: string
}

export const LOCATION_STATUS_LABELS: Record<MyOffer['location_status'], string> = {
  pending: 'À géolocaliser',
  geocoded: 'Placée sur la carte',
  to_verify: 'Localisation à vérifier',
}
