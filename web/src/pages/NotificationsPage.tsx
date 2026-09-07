import { useEffect, useState } from 'react'
import { BellIcon } from 'lucide-react'
import { PageError, PageLoading } from '@/components/PageState'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useApiResource } from '@/hooks/use-api-resource'
import {
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '@/lib/notifications'
import { publishedLabel } from '@/lib/offers'
import { cn } from '@/lib/utils'

export function NotificationsPage() {
  const { status, data, error } = useApiResource<Notification[]>('/api/notifications')
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (status === 'ready') setNotifications(data)
  }, [status, data])

  const unread = notifications.filter((notification) => notification.read_at === null)

  async function handleMarkAll() {
    await markAllNotificationsRead()
    const now = new Date().toISOString()
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read_at: notification.read_at ?? now })),
    )
  }

  async function handleMarkOne(notification: Notification) {
    if (notification.read_at !== null) return
    const updated = await markNotificationRead(notification.id)
    setNotifications((current) =>
      current.map((entry) => (entry.id === updated.id ? updated : entry)),
    )
  }

  return (
    <PageShell
      title="Notifications"
      description="Les événements qui concernent votre compte."
      actions={
        unread.length > 0 && (
          <Button variant="outline" onClick={handleMarkAll}>
            Tout marquer comme lu
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-3">
        {status === 'loading' && <PageLoading />}
        {status === 'error' && <PageError message={error} />}

        {status === 'ready' &&
          (notifications.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BellIcon />
                </EmptyMedia>
                <EmptyTitle>Aucune notification</EmptyTitle>
                <EmptyDescription>
                  Les candidatures reçues et les réponses à vos candidatures s'afficheront ici.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleMarkOne(notification)}
                    className={cn(
                      'w-full rounded-lg border border-l-4 p-4 text-left transition-colors',
                      notification.read_at === null
                        ? 'border-l-primary bg-primary/5 hover:bg-primary/10'
                        : 'border-l-border bg-card hover:bg-muted/50',
                    )}
                  >
                    <p className="font-medium text-primary">{notification.title}</p>
                    <p className="mt-1 text-sm">{notification.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {publishedLabel(notification.created_at).replace('Publiée', 'Reçue')}
                      {notification.read_at === null && ' · non lue'}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </PageShell>
  )
}
