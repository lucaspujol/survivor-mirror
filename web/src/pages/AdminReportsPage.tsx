import { FlagIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function AdminReportsPage() {
  return (
    <PageShell
      title="Signalements"
      description="Offres signalées comme frauduleuses par les utilisateurs."
    >
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FlagIcon />
          </EmptyMedia>
          <EmptyTitle>Aucun signalement en attente</EmptyTitle>
          <EmptyDescription>
            Les offres signalées apparaîtront ici pour modération.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </PageShell>
  )
}
