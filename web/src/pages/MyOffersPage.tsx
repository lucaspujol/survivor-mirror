import { useEffect, useState } from 'react';

interface JobOffer {
  id: number;
  title: string;
  company: string;
  description: string;
  city: string;
  lat: number;
  lng: number;
}

export function MyOffersPage() {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchOffers = () => {
    setLoading(true);
    setError('');
    fetch('/api/offres')
      .then((res) => res.json())
      .then((data: JobOffer[]) => setOffers(data))
      .catch(() => setError('Impossible de charger les offres.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const startEdit = (offer: JobOffer) => {
    setEditingId(offer.id);
    setEditTitle(offer.title);
    setEditDescription(offer.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    setSavingId(id);
    setError('');
    try {
      const response = await fetch(`/api/offres/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail ?? 'Erreur lors de la modification.');
      }

      const updated: JobOffer = await response.json();
      setOffers((prev) => prev.map((offer) => (offer.id === id ? updated : offer)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer définitivement cette offre ?')) return;

    setDeletingId(id);
    setError('');
    try {
      const response = await fetch(`/api/offres/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression.');
      }
      setOffers((prev) => prev.filter((offer) => offer.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement des offres…</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold">Mes offres</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {offers.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune offre publiée pour l'instant.</p>
      )}

      {offers.map((offer) => (
        <div key={offer.id} className="rounded-md border p-4">
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
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-heading font-bold">{offer.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {offer.company} - {offer.city}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(offer)}
                    className="rounded-md border px-3 py-1.5 text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    disabled={deletingId === offer.id}
                    className="rounded-md border border-red-600 px-3 py-1.5 text-sm text-red-600 disabled:opacity-50"
                  >
                    {deletingId === offer.id ? 'Suppression…' : 'Supprimer'}
                  </button>
                </div>
              </div>
              <p className="text-sm">{offer.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
