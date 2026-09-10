import { useEffect, useImperativeHandle, useRef, useState } from 'react'
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

/** Mac users reach for Cmd, everyone else for Ctrl. */
function zoomModifierLabel() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? '\u2318 Cmd'
    : 'Ctrl'
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

    // Remote offers have no position — nothing to fly to, and Leaflet
    // throws on flyTo(null, null) if this isn't guarded.
    if (offer.lat == null || offer.lng == null) return

    previousViewRef.current ??= { center: map.getCenter(), zoom: map.getZoom() }
    map.flyTo([offer.lat, offer.lng], Math.max(map.getZoom(), FOCUS_ZOOM), {
      duration: 0.6,
    })
  }, [map, offer])

  return null
}

/**
 * Centres the map on a geocoded search location (the "zone géographique"
 * field), independently of offer selection — reusing the same fly-to
 * mechanism as FocusOffer.
 */
function FocusLocation({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap()

  useEffect(() => {
    if (!location) return
    map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), FOCUS_ZOOM), {
      duration: 0.6,
    })
  }, [map, location])

  return null
}

/**
 * Leaflet has no "modifier required" wheel mode, so the gesture is rebuilt
 * here: plain wheel scrolls the page and raises a hint, Ctrl (or Cmd) wheel
 * zooms. Trackpad pinch arrives as a wheel event with ctrlKey already set,
 * so it keeps zooming untouched.
 */
function CtrlWheelZoom({ onHint }: { onHint: (visible: boolean) => void }) {
  const map = useMap()

  useEffect(() => {
    map.scrollWheelZoom.disable()

    const container = map.getContainer()
    let hideTimer: ReturnType<typeof setTimeout> | undefined

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        // Stop the browser's own page zoom, then hand the gesture to Leaflet.
        event.preventDefault()
        onHint(false)
        clearTimeout(hideTimer)
        map.setZoomAround(
          map.mouseEventToContainerPoint(event),
          map.getZoom() - Math.sign(event.deltaY) * (event.shiftKey ? 3 : 1),
        )
        return
      }

      onHint(true)
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => onHint(false), 1400)
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      clearTimeout(hideTimer)
      container.removeEventListener('wheel', onWheel)
    }
  }, [map, onHint])

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
  focusLocation?: { lat: number; lng: number } | null
  /** Lets the page hand focus back to a pin when its detail panel closes. */
  focusRef?: React.RefObject<{ focusMarker: (id: number) => boolean } | null>
}

export function JobMap({
  offers,
  selected,
  onSelect,
  onBoundsChange,
  focusLocation = null,
  focusRef,
}: JobMapProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [showZoomHint, setShowZoomHint] = useState(false)
  // Leaflet recreates pin elements as they enter and leave the view, so the
  // lookup is kept live by the markers' own add/remove handlers.
  const markerElements = useRef(new Map<number, HTMLElement>())

  useImperativeHandle(
    focusRef,
    () => ({
      focusMarker: (id: number) => {
        const element = markerElements.current.get(id)
        if (!element?.isConnected) return false

        element.focus({ preventScroll: true })
        // A detached or hidden pin silently swallows focus, and reporting
        // success there would strand the reader with nothing selected.
        return document.activeElement === element
      },
    }),
    [],
  )

  // Remote offers have no coordinates: they can never get a pin. Filtered
  // here rather than upstream, so every other consumer of `offers` (the
  // results list, the filter counts) still sees them.
  const mappableOffers = offers.filter((offer) => offer.lat != null && offer.lng != null)

  return (
    <div className="relative isolate h-full w-full">
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
        <CtrlWheelZoom onHint={setShowZoomHint} />
        <BoundsWatcher onChange={onBoundsChange} />
        <FocusOffer offer={selected} />
        <FocusLocation location={focusLocation} />

        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          maxClusterRadius={(zoom: number) => (zoom < 8 ? 100 : 40)}
          iconCreateFunction={clusterIcon}
        >
          {mappableOffers.map((offer) => (
            <Marker
              key={offer.id}
              position={[offer.lat, offer.lng]}
              icon={offer.id === selected?.id ? selectedOfferIcon : offerIcon}
              zIndexOffset={offer.id === selected?.id ? 1000 : 0}
              keyboard
              eventHandlers={{
                click: () => onSelect(offer),
                // Leaflet focuses markers but only fires `keypress` on Enter:
                // Space is handled on the element so the pin behaves like the
                // button it reads as.
                keypress: () => onSelect(offer),
                add: (e) => {
                  const element = e.target.getElement()
                  if (!element) return

                  markerElements.current.set(offer.id, element)
                  element.setAttribute(
                    'aria-label',
                    `Offre : ${offer.title} — ${offer.company}, ${offer.city}. Appuyez sur Entrée pour l'ouvrir.`,
                  )
                  element.addEventListener('keydown', (event: KeyboardEvent) => {
                    if (event.key !== ' ' && event.key !== 'Spacebar') return
                    event.preventDefault()
                    onSelect(offer)
                  })
                },
                remove: () => {
                  markerElements.current.delete(offer.id)
                },
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Mirrors the map's own hint conventions: an overlay that fades in over
          the tiles rather than a toast, so it reads as feedback on the gesture. */}
      <div
        aria-hidden={!showZoomHint}
        className={`pointer-events-none absolute inset-0 z-[500] grid place-items-center bg-foreground/45 transition-opacity duration-200 ${
          showZoomHint ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="rounded-lg px-6 text-center text-lg font-medium text-background md:text-xl">
          Utilisez {zoomModifierLabel()} + molette pour zoomer sur la carte
        </p>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {showZoomHint ? `Utilisez ${zoomModifierLabel()} plus la molette pour zoomer sur la carte.` : ''}
      </p>

      <LocateControl map={map} focusLocation={focusLocation} />
    </div>
  )
}
