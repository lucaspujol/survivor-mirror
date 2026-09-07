# Fonctionnalités reportées — comment les réimplémenter

Quatre exigences prioritaires du cahier des charges ont été implémentées puis
**retirées** de la branche à la demande du cabinet (gel du 7 septembre 2026).
Le code n'est pas perdu : il est intégralement conservé dans l'historique Git.

## Récupérer le code d'un coup

Le commit d'implémentation est `e9569cf`, annulé par le commit de revert qui le
suit. Pour tout remettre en place :

```sh
git revert <sha-du-commit-de-revert>   # annule l'annulation
docker compose exec api alembic upgrade head
```

Si la branche a divergé depuis, récupérer fichier par fichier :

```sh
git checkout e9569cf -- api/app/routers/applications.py
git show e9569cf -- api/app/main.py | git apply -
```

**Attention** : le revert a également conservé volontairement trois
corrections de bugs (voir « Ce qui a été gardé » en bas). Ne pas les réappliquer
une seconde fois.

---

## 1. Candidatures (cahier des charges §2.1, §2.2)

**Migration** — aucune. La table `applications` existe déjà depuis
`0001_initial_schema` (contrainte `uq_applications_job_seeker` incluse).

**Fichier à recréer** : `api/app/routers/applications.py`, monté dans
`api/app/main.py` via `app.include_router(applications.router)`.

| Route | Rôle | Comportement |
| --- | --- | --- |
| `POST /api/candidatures` | `CurrentSeeker` | Corps `{job_id}`. 404 offre inconnue, 409 si déjà postulé, 409 si offre archivée. |
| `GET /api/offres/{id}/candidatures` | `CurrentEmployer` | 403 si l'offre n'appartient pas à l'appelant. Renvoie le profil complet du candidat. |
| `PATCH /api/candidatures/{id}` | `CurrentEmployer` | Corps `{status}` parmi `sent`/`under_review`/`accepted`/`rejected`. 403 si l'offre n'est pas la sienne. |

**Schémas** (`api/app/schemas.py`) : `ApplicationCreateIn`, `SeekerProfileOut`,
`EmployerApplicationOut`, `ApplicationStatusIn`.

Points qui ont demandé de l'attention :
- Le cahier des charges impose la **transmission du profil** à l'employeur. Le
  payload d'envoi ne contient donc que `job_id` : le profil est déjà en base
  (`job_seekers`), il est joint à la lecture côté employeur.
- Charger le candidat avec
  `joinedload(Application.job_seeker).joinedload(JobSeeker.user)`, sinon l'email
  déclenche une requête par ligne.

**Front** : `web/src/lib/applications.ts` (client + libellés + styles de
statut), `web/src/components/offers/ApplyButton.tsx` (gère les trois états :
visiteur non connecté → lien `/login` avec `state={{ from: location }}`,
candidat → POST, déjà postulé → lien vers `/candidatures`),
`web/src/components/offers/OfferApplicantsDialog.tsx` +
`ApplicantCard.tsx` (liste des candidats et changement de statut).
`OfferDetail.tsx` remplace le `toast.info('Les candidatures arrivent bientôt.')`
par `<ApplyButton />`.

Le 409 « déjà postulé » doit être traité comme un **résultat**, pas une erreur :
`ApiError.status === 409` → afficher l'état « candidature envoyée ».

## 2. Notifications in-app (§2.2)

Le cahier des charges demande une notification à chaque nouvelle candidature et
**exclut l'e-mail**. C'est donc une simple ligne en base que le destinataire lit
depuis son écran.

**Migration** : table `notifications` — `id`, `user_id` (FK users, CASCADE),
`type`, `title`, `body`, `job_id` (FK jobs, **`ON DELETE SET NULL`**), `read_at`,
`created_at`, index `(user_id, created_at)`, CHECK sur `type`.

Le `SET NULL` est délibéré : une notification est le constat de ce qui était
vrai au moment où elle est partie. Supprimer l'offre ne doit pas réécrire son
message, seulement casser le lien.

**Écriture** : dans la **même transaction** que l'événement déclencheur (le
`db.add(Notification(...))` est fait avant le `db.commit()` de la candidature),
sinon une notification peut décrire une candidature annulée.

