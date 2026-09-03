import { Link } from 'react-router'
import { FileTextIcon, MapIcon } from 'lucide-react'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function ApplicationsPage() {
  return (
    <PageShell
      title="Mes candidatures"
      description="Suivez l'état de vos candidatures envoyées aux employeurs."
    >
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileTextIcon />
          </EmptyMedia>
          <EmptyTitle>Aucune candidature</EmptyTitle>
          <EmptyDescription>
            Trouvez une offre sur la carte et postulez : son avancement
            s'affichera ici.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link to="/" />}>
            <MapIcon />
            Explorer la carte
          </Button>
        </EmptyContent>
      </Empty>
    </PageShell>
  )
}
