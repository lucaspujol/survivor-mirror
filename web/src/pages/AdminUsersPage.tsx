import { UsersIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function AdminUsersPage() {
  return (
    <PageShell
      title="Utilisateurs"
      description="Comptes candidats et employeurs de la plateforme."
    >
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>Annuaire indisponible</EmptyTitle>
          <EmptyDescription>
            L'API d'administration des comptes n'est pas encore branchée.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </PageShell>
  )
}
