import { ShieldCheckIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** GDPR notice required by the brief: say what location data is used for. */
export function PrivacyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheckIcon className="size-4" />
          Données personnelles et localisation
        </CardTitle>
        <CardDescription>
          Ce que la plateforme conserve, et ce qu'elle ne conserve pas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
          <li>
            Votre position GPS n'est jamais enregistrée : elle sert uniquement, le
            temps d'une requête, à centrer la carte.
          </li>
          <li>
            Seule l'adresse des offres publiées est géocodée et stockée, afin de les
            placer sur la carte.
          </li>
          <li>
            Les données collectées se limitent à ce qu'exige une recherche d'emploi :
            identité, email, et profil professionnel.
          </li>
          <li>
            La suppression de votre compte efface vos candidatures et vos offres.
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
