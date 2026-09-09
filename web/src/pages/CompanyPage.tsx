import { Link, useParams } from 'react-router'
import { MailIcon, PhoneIcon } from 'lucide-react'
import { CONTRACT_TYPES } from '@/components/contractTypes'
import { PageEmpty, PageError, PageLoading } from '@/components/PageState'
import { WORK_MODES } from '@/components/workModes'
import { PageShell } from '@/components/layout/PageShell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useApiResource } from '@/hooks/use-api-resource'

type CompanyOffer = {
  id: number
  title: string
  contract_type: string
  work_mode: string
  city: string
  created_at: string
}

type CompanyDetail = {
  id: number
  company_name: string
  email: string
  phone: string | null
  description: string | null
  offers: CompanyOffer[]
}

function labelOf(options: { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function CompanyPage() {
  const { employerId } = useParams<{ employerId: string }>()
  const { status, data, error } = useApiResource<CompanyDetail>(`/api/employeurs/${employerId}`)

  return (
    <PageShell
      title={status === 'ready' ? data.company_name : 'Entreprise'}
      description="Profil et offres publiées par cette entreprise."
    >
      <div className="flex flex-col gap-6">
        {status === 'loading' && <PageLoading />}
        {status === 'error' && <PageError message={error} />}

        {status === 'ready' && (
          <>
            <Card>
              <CardContent className="flex flex-col gap-3 pt-6">
                {data.description && <p className="text-sm">{data.description}</p>}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MailIcon className="size-3.5 shrink-0" />
                    {data.email}
                  </span>
                  {data.phone && (
                    <span className="flex items-center gap-1.5">
                      <PhoneIcon className="size-3.5 shrink-0" />
                      {data.phone}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-3 text-lg font-semibold">
                Offres publiées ({data.offers.length})
              </h2>
              {data.offers.length === 0 ? (
                <PageEmpty title="Cette entreprise n'a publié aucune offre pour le moment." />
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.offers.map((offer) => (
                    <li key={offer.id}>
                      {/* Reuses the map's existing deep-link mechanism: opens
                          the offer selected, flown to on the map if it has a
                          location, unchanged otherwise (e.g. remote offers). */}
                      <Link to={`/?offre=${offer.id}`}>
                        <Card className="transition-colors hover:border-primary/40">
                          <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6">
                            <div>
                              <p className="font-medium text-primary">{offer.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {labelOf(CONTRACT_TYPES, offer.contract_type)} ·{' '}
                                {labelOf(WORK_MODES, offer.work_mode)}
                                {offer.work_mode !== 'remote' && ` · ${offer.city}`}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {dateFormat.format(new Date(offer.created_at))}
                            </Badge>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </PageShell>
  )
}
