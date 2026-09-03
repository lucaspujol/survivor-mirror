import { Link } from 'react-router'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiResource } from '@/hooks/use-api-resource'

type Offer = {
  id: number
  title: string
  description: string
  city: string
  address: string | null
  location_status: 'pending' | 'geocoded' | 'to_verify'
  application_count: number
  created_at: string
}

const locationLabels: Record<Offer['location_status'], string> = {
  pending: 'À géolocaliser',
  geocoded: 'Placée sur la carte',
  to_verify: 'Localisation à vérifier',
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function MyOffersPage() {
  const { status, data, error } = useApiResource<Offer[]>('/api/mes-offres')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Mes offres</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Les offres publiées par votre établissement et les candidatures reçues.
        </p>
      </div>

      {status === 'loading' && <PageLoading />}
      {status === 'error' && <PageError message={error} />}

      {status === 'ready' &&
        (data.length === 0 ? (
          <PageEmpty
            title="Vous n'avez pas encore publié d'offre."
            hint="Publiez votre première offre depuis la carte."
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {data.length} offre{data.length > 1 ? 's' : ''} publiée
              {data.length > 1 ? 's' : ''} ·{' '}
              <Link to="/" className="underline underline-offset-4">
                publier une offre
              </Link>
            </p>
            <ul className="flex flex-col gap-3">
              {data.map((offer) => (
                <li key={offer.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>{offer.title}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {offer.application_count} candidature
                          {offer.application_count > 1 ? 's' : ''}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>{offer.description}</p>
                      <p className="mt-2 text-muted-foreground">
                        {offer.address ?? offer.city} · {locationLabels[offer.location_status]}{' '}
                        · publiée le {dateFormat.format(new Date(offer.created_at))}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        ))}
    </div>
  )
}
