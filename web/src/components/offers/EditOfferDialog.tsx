import { useState, type FormEvent } from 'react'
import {
  OfferFormFields,
  hasDuration,
  requiresAddress,
  type OfferDraft,
} from '@/components/offers/OfferFormFields'
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

type EditOfferDialogProps = {
  offer: MyOffer
  onSaved: (offer: MyOffer) => void
}

function draftFrom(offer: MyOffer): OfferDraft {
  return {
    title: offer.title,
    description: offer.description,
    contract_type: offer.contract_type,
    contract_duration: offer.contract_duration ?? '',
    work_mode: offer.work_mode,
    time_commitment: offer.time_commitment,
    address: offer.address ?? '',
  }
}

export function EditOfferDialog({ offer, onSaved }: EditOfferDialogProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<OfferDraft>(() => draftFrom(offer))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Reopening must show the offer as it stands, not an abandoned draft.
  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(draftFrom(offer))
      setError('')
    }
    setOpen(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (requiresAddress(draft.work_mode) && !draft.address.trim()) {
      setError('Une adresse est nécessaire pour ce mode de travail.')
      return
    }

    const addressChanged = draft.address !== (offer.address ?? '')

    setIsSaving(true)
    setError('')
    try {
      const updated = await api<MyOffer>(`/api/offres/${offer.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          contract_type: draft.contract_type,
          contract_duration: hasDuration(draft.contract_type) ? draft.contract_duration : null,
          work_mode: draft.work_mode,
          time_commitment: draft.time_commitment,
          ...(addressChanged || draft.work_mode !== 'remote' ? { address: draft.address } : {}),
        }),
      })

      onSaved({
        ...offer,
        title: updated.title,
        description: updated.description,
        contract_type: updated.contract_type,
        contract_duration: updated.contract_duration,
        work_mode: updated.work_mode,
        time_commitment: updated.time_commitment,
        address: updated.address,
        city: updated.city,
        // The API geocodes asynchronously and PATCH does not echo the status,
        // so mirror what the server will have done with the new address.
        location_status:
          updated.work_mode === 'remote'
            ? 'pending'
            : addressChanged
              ? 'geocoded'
              : offer.location_status,
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Modifier
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'offre</DialogTitle>
          <DialogDescription>
            Les candidatures déjà reçues sont conservées.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <OfferFormFields
            idPrefix={`edit-${offer.id}`}
            draft={draft}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          />
          <FieldError>{error}</FieldError>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Annuler</Button>} />
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
