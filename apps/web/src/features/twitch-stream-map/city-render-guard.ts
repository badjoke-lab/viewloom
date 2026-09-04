import { resolveCityCentroid } from './city-centroid-core'
import { TWITCH_CITY_CENTROIDS_INITIAL } from './city-centroids.initial'

type CityRow = {
  displayName?: string
  viewers?: number
  location?: {
    countryCode?: string
    countryName?: string
    regions?: string[]
    cities?: string[]
  }
}

type CityPayload = {
  mappedStreams?: CityRow[]
}

type CityMarker = {
  remove(): void
}

type CityPayloadWindow = Window & {
  __viewloomStreamMapCityPayload?: CityPayload | null
  __viewloomStreamMapInstance?: unknown
  __viewloomStreamMapCaptureInstalled?: boolean
}

type ResolvedCityGroup = {
  key: string
  label: string
  streams: number
  viewers: number
  longitude: number
  latitude: number
}

const requestedCity = new URL(window.location.href).searchParams.get('geography') === 'city'
let cityMarkers: CityMarker[] = []

if (requestedCity) bootCityRendering()

function bootCityRendering(): void {
  document.documentElement.classList.add('stream-map-city-mode')
  captureMapInstance()
  injectCityStyles()
  updateStaticCityCopy()
  renderWhenPayloadArrives()
}

function captureMapInstance(): void {
  const target = window as CityPayloadWindow
  if (target.__viewloomStreamMapCaptureInstalled) return
  const maplibregl = (window as any).maplibregl
  if (!maplibregl?.Map) return

  const NativeMap = maplibregl.Map
  maplibregl.Map = class ViewLoomCityCapturingMap extends NativeMap {
    constructor(options: any) {
      super(options)
      target.__viewloomStreamMapInstance = this
    }
  }
  target.__viewloomStreamMapCaptureInstalled = true
}

function injectCityStyles(): void {
  const style = document.createElement('style')
  style.id = 'stream-map-city-render-style'
  style.textContent = `
    .stream-map-city-mode .stream-map-country-marker{display:none!important}
    .stream-map-city-mode #stream-map-selected-country{display:none!important}
    .stream-map-city-marker{appearance:none;border:1px solid rgba(255,255,255,.72);background:rgba(13,18,28,.92);color:#fff;border-radius:999px;min-width:48px;min-height:48px;padding:7px 10px;display:grid;place-items:center;gap:1px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.34)}
    .stream-map-city-marker strong{font-size:14px;line-height:1}.stream-map-city-marker span{font-size:9px;line-height:1.15;max-width:78px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .stream-map-city-marker:focus-visible{outline:2px solid currentColor;outline-offset:3px}
    .stream-map-city-places{grid-column:1/-1;display:grid;gap:8px;border-top:1px solid var(--line,#30363d);padding-top:12px}
    .stream-map-city-place{display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid var(--line,#30363d)}
    .stream-map-city-place span{color:var(--muted,#9ca3af);font-size:13px;text-align:right}
    .stream-map-city-placement-note{margin:0;color:var(--muted,#9ca3af);font-size:12px}
  `
  document.head.append(style)
}

