import { Link } from 'react-router'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <PageShell title="Cette page n'existe pas" description="Erreur 404">
      <div className="flex flex-col items-start gap-4">
        <p className="max-w-prose text-sm text-muted-foreground">
          L'adresse demandée ne correspond à aucune page de ChômageGo. Elle a peut-être
          été supprimée, ou l'adresse comporte une erreur de saisie.
        </p>
        <Button render={<Link to="/" />}>Retour à la carte</Button>
      </div>
    </PageShell>
  )
}
