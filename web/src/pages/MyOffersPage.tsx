import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { CONTRACT_TYPES } from '@/components/contractTypes';
import { PageEmpty, PageError, PageLoading } from '@/components/PageState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiResource } from '@/hooks/use-api-resource';

type Offer = {
  id: number;
  title: string;
  description: string;
  city: string;
  address: string | null;
  contract_type: string;
  contract_duration: string | null;
  location_status: 'pending' | 'geocoded' | 'to_verify';
  application_count: number;
  created_at: string;
};

const locationLabels: Record<Offer['location_status'], string> = {
  pending: 'À géolocaliser',
  geocoded: 'Placée sur la carte',
  to_verify: 'Localisation à vérifier',
};

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function MyOffersPage() {
  const { status, data, error } = useApiResource<Offer[]>('/api/mes-offres');
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    if (status === 'ready') {
      setOffers(data);
    }
  }, [status, data]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContractType, setEditContractType] = useState('cdi');
  const [editContractDuration, setEditContractDuration] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [originalAddress, setOriginalAddress] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const editContractInfo = CONTRACT_TYPES.find((c) => c.value === editContractType);

  const startEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setEditTitle(offer.title);
    setEditDescription(offer.description);
    setEditContractType(offer.contract_type);
    setEditContractDuration(offer.contract_duration ?? '');
    setEditAddress(offer.address ?? '');
    setOriginalAddress(offer.address ?? '');
    setActionError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    setSavingId(id);
    setActionError('');
    try {
      const addressChanged = editAddress !== originalAddress;

      const response = await fetch(`/api/offres/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          contract_type: editContractType,
          contract_duration: editContractInfo?.hasDuration ? editContractDuration : null,
          ...(addressChanged ? { address: editAddress } : {}),
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.detail ?? 'Erreur lors de la modification.');
      }

      const updated = await response.json();

      setOffers((prev) =>
        prev.map((offer) =>
          offer.id === id
            ? {
                ...offer,
                title: updated.title,
                description: updated.description,
                contract_type: updated.contract_type,
                contract_duration: updated.contract_duration,
                address: updated.address,
                city: updated.city,
                location_status: addressChanged ? 'geocoded' : offer.location_status,
              }
            : offer
        )
      );
      setEditingId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer définitivement cette offre ?')) return;

    setDeletingId(id);
    setActionError('');
    try {
      const response = await fetch(`/api/offres/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression.');
      }
      setOffers((prev) => prev.filter((offer) => offer.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setDeletingId(null);
    }
  };

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
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {status === 'ready' &&
        (offers.length === 0 ? (
          <PageEmpty
            title="Vous n'avez pas encore publié d'offre."
            hint="Publiez votre première offre depuis la carte."
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {offers.length} offre{offers.length > 1 ? 's' : ''} publiée
              {offers.length > 1 ? 's' : ''} ·{' '}
              <Link to="/" className="underline underline-offset-4">
                publier une offre
              </Link>
            </p>
            <ul className="flex flex-col gap-3">
              {offers.map((offer) => {
                const contractInfo = CONTRACT_TYPES.find((c) => c.value === offer.contract_type);

                return (
                  <li key={offer.id}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>{offer.title}</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {offer.application_count} candidature
                              {offer.application_count > 1 ? 's' : ''}
                            </span>
                          </div>
                          {editingId !== offer.id && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(offer)}
                                className="rounded-md border px-3 py-1.5 text-xs font-normal"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(offer.id)}
                                disabled={deletingId === offer.id}
                                className="rounded-md border border-red-600 px-3 py-1.5 text-xs font-normal text-red-600 disabled:opacity-50"
                              >
                                {deletingId === offer.id ? 'Suppression…' : 'Supprimer'}
                              </button>
                            </div>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        {editingId === offer.id ? (
                          <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium" htmlFor={`title-${offer.id}`}>
                              Intitulé
                            </label>
                            <input
                              id={`title-${offer.id}`}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="rounded-md border px-3 py-2 text-sm"
                            />

                            <label className="text-sm font-medium" htmlFor={`description-${offer.id}`}>
                              Description
                            </label>
                            <textarea
                              id={`description-${offer.id}`}
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={3}
                              className="rounded-md border px-3 py-2 text-sm"
                            />

                            <label className="text-sm font-medium" htmlFor={`contract-type-${offer.id}`}>
                              Type de contrat
                            </label>
                            <select
                              id={`contract-type-${offer.id}`}
                              value={editContractType}
                              onChange={(e) => setEditContractType(e.target.value)}
                              className="rounded-md border px-3 py-2 text-sm"
                            >
                              {CONTRACT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>

                            {editContractInfo?.hasDuration && (
                              <>
                                <label
                                  className="text-sm font-medium"
                                  htmlFor={`contract-duration-${offer.id}`}
                                >
                                  Durée
                                </label>
                                <input
                                  id={`contract-duration-${offer.id}`}
                                  value={editContractDuration}
                                  onChange={(e) => setEditContractDuration(e.target.value)}
                                  placeholder="ex: 3 mois, 6 mois, 1 an"
                                  className="rounded-md border px-3 py-2 text-sm"
                                />
                              </>
                            )}

                            <label className="text-sm font-medium" htmlFor={`address-${offer.id}`}>
                              Adresse
                            </label>
                            <AddressAutocomplete
                              id={`address-${offer.id}`}
                              value={editAddress}
                              onChange={setEditAddress}
                            />

                            <div className="mt-1 flex gap-2">
                              <button
                                onClick={() => saveEdit(offer.id)}
                                disabled={savingId === offer.id}
                                className="rounded-md border-2 border-institutional px-3 py-1.5 text-sm font-medium text-institutional disabled:opacity-50"
                              >
                                {savingId === offer.id ? 'Enregistrement…' : 'Enregistrer'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-md border px-3 py-1.5 text-sm"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p>{offer.description}</p>
                            <p className="mt-2 text-muted-foreground">
                              {offer.address ?? offer.city} · {locationLabels[offer.location_status]}{' '}
                              · {contractInfo?.label ?? offer.contract_type}
                              {offer.contract_duration ? ` (${offer.contract_duration})` : ''} ·
                              publiée le {dateFormat.format(new Date(offer.created_at))}
                            </p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        ))}
    </div>
  );
}