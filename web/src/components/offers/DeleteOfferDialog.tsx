import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { FieldError } from '@/components/ui/field'
import { api } from '@/lib/api'
import type { MyOffer } from '@/lib/my-offers'

type DeleteOfferDialogProps = {
  offer: MyOffer
  onDeleted: () => void
}

export function DeleteOfferDialog({ offer, onDeleted }: DeleteOfferDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setIsDeleting(true)
    setError('')
    try {
      await api<void>(`/api/offres/${offer.id}`, { method: 'DELETE' })
      setOpen(false)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setError('')
        setOpen(next)
      }}
    >
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            Supprimer
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer « {offer.title} » ?</DialogTitle>
          <DialogDescription>
            L'offre est retirée de la carte définitivement.
            {offer.application_count > 0 &&
              ` ${offer.application_count} candidature${offer.application_count > 1 ? 's' : ''} y ${offer.application_count > 1 ? 'sont rattachées' : 'est rattachée'}.`}
          </DialogDescription>
        </DialogHeader>
        <FieldError>{error}</FieldError>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline">Annuler</Button>} />
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Suppression…' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
