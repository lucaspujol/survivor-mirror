import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { User } from '@/lib/auth'

const ROLE_LABELS = {
  seeker: 'Candidat',
  employer: 'Employeur',
  admin: 'Administrateur',
} as const

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export function ProfileCard({ user }: { user: User }) {
  const memberSince = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(
    new Date(user.created_at),
  )

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">
              {initials(user.display_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{user.display_name}</p>
            <Badge variant="secondary" className="mt-1">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </div>

        <Separator />

        <dl className="flex flex-col gap-3">
          <Row
            label={user.role === 'employer' ? 'Raison sociale' : 'Nom'}
            value={user.display_name}
          />
          <Row label="Email" value={user.email} />
          <Row label="Compte créé le" value={memberSince} />
        </dl>
      </CardContent>
    </Card>
  )
}
