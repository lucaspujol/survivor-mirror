import { useEffect, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import '@/components/map/leaflet-theme.css'
import { clusterIcon, offerIcon, selectedOfferIcon } from '@/components/map/markers'
import { LocateControl } from '@/components/Locatecontrol'
import type { Bounds, Offer } from '@/lib/offers'

const DEFAULT_CENTER: [number, number] = [46.6, 2.5]
const DEFAULT_ZOOM = 6
const FOCUS_ZOOM = 13
const WORLD_BOUNDS: L.LatLngBoundsExpression = [
  [-90, -180],
  [90, 180],
]

function toBounds(bounds: L.LatLngBounds): Bounds {
  return {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  }
}

function BoundsWatcher({ onChange }: { onChange: (bounds: Bounds) => void }) {
  const map = useMapEvents({
    moveend: () => onChange(toBounds(map.getBounds())),
    zoomend: () => onChange(toBounds(map.getBounds())),
  })

  const hasReported = useRef(false)
  useEffect(() => {
    if (hasReported.current) return
    hasReported.current = true
    onChange(toBounds(map.getBounds()))
  }, [map, onChange])

  return null
}

/**
 * Centres the map on the offer picked from the list, and restores the previous
 * view when the selection is cleared: zooming in shrinks the bounds, so
 * without this the list would come back holding only the offer just visited.
 */
function FocusOffer({ offer }: { offer: Offer | null }) {
  const map = useMap()
  const previousViewRef = useRef<{ center: L.LatLng; zoom: number } | null>(null)

  useEffect(() => {
    if (!offer) {
      const previous = previousViewRef.current
      previousViewRef.current = null
      if (previous) map.flyTo(previous.center, previous.zoom, { duration: 0.6 })
      return
    }

    previousViewRef.current ??= { center: map.getCenter(), zoom: map.getZoom() }
    map.flyTo([offer.lat, offer.lng], Math.max(map.getZoom(), FOCUS_ZOOM), {
      duration: 0.6,
    })
  }, [map, offer])

  return null
}

/** Hands the map instance to the overlays rendered outside the container. */
function MapReady({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()

  useEffect(() => {
    onReady(map)
  }, [map, onReady])

  return null
}

type JobMapProps = {
  offers: Offer[]
  selected: Offer | null
  onSelect: (offer: Offer) => void
  onBoundsChange: (bounds: Bounds) => void
}

export function JobMap({ offers, selected, onSelect, onBoundsChange }: JobMapProps) {
  const [map, setMap] = useState<L.Map | null>(null)

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={2}
        maxBounds={WORLD_BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        className="h-full w-full"
      >
        {/* Top left is taken by the locate panel. */}
        <ZoomControl position="topright" />

        <TileLayer
          attribution='&copy; <a href="https://www.ign.fr/">IGN</a> — Géoplateforme'
          url="https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png"
          maxZoom={19}
        />

        <MapReady onReady={setMap} />
        <BoundsWatcher onChange={onBoundsChange} />
        <FocusOffer offer={selected} />

        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={(zoom: number) => (zoom < 8 ? 100 : 40)}
          iconCreateFunction={clusterIcon}
        >
          {offers.map((offer) => (
            <Marker
              key={offer.id}
              position={[offer.lat, offer.lng]}
              icon={offer.id === selected?.id ? selectedOfferIcon : offerIcon}
              zIndexOffset={offer.id === selected?.id ? 1000 : 0}
              eventHandlers={{ click: () => onSelect(offer) }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      <LocateControl map={map} />
    </div>
  )
}