function updateStaticCityCopy(): void {
  const run = () => {
    const shell = document.querySelector<HTMLElement>('.stream-map-shell__head')
    const heading = shell?.querySelector<HTMLElement>('h2')
    const copy = shell?.querySelector<HTMLElement>('p')
    if (heading) heading.textContent = 'City view'
    if (copy) copy.textContent = 'City mode uses accepted home/base or declared-location evidence with a city. Map markers are city reference points, never creator coordinates.'

    const interaction = document.querySelector<HTMLElement>('.stream-map-interaction-note')
    if (interaction) interaction.textContent = 'City markers show the referenced city/place point for accepted City evidence. They do not represent a creator’s exact position; unresolved or ambiguous cities remain list-only.'

    const resultsHead = document.querySelector<HTMLElement>('.stream-map-results__head')
    const resultsHeading = resultsHead?.querySelector<HTMLElement>('h2')
    const resultsCopy = resultsHead?.querySelector<HTMLElement>('p')
    if (resultsHeading) resultsHeading.textContent = 'Mapped City streams'
    if (resultsCopy) resultsCopy.textContent = 'Only streams with accepted City-level home/base or declared-location evidence are listed. Country-only evidence stays in accounting and is not promoted.'
    const countryFactLabel = document.getElementById('stream-map-country-count')?.parentElement?.querySelector<HTMLElement>('small')
    if (countryFactLabel) countryFactLabel.textContent = 'Countries with City evidence'
    const currentFactLabel = document.getElementById('stream-map-current-count')?.parentElement?.querySelector<HTMLElement>('small')
    if (currentFactLabel) currentFactLabel.textContent = 'Current-location placement'
    textNode('stream-map-current-count', '0')

    const countryList = document.getElementById('stream-map-country-list')
    const countryCard = countryList?.closest('.stream-map-results-card') as HTMLElement | null | undefined
    if (countryCard) countryCard.hidden = true

    const listTitle = document.getElementById('stream-map-stream-list-title')
    if (listTitle) listTitle.textContent = 'City-placeable streams'

    const root = document.getElementById('stream-map-root')
    root?.setAttribute('aria-label', 'World map with city reference-point markers for accepted City evidence; creator coordinates are not published or inferred')
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
}

function renderWhenPayloadArrives(): void {
  const render = () => {
    const payload = (window as CityPayloadWindow).__viewloomStreamMapCityPayload
    if (!payload) return false
    const rows = Array.isArray(payload.mappedStreams) ? payload.mappedStreams : []
    renderCityPlaces(rows)
    if (!renderCityMarkers(rows)) window.setTimeout(() => renderCityMarkers(rows), 50)
    window.setTimeout(updateStaticCityCopy, 0)
    return true
  }

  if (render()) return
  const observer = new MutationObserver(() => {
    if (!render()) return
    observer.disconnect()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

function resolveCityGroups(rows: CityRow[]): { groups: ResolvedCityGroup[]; unresolved: number } {
  const grouped = new Map<string, ResolvedCityGroup>()
  let unresolved = 0

  for (const row of rows) {
    const city = clean(row.location?.cities?.[0])
    const countryCode = clean(row.location?.countryCode)
    const region = clean(row.location?.regions?.[0])
    const resolution = resolveCityCentroid(TWITCH_CITY_CENTROIDS_INITIAL, { countryCode, city, region })
    if (resolution.state !== 'resolved') {
      unresolved += 1
      continue
    }

    const record = resolution.record
    const key = `${record.countryCode}|${record.city}|${record.longitude}|${record.latitude}`.toLowerCase()
    const country = clean(row.location?.countryName) || countryCode
    const label = [city || record.city, region, country].filter(Boolean).join(' · ')
    const current = grouped.get(key) ?? {
      key,
      label,
      streams: 0,
      viewers: 0,
      longitude: record.longitude,
      latitude: record.latitude,
    }
    current.streams += 1
    current.viewers += count(row.viewers)
    grouped.set(key, current)
  }

  return {
    groups: [...grouped.values()].sort((a, b) => b.viewers - a.viewers || a.label.localeCompare(b.label)),
    unresolved,
  }
}

function renderCityMarkers(rows: CityRow[]): boolean {
  for (const marker of cityMarkers) marker.remove()
  cityMarkers = []

  const target = window as CityPayloadWindow
  const map = target.__viewloomStreamMapInstance
  const maplibregl = (window as any).maplibregl
  if (!map || !maplibregl?.Marker) return false

  const { groups } = resolveCityGroups(rows)
  for (const group of groups) {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'stream-map-city-marker'
    element.dataset.cityKey = group.key
    element.setAttribute('aria-label', `${group.label}: ${format(group.streams)} mapped stream${group.streams === 1 ? '' : 's'}, ${format(group.viewers)} viewers. Marker is a city reference point, not creator coordinates.`)

    const countNode = document.createElement('strong')
    countNode.textContent = format(group.streams)
    const labelNode = document.createElement('span')
    labelNode.textContent = group.label.split(' · ')[0] || 'City'
    element.append(countNode, labelNode)
    element.addEventListener('click', () => {
      document.querySelector<HTMLElement>(`[data-city-place-key="${cssEscape(group.key)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    const marker = new maplibregl.Marker({ element, anchor: 'center' })
      .setLngLat([group.longitude, group.latitude])
      .addTo(map) as CityMarker
    cityMarkers.push(marker)
  }
  return true
}

function renderCityPlaces(rows: CityRow[]): void {
  const panel = document.querySelector<HTMLElement>('[data-stream-map-geography-panel]')
  if (!panel) return

  let host = panel.querySelector<HTMLElement>('[data-city-places]')
  if (!host) {
    host = document.createElement('div')
    host.className = 'stream-map-city-places'
    host.dataset.cityPlaces = ''
    panel.append(host)
  }
  host.replaceChildren()

  const grouped = new Map<string, { key: string; label: string; streams: number; viewers: number }>()
  for (const row of rows) {
    const city = clean(row.location?.cities?.[0])
    if (!city) continue
    const region = clean(row.location?.regions?.[0])
    const country = clean(row.location?.countryName) || clean(row.location?.countryCode)
    const label = [city, region, country].filter(Boolean).join(' · ')
    const key = [clean(row.location?.countryCode), region, city].join('|').toLowerCase()
    const current = grouped.get(key) ?? { key, label, streams: 0, viewers: 0 }
    current.streams += 1
    current.viewers += count(row.viewers)
    grouped.set(key, current)
  }

  const title = document.createElement('strong')
  title.textContent = 'Accepted City locations'
  host.append(title)

  const places = [...grouped.values()].sort((a, b) => b.viewers - a.viewers || a.label.localeCompare(b.label))
  if (!places.length) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = 'No accepted City placement exists in the selected population. Country-only evidence remains accounted but is not promoted to City.'
    host.append(empty)
    return
  }

  const { groups: resolvedGroups, unresolved } = resolveCityGroups(rows)
  const note = document.createElement('p')
  note.className = 'stream-map-city-placement-note'
  note.textContent = `${format(resolvedGroups.length)} city marker${resolvedGroups.length === 1 ? '' : 's'} resolved from the current reference-point set; ${format(unresolved)} stream${unresolved === 1 ? '' : 's'} remain list-only because no unambiguous city point is available.`
  host.append(note)

  for (const place of places) {
    const row = document.createElement('div')
    row.className = 'stream-map-city-place'
    row.dataset.cityPlaceKey = place.key
    const name = document.createElement('strong')
    name.textContent = place.label
    const detail = document.createElement('span')
    detail.textContent = `${format(place.streams)} stream${place.streams === 1 ? '' : 's'} · ${format(place.viewers)} viewers`
    row.append(name, detail)
    host.append(row)
  }
}

function textNode(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function count(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function format(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(value)
    : value.replace(/["\\]/g, '\\$&')
}

export {}
