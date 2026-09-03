import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DangerZoneCard() {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Supprimer mon compte</CardTitle>
        <CardDescription>
          La suppression est définitive : compte, offres et candidatures sont
          effacés, sans possibilité de restauration.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-2">
        <Button variant="destructive" disabled>
          Supprimer définitivement
        </Button>
        <p className="text-xs text-muted-foreground">
          L'API de suppression de compte n'est pas encore disponible.
        </p>
      </CardContent>
    </Card>
  )
}
