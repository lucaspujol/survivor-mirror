import { useAuth } from '@/lib/auth'

const roleLabels = {
  seeker: 'Candidat',
  employer: 'Employeur',
  admin: 'Administrateur',
} as const

export function AccountPage() {
  const { user } = useAuth()

  // RequireAuth guarantees a user here.
  if (!user) return null

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Mon compte</h1>
      <dl className="grid gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-32 text-muted-foreground">Nom</dt>
          <dd>{user.fullname}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-32 text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-32 text-muted-foreground">Rôle</dt>
          <dd>{roleLabels[user.role]}</dd>
        </div>
      </dl>
    </div>
  )
}
