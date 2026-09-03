import { useState, type FormEvent } from 'react';
import { AddressAutocomplete } from '@/components/AdressAutocomplete';

interface CreateOfferFormProps {
  onCreated?: () => void;
}

export function CreateOfferForm({ onCreated }: CreateOfferFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch('/api/offres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The company is not sent: the API attaches the offer to the
        // employer whose session publishes it.
        body: JSON.stringify({ title, description, address }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail ?? 'Erreur lors de la publication.');
      }

      setTitle('');
      setDescription('');
      setAddress('');
      setStatus('idle');
      onCreated?.();
    } catch (err) {
      setStatus('error');
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMessage(
          'Le serveur ne répond pas (délai dépassé). Vérifiez que le backend tourne bien.'
        );
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Erreur inconnue.');
      }
    } finally {
      clearTimeout(timeoutId);
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
        <label htmlFor="description" className="text-sm font-medium">
          Description du poste
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
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