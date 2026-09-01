import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// @ts-expect-error _getIconUrl
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface JobOffer {
  id: number;
  title: string;
  company: string;
  lat: number;
  lng: number;
}

const DEFAULT_CENTER: [number, number] = [46.6, 2.5];
const DEFAULT_ZOOM = 6;

export function JobMap() {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/offres')
      .then((res) => res.json())
      .then((data: JobOffer[]) => setOffers(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Chargement de la carte…</p>;
  }

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={(zoom: number) => (zoom < 8 ? 60 : 40)}
      >
        {offers.map((offer) => (
          <Marker key={offer.id} position={[offer.lat, offer.lng]}>
            <Popup>
              <strong>{offer.title}</strong>
              <br />
              {offer.company}
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
