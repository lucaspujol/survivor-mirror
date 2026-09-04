import { useEffect, useRef, useState } from 'react';

interface AddressSuggestion {
  label: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (label: string, coords: { lat: number; lng: number }) => void;
  id?: string;
}

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 3;

export function AddressAutocomplete({ value, onChange, onSelect, id = 'address' }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`,
        { signal: controller.signal }
      )
        .then((res) => res.json())
        .then((data) => {
          const results: AddressSuggestion[] = data.features.map(
            (feature: { properties: { label: string }; geometry: { coordinates: [number, number] } }) => ({
              label: feature.properties.label,
              lng: feature.geometry.coordinates[0],
              lat: feature.geometry.coordinates[1],
            })
          );
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setActiveIndex(-1);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setSuggestions([]);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.label);
    onSelect?.(suggestion.label, { lat: suggestion.lat, lng: suggestion.lng });
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="12 rue de Rivoli, 75004 Paris"
        required
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {isOpen && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.label}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={() => selectSuggestion(suggestion)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === activeIndex ? 'bg-institutional/10' : 'hover:bg-institutional/5'
              }`}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}