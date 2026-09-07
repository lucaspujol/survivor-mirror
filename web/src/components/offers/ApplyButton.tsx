import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api'
import { applyToOffer } from '@/lib/applications'
import { useAuth } from '@/lib/auth'

type ApplyButtonProps = {
  offerId: number
  isExpired: boolean
}

/**
 * Brief: browsing is public, applying requires an authenticated seeker. A
 * signed-out visitor is sent to sign-in with the current page remembered.
 */
export function ApplyButton({ offerId, isExpired }: ApplyButtonProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [isSending, setIsSending] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  if (!user) {
    return (
      <Button render={<Link to="/login" state={{ from: location }} />}>
        Se connecter pour postuler
      </Button>
    )
  }

  if (user.role !== 'seeker') return null

  if (isExpired) {
    return (
      <Button disabled>Offre archivée</Button>
    )
  }

  async function handleApply() {
    setIsSending(true)
    try {
      await applyToOffer(offerId)
      setHasApplied(true)
      toast.success('Candidature envoyée. Votre profil a été transmis à l\'employeur.')
    } catch (err) {
      // 409 is the "already applied" case: it is an outcome, not a failure.
      if (err instanceof ApiError && err.status === 409) {
        setHasApplied(true)
        toast.info(err.message)
      } else {
        toast.error(err instanceof Error ? err.message : 'Erreur lors de la candidature.')
      }
    } finally {
      setIsSending(false)
    }
  }

  if (hasApplied) {
    return (
      <Button variant="outline" render={<Link to="/candidatures" />}>
        Candidature envoyée — suivre
      </Button>
    )
  }

  return (
    <Button onClick={handleApply} disabled={isSending}>
      {isSending ? 'Envoi…' : 'Postuler'}
    </Button>
  )
}
