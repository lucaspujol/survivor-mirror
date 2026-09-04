import L from 'leaflet'

const PIN = (fill: string, scale: number) => `
<svg width="${28 * scale}" height="${36 * scale}" viewBox="0 0 28 36" fill="none">
  <path d="M14 0C6.27 0 0 6.15 0 13.74 0 23.7 14 36 14 36s14-12.3 14-22.26C28 6.15 21.73 0 14 0z" fill="${fill}"/>
  <circle cx="14" cy="13.5" r="5.5" fill="white"/>
</svg>`

function pinIcon(fill: string, scale: number, className: string) {
  return L.divIcon({
    html: `<div class="geo-marker ${className}">${PIN(fill, scale)}</div>`,
    className: '',
    iconSize: [28 * scale, 36 * scale],
    iconAnchor: [14 * scale, 36 * scale],
    popupAnchor: [0, -34 * scale],
  })
}

export const offerIcon = pinIcon('#1b3a6b', 1, '')
export const selectedOfferIcon = pinIcon('#b8341f', 1.25, 'geo-marker--selected')

export function clusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount()
  const size = count < 10 ? 34 : count < 100 ? 40 : 48

  return L.divIcon({
    html: `<div class="geo-cluster" style="width:${size}px;height:${size}px;font-size:${
      size / 3
    }px">${count}</div>`,
    className: '',
    iconSize: L.point(size, size),
  })
}
