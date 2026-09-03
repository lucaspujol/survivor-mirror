import {
  BriefcaseIcon,
  FileTextIcon,
  FlagIcon,
  MapIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/lib/auth'

export type NavItem = {
  title: string
  url: string
  icon: LucideIcon
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

const MAP: NavItem = { title: 'Carte', url: '/', icon: MapIcon }
const APPLICATIONS: NavItem = {
  title: 'Mes candidatures',
  url: '/candidatures',
  icon: FileTextIcon,
}
const MY_OFFERS: NavItem = { title: 'Mes offres', url: '/mes-offres', icon: BriefcaseIcon }

const ADMIN: NavItem[] = [
  { title: 'Signalements', url: '/admin/signalements', icon: FlagIcon },
  { title: 'Utilisateurs', url: '/admin/utilisateurs', icon: UsersIcon },
]

/**
 * Each role sees only the entries it can act on. A visitor sees both sides of
 * the product — clicking a protected entry bounces through /login — so the
 * features stay discoverable before signing up.
 */
export function navGroupsFor(role: Role | null): NavGroup[] {
  if (role === 'employer') {
    return [{ label: 'Recrutement', items: [MAP, MY_OFFERS] }]
  }

  if (role === 'seeker') {
    return [{ label: 'Recherche', items: [MAP, APPLICATIONS] }]
  }

  if (role === 'admin') {
    return [
      { label: 'Navigation', items: [MAP] },
      { label: 'Administration', items: ADMIN },
    ]
  }

  return [{ label: 'Navigation', items: [MAP, APPLICATIONS, MY_OFFERS] }]
}

const TITLES: Record<string, string> = {
  '/': 'Carte des offres',
  '/candidatures': 'Mes candidatures',
  '/mes-offres': 'Mes offres',
  '/me': 'Mon compte',
  '/admin/signalements': 'Signalements',
  '/admin/utilisateurs': 'Utilisateurs',
}

export function pageTitle(pathname: string): string {
  return TITLES[pathname] ?? 'GéoEmploi'
}
