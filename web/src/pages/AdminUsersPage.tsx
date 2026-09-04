import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { PageShell } from '@/components/layout/PageShell'
import { useApiResource } from '@/hooks/use-api-resource'

type AdminUser = {
  id: number
  email: string
  role: 'seeker' | 'employer' | 'admin'
  display_name: string
  activity_verified: boolean | null
  offer_count: number
  application_count: number
  created_at: string
}

const roleLabels: Record<AdminUser['role'], string> = {
  seeker: 'Candidat',
  employer: 'Employeur',
  admin: 'Administrateur',
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function AdminUsersPage() {
  const { status, data, error } = useApiResource<AdminUser[]>('/api/admin/utilisateurs')

  return (
    <PageShell
      title="Utilisateurs"
      description="Consultation des comptes de la plateforme. Cet écran est en lecture seule."
    >
      <div className="flex flex-col gap-4">
      {status === 'loading' && <PageLoading rows={4} />}
      {status === 'error' && <PageError message={error} />}

      {status === 'ready' &&
        (data.length === 0 ? (
          <PageEmpty title="Aucun compte enregistré." />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{data.length} comptes</p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[48rem] border-collapse text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Nom</th>
                    <th className="px-3 py-2 font-medium">Rôle</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Activité</th>
                    <th className="px-3 py-2 text-right font-medium">Offres</th>
                    <th className="px-3 py-2 text-right font-medium">Candidatures</th>
                    <th className="px-3 py-2 font-medium">Inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{user.display_name}</td>
                      <td className="px-3 py-2">{roleLabels[user.role]}</td>
                      <td className="px-3 py-2 text-muted-foreground">{user.email}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {user.activity_verified === null
                          ? '—'
                          : user.activity_verified
                            ? 'Vérifiée'
                            : 'À vérifier'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{user.offer_count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {user.application_count}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {dateFormat.format(new Date(user.created_at))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ))}
      </div>
    </PageShell>
  )
}
