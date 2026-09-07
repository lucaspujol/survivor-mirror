import { useState, type FormEvent } from 'react'
import { FlagIcon } from 'lucide-react'
import { toast } from 'sonner'
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
import { REPORT_REASONS, reasonLabel, reportOffer, type ReportReason } from '@/lib/reports'

type ReportOfferDialogProps = {
  offerId: number
  offerTitle: string
}

/** Brief §5: users must be able to flag fraudulent or non-compliant offers. */
export function ReportOfferDialog({ offerId, offerTitle }: ReportOfferDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('fraud')
  const [details, setDetails] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSending(true)
    setError('')
    try {
      await reportOffer(offerId, reason, details)
      setOpen(false)
      setDetails('')
      toast.success('Signalement transmis à la modération.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du signalement.')
    } finally {
      setIsSending(false)
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
          <Button variant="ghost" size="sm">
            <FlagIcon />
            Signaler cette offre
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Signaler « {offerTitle} »</DialogTitle>
          <DialogDescription>
            Le signalement est transmis à la modération. L'employeur reste responsable du
            contenu de son annonce.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="report-reason">Motif</FieldLabel>
              <Select
                value={reason}
                onValueChange={(value) => setReason(value as ReportReason)}
              >
                <SelectTrigger id="report-reason" className="w-full">
                  <SelectValue>{(value) => reasonLabel(value as string)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((entry) => (
                    <SelectItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="report-details">Précisions (facultatif)</FieldLabel>
              <Textarea
                id="report-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Ce qui vous paraît anormal dans cette offre."
              />
              <FieldDescription>
                Un même compte ne peut signaler une offre qu'une seule fois.
              </FieldDescription>
            </Field>
            <FieldError>{error}</FieldError>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline">Annuler</Button>} />
            <Button type="submit" disabled={isSending}>
              {isSending ? 'Envoi…' : 'Signaler'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
