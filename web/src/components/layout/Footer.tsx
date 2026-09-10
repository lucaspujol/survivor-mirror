import { Link } from 'react-router'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p>GéoEmploi - démonstrateur technique, ne constitue pas un service public en exploitation.</p>
        <nav aria-label="Liens légaux" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/cgu" className="hover:text-primary hover:underline">
            Conditions générales d'utilisation
          </Link>
          <Link to="/mentions-legales" className="hover:text-primary hover:underline">
            Mentions légales
          </Link>
          <Link to="/confidentialite" className="hover:text-primary hover:underline">
            Confidentialité
          </Link>
        </nav>
      </div>
    </footer>
  )
}
