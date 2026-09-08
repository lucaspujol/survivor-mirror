import { useState, type FormEvent } from 'react'
import { FlagIcon } from 'lucide-react'
import { REPORT_REASONS } from '@/components/reportReasons'
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

type ReportOfferDialogProps = {
  offerId: number
}

export function ReportOfferDialog({ offerId }: ReportOfferDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('fraudulent')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next) setError('')
    setOpen(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await api(`/api/offres/${offerId}/signalements`, {
        method: 'POST',
        body: JSON.stringify({ reason, comment: comment.trim() || null }),
      })
      setSubmitted(true)
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du signalement.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <FlagIcon />
        Offre signalée
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <FlagIcon />
            Signaler cette offre
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Signaler cette offre</DialogTitle>
          <DialogDescription>
            Votre signalement sera examiné par l'administration.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="report-reason">Motif</FieldLabel>
              <Select value={reason} onValueChange={(value) => setReason(value as string)}>
                <SelectTrigger id="report-reason" className="w-full">
                  <SelectValue>
                    {(value) => REPORT_REASONS.find((r) => r.value === value)?.label ?? (value as string)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="report-comment">Commentaire (facultatif)</FieldLabel>
              <Textarea
                id="report-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder="Précisez si besoin…"
              />
              <FieldDescription>
                Un compte ne peut signaler une même offre qu'une seule fois.
              </FieldDescription>
            </Field>

            <FieldError>{error}</FieldError>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Annuler</Button>} />
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi…' : 'Signaler'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
