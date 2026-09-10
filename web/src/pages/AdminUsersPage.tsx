import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

type RoleFilter = 'all' | 'seeker' | 'employer' | 'admin'
type ActivityFilter = 'all' | 'verified' | 'unverified'
type SortKey =
  | 'name_asc'
  | 'name_desc'
  | 'date_desc'
  | 'date_asc'
  | 'offers_desc'
  | 'offers_asc'
  | 'applications_desc'
  | 'applications_asc'

const roleLabels: Record<AdminUser['role'], string> = {
  seeker: 'Candidat',
  employer: 'Employeur',
  admin: 'Administrateur',
}

const SORT_LABELS: Record<SortKey, string> = {
  name_asc: 'Nom (A → Z)',
  name_desc: 'Nom (Z → A)',
  date_desc: 'Plus récents',
  date_asc: 'Plus anciens',
  offers_desc: "Plus d'offres",
  offers_asc: "Moins d'offres",
  applications_desc: 'Plus de candidatures',
  applications_asc: 'Moins de candidatures',
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const PAGE_SIZE = 20

function sortUsers(users: AdminUser[], sort: SortKey): AdminUser[] {
  const sorted = [...users]
  switch (sort) {
    case 'name_asc':
      return sorted.sort((a, b) => a.display_name.localeCompare(b.display_name))
    case 'name_desc':
      return sorted.sort((a, b) => b.display_name.localeCompare(a.display_name))
    case 'date_asc':
      return sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
    case 'date_desc':
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    case 'offers_asc':
      return sorted.sort((a, b) => a.offer_count - b.offer_count)
    case 'offers_desc':
      return sorted.sort((a, b) => b.offer_count - a.offer_count)
    case 'applications_asc':
      return sorted.sort((a, b) => a.application_count - b.application_count)
    case 'applications_desc':
      return sorted.sort((a, b) => b.application_count - a.application_count)
  }
}

export function AdminUsersPage() {
  const { status, data, error } = useApiResource<AdminUser[]>('/api/admin/utilisateurs')

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all')
  const [sort, setSort] = useState<SortKey>('date_desc')
  const [page, setPage] = useState(1)

  // Any filter or sort change makes the current page number meaningless -
  // back to page 1 rather than showing an empty page 4 of a filtered list of 2.
  useEffect(() => {
    setPage(1)
  }, [roleFilter, activityFilter, sort])

  const filtered = useMemo(() => {
    if (status !== 'ready') return []
    return data.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false
      if (activityFilter === 'verified' && user.activity_verified !== true) return false
      if (activityFilter === 'unverified' && user.activity_verified !== false) return false
      return true
    })
  }, [status, data, roleFilter, activityFilter])

  const sorted = useMemo(() => sortUsers(filtered, sort), [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const shown = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
              <div className="flex flex-wrap items-end gap-4 rounded-lg bg-muted px-3 py-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="role-filter" className="text-xs">Rôle</Label>
                  <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
                    <SelectTrigger id="role-filter" className="h-9 w-40 bg-background">
                      <SelectValue>
                        {(value) =>
                          value === 'all' ? 'Tous' : roleLabels[value as AdminUser['role']]
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="seeker">Candidats</SelectItem>
                      <SelectItem value="employer">Employeurs</SelectItem>
                      <SelectItem value="admin">Administrateurs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="activity-filter" className="text-xs">Activité</Label>
                  <Select
                    value={activityFilter}
                    onValueChange={(value) => setActivityFilter(value as ActivityFilter)}
                  >
                    <SelectTrigger id="activity-filter" className="h-9 w-40 bg-background">
                      <SelectValue>
                        {(value) =>
                          value === 'all'
                            ? 'Toutes'
                            : value === 'verified'
                              ? 'Vérifiée'
                              : 'À vérifier'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="verified">Vérifiée</SelectItem>
                      <SelectItem value="unverified">À vérifier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="sort" className="text-xs">Trier par</Label>
                  <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                    <SelectTrigger id="sort" className="h-9 w-48 bg-background">
                      <SelectValue>{(value) => SORT_LABELS[value as SortKey]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {SORT_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {sorted.length} compte{sorted.length > 1 ? 's' : ''}
                {sorted.length !== data.length ? ` sur ${data.length} au total` : ''}
              </p>

              {sorted.length === 0 ? (
                <PageEmpty title="Aucun compte ne correspond à ces filtres." />
              ) : (
                <>
                  <div
                    className="overflow-x-auto rounded-md border"
                    tabIndex={0}
                    role="region"
                    aria-label="Tableau des utilisateurs, défilement horizontal si nécessaire"
                  >
                    <table className="w-full min-w-[48rem] border-collapse text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th scope="col" className="px-3 py-2 font-medium">Nom</th>
                          <th scope="col" className="px-3 py-2 font-medium">Rôle</th>
                          <th scope="col" className="px-3 py-2 font-medium">Email</th>
                          <th scope="col" className="px-3 py-2 font-medium">Activité</th>
                          <th scope="col" className="px-3 py-2 text-right font-medium">Offres</th>
                          <th scope="col" className="px-3 py-2 text-right font-medium">Candidatures</th>
                          <th scope="col" className="px-3 py-2 font-medium">Inscription</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shown.map((user) => (
                          <tr key={user.id} className="border-t">
                            <td className="px-3 py-2 font-medium">
                              <Link
                                to={`/admin/utilisateurs/${user.id}`}
                                className="underline underline-offset-4 hover:text-primary"
                              >
                                {user.display_name}
                              </Link>
                            </td>
                            <td className="px-3 py-2">{roleLabels[user.role]}</td>
                            <td className="px-3 py-2 text-muted-foreground">{user.email}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {user.activity_verified === null
                                ? '-'
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

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Page {page} sur {totalPages}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </>
              )}
            </>
          ))}
      </div>
    </PageShell>
  )
}
