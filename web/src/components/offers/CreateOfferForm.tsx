import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { AddressAutocomplete } from '@/components/offers/AddressAutocomplete'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api'
import { createOffer } from '@/lib/offers'

type CreateOfferFormProps = {
  /** Company name is prefilled from the employer account and never asked twice. */
  company: string
  onCreated?: () => void
  onCancel?: () => void
}

export function CreateOfferForm({ company, onCreated, onCancel }: CreateOfferFormProps) {
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setError(null)
    setIsPending(true)
    try {
      await createOffer({
        title: String(data.get('title')),
        company,
        description: String(data.get('description')),
        address,
      })
      toast.success('Offre publiée', {
        description: "Elle apparaît sur la carte et expire dans 30 jours.",
      })
      form.reset()
      setAddress('')
      onCreated?.()
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'Publication impossible.',
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Intitulé du poste</FieldLabel>
          <Input id="title" name="title" placeholder="Développeur back-end" required />
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={5}
            placeholder="Missions, compétences attendues, type de contrat…"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Adresse du poste</FieldLabel>
          <AddressAutocomplete value={address} onChange={setAddress} />
          <FieldDescription>
            L'adresse est géocodée pour placer l'offre sur la carte.
          </FieldDescription>
        </Field>

        <FieldError>{error}</FieldError>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner />}
            {isPending ? 'Publication…' : "Publier l'offre"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
