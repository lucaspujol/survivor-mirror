import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ApiError, apiForm } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
  type ApplicationDetail,
} from '@/lib/applications'
import { FileField } from '@/components/applications/FileField'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type ApplyDialogProps = {
  jobId: number
  jobTitle: string
  company: string
  /** Called once the application is accepted, so the caller can mark the offer
   * as already applied to. */
  onApplied?: (application: ApplicationDetail) => void
}

/** Splits "Camille Fontaine" into a first and a last name, to prefill the form
 * from the account's display name. Everything after the first space is the
 * last name, so compound names survive. */
function splitDisplayName(displayName: string): [string, string] {
  const trimmed = displayName.trim()
  const separator = trimmed.indexOf(' ')
  if (separator === -1) return [trimmed, '']
  return [trimmed.slice(0, separator), trimmed.slice(separator + 1)]
}

export function ApplyDialog({ jobId, jobTitle, company, onApplied }: ApplyDialogProps) {
  const { user } = useAuth()
  const [defaultFirstName, defaultLastName] = splitDisplayName(user?.display_name ?? '')

  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState(defaultFirstName)
  const [lastName, setLastName] = useState(defaultLastName)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [cv, setCv] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [fileError, setFileError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setFileError('')

    if (!cv) {
      setFileError('Le CV est obligatoire.')
      return
    }
    // Checked here too, not only by the API: a 5 Mo file that is going to be
    // refused should not be uploaded first.
    const tooLarge = [cv, coverLetter].find((file) => file && file.size > MAX_FILE_SIZE)
    if (tooLarge) {
      setFileError(`« ${tooLarge.name} » dépasse ${MAX_FILE_SIZE_LABEL}.`)
      return
    }

    const body = new FormData()
    body.append('job_id', String(jobId))
    body.append('first_name', firstName)
    body.append('last_name', lastName)
    if (phone.trim()) body.append('phone', phone)
    if (message.trim()) body.append('message', message)
    body.append('cv', cv)
    if (coverLetter) body.append('cover_letter', coverLetter)

    setSending(true)
    try {
      const application = await apiForm<ApplicationDetail>('/api/candidatures', body)
      setOpen(false)
      toast.success('Candidature envoyée', {
        description: 'Retrouvez-la dans « Mes candidatures ».',
      })
      onApplied?.(application)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "L'envoi a échoué. Réessayez dans un instant.",
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Postuler</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Postuler à cette offre</DialogTitle>
          <DialogDescription>
            {jobTitle} — {company}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void submit(event)}>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="apply-first-name">Prénom</FieldLabel>
                <Input
                  id="apply-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="apply-last-name">Nom</FieldLabel>
                <Input
                  id="apply-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                  required
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="apply-phone">
                Téléphone
                <span className="font-normal text-muted-foreground"> (facultatif)</span>
              </FieldLabel>
              <Input
                id="apply-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                placeholder="06 12 34 56 78"
              />
              <FieldDescription>
                L'employeur vous répondra par courriel si vous n'en indiquez pas.
              </FieldDescription>
            </Field>

            <FileField label="CV" file={cv} onChange={setCv} required />
            <FileField
              label="Lettre de motivation"
              file={coverLetter}
              onChange={setCoverLetter}
            />
            {fileError && <FieldError>{fileError}</FieldError>}

            <Field>
              <FieldLabel htmlFor="apply-message">
                Message
                <span className="font-normal text-muted-foreground"> (facultatif)</span>
              </FieldLabel>
              <Textarea
                id="apply-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="Présentez en quelques lignes ce qui vous motive pour ce poste."
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              }
            />
            <Button type="submit" disabled={sending}>
              {sending ? 'Envoi…' : 'Envoyer ma candidature'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
