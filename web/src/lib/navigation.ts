const TITLES: Record<string, string> = {
  '/': 'Carte des offres',
  '/candidatures': 'Mes candidatures',
  '/mes-offres': 'Mes offres',
  '/me': 'Mon compte',
  '/admin/utilisateurs': 'Utilisateurs',
}

export function pageTitle(pathname: string): string {
  return TITLES[pathname] ?? 'GéoEmploi'
}
