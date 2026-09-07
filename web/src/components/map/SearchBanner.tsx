import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SearchBannerProps = {
  query: string
  onQueryChange: (query: string) => void
  location: string
  onLocationChange: (location: string) => void
  onSearch: () => void
  onReset: () => void
  keywordSuggestions?: string[]
}

const inputStyle =
  'h-10 rounded-none border-0 border-b-2 border-primary/40 bg-muted px-3 italic placeholder:italic'

/** Institutional search band: keywords on the left, place on the right. */
export function SearchBanner({
  query,
  onQueryChange,
  location,
  onLocationChange,
  onSearch,
  onReset,
  keywordSuggestions = [],
}: SearchBannerProps) {
  return (
    <form
      className="rounded-xl bg-primary/5 px-4 py-6 md:px-8"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      <h1 className="text-center text-2xl font-bold tracking-tight text-primary md:text-3xl">
        Rechercher une offre
      </h1>

      <div className="mt-6 grid gap-5 md:grid-cols-2 md:gap-10">
        <div className="grid gap-2">
          <Label htmlFor="search-query" className="text-sm">
            Par des mots-clés (métier, entreprise, etc.)
          </Label>
          <Input
            id="search-query"
            type="search"
            list="keyword-suggestions"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Par exemple : développeur web"
            className="h-10 rounded-none border-0 border-b-2 border-primary bg-muted px-3 italic placeholder:italic"
          />
          {}
          <datalist id="keyword-suggestions">
            {keywordSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="search-location" className="text-sm">
            Par zone géographique (ville, adresse)
          </Label>
          <AddressAutocomplete
            id="search-location"
            value={location}
            onChange={onLocationChange}
            placeholder="Par exemple : Lyon"
            required={false}
            className={inputStyle}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onReset}>
          Réinitialiser
        </Button>
        <Button type="submit">Rechercher</Button>
      </div>
    </form>
  )
}
