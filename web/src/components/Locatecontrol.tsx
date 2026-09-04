import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { AddressAutocomplete } from './AddressAutocomplete';

type LocateStatus = 'idle' | 'locating' | 'denied' | 'unsupported' | 'manual';

interface LocateControlProps {
  map: L.Map | null;
}

const LOCATION_COLOR = '#5B9BD5';

export function LocateControl({ map }: LocateControlProps) {
  const [status, setStatus] = useState<LocateStatus>('idle');
  const [manualCity, setManualCity] = useState('');
  const [hasLastPosition, setHasLastPosition] = useState(false);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const accuracyMarkerRef = useRef<L.Marker | null>(null);
  const positionDotRef = useRef<L.Marker | null>(null);
  const arrowMarkerRef = useRef<L.Marker | null>(null);
  const arrowElRef = useRef<HTMLDivElement | null>(null);
  const orientationHandlerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);
  const zoomHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      accuracyMarkerRef.current?.remove();
      positionDotRef.current?.remove();
      arrowMarkerRef.current?.remove();
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current, true);
        window.removeEventListener(
          'deviceorientationabsolute' as keyof WindowEventMap,
          orientationHandlerRef.current as EventListener,
          true
        );
      }
    };
  }, []);

  const clearPositionMarkers = () => {
    accuracyMarkerRef.current?.remove();
    positionDotRef.current?.remove();
    arrowMarkerRef.current?.remove();
    accuracyMarkerRef.current = null;
    positionDotRef.current = null;
    arrowMarkerRef.current = null;
    if (zoomHandlerRef.current && map) {
      map.off('zoomend', zoomHandlerRef.current);
      zoomHandlerRef.current = null;
    }
  };

  const createArrowIcon = () =>
    L.divIcon({
      className: '',
      html: `<div style="
        width: 0; height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-bottom: 16px solid ${LOCATION_COLOR};
        transform-origin: 50% 80%;
      "></div>`,
      iconSize: [14, 16],
      iconAnchor: [7, 8],
    });

  const metersToPixels = (targetMap: L.Map, lat: number, meters: number): number => {
    const metersPerDegree = 111_320 * Math.cos((lat * Math.PI) / 180);
    const p1 = targetMap.latLngToLayerPoint([lat, 0]);
    const p2 = targetMap.latLngToLayerPoint([lat, meters / metersPerDegree]);
    return Math.abs(p2.x - p1.x);
  };

  const createAccuracyIcon = (pixelDiameter: number) =>
    L.divIcon({
      className: '',
      html: `<div style="
        width: ${pixelDiameter}px;
        height: ${pixelDiameter}px;
        border-radius: 50%;
        background: ${LOCATION_COLOR};
        opacity: 0.25;
      "></div>`,
      iconSize: [pixelDiameter, pixelDiameter],
      iconAnchor: [pixelDiameter / 2, pixelDiameter / 2],
    });

  const startListeningToCompass = (lat: number, lng: number) => {
    const applyHeading = (heading: number) => {
      if (!arrowMarkerRef.current) {
        arrowMarkerRef.current = L.marker([lat, lng], {
          icon: createArrowIcon(),
          interactive: false,
          zIndexOffset: 1100,
        }).addTo(map!);
        arrowElRef.current = arrowMarkerRef.current.getElement()?.firstElementChild as HTMLDivElement;
      }
      if (arrowElRef.current) {
        arrowElRef.current.style.transform = `rotate(${heading}deg)`;
      }
    };

    const handler = (event: DeviceOrientationEvent) => {
      const iosHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      const heading = iosHeading ?? (event.alpha != null ? 360 - event.alpha : null);
      if (heading != null) {
        applyHeading(heading);
      }
    };

    orientationHandlerRef.current = handler;

    const win = window as typeof window & {
      DeviceOrientationEvent?: typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
    };

    if (typeof win.DeviceOrientationEvent?.requestPermission === 'function') {
      win.DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            window.addEventListener('deviceorientation', handler, true);
          }
        })
        .catch(() => {});
    } else {
      const supportsAbsoluteOrientation = 'ondeviceorientationabsolute' in window;
      if (supportsAbsoluteOrientation) {
        window.addEventListener(
          'deviceorientationabsolute' as keyof WindowEventMap,
          handler as EventListener,
          true
        );
      } else if (typeof DeviceOrientationEvent !== 'undefined') {
        window.addEventListener('deviceorientation', handler, true);
      }
    }
  };

  const showPosition = (lat: number, lng: number, accuracy: number) => {
    if (!map) return;
    clearPositionMarkers();

    lastPositionRef.current = { lat, lng };
    setHasLastPosition(true);

    const pixelDiameter = Math.max(metersToPixels(map, lat, accuracy) * 2, 16);

    accuracyMarkerRef.current = L.marker([lat, lng], {
      icon: createAccuracyIcon(pixelDiameter),
      interactive: false,
      zIndexOffset: -1000,
    }).addTo(map);

    positionDotRef.current = L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="
          width: 12px; height: 12px;
          border-radius: 50%;
          background: ${LOCATION_COLOR};
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      }),
      interactive: false,
      zIndexOffset: 1000,
    }).addTo(map);

    const handleZoom = () => {
      if (!accuracyMarkerRef.current) return;
      const newDiameter = Math.max(metersToPixels(map, lat, accuracy) * 2, 16);
      accuracyMarkerRef.current.setIcon(createAccuracyIcon(newDiameter));
    };
    zoomHandlerRef.current = handleZoom;
    map.on('zoomend', handleZoom);

    startListeningToCompass(lat, lng);
  };

  const handleLocate = () => {
    if (!map) return;

    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        map.setView([latitude, longitude], 13);
        showPosition(latitude, longitude, accuracy);
        setStatus('idle');
      },
      () => {
        setStatus('denied');
      },
      { timeout: 8000 }
    );
  };

  const handleManualSelect = (label: string, coords: { lat: number; lng: number }) => {
    setManualCity(label);
    if (map) {
      clearPositionMarkers();
      map.setView([coords.lat, coords.lng], 12);
      lastPositionRef.current = coords;
      setHasLastPosition(true);
      setStatus('manual');
    }
  };

  const handleRecenter = () => {
    if (!map || !lastPositionRef.current) return;
    map.setView([lastPositionRef.current.lat, lastPositionRef.current.lng], map.getZoom());
  };

  return (
    <>
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1000,
        background: 'white',
        borderRadius: 4,
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        padding: 6,
        width: status === 'idle' || status === 'locating' ? 190 : 220,
        fontSize: 13,
      }}
    >
      {status !== 'denied' && status !== 'unsupported' && status !== 'manual' && (
        <>
          <button
            onClick={handleLocate}
            disabled={status === 'locating'}
            style={{
              border: '2px solid #1B3A6B',
              color: '#1B3A6B',
              background: 'white',
              borderRadius: 4,
              padding: '6px 8px',
              fontSize: 13,
              fontWeight: 500,
              cursor: status === 'locating' ? 'default' : 'pointer',
            }}
          >
            {status === 'locating' ? 'Localisation…' : 'Me localiser'}
          </button>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#666' }}>
            Utilisé uniquement pour centrer la carte, jamais enregistré.
          </p>
        </>
      )}

      {(status === 'denied' || status === 'unsupported' || status === 'manual') && (
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 12 }}>
            {status === 'unsupported'
              ? "Votre navigateur ne permet pas la géolocalisation."
              : "Position non disponible ou refusée."}
            {' '}Indiquez votre ville à la place :
          </p>
          <AddressAutocomplete
            value={manualCity}
            onChange={setManualCity}
            onSelect={handleManualSelect}
            id="manual-city"
          />
          <button
            onClick={() => {
              setStatus('idle');
              setManualCity('');
            }}
            style={{
              marginTop: 6,
              background: 'none',
              border: 'none',
              color: '#1B3A6B',
              fontSize: 11,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Réessayer la géolocalisation
          </button>
        </div>
      )}
    </div>

    {hasLastPosition && (
      <button
        onClick={handleRecenter}
        title="Recentrer sur ma dernière position"
        style={{
          position: 'absolute',
          bottom: 24,
          left: 12,
          zIndex: 1000,
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: 'none',
          background: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <line x1="12" y1="1" x2="12" y2="5" stroke="#1B3A6B" strokeWidth="2" />
          <line x1="12" y1="19" x2="12" y2="23" stroke="#1B3A6B" strokeWidth="2" />
          <line x1="1" y1="12" x2="5" y2="12" stroke="#1B3A6B" strokeWidth="2" />
          <line x1="19" y1="12" x2="23" y2="12" stroke="#1B3A6B" strokeWidth="2" />
          <circle cx="12" cy="12" r="6" fill="none" stroke="#1B3A6B" strokeWidth="2" />
          <circle cx="12" cy="12" r="2.5" fill="#1B3A6B" />
        </svg>
      </button>
    )}
  </>
  );
}
