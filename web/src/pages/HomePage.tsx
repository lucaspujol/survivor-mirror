import { JobMap } from '@/components/JobMap';
import { CreateOfferForm } from '@/components/Createofferform';

export function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Offres d'emploi</h1>
      <p className="text-muted-foreground mt-2">
        Explorez les offres disponibles près de chez vous
      </p>

      <div className="mt-6">
        <JobMap />
        <CreateOfferForm />
      </div>
    </div>
  )
}