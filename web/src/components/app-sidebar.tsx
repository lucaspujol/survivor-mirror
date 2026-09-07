import { Link } from 'react-router'
import { NavMain, type NavItem } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth, type Role } from '@/lib/auth'
import { BriefcaseIcon, FileTextIcon, MapIcon, UsersIcon } from 'lucide-react'

const mapItem: NavItem = { title: 'Carte', url: '/', icon: <MapIcon /> }

// Only what the role can actually open: an entry that would land on a 404 or
// on a screen the API refuses is worse than no entry at all.
const roleItems: Record<Role, NavItem[]> = {
  seeker: [{ title: 'Mes candidatures', url: '/candidatures', icon: <FileTextIcon /> }],
  employer: [{ title: 'Mes offres', url: '/mes-offres', icon: <BriefcaseIcon /> }],
  admin: [],
}

const adminItems: NavItem[] = [
  { title: 'Utilisateurs', url: '/admin/utilisateurs', icon: <UsersIcon /> },
]

/**
 * Identité neutre : le nom du produit en typographie, sans bloc-marque.
 * Aucun visuel de l'État, conformément au gel du 7 septembre 2026.
 */
function SidebarBrand() {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  if (isCollapsed) {
    return (
      <span className="font-heading text-lg font-bold tracking-tight text-primary">
        C
      </span>
    )
  }

  return (
    <div className="flex flex-col items-start">
      <span className="font-heading text-xl leading-none font-bold tracking-tight text-primary">
        Chômage<span className="text-foreground">Go</span>
      </span>
      <span className="mt-1.5 text-[11px] leading-tight text-muted-foreground">
        Démonstrateur technique
      </span>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link to="/" className="block px-2 py-2 hover:opacity-90">
          <SidebarBrand />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label="Navigation"
          items={[mapItem, ...(user ? roleItems[user.role] : [])]}
        />
        {user?.role === 'admin' && <NavMain label="Administration" items={adminItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
