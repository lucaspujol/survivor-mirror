import { PageShell } from '@/components/layout/PageShell'
import { LegalArticle as Article, ToValidate } from '@/components/layout/LegalArticle'

function DataTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            {headers.map((header) => (
              <th key={header} scope="col" className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cellIndex === 0 ? 'px-3 py-2' : 'px-3 py-2 text-muted-foreground'}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ConfidentialityPage() {
  return (
    <PageShell
      title="Confidentialité"
      description="Fiche de registre RGPD - Version 2.0 · Septembre 2026 · Document soumis à validation juridique."
    >
      <div className="flex max-w-prose flex-col gap-6">
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <p>
            Traitement des données personnelles - Ministère du Job et Bonheur, Direction
            Numérique et Innovation.
          </p>
          <p>Référence du cahier des charges : JEB/DNI/2026-001.</p>
          <p className="mt-2 font-medium text-foreground">
            GéoEmploi est un démonstrateur technique et ne constitue pas un service public en
            exploitation. Les données de démonstration ne contiennent aucune donnée personnelle
            réelle.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Les qualifications proposées ici décrivent l'état réel du traitement tel qu'implémenté
          et restent à confirmer par le responsable du traitement.
        </p>

        <Article number="1" title="Responsable et finalités">
          <p>
            Responsable du traitement : à confirmer par le responsable du projet / Ministère du
            Job et Bonheur.
          </p>
          <p>Finalités :</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>création, authentification et gestion des comptes utilisateurs ;</li>
            <li>gestion des profils candidats et des comptes employeurs ;</li>
            <li>publication, géocodage et consultation des offres d'emploi ;</li>
            <li>dépôt, transmission et suivi des candidatures et de leurs pièces jointes ;</li>
            <li>recherche d'offres à proximité, par géolocalisation ou par saisie d'une commune ;</li>
            <li>mesure de l'audience d'une offre pour le tableau de bord de l'employeur ;</li>
            <li>signalement des offres frauduleuses ou non conformes, et modération ;</li>
            <li>sécurité et bon fonctionnement technique du Service.</li>
          </ul>
        </Article>

        <Article number="2" title="Données effectivement stockées">
          <DataTable
            headers={['Catégorie', 'Données', 'Stockage']}
            rows={[
              ['Compte', 'e-mail, rôle, mot de passe haché, dates de création et de mise à jour', 'users.email, role, password_hash, created_at, updated_at'],
              ['Profil candidat', 'nom, prénom, compétences, expérience, disponibilité', 'job_seekers.first_name, last_name, skills, experience, availability'],
              ['Compte employeur', "entreprise, description, téléphone, vérification d'activité", 'employers.company_name, description, phone, activity_verified'],
              ['Offre', 'titre, description, type et durée de contrat, mode et temps de travail, adresse, commune', 'jobs.title, description, contract_type, contract_duration, work_mode, time_commitment, location_address, location_city'],
              ["Géolocalisation d'une offre", 'point WGS84, source, score, date, statut', 'jobs.location, geocoding_source, geocoding_score, geocoded_at, location_status'],
              ["Audience d'une offre", 'compteur de consultations, sans donnée sur le visiteur', 'jobs.view_count'],
              ['Candidature', 'candidat, offre, statut, nom, prénom, téléphone, message, dates', 'applications.job_seeker_id, job_id, status, first_name, last_name, phone, message, created_at, updated_at'],
              ['Documents de candidature', "type, nom d'origine, chemin de stockage, type MIME, taille", 'application_documents.kind, original_name, stored_path, mime_type, size_bytes - le fichier lui-même est sur disque, hors base'],
              ['Signalement', 'offre, auteur, motif, commentaire, statut, date', 'reports.job_id, reporter_id, reason, comment, status, created_at'],
              ['Avertissement', 'compte visé, administrateur émetteur, motif, date', 'warnings.user_id, issued_by, reason, created_at'],
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Minimisation appliquée au modèle de données : aucune date de naissance, aucune
            adresse personnelle du candidat, aucun numéro d'identification national. Les
            coordonnées Lambert-93 ne sont pas stockées, elles sont calculées à la demande à
            partir du point WGS84.
          </p>
        </Article>

        <Article number="3" title="Bases légales proposées">
          <DataTable
            headers={['Traitement', 'Base légale']}
            rows={[
              ['Compte, authentification, profils', 'Exécution du contrat'],
              ['Offres et candidatures', 'Exécution du contrat'],
              ['Documents de candidature', 'Exécution du contrat'],
              ['Recherche par commune', 'Exécution du contrat / fourniture du service'],
              ["Géocodage d'une offre", 'Exécution du contrat / fourniture du service'],
              ["Géolocalisation de l'Utilisateur", 'Consentement'],
              ["Compteur de vues d'une offre", 'Intérêt légitime (tableau de bord employeur), sous réserve de validation'],
              ['Signalement et modération', "Intérêt légitime / obligation de retrait des contenus illicites, sous réserve de validation"],
              ["Avertissement d'un compte", 'Intérêt légitime (sécurité du Service), sous réserve de validation'],
              ['Sécurité et fonctionnement technique', 'Intérêt légitime, sous réserve de validation'],
            ]}
          />
          <p className="text-xs text-muted-foreground">
            La qualification définitive des bases légales doit être confirmée par le responsable
            du traitement.
          </p>
        </Article>

        <Article number="4" title="Géolocalisation et minimisation">
          <p>
            La position GPS de l'Utilisateur n'est jamais enregistrée en base de données. Elle
            est transmise en paramètre de recherche, le temps d'une requête, si et seulement si
            l'Utilisateur autorise le navigateur à la communiquer. Aucun historique de
            déplacements n'est constitué.
          </p>
          <p>
            En cas de refus, la recherche reste entièrement disponible par saisie manuelle d'une
            commune. Le refus ou le retrait du consentement n'entraîne ni suppression du compte,
            ni perte du profil, des offres ou des candidatures.
          </p>
          <p>
            La localisation d'une offre est en revanche conservée : elle correspond au lieu de
            travail déclaré par l'employeur, non à une personne, et elle est nécessaire à
            l'affichage cartographique. Elle est obtenue par géocodage de l'adresse saisie.
          </p>
          <p>
            Le compteur de vues d'une offre est un simple entier incrémenté à la consultation. Il
            n'enregistre ni identifiant, ni adresse IP, ni horodatage par visiteur : il ne permet
            donc pas de reconstituer qui a consulté une offre.
          </p>
        </Article>

        <Article number="5" title="Durées de conservation proposées">
          <DataTable
            headers={['Données', 'Durée cible']}
            rows={[
              ['Compte / profil', "Durée d'utilisation du compte, puis suppression à l'initiative de l'Utilisateur"],
              ['Offre', 'Publication, archivage automatique à 30 jours, puis 2 ans au maximum après archivage'],
              ['Candidature', "Traitement, puis 2 ans au maximum après clôture, sauf demande d'effacement"],
              ['Documents de candidature', 'Même durée que la candidature, fichier sur disque compris'],
              ["Localisation d'une offre", "Même durée que l'offre"],
              ['Compteur de vues', "Même durée que l'offre"],
              ["Position GPS de l'Utilisateur", 'Aucune conservation'],
              ['Signalement', 'À définir selon la suite donnée et les besoins de preuve'],
              ['Avertissement', 'À définir'],
              ['Journaux techniques', 'À définir selon les journaux réellement produits et leur finalité'],
            ]}
          />
          <p>
            Implémenté aujourd'hui : l'archivage automatique d'une offre à 30 jours, et la
            suppression du compte à la demande, qui efface immédiatement l'ensemble des données
            rattachées. Non implémenté : la purge automatique des offres et candidatures au terme
            des deux ans, qui devra être développée avant toute mise en production.
          </p>
        </Article>

        <Article number="6" title="Destinataires">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>L'Utilisateur concerné, pour ses propres données.</li>
            <li>
              L'Employeur, pour les informations et documents nécessaires au traitement des
              candidatures reçues sur ses propres offres.
            </li>
            <li>Le Candidat, pour le suivi de ses propres candidatures.</li>
            <li>
              Les administrateurs habilités, pour la modération des offres, le traitement des
              signalements et la gestion des comptes.
            </li>
            <li>
              Les composants techniques nécessaires au Service : base de données
              PostgreSQL/PostGIS et stockage des fichiers, exécutés dans l'infrastructure du
              projet.
            </li>
          </ul>
          <p>Sous-traitants et services tiers appelés :</p>
          <DataTable
            headers={['Service', 'Données transmises', 'Fournisseur']}
            rows={[
              ['Fonds de carte', 'Requêtes de tuiles depuis le navigateur', 'IGN - Géoplateforme'],
              ["Géocodage d'une offre", "Adresse de l'offre, depuis le serveur", 'API Adresse (api-adresse.data.gouv.fr)'],
              ['Autocomplétion et recherche par commune', "Saisie de l'Utilisateur, depuis le navigateur", 'API Adresse (api-adresse.data.gouv.fr)'],
            ]}
          />
          <p>Aucune vente ni transmission publicitaire n'est prévue.</p>
          <ToValidate>
            qualification exacte de ces services au regard du RGPD (sous-traitant ou non) et
            conditions contractuelles applicables.
          </ToValidate>
        </Article>

        <Article number="7" title="Données non collectées">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Pas de position GPS permanente ni d'historique des déplacements.</li>
            <li>Pas de conservation de la position GPS personnelle après la recherche.</li>
            <li>Pas d'identification du visiteur derrière le compteur de vues d'une offre.</li>
            <li>Pas de données bancaires : le Service ne comporte aucun paiement.</li>
            <li>Pas de données de santé ni de données biométriques.</li>
            <li>
              Pas de données relatives aux opinions politiques, convictions religieuses, origine
              ou orientation sexuelle.
            </li>
            <li>Pas de traceur publicitaire ni d'outil de mesure d'audience tiers.</li>
            <li>Pas de données personnelles réelles dans le jeu de données de démonstration.</li>
          </ul>
        </Article>

        <Article number="8" title="Droits des personnes">
          <p>
            Selon les conditions applicables : accès, rectification, effacement, limitation,
            opposition lorsque applicable, portabilité et retrait du consentement.
          </p>
          <p>
            <strong>Effacement - implémenté.</strong> L'Utilisateur peut supprimer son compte
            depuis l'application. La suppression retire en cascade le profil, les offres
            publiées, les candidatures déposées ou reçues et les enregistrements de documents ;
            les fichiers correspondants sont également supprimés du disque. Le cookie
            d'authentification est invalidé dans le même mouvement.
          </p>
          <p>
            <strong>Rectification - implémenté</strong> pour le profil et les offres,
            modifiables par leur titulaire. Une candidature déjà envoyée n'est pas modifiable :
            elle constitue un instantané que l'employeur doit continuer de voir inchangé.
          </p>
          <p>
            Le retrait du consentement à la géolocalisation ne doit entraîner ni suppression du
            compte, ni perte du profil ou des candidatures.
          </p>
          <ToValidate>
            procédure d'exercice des droits d'accès, de limitation, d'opposition et de
            portabilité, modalités d'identification du demandeur et délais de réponse.
          </ToValidate>
        </Article>

        <Article number="9" title="Mesures de sécurité">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Mots de passe hachés, jamais stockés en clair.</li>
            <li>
              Authentification par jeton signé, transporté dans un cookie HTTP-only inaccessible
              aux scripts de la page.
            </li>
            <li>
              Contrôle des accès par rôle appliqué côté serveur : une requête sans session est
              refusée, une requête avec le mauvais rôle également. L'interface ne constitue pas
              la seule barrière.
            </li>
            <li>
              Séparation des droits entre demandeur d'emploi, employeur et administrateur. Le
              rôle administrateur ne peut pas être obtenu par le formulaire d'inscription.
            </li>
            <li>
              Contraintes d'intégrité et contraintes d'unicité en base : une candidature par
              candidat et par offre, un signalement par compte et par offre, un document de
              chaque type par candidature.
            </li>
            <li>
              Contrôle du type MIME et de la taille des fichiers transmis, avec vérification
              pendant la lecture par blocs plutôt que sur la taille déclarée par le client.
            </li>
            <li>
              Nom de stockage des fichiers généré côté serveur : le nom fourni par l'Utilisateur
              n'entre jamais dans la construction d'un chemin.
            </li>
            <li>Absence de secrets applicatifs dans le code source.</li>
          </ul>
          <ToValidate>
            avant mise en production : rotation du secret de signature des jetons, activation du
            cookie sécurisé (HTTPS uniquement), et politique de journalisation.
          </ToValidate>
        </Article>

        <Article number="10" title="Points soumis à validation juridique">
          <DataTable
            headers={['Sujet', 'État']}
            rows={[
              ['Responsable de traitement définitif', 'À valider'],
              ['Bases légales, en particulier intérêt légitime du compteur de vues et de la modération', 'À valider'],
              ['Durées de conservation et implémentation de la purge', 'À valider'],
              ["Procédure d'exercice des droits", 'À valider'],
              ['Destinataires et qualification des sous-traitants', 'À valider'],
              ['Journaux techniques : existence, contenu, durée', 'À valider'],
              ['Conservation des signalements et des avertissements', 'À valider'],
              ["Information RGPD présentée aux utilisateurs et recueil du consentement à la géolocalisation", 'À valider'],
              ["Analyse d'impact (AIPD) : nécessité à confirmer", 'À valider'],
            ]}
          />
        </Article>

        <Article number="11" title="Évolutions par rapport à la version 1.0">
          <p>
            La version 1.0 décrivait ChômageGo sous le cahier des charges précédent. Les
            changements suivants ont été apportés :
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Nom du service : ChômageGo devient GéoEmploi.</li>
            <li>
              Nouvelles catégories de données : documents de candidature, signalements,
              avertissements, compteur de vues, ainsi que les champs ajoutés aux offres (mode et
              temps de travail) et aux employeurs (description, téléphone).
            </li>
            <li>
              Coordonnées de candidature : la candidature stocke désormais ses propres nom,
              prénom et téléphone, distincts du profil. Le numéro de téléphone quitte donc le
              profil candidat pour la candidature.
            </li>
            <li>
              Suppression du compte : passe de mesure prévue à mesure implémentée, avec
              effacement des fichiers sur disque.
            </li>
            <li>Archivage à 30 jours : nouvelle exigence du cahier des charges, implémentée.</li>
            <li>
              Services tiers : les fournisseurs réellement appelés sont nommés, à savoir l'IGN
              Géoplateforme et l'API Adresse.
            </li>
            <li>
              Mesures de sécurité : ajout des contrôles sur les fichiers transmis et de la
              génération serveur des noms de stockage.
            </li>
            <li>
              Bases légales : ajout des lignes correspondant au compteur de vues, à la
              modération et aux avertissements.
            </li>
          </ul>
        </Article>

        <div className="rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <p>Document préparé par : Amayyas AOUADENE - Chef de projet</p>
          <p>Destinataire : Florine Pontaillac - Conseillère juridique</p>
          <p>Version : 2.0 - Projet</p>
          <p className="font-medium text-foreground">Statut : En attente de validation juridique</p>
        </div>
      </div>
    </PageShell>
  )
}
