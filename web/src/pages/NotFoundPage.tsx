import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <p className="text-sm font-medium text-muted-foreground">Erreur 404</p>
      <h1 className="text-2xl font-semibold">Cette page n'existe pas</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        L'adresse demandée ne correspond à aucune page de ChômageGo. Elle a peut-être
        été supprimée, ou l'adresse comporte une erreur de saisie.
      </p>
      <Button render={<Link to="/" />}>Retour à la carte</Button>
    </div>
  )
}
