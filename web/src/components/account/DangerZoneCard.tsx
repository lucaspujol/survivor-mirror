import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { useAuth, type User } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

/** What the account takes with it, in the words of the role that owns it. */
const CONSEQUENCES: Record<User['role'], string> = {
  seeker:
    'Vos candidatures, les CV et lettres de motivation que vous avez envoyés, et votre profil professionnel seront effacés.',
  employer:
    'Vos offres, les candidatures que vous avez reçues et les documents joints par les candidats seront effacés.',
  admin: 'Votre compte administrateur sera effacé.',
}

export function DangerZoneCard({ user }: { user: User }) {
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Typing the address is what separates an intentional deletion from a
  // mis-click: nothing here can be undone.
  const confirmed = confirmation.trim().toLowerCase() === user.email.toLowerCase()

  const submit = async () => {
    setDeleting(true)
    setError('')
    try {
      await deleteAccount()
      setOpen(false)
      toast.success('Compte supprimé', {
        description: 'Vos données ont été effacées.',
      })
      void navigate('/')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "La suppression a échoué. Réessayez dans un instant.",
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Supprimer mon compte</CardTitle>
        <CardDescription>
          {CONSEQUENCES[user.role]} Aucune restauration n'est possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (next) {
              setConfirmation('')
              setError('')
            }
            setOpen(next)
          }}
        >
          <DialogTrigger render={<Button variant="destructive">Supprimer définitivement</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Supprimer votre compte ?</DialogTitle>
              <DialogDescription>
                {CONSEQUENCES[user.role]} Cette action est irréversible.
              </DialogDescription>
            </DialogHeader>

            <Field>
              <FieldLabel htmlFor="delete-confirmation">
                Saisissez votre adresse email pour confirmer
              </FieldLabel>
              <Input
                id="delete-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                placeholder={user.email}
              />
              <FieldDescription>{user.email}</FieldDescription>
              {error && <FieldError>{error}</FieldError>}
            </Field>

            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                }
              />
              <Button
                type="button"
                variant="destructive"
                disabled={!confirmed || deleting}
                onClick={() => void submit()}
              >
                {deleting ? 'Suppression…' : 'Supprimer mon compte'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
