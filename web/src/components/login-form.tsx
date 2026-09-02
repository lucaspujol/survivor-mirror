import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Content de vous revoir</h1>
                <p className="text-balance text-muted-foreground">
                  Connectez-vous à votre compte ChômageGo
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field>
                <Button type="submit">Se connecter</Button>
              </Field>
              <FieldDescription className="text-center">
                Pas encore de compte ? <Link to="/register">Créer un compte</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          {/* Image placeholder */}
          <div className="relative hidden bg-gradient-to-br from-primary/20 to-primary/60 md:block" />
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Vos données de localisation ne sont utilisées que pour afficher les offres
        proches de vous.
      </FieldDescription>
    </div>
  )
}
