import { useState } from 'react'
import { Link } from 'react-router'
import { JobMap } from '@/components/JobMap'
import { CreateOfferForm } from '@/components/Createofferform'
import { useAuth } from '@/lib/auth'

/** Publishing is reserved to employers, so everyone else is told what the
 *  panel is for instead of being shown a form the API would refuse. */
function PublishPanel({ onCreated }: { onCreated: () => void }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link to="/login" className="underline underline-offset-4">
          Connectez-vous
        </Link>{' '}
        avec un compte employeur pour publier une offre.
      </p>
    )
  }

  if (user.role !== 'employer') {
    return (
      <p className="text-sm text-muted-foreground">
        La publication d'offres est réservée aux comptes employeur.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Publier une offre</h2>
      <p className="text-sm text-muted-foreground">
        L'offre sera publiée au nom de {user.display_name} et placée sur la carte.
      </p>
      <CreateOfferForm onCreated={onCreated} />
    </div>
  )
}

export function HomePage() {
  const [refreshSignal, setRefreshSignal] = useState(0)

  return (
    <div>
      <h1 className="text-2xl font-semibold">Offres d'emploi</h1>
      <p className="text-muted-foreground mt-2">
        Explorez les offres disponibles près de chez vous
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <JobMap refreshSignal={refreshSignal} />
        <PublishPanel onCreated={() => setRefreshSignal((n) => n + 1)} />
      </div>
    </div>
  )
}
