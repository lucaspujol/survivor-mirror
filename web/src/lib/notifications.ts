import { api } from '@/lib/api'

export type Notification = {
  id: number
  type: 'application_received' | 'application_status' | 'offer_removed'
  title: string
  body: string
  job_id: number | null
  read_at: string | null
  created_at: string
}

export function listNotifications() {
  return api<Notification[]>('/api/notifications')
}

export function markNotificationRead(id: number) {
  return api<Notification>(`/api/notifications/${id}/lu`, { method: 'POST' })
}

export function markAllNotificationsRead() {
  return api<void>('/api/notifications/lues', { method: 'POST' })
}
