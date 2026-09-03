import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthSubmit } from '@/hooks/use-auth-submit'
import { useAuth, type RegisterPayload } from '@/lib/auth'

export function SignupForm({ className, ...props }: React.ComponentProps<'div'>) {
  const { register } = useAuth()
  const { error, isPending, submit } = useAuthSubmit('Inscription impossible')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    void submit(() =>
      register({
        email: String(data.get('email')),
        fullname: String(data.get('fullname')),
        password: String(data.get('password')),
        role: data.get('role') as RegisterPayload['role'],
      }),
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Créer un compte</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Quelques secondes suffisent
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="fullname">Nom complet</FieldLabel>
                <Input id="fullname" name="fullname" autoComplete="name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="role">Je suis</FieldLabel>
                <select
                  id="role"
                  name="role"
                  defaultValue="seeker"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="seeker">candidat</option>
                  <option value="employer">employeur</option>
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <FieldDescription>8 caractères minimum.</FieldDescription>
              </Field>
              <FieldError>{error}</FieldError>
              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Création…' : 'Créer mon compte'}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Déjà inscrit ? <Link to="/login">Se connecter</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          {/* Image placeholder */}
          <div className="relative hidden bg-gradient-to-br from-primary/20 to-primary/60 md:block" />
        </CardContent>
      </Card>
    </div>
  )
}
