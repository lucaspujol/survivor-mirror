import { Link } from 'react-router'
import { NavMain, type NavItem } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth'
import {
  BriefcaseIcon,
  FileTextIcon,
  FlagIcon,
  MapIcon,
  MapPinnedIcon,
  UsersIcon,
} from 'lucide-react'

const mainItems: NavItem[] = [
  { title: 'Carte', url: '/', icon: <MapIcon /> },
  { title: 'Mes candidatures', url: '/candidatures', icon: <FileTextIcon /> },
  { title: 'Mes offres', url: '/mes-offres', icon: <BriefcaseIcon /> },
]

const adminItems: NavItem[] = [
  { title: 'Signalements', url: '/admin/signalements', icon: <FlagIcon /> },
  { title: 'Utilisateurs', url: '/admin/utilisateurs', icon: <UsersIcon /> },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <MapPinnedIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">ChômageGo</span>
                <span className="truncate text-xs">Offres près de chez vous</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Navigation" items={mainItems} />
        {user?.role === 'admin' && <NavMain label="Administration" items={adminItems} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
