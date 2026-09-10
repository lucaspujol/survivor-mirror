import { PageShell } from '@/components/layout/PageShell'

export function LegalNoticePage() {
  return (
    <PageShell
      title="Mentions légales"
      description="Conformément à l'article 6-III de la loi n° 2004-575 du 21 juin 2004 (LCEN)."
    >
      <div className="flex max-w-prose flex-col gap-6 text-sm">
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">Éditeur du site</h2>
          <p className="text-foreground">
            Ministère du Job et du Bonheur - Direction Numérique et Innovation.
          </p>
          <p className="text-foreground">
            Adresse et coordonnées de l'organisme non communiquées à ce stade
            (démonstrateur technique, hors production).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">
            Directeur de la publication
          </h2>
          <p className="text-foreground">Amayyas AOUADENE - Chef de projet.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">Hébergement</h2>
          <p className="text-foreground">
            Ce démonstrateur ne fait l'objet d'aucun hébergement public : il s'exécute
            uniquement en local, via Docker, sur les machines de l'équipe de
            développement. Aucun hébergeur tiers n'est sollicité à ce stade.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-primary">Contact</h2>
          <p className="text-foreground">contact@geoemploi.fr</p>
        </section>

      </div>
    </PageShell>
  )
}
