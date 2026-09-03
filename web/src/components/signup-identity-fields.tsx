import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { RegisterPayload } from '@/lib/auth'

/** A seeker signs up under a person's name, an employer under a company's. */
export function SignupIdentityFields({ role }: { role: RegisterPayload['role'] }) {
  if (role === 'employer') {
    return (
      <Field>
        <FieldLabel htmlFor="company_name">Nom de l'entreprise</FieldLabel>
        <Input id="company_name" name="company_name" autoComplete="organization" required />
      </Field>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="first_name">Prénom</FieldLabel>
        <Input id="first_name" name="first_name" autoComplete="given-name" required />
      </Field>
      <Field>
        <FieldLabel htmlFor="last_name">Nom</FieldLabel>
        <Input id="last_name" name="last_name" autoComplete="family-name" required />
      </Field>
    </div>
  )
}