**Routes** : `GET /api/notifications`, `POST /api/notifications/{id}/lu`,
`POST /api/notifications/lues` (tout marquer lu, 204).

**Front** : `web/src/lib/notifications.ts`, `web/src/pages/NotificationsPage.tsx`,
entrée de menu dans `app-sidebar.tsx` (hors `roleItems` : tous les rôles
connectés reçoivent des notifications), route sous `RequireAuth` dans `App.tsx`,
titre dans `lib/navigation.ts`.

## 3. Signalement d'offres (§5)

**Migration** : table `reports` — `id`, `job_id` (FK jobs CASCADE),
`reporter_id` (FK users CASCADE), `reason`, `details` (texte libre, max 2000),
`status`, `created_at`, `updated_at`, `UNIQUE(job_id, reporter_id)`,
index sur `status`.

L'unicité par (offre, signalant) évite qu'un même compte gonfle la file de
modération.

**Routes** : `POST /api/signalements` (tout compte connecté),
`GET /api/admin/signalements` (file de modération, `pending` en premier),
`PATCH /api/admin/signalements/{id}` (`reviewed` / `dismissed`).

Supprimer l'offre litigieuse reste un appel séparé — `DELETE /api/offres/{id}`,
qu'un admin peut déjà passer sur n'importe quelle offre via
`require_owner_or_admin`.

**Front** : `web/src/lib/reports.ts`,
`web/src/components/offers/ReportOfferDialog.tsx` (remplace le
`toast.info('Signalement enregistré côté interface.')`),
`web/src/pages/AdminReportsPage.tsx` + `web/src/components/admin/ReportRow.tsx`,
entrée « Modération » dans `adminItems`.

## 4. Expiration des offres à 30 jours (§2.2)

**Migration** : colonne `jobs.expires_at`, `server_default`
`now() + interval '30 days'`, **backfill obligatoire** avant de passer la
colonne en `NOT NULL` :

```sql
UPDATE jobs SET expires_at = created_at + interval '30 days';
```

Sans ce backfill, toutes les offres de démonstration expirent le même jour et
les libellés « Expire dans X j » deviennent faux.

**Archivage paresseux**, pas de tâche planifiée (conforme au `CLAUDE.md`) :
`GET /api/offres` ajoute `.where(Job.expires_at > func.now())`. La ligne reste
en base et reste visible dans « Mes offres » pour l'employeur qui la possède.

`POST /api/candidatures` refuse une offre dont `expires_at` est dépassé (409).

**Front** : exposer `expires_at` dans `JobOffer` (main.py) et
`EmployerOfferOut` (schemas.py + dashboard.py), puis faire lire cette date au
client au lieu de la recalculer :

```ts
export function daysLeft(offer: { expires_at: string }): number {
  const remaining = new Date(offer.expires_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(remaining / 86_400_000))
}
```

La constante `OFFER_LIFETIME_DAYS = 30` de `web/src/lib/offers.ts` devient
inutile à ce moment-là : la règle vit dans le `server_default`.

---

## Ce qui a été gardé (ne pas réappliquer)

Trois corrections livrées dans le même commit ont été **conservées** lors du
revert, parce que ce sont des bugs et non des fonctionnalités :

1. `JobOffer` expose `created_at` et `employer_id`. Sans eux, tous les libellés
   de date de la carte affichaient `NaN` et le filtre par période ne
   correspondait à rien.
2. Les schémas de **sortie** n'utilisent plus `EmailStr`. `EmailStr` refuse les
   TLD réservés (`.local`, `.test`) : un compte existant en
   `contact@marie-dupont.seed.local` faisait répondre 500 à
   `/api/admin/utilisateurs` et n'aurait pas pu se connecter. La validation
   reste sur les schémas d'entrée.
3. `NotFoundPage` utilise `PageShell`, comme toutes les autres pages hors carte
   et hors authentification.

## Reste à faire, jamais implémenté

Non couvert par le commit annulé, et toujours absent du produit :
suppression de compte (§3.3, RGPD), édition du profil professionnel du candidat,
vérification d'activité employeur, suspension de compte et tableau de bord de
métriques nationales côté admin, périmètre de diffusion d'une offre, compteur de
vues, mention RGPD visible par un visiteur non connecté, documentation d'API et
rétrospective.
