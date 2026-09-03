import { useEffect, useRef, useState } from 'react'
import { MapPinIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Suggestion = { label: string }

type AddressAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  id?: string
}

const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 3
const ADRESSE_API = 'https://api-adresse.data.gouv.fr/search/'

export function AddressAutocomplete({
  value,
  onChange,
  id = 'address',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      fetch(`${ADRESSE_API}?q=${encodeURIComponent(value)}&limit=5`, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data) => {
          const results: Suggestion[] = data.features.map(
            (feature: { properties: { label: string } }) => ({
              label: feature.properties.label,
            }),
          )
          setSuggestions(results)
          setIsOpen(results.length > 0)
          setActiveIndex(-1)
        })
        .catch((cause) => {
          if (cause.name !== 'AbortError') setSuggestions([])
        })
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value])

  function select(suggestion: Suggestion) {
    onChange(suggestion.label)
    setSuggestions([])
    setIsOpen(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((previous) => (previous + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((previous) =>
        previous <= 0 ? suggestions.length - 1 : previous - 1,
      )
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      select(suggestions[activeIndex])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <MapPinIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="12 rue de Rivoli, 75004 Paris"
        required
        className="pl-9"
      />

      {isOpen && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.label}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={() => select(suggestion)}
              className={cn(
                'cursor-pointer rounded-sm px-2 py-1.5 text-sm',
                index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60',
              )}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
