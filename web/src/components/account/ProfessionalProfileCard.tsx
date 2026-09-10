import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { SkillsInput } from '@/components/account/SkillsInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { MAX_EXPERIENCE_LENGTH, getProfile, saveProfile, type SeekerProfile } from '@/lib/profile'

const EMPTY: SeekerProfile = {
  first_name: '',
  last_name: '',
  skills: [],
  experience: null,
  availability: null,
}

/**
 * The professional profile a job seeker can manage (brief §2.1). These are the
 * fields an employer reads next to an application, so the card says so: it is
 * not private notes, it is what gets transmitted.
 */
export function ProfessionalProfileCard() {
  const { refreshUser } = useAuth()

  const [profile, setProfile] = useState<SeekerProfile | null>(null)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let cancelled = false

    getProfile()
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(
          err instanceof ApiError ? err.message : 'Votre profil est indisponible.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [])

  const update = <K extends keyof SeekerProfile>(key: K, value: SeekerProfile[K]) => {
    setProfile((current) => ({ ...(current ?? EMPTY), [key]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!profile) return

    setSaving(true)
    setSaveError('')
    try {
      // The API trims and de-duplicates, so the saved profile is what the
      // form should show afterwards — not what was typed.
      setProfile(await saveProfile(profile))
      // The name feeds display_name, shown in the sidebar and on this page.
      await refreshUser()
      toast.success('Profil enregistré', {
        description: 'Les employeurs verront ces informations avec vos candidatures.',
      })
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "L'enregistrement a échoué. Réessayez dans un instant.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profil professionnel</CardTitle>
        <CardDescription>
          Ces informations sont transmises à l'employeur avec chacune de vos
          candidatures.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {!profile && !loadError && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Chargement…
          </p>
        )}

        {profile && (
          <form onSubmit={(event) => void submit(event)}>
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="profile-first-name">Prénom</FieldLabel>
                  <Input
                    id="profile-first-name"
                    value={profile.first_name}
                    onChange={(event) => update('first_name', event.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="profile-last-name">Nom</FieldLabel>
                  <Input
                    id="profile-last-name"
                    value={profile.last_name}
                    onChange={(event) => update('last_name', event.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </Field>
              </div>

              <SkillsInput
                skills={profile.skills}
                onChange={(skills) => update('skills', skills)}
              />

              <Field>
                <FieldLabel htmlFor="profile-experience">
                  Expérience
                  <span className="font-normal text-muted-foreground"> (facultatif)</span>
                </FieldLabel>
                <Textarea
                  id="profile-experience"
                  value={profile.experience ?? ''}
                  onChange={(event) => update('experience', event.target.value || null)}
                  rows={5}
                  maxLength={MAX_EXPERIENCE_LENGTH}
                  placeholder="Vos postes précédents, vos domaines, ce que vous cherchez."
                />
                <FieldDescription>
                  {(profile.experience ?? '').length} / {MAX_EXPERIENCE_LENGTH} caractères
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="profile-availability">
                  Disponible à partir du
                  <span className="font-normal text-muted-foreground"> (facultatif)</span>
                </FieldLabel>
                <Input
                  id="profile-availability"
                  type="date"
                  className="w-fit"
                  value={profile.availability ?? ''}
                  onChange={(event) => update('availability', event.target.value || null)}
                />
              </Field>

              {saveError && <FieldError>{saveError}</FieldError>}
            </FieldGroup>

            <div className="mt-6">
              <Button type="submit" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
