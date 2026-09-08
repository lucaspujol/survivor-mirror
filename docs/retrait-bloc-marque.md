# Retrait du bloc-marque de l'État — inventaire et preuve

Consigne du cabinet, 7 septembre 2026. Aucun visuel de l'État ne subsiste dans
les interfaces. Les fichiers sont **conservés** dans `_archive/charte-etat/`,
hors de `web/public/`, donc plus servis par l'application.

## Identité retenue (les trois lignes demandées)

1. **Nom** : « GéoEmploi » en typographie seule, sans bloc-marque, sans Marianne,
   sans mention « Ministère » — c'est le nom déjà porté par l'interface (titre
   d'onglet, page de connexion), donc aucun écran ne change de nom.
2. **Typographie** : Geist Variable, déjà présente dans les dépendances
   (`@fontsource-variable/geist`) et déjà déclarée en police de repli — le
   passage est donc sans nouvelle dépendance et sans risque de fonte manquante.
3. **Couleur primaire** : violet `#863BFF` (`oklch(0.568 0.264 293.4)`), reprise
   du favicon neutre déjà au dépôt ; volontairement éloignée du bleu
   institutionnel `#1B3A6B`, qu'aucun écran n'utilise plus.

## Où le bloc apparaissait, et ce qui a été fait

| Endroit | Avant | Après |
| --- | --- | --- |
| En-tête de la barre latérale | `logo-de-la-republique-francaise.png` + « Ministère du Job et du Bonheur » + « Liberté / Égalité / Fraternité » | Mot-symbole typographique « GéoEmploi » + « Démonstrateur technique » |
| Barre latérale repliée | Drapeau tricolore | Lettre « C » en typographie |
| Favicon | `favicon.jpg` (Marianne tricolore) | `favicon.svg` (marque neutre violette) |
| Titre d'onglet | « GéoEmploi » | « GéoEmploi — démonstrateur technique » |
| Typographie globale | Marianne (5 `@font-face`, `--font-heading`, `--font-sans`) | Geist Variable |
| Couleur primaire | `#1B3A6B` (`--primary`, `--ring`, `--sidebar-primary`, `--chart-1..5`, `--color-institutional`) | `#863BFF` (`--color-brand`) |
| Marqueur de carte | `job-marker.svg` en `#1B3A6B` | `#863BFF` |
| Contrôle de géolocalisation | `#1B3A6B` en dur (9 occurrences) | `#863BFF` |
| Marqueurs Leaflet | `markers.ts` en `#1b3a6b` | `#863bff` |
| Logotype produit | `logo_chomage_go.png`, bleu-blanc-rouge sur bleu institutionnel | archivé (n'était référencé par aucun écran, mais restait servi) |
| Visuel non référencé | `ministere-job-et-bonheur.png` | archivé |
| Documentation technique | « records the Ministry's validation » (`docs/database.md`) | « the platform operator's validation » |
| Balises de partage | absentes | ajoutées, neutres, portant la mention |

## Mention obligatoire

« Démonstrateur technique, ne constitue pas un service public en exploitation. »

Portée par `web/src/components/layout/DemoNotice.tsx`, montée dans les **deux**
gabarits, donc présente sur la totalité des pages :

- `AppLayout` — carte publique, écrans connectés, écrans vides, **404**
  (`/introuvable` et toute URL inconnue) ;
- `AuthLayout` — connexion et inscription ;
- `index.html` — `<meta name="description">`, `og:description`,
  `twitter:description`, donc aussi dans l'aperçu de partage.

La constante `DEMO_NOTICE` est exportée et réutilisée : le libellé n'existe
qu'à un seul endroit et ne peut pas diverger d'un écran à l'autre.

## Sans objet sur ce projet

Vérifié, ces supports n'existent pas dans le dépôt, il n'y avait donc rien à
retirer : **e-mails transactionnels** (aucun envoi, aucune dépendance SMTP dans
`api/requirements.txt`), **gabarits d'export PDF et CSV** (aucun code d'export),
**manifeste d'application** (aucun `manifest.webmanifest`), **captures dans le
README et la documentation** (aucune image référencée), **vidéos exportées**.

## Vérifications passées

```sh
cd web && npx tsc -b --noEmit && npm run lint   # 0 erreur
npm run build
grep -rilE "marianne|republique|ministere|1b3a6b" dist/   # aucun résultat
```

Aucun asset de l'État n'est plus servi : `/favicon.jpg`,
`/logo/logo-de-la-republique-francaise.png`, `/logo/logo_chomage_go.png` et
`/fonts/Marianne_2022/...` retournent désormais le fallback HTML du SPA et non
un fichier (`Content-Type: text/html`).

## Reste à faire

**Captures « après » des cinq écrans les plus visibles** — non fournies. Le
poste ne dispose pas d'accès navigateur automatisé dans cette session, donc
aucune capture n'a pu être produite. Les cinq écrans à photographier sont :
carte publique `/`, connexion `/login`, inscription `/register`, « Mes offres »
`/mes-offres`, page 404 `/introuvable`. Le code est prêt et vérifié par le
build ; il ne manque que la prise de vue.
