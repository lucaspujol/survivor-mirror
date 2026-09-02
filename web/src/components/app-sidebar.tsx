import { Link } from 'react-router'
import { NavMain, type NavItem } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/lib/auth'
import {
  BriefcaseIcon,
  FileTextIcon,
  FlagIcon,
  MapIcon,
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

function TricolorFlag({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <img
      src="/logo/logo-de-la-republique-francaise.png"
      alt="République française"
      className={cn('object-contain', className)}
      style={style}
    />
  )
}

function SidebarBrand() {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  if (isCollapsed) {
    return <TricolorFlag className="size-5" />
  }
 
  const X = 17
 
  return (
    <div
      className="flex flex-col items-start"
      style={{ '--x': `${X}px` } as React.CSSProperties}
    >
      <TricolorFlag className="w-auto" style={{ height: 'var(--x)' }} />
 
      <div
        className="font-heading font-bold uppercase"
        style={{
          marginTop: 'calc(var(--x) / 2)',
          fontSize: 'calc(var(--x) * 0.75)',
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        <div>Ministère du</div>
        <div style={{ marginTop: 'calc(var(--x) / 3)' }}>Job et du Bonheur</div>
      </div>
 
      <div
        className="font-heading text-muted-foreground italic"
        style={{
          marginTop: 'calc(var(--x) / 2)',
          fontSize: 'calc(var(--x) * 11 / 6 / 3.4)',
          lineHeight: 1.3,
        }}
      >
        <div>Liberté</div>
        <div>Égalité</div>
        <div>Fraternité</div>
      </div>
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
