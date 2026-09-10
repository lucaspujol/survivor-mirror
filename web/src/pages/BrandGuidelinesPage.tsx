import { PageShell } from '@/components/layout/PageShell'

function ColorSwatch({ hex, name, usage }: { hex: string; name: string; usage: string }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-14 w-14 shrink-0 rounded-lg border"
        style={{ backgroundColor: `#${hex}` }}
        aria-hidden
      />
      <div>
        <p className="font-medium">
          {name} <span className="text-muted-foreground">#{hex}</span>
        </p>
        <p className="text-sm text-muted-foreground">{usage}</p>
      </div>
    </div>
  )
}

export function BrandGuidelinesPage() {
  return (
    <PageShell
      title="Charte graphique"
      description="Identité visuelle de GéoEmploi, décidée le 7 septembre 2026."
    >
      <div className="flex max-w-prose flex-col gap-8 text-sm">
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">Contexte</h2>
          <p>
            Jusqu'au 7 septembre 2026, GéoEmploi reprenait les codes visuels de l'État :
            bloc-marque de la République, bleu institutionnel, police Marianne. Une consigne
            du cabinet a demandé le retrait complet de ces éléments - apposer le bloc-marque
            de l'État revient à donner un engagement institutionnel que le projet, un
            démonstrateur technique, ne peut pas honorer. Cette charte documente l'identité
            qui a remplacé l'ancienne, pas l'ancienne elle-même.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-primary">Nom et mention obligatoire</h2>
          <p>
            Le produit s'appelle <strong>GéoEmploi</strong>, en typographie seule - jamais
            accompagné du mot « Ministère », d'un drapeau, ou d'une devise. La mention
            suivante doit rester visible sur toutes les pages, sans exception :
          </p>
          <p className="rounded-md border bg-muted/40 px-4 py-3 font-medium">
            « Démonstrateur technique, ne constitue pas un service public en exploitation. »
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-primary">Couleur</h2>
          <ColorSwatch
            hex="863BFF"
            name="Violet de marque"
            usage="Couleur primaire retenue le 7 septembre 2026, volontairement éloignée du bleu institutionnel qu'elle remplace."
          />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">Typographie</h2>
          <p>
            <strong>Geist Variable</strong> - déjà présente dans les dépendances du projet,
            déclarée en police de repli avant même le changement d'identité. Remplace la
            police officielle Marianne (5 déclarations <code>@font-face</code>, retirées).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">Logo et bloc-marque</h2>
          <p>
            Pas de logo au sens classique : le nom « GéoEmploi » en typographie, seul,
            tient lieu de marque.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">Favicon et méta-données</h2>
          <p>
            Icône neutre, sans symbole tricolore. Titre d'onglet :
            « GéoEmploi - démonstrateur technique ».
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">Explicitement interdit</h2>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Tout visuel de l'État : bloc-marque, Marianne, drapeau tricolore.</li>
            <li>La mention « Ministère du Job et du Bonheur » dans l'interface.</li>
            <li>La devise « Liberté / Égalité / Fraternité ».</li>
            <li>Présenter GéoEmploi comme un service public réellement en exploitation.</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Les fichiers retirés restent conservés hors de <code>web/public/</code>, dans{' '}
            <code>_archive/charte-etat/</code>, à titre de preuve du retrait plutôt que
            supprimés définitivement.
          </p>
        </section>
      </div>
    </PageShell>
  )
}
