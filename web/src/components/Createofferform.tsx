import { useState, type FormEvent } from 'react';
import { AddressAutocomplete } from './AddressAutocomplete';
import { CONTRACT_TYPES } from './contractTypes';
import { WORK_MODES } from './workModes';
import { TIME_COMMITMENTS } from './timeCommitments';

interface CreateOfferFormProps {
  onCreated?: () => void;
}

export function CreateOfferForm({ onCreated }: CreateOfferFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contractType, setContractType] = useState('cdi');
  const [contractDuration, setContractDuration] = useState('');
  const [workMode, setWorkMode] = useState('on_site');
  const [timeCommitment, setTimeCommitment] = useState('full_time');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedContractType = CONTRACT_TYPES.find((c) => c.value === contractType);
  const selectedWorkMode = WORK_MODES.find((w) => w.value === workMode);

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
        body: JSON.stringify({
          title,
          description,
          contract_type: contractType,
          contract_duration: selectedContractType?.hasDuration ? contractDuration : null,
          work_mode: workMode,
          time_commitment: timeCommitment,
          address: selectedWorkMode?.requiresAddress ? address : null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail ?? 'Erreur lors de la publication.');
      }

      setTitle('');
      setDescription('');
      setContractType('cdi');
      setContractDuration('');
      setWorkMode('on_site');
      setTimeCommitment('full_time');
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
        <label htmlFor="contractType" className="text-sm font-medium">
          Type de contrat
        </label>
        <select
          id="contractType"
          value={contractType}
          onChange={(e) => setContractType(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {CONTRACT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite">
        {selectedContractType?.hasDuration && (
          <div className="flex flex-col gap-1">
            <label htmlFor="contractDuration" className="text-sm font-medium">
              Durée
            </label>
            <input
              id="contractDuration"
              value={contractDuration}
              onChange={(e) => setContractDuration(e.target.value)}
              placeholder="ex: 3 mois, 6 mois, 1 an"
              required
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="workMode" className="text-sm font-medium">
          Mode de travail
        </label>
        <select
          id="workMode"
          value={workMode}
          onChange={(e) => setWorkMode(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {WORK_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="timeCommitment" className="text-sm font-medium">
          Temps de travail
        </label>
        <select
          id="timeCommitment"
          value={timeCommitment}
          onChange={(e) => setTimeCommitment(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          {TIME_COMMITMENTS.map((tc) => (
            <option key={tc.value} value={tc.value}>
              {tc.label}
            </option>
          ))}
        </select>
      </div>

      <div aria-live="polite">
        {selectedWorkMode?.requiresAddress ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="text-sm font-medium">
              Adresse
            </label>
            <AddressAutocomplete value={address} onChange={setAddress} />
            <span className="text-xs text-muted-foreground">
              Géocodée automatiquement via la Base Adresse Nationale.
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Offre 100% télétravail : pas d'adresse à renseigner, elle n'apparaîtra pas sur la carte.
          </p>
        )}
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-md border-2 border-primary px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
      >
        {status === 'loading' ? 'Publication…' : 'Publier l’offre'}
      </button>
    </form>
  );
}
