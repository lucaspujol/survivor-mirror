/**
 * Mention imposée par le cabinet (gel du 7 septembre 2026), au mot près.
 * Elle doit figurer sur toutes les pages publiques, pages d'erreur comprises.
 * Ne pas reformuler.
 */
export const DEMO_NOTICE =
  'Démonstrateur technique, ne constitue pas un service public en exploitation.'

export function DemoNotice() {
  return (
    <footer className="border-t bg-background px-4 py-3 md:px-6">
      <p className="text-center text-xs text-muted-foreground">{DEMO_NOTICE}</p>
    </footer>
  )
}
