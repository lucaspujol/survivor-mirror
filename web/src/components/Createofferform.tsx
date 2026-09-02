import { useState, type FormEvent } from 'react';
import { AddressAutocomplete } from '@/components/AdressAutocomplete';

interface CreateOfferFormProps {
  onCreated?: () => void;
}

export function CreateOfferForm({ onCreated }: CreateOfferFormProps) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/offres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, company, address }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail ?? 'Erreur lors de la publication.');
      }

      setTitle('');
      setCompany('');
      setAddress('');
      setStatus('idle');
      onCreated?.();
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Erreur inconnue.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Intitulé du poste
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="company" className="text-sm font-medium">
          Entreprise
        </label>
        <input
          id="company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          required
          className="rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className="text-sm font-medium">
          Adresse
        </label>
        <AddressAutocomplete value={address} onChange={setAddress} />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-md border-2 border-institutional px-4 py-2 text-sm font-medium text-institutional disabled:opacity-50"
      >
        {status === 'loading' ? 'Publication…' : 'Publier l’offre'}
      </button>
    </form>
  );
}