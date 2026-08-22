import {
  filterMappedStreams,
  summarizeFilteredStreams,
  type StreamMapMappedStream,
} from './location-filter-core.mjs'

type MapLibreControl = object

type MapLibreMap = {
  addControl(control: MapLibreControl, position?: string): void
  scrollZoom: { disable(): void }
  on(event: 'load' | 'error', handler: () => void): void
}

type MapLibreMarker = {
  setLngLat(lngLat: [number, number]): MapLibreMarker
  addTo(map: MapLibreMap): MapLibreMarker
  remove(): void
}

type MapLibreNamespace = {
  Map: new (options: {
    container: string | HTMLElement
    style: string
    center: [number, number]
    zoom: number
    minZoom: number
    maxZoom: number
    maxBounds: [[number, number], [number, number]]
    attributionControl: boolean
    dragRotate: boolean
    pitchWithRotate: boolean
  }) => MapLibreMap
  Marker: new (options: { element: HTMLElement; anchor?: string }) => MapLibreMarker
  NavigationControl: new (options?: { showCompass?: boolean; visualizePitch?: boolean }) => MapLibreControl
}

type StreamMapPayload = {
  version: 'viewloom-stream-map-live-v1'
  platform: 'twitch'
  source: 'real'
  sourceMode: string
  updatedAt: string | null
  coverage: {
    topLimit: number
    observedStreams: number
    observedViewers: number
    mappedStreams: number
    unmappedStreams: number
    eligibleUnmappedStreams: number
    excludedNonPersonStreams: number
    mappedViewers: number
    unmappedViewers: number
    excludedNonPersonViewers: number
    mappedPercent: number
    mappedViewerPercent: number
    mappedCountryCount: number
    currentLocationStreams: number
    currentLocationPercent: number
    coveredPages: number | null
    hasMore: boolean
    mappedBySource: Record<string, number>
    unmappedReasons: Record<string, number>
  }
  mappedStreams: StreamMapMappedStream[]
  excludedNonPersonStreams: Array<{
    login: string
    displayName: string
    viewers: number
    url: string
    entityKind: string
  }>
  semantics: {
    languageUsedForPlacement: false
    candidateOnlyPlacementAllowed: false
    nonPersonPlacementAllowed: false
    conflictingAcceptedCountriesAreMapped: false
    mappedPlusUnmappedEqualsObserved: true
    excludedNonPersonIsSubsetOfUnmapped: true
    evidenceSourcesRemainDistinct: true
  }
  state: string
}

declare global {
  interface Window {
    maplibregl?: MapLibreNamespace
  }
}

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  AR: [-64.0, -34.0], AU: [134.0, -25.0], BR: [-51.0, -10.0], CA: [-106.0, 56.0],
  CL: [-71.0, -33.0], CO: [-74.0, 4.0], DE: [10.5, 51.1], DK: [9.5, 56.0],
  ES: [-3.7, 40.4], FI: [26.0, 64.0], FR: [2.2, 46.2], GB: [-3.4, 55.4],
  HK: [114.2, 22.3], ID: [118.0, -2.0], IN: [79.0, 22.0], IT: [12.6, 42.8],
  JP: [138.0, 36.0], KR: [127.8, 36.3], MX: [-102.0, 23.6], NL: [5.3, 52.1],
  NO: [8.5, 61.0], PH: [122.0, 12.0], PL: [19.1, 52.1], SE: [16.0, 62.0],
  SG: [103.8, 1.35], TH: [101.0, 15.5], TR: [35.2, 39.0], TW: [121.0, 23.7],
  US: [-98.5, 39.5],
}

const SOURCE_LABELS: Record<string, string> = {
  account_profile: 'Account/Profile',
  stream_title: 'Stream title',
  stream_tag: 'Stream tag',
  channel_profile: 'Channel profile',
  official_external: 'Official external',
  manual_review: 'Manual review',
}

const TYPE_LABELS: Record<string, string> = {
  home_base: 'Home / base',
  declared_location: 'Declared location',
  current_location: 'Current location',
}

const root = document.querySelector<HTMLElement>('#stream-map-root')
const status = document.querySelector<HTMLElement>('[data-stream-map-status]')
const state = document.querySelector<HTMLElement>('[data-stream-map-state]')
const sourceInputs = [...document.querySelectorAll<HTMLInputElement>('[data-location-source]')]
const typeInputs = [...document.querySelectorAll<HTMLInputElement>('[data-location-type]')]
const clearButton = document.querySelector<HTMLButtonElement>('[data-clear-location-filters]')

let payload: StreamMapPayload | null = null
let map: MapLibreMap | null = null
let mapReady = false
let mapFailed = false
let loadError = ''
let markers: MapLibreMarker[] = []

for (const input of [...sourceInputs, ...typeInputs]) input.addEventListener('change', renderView)
clearButton?.addEventListener('click', () => {
  for (const input of [...sourceInputs, ...typeInputs]) input.checked = false
  renderView()
})

initializeMap()
void loadData()

function initializeMap(): void {
  if (!root) return
  const maplibregl = window.maplibregl
  if (!maplibregl) {
    mapFailed = true
    root.dataset.mapState = 'renderer-error'
    syncStatus()
    return
  }

  root.dataset.mapState = 'basemap-loading'
  map = new maplibregl.Map({
    container: root,
    style: 'https://tiles.openfreemap.org/styles/dark',
    center: [10, 18],
    zoom: 1.15,
    minZoom: 0.8,
    maxZoom: 6,
    maxBounds: [[-180, -78], [180, 82]],
    attributionControl: true,
    dragRotate: false,
    pitchWithRotate: false,
  })
  map.scrollZoom.disable()
  map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right')

  map.on('load', () => {
    mapReady = true
    root.dataset.mapState = 'basemap-ready'
    renderView()
  })

  map.on('error', () => {
    if (mapReady) return
    mapFailed = true
    root.dataset.mapState = 'basemap-error'
    syncStatus()
  })
}

async function loadData(): Promise<void> {
  try {
    const response = await fetch('/api/twitch-stream-map', { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const next = await response.json() as StreamMapPayload
    if (next.version !== 'viewloom-stream-map-live-v1' || next.platform !== 'twitch' || next.source !== 'real') {
      throw new Error('Unexpected Stream Map data contract.')
    }
    payload = next
    renderView()
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error)
    renderView()
  }
}

function renderView(): void {
  if (!payload) {
    if (loadError) renderFailure(loadError)
    else syncStatus()
    return
  }

  const filter = currentFilter()
  const filtered = filterMappedStreams(payload.mappedStreams, filter)
  const summary = summarizeFilteredStreams(filtered, payload.coverage.observedStreams, payload.coverage.observedViewers)
  const filtering = filter.sources.size > 0 || filter.types.size > 0

  text('stream-map-observed', formatNumber(payload.coverage.observedStreams))
  text('stream-map-mapped', formatNumber(summary.mappedStreams))
  text('stream-map-unmapped', formatNumber(summary.unmappedStreams))
  text('stream-map-strip-updated', payload.updatedAt ? formatAgo(payload.updatedAt) : 'Unavailable')
  text('stream-map-strip-coverage', `${formatPercent(summary.mappedPercent)} streams · ${formatPercent(summary.mappedViewerPercent)} viewers`)
  text('stream-map-filter-summary', filterSummary(filter.sources, filter.types))
  text('stream-map-card-mapped', `${formatNumber(summary.mappedStreams)} / ${formatNumber(payload.coverage.observedStreams)}`)
  text('stream-map-card-viewers', `${formatNumber(summary.mappedViewers)} / ${formatNumber(payload.coverage.observedViewers)}`)
  text('stream-map-card-excluded', `${formatNumber(payload.coverage.excludedNonPersonStreams)} streams · ${formatNumber(payload.coverage.excludedNonPersonViewers)} viewers`)
  text('stream-map-country-count', formatNumber(summary.mappedCountryCount))
  text('stream-map-current-count', formatNumber(summary.currentLocationStreams))

  const note = document.getElementById('stream-map-filter-note')
  if (note) {
    note.textContent = filtering
      ? `Filtered coverage: ${formatPercent(summary.mappedPercent)} of observed streams. Unmatched accepted evidence is treated as unmapped in this view.`
      : `All accepted evidence: ${formatPercent(payload.coverage.mappedPercent)} of observed streams and ${formatPercent(payload.coverage.mappedViewerPercent)} of observed viewers are mapped.`
  }

  renderCountrySummary(filtered)
  renderStreamList(filtered)
  renderMarkers(filtered)
  syncStatus(filtered.length)
}

function currentFilter(): { sources: Set<string>; types: Set<string> } {
  return {
    sources: new Set(sourceInputs.filter((input) => input.checked).map((input) => input.value)),
    types: new Set(typeInputs.filter((input) => input.checked).map((input) => input.value)),
  }
}

function renderCountrySummary(streams: StreamMapMappedStream[]): void {
  const list = document.getElementById('stream-map-country-list')
  if (!list) return
  list.replaceChildren()

  const countries = groupedCountries(streams)
  if (countries.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = 'No accepted mapped country matches the selected evidence filters.'
    list.append(empty)
    return
  }

  for (const country of countries) {
    const row = document.createElement('div')
    row.className = 'stream-map-country-row'
    const name = document.createElement('strong')
    name.textContent = country.countryName
    const detail = document.createElement('span')
    detail.textContent = `${formatNumber(country.streams.length)} stream${country.streams.length === 1 ? '' : 's'} · ${formatNumber(country.viewers)} viewers`
    row.append(name, detail)
    list.append(row)
  }
}

function renderStreamList(streams: StreamMapMappedStream[]): void {
  const list = document.getElementById('stream-map-stream-list')
  if (!list) return
  list.replaceChildren()

  if (streams.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = 'No mapped streamer matches the selected source/type combination.'
    list.append(empty)
    return
  }

  for (const stream of [...streams].sort((a, b) => b.viewers - a.viewers)) {
    const article = document.createElement('article')
    article.className = 'stream-map-stream-row'

    const head = document.createElement('div')
    head.className = 'stream-map-stream-row__head'
    const channel = document.createElement('a')
    channel.href = stream.url
    channel.target = '_blank'
    channel.rel = 'noreferrer'
    channel.textContent = stream.displayName
    const viewers = document.createElement('strong')
    viewers.textContent = `${formatNumber(stream.viewers)} viewers`
    head.append(channel, viewers)

    const location = document.createElement('div')
    location.className = 'stream-map-stream-row__location'
    location.textContent = locationLabel(stream)

    const badges = document.createElement('div')
    badges.className = 'stream-map-badges'
    for (const source of stream.sources) badges.append(sourceBadge(source))
    for (const type of stream.location.locationTypes) badges.append(typeBadge(type))

    const evidenceList = document.createElement('div')
    evidenceList.className = 'stream-map-evidence-list'
    for (const evidence of stream.evidence) {
      const row = document.createElement('div')
      row.className = 'stream-map-evidence-row'
      row.append(sourceBadge(evidence.source))
      const detail = document.createElement('span')
      detail.textContent = `${TYPE_LABELS[evidence.locationType] ?? evidence.locationType} · ${evidence.countryName ?? evidence.countryCode}${evidence.region ? ` / ${evidence.region}` : ''}${evidence.city ? ` / ${evidence.city}` : ''} · ${evidence.confidence}`
      row.append(detail)
      if (evidence.sourceUrl) {
        const source = document.createElement('a')
        source.href = evidence.sourceUrl
        source.target = '_blank'
        source.rel = 'noreferrer'
        source.textContent = 'source'
        row.append(source)
      }
      evidenceList.append(row)
    }

    article.append(head, location, badges, evidenceList)
    list.append(article)
  }
}

function renderMarkers(streams: StreamMapMappedStream[]): void {
  for (const marker of markers) marker.remove()
  markers = []
  if (!mapReady || !map || !window.maplibregl) return

  for (const country of groupedCountries(streams)) {
    const coordinates = COUNTRY_CENTROIDS[country.countryCode]
    if (!coordinates) continue
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'stream-map-country-marker'
    element.setAttribute('aria-label', `${country.countryName}: ${country.streams.length} mapped streams, ${formatNumber(country.viewers)} viewers`)
    const count = document.createElement('strong')
    count.textContent = formatNumber(country.streams.length)
    const label = document.createElement('span')
    label.textContent = country.countryCode
    element.append(count, label)
    element.addEventListener('click', () => {
      const countryList = document.getElementById('stream-map-country-list')
      countryList?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
    markers.push(new window.maplibregl.Marker({ element, anchor: 'center' }).setLngLat(coordinates).addTo(map))
  }
}

function groupedCountries(streams: StreamMapMappedStream[]) {
  const groups = new Map<string, { countryCode: string; countryName: string; viewers: number; streams: StreamMapMappedStream[] }>()
  for (const stream of streams) {
    const countryCode = String(stream.location.countryCode || '').toUpperCase()
    if (!countryCode) continue
    const current = groups.get(countryCode) ?? {
      countryCode,
      countryName: stream.location.countryName || countryCode,
      viewers: 0,
      streams: [],
    }
    current.viewers += stream.viewers
    current.streams.push(stream)
    groups.set(countryCode, current)
  }
  return [...groups.values()].sort((a, b) => b.viewers - a.viewers || a.countryName.localeCompare(b.countryName))
}

function sourceBadge(source: string): HTMLElement {
  const badge = document.createElement('span')
  badge.className = `stream-map-badge stream-map-badge--${source.replace(/_/g, '-')}`
  badge.dataset.source = source
  badge.textContent = SOURCE_LABELS[source] ?? source
  return badge
}

function typeBadge(type: string): HTMLElement {
  const badge = document.createElement('span')
  badge.className = 'stream-map-type-badge'
  badge.dataset.locationType = type
  badge.textContent = TYPE_LABELS[type] ?? type
  return badge
}

function locationLabel(stream: StreamMapMappedStream): string {
  const city = stream.location.cities[0]
  const region = stream.location.regions[0]
  return [stream.location.countryName, region, city].filter(Boolean).join(' / ')
}

function syncStatus(filteredCount?: number): void {
  if (state) {
    state.textContent = loadError ? 'Data error' : payload ? (mapFailed ? 'Data ready' : mapReady ? 'Ready' : 'Map loading') : 'Loading'
  }
  if (!status) return

  if (loadError) {
    status.dataset.state = 'error'
    status.replaceChildren(statusStrong('Stream Map data unavailable'), statusSpan(loadError))
    return
  }
  if (!payload) {
    status.dataset.state = 'loading'
    status.replaceChildren(statusStrong('Loading live Twitch geography…'), statusSpan('No demo geography will be substituted.'))
    return
  }
  if (mapFailed) {
    status.dataset.state = 'error'
    status.replaceChildren(statusStrong('Live data ready · map renderer unavailable'), statusSpan(`${filteredCount ?? payload.mappedStreams.length} mapped streams remain available in the list below.`))
    return
  }
  if (!mapReady) {
    status.dataset.state = 'loading'
    status.replaceChildren(statusStrong('Live data ready · loading world basemap…'), statusSpan(`${filteredCount ?? payload.mappedStreams.length} mapped streams from accepted evidence.`))
    return
  }

  status.dataset.state = 'ready'
  status.replaceChildren(statusStrong(`${filteredCount ?? payload.mappedStreams.length} mapped streams in view`), statusSpan('Unknown and rejected geography remains unmapped.'))
}

function renderFailure(message: string): void {
  text('stream-map-observed', 'Unavailable')
  text('stream-map-mapped', 'Unavailable')
  text('stream-map-unmapped', 'Unavailable')
  text('stream-map-strip-updated', 'Unavailable')
  text('stream-map-strip-coverage', 'Unavailable')
  syncStatus()
  const list = document.getElementById('stream-map-stream-list')
  if (list) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = `Real Stream Map data could not be loaded. ${message}`
    list.replaceChildren(empty)
  }
}

function filterSummary(sources: Set<string>, types: Set<string>): string {
  if (sources.size === 0 && types.size === 0) return 'All accepted'
  const sourceText = sources.size ? [...sources].map((source) => SOURCE_LABELS[source] ?? source).join(' + ') : 'All sources'
  const typeText = types.size ? [...types].map((type) => TYPE_LABELS[type] ?? type).join(' + ') : 'All types'
  return `${sourceText} · ${typeText}`
}

function statusStrong(value: string): HTMLElement {
  const node = document.createElement('strong')
  node.textContent = value
  return node
}

function statusSpan(value: string): HTMLElement {
  const node = document.createElement('span')
  node.textContent = value
  return node
}

function text(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)))
}

function formatPercent(value: number): string {
  const percent = Math.max(0, value) * 100
  return percent < 1 && percent > 0 ? `${percent.toFixed(2)}%` : `${percent.toFixed(1)}%`
}

function formatAgo(value: string): string {
  const ms = Date.now() - Date.parse(value)
  if (!Number.isFinite(ms)) return value
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
