import { api } from '@/lib/api'

export const REPORT_REASONS = [
  { value: 'fraud', label: 'Offre frauduleuse' },
  { value: 'misleading', label: 'Informations trompeuses' },
  { value: 'discrimination', label: 'Contenu discriminatoire' },
  { value: 'offensive', label: 'Contenu offensant' },
  { value: 'other', label: 'Autre motif' },
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]['value']

export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'À traiter',
  reviewed: 'Traité',
  dismissed: 'Non fondé',
}

export type Report = {
  id: number
  job_id: number
  job_title: string
  company: string
  reason: ReportReason
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  reporter_email: string
  created_at: string
}

export function reasonLabel(reason: string) {
  return REPORT_REASONS.find((entry) => entry.value === reason)?.label ?? reason
}

export function reportOffer(jobId: number, reason: ReportReason, details: string) {
  return api<Report>('/api/signalements', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId, reason, details: details.trim() || null }),
  })
}

export function listReports() {
  return api<Report[]>('/api/admin/signalements')
}

export function updateReportStatus(reportId: number, status: Report['status']) {
  return api<Report>(`/api/admin/signalements/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
