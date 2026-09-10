import { AlertTriangle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { PageShell } from '@/components/layout/PageShell'
import { useApiResource } from '@/hooks/use-api-resource'

type UserWarning = {
  id: number
  reason: string
  created_at: string
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default function WarningsPage() {
  const { status, data, error } = useApiResource<UserWarning[]>(
    '/api/mes-avertissements',
  )

  if (status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">
          Mes avertissements
        </h1>

        <div className="flex flex-col gap-3">
          <Card>
            <CardContent className="p-6">
              Chargement...
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">
          Mes avertissements
        </h1>

        <Card>
          <CardContent className="p-6 text-destructive">
            {error ?? 'Impossible de récupérer vos avertissements.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const warnings = data ?? []

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">
          Mes avertissements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez ici les avertissements concernant votre compte.
        </p>
      </div>

      {warnings.length === 0 ? (
        <PageShell title="Vous n'avez reçu aucun avertissement." />
      ) : (
        <div className="flex flex-col gap-4">
          {warnings.map((warning) => (
            <Card key={warning.id}>
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">
                      Avertissement
                    </h2>

                    <span className="text-sm text-muted-foreground">
                      {dateFormat.format(new Date(warning.created_at))}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">
                    {warning.reason}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
