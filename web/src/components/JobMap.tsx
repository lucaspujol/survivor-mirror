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

const jobIcon = new L.Icon({
  iconUrl: '/icons/job-marker.svg',
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -40],
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
        maxClusterRadius={(zoom: number) => (zoom < 8 ? 100 : 40)}
        iconCreateFunction={(cluster) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div style="
              background: #1B3A6B;
              color: white;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              border: 2px solid white;
            ">${count}</div>`,
            className: '',
            iconSize: L.point(36, 36),
          });
        }}
      >
        {offers.map((offer) => (
          <Marker key={offer.id} position={[offer.lat, offer.lng]} icon={jobIcon}>
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
