import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
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
  description: string;
  city: string;
  lat: number;
  lng: number;
}

interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

const DEFAULT_CENTER: [number, number] = [46.6, 2.5];
const DEFAULT_ZOOM = 6;
const DEBOUNCE_MS = 100;
const WORLD_BOUNDS: L.LatLngBoundsExpression = [
  [-90, -180],
  [90, 180],
];

function boundsToObject(bounds: L.LatLngBounds): MapBounds {
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  };
}

function BoundsWatcher({
  onBoundsChange,
  onMapReady,
}: {
  onBoundsChange: (bounds: MapBounds) => void;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(boundsToObject(map.getBounds())),
    zoomend: () => onBoundsChange(boundsToObject(map.getBounds())),
  });

  const hasFetchedInitial = useRef(false);

  useEffect(() => {
    onMapReady(map);

    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      onBoundsChange(boundsToObject(map.getBounds()));
    }
  }, [map, onMapReady, onBoundsChange]);

  return null;
}

interface JobMapProps {
  refreshSignal?: number;
}

export function JobMap({ refreshSignal }: JobMapProps) {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const fetchOffersInBounds = useCallback((bounds: MapBounds) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams({
        south: bounds.south.toString(),
        west: bounds.west.toString(),
        north: bounds.north.toString(),
        east: bounds.east.toString(),
      });

      setLoading(true);
      fetch(`/api/offres?${params}`)
        .then((res) => res.json())
        .then((data: JobOffer[]) => setOffers(data))
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
  }, []);

  const handleMapReady = useCallback ((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (mapInstanceRef.current) {
      fetchOffersInBounds(boundsToObject(mapInstanceRef.current.getBounds()));
    }
  }, [refreshSignal, fetchOffersInBounds]);

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1000,
            background: 'white',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 13,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        >
          Chargement des offres…
        </div>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={0.8}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.ign.fr/">IGN</a> - Géoplateforme'
          url="https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png"
          maxZoom={19}
        />

        <BoundsWatcher onBoundsChange={fetchOffersInBounds} onMapReady={handleMapReady} />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={(zoom: number) => (zoom < 8 ? 100 : 40)}
          iconCreateFunction={(cluster: L.MarkerCluster) => {
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
                <span>{offer.company} - {offer.city}</span>
                <p style={{ marginTop: 4, marginBottom: 0 }}>{offer.description}</p>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer> 
    </div>
  );
}
