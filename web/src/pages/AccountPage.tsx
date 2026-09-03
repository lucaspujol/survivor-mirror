import { DangerZoneCard } from '@/components/account/DangerZoneCard'
import { PrivacyCard } from '@/components/account/PrivacyCard'
import { ProfileCard } from '@/components/account/ProfileCard'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { LogOutIcon } from 'lucide-react'

export function AccountPage() {
  const { user, logout } = useAuth()

  // RequireAuth guarantees a user here.
  if (!user) return null

  return (
    <PageShell
      title="Mon compte"
      description="Vos informations et l'usage qui est fait de vos données."
      actions={
        <Button variant="outline" onClick={() => void logout()}>
          <LogOutIcon />
          Se déconnecter
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <ProfileCard user={user} />
        <PrivacyCard />
        <DangerZoneCard />
      </div>
    </PageShell>
  )
}
