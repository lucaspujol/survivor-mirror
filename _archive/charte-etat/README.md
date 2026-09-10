# Charte graphique de l'État - mise de côté

Retiré des interfaces le 7 septembre 2026 sur consigne du cabinet : apposer le
bloc-marque de l'État revient à donner un engagement institutionnel que le
cabinet n'est plus en mesure de donner.

**Conservé, pas jeté.** Rien ici n'est servi par l'application : ce dossier est
hors de `web/public/`, donc aucun de ces fichiers n'est accessible par URL.

| Fichier | Où il était utilisé |
| --- | --- |
| `logo-de-la-republique-francaise.png` | bloc-marque de l'en-tête de la barre latérale (`app-sidebar.tsx`) |
| `ministere-job-et-bonheur.png` | non référencé dans le code au moment du retrait |
| `favicon.png` | favicon déclaré dans `web/index.html` |

Pour un éventuel rétablissement : `git log --follow` sur ces fichiers, et le
commit de retrait contient le diff exact des interfaces.

## Ajouts du même retrait

| Fichier | Motif |
| --- | --- |
| `logo_chomage_go-tricolore.png` | logotype produit en bleu-blanc-rouge sur bleu institutionnel : non référencé dans le code, mais servi depuis `web/public/logo/`. Le dossier `logo/` a été supprimé, il était vide ensuite. |
