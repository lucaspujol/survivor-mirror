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

type ReportGroup = {
  job_id: number
  job_title: string
  report_count: number
  employer_id: number
  company_name: string
  employer_email: string
  warning_count: number
  status: 'pending' | 'in_progress' | 'reviewed' | 'dismissed'
  latest_report_at: string
}

type SortKey =
  | 'company_asc'
  | 'company_desc'
  | 'reports_desc'
  | 'reports_asc'
  | 'warnings_desc'
  | 'warnings_asc'
  | 'status_asc'
  | 'status_desc'

const statusLabels: Record<ReportGroup['status'], string> = {
  pending: 'À traiter',
  in_progress: 'En cours de traitement',
  reviewed: 'Examiné',
  dismissed: 'Classé sans suite',
}

// Worst-to-best, matching the backend's aggregation order - used both to
// color the badge and to support "trier par statut".
const statusOrder: ReportGroup['status'][] = ['pending', 'in_progress', 'reviewed', 'dismissed']

const statusStyles: Record<ReportGroup['status'], string> = {
  pending: 'bg-destructive/10 text-destructive',
  in_progress: 'bg-amber-100 text-amber-900',
  reviewed: 'bg-emerald-100 text-emerald-900',
  dismissed: 'bg-muted text-muted-foreground',
}

const SORT_LABELS: Record<SortKey, string> = {
  company_asc: 'Entreprise (A → Z)',
  company_desc: 'Entreprise (Z → A)',
  reports_desc: 'Plus de signalements',
  reports_asc: 'Moins de signalements',
  warnings_desc: "Plus d'avertissements",
  warnings_asc: "Moins d'avertissements",
  status_asc: 'Statut (à traiter en premier)',
  status_desc: 'Statut (classé sans suite en premier)',
}

const PAGE_SIZE = 20

function sortGroups(groups: ReportGroup[], sort: SortKey): ReportGroup[] {
  const sorted = [...groups]
  switch (sort) {
    case 'company_asc':
      return sorted.sort((a, b) => a.company_name.localeCompare(b.company_name))
    case 'company_desc':
      return sorted.sort((a, b) => b.company_name.localeCompare(a.company_name))
    case 'reports_desc':
      return sorted.sort((a, b) => b.report_count - a.report_count)
    case 'reports_asc':
      return sorted.sort((a, b) => a.report_count - b.report_count)
    case 'warnings_desc':
      return sorted.sort((a, b) => b.warning_count - a.warning_count)
    case 'warnings_asc':
      return sorted.sort((a, b) => a.warning_count - b.warning_count)
    case 'status_asc':
      return sorted.sort(
        (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
      )
    case 'status_desc':
      return sorted.sort(
        (a, b) => statusOrder.indexOf(b.status) - statusOrder.indexOf(a.status),
      )
  }
}

export function AdminReportsPage() {
  const { status, data, error } = useApiResource<ReportGroup[]>(
    '/api/admin/signalements/par-offre',
  )

  const [sort, setSort] = useState<SortKey>('reports_desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [sort])

  const sorted = useMemo(() => {
    if (status !== 'ready') return []
    return sortGroups(data, sort)
  }, [status, data, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const shown = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <PageShell
      title="Signalements"
      description="Offres signalées par les utilisateurs, regroupées par offre. Sélectionnez une ligne pour voir le détail et agir."
    >
      <div className="flex flex-col gap-4">
        {status === 'loading' && <PageLoading rows={4} />}
        {status === 'error' && <PageError message={error} />}

        {status === 'ready' &&
          (data.length === 0 ? (
            <PageEmpty title="Aucun signalement pour le moment." />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {sorted.length} offre{sorted.length > 1 ? 's' : ''} signalée
                  {sorted.length > 1 ? 's' : ''}
                </p>
                <div className="grid gap-1.5">
                  <Label htmlFor="sort" className="text-xs">Trier par</Label>
                  <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
                    <SelectTrigger id="sort" className="h-9 w-56 bg-background">
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

              <div
                className="overflow-x-auto rounded-md border"
                tabIndex={0}
                role="region"
                aria-label="Tableau des signalements, défilement horizontal si nécessaire"
              >
                <table className="w-full min-w-[64rem] border-collapse text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Offre</th>
                      <th scope="col" className="px-3 py-2 font-medium">Entreprise</th>
                      <th scope="col" className="px-3 py-2 font-medium">Email entreprise</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Signalements
                      </th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">
                        Avertissements
                      </th>
                      <th scope="col" className="px-3 py-2 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((group) => (
                      <tr key={group.job_id} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          <Link
                            to={`/admin/signalements/${group.job_id}`}
                            className="underline underline-offset-4 hover:text-primary"
                          >
                            {group.job_title}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            to={`/admin/utilisateurs/${group.employer_id}`}
                            className="underline underline-offset-4 hover:text-primary"
                          >
                            {group.company_name}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {group.employer_email}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {group.report_count}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {group.warning_count}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[group.status]}`}
                          >
                            {statusLabels[group.status]}
                          </span>
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
          ))}
      </div>
    </PageShell>
  )
}
