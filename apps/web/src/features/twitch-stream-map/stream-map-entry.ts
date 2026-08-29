import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  filterMappedStreams,
  summarizeFilteredStreams,
  type StreamMapMappedStream,
} from './location-filter-core.mjs'
import {
  countrySelectionState,
  groupMappedStreamsByCountry,
} from './country-drilldown-core.mjs'
import { renderUnmappedReasonAnalysis } from './unmapped-reason-view'

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

type PopulationCategory = {
  id: string
  name: string
  streamCount: number
  totalViewers: number
}

type StreamMapPopulationFilter = {
  implementationState: 'public'
  order: string[]
  baseObservedStreams: number
  selectedTop: number
  minViewers: number
  selectedCategory: string
  selectedCategoryName: string | null
  categoryState: 'all' | 'selected' | 'unknown_category' | 'category_unavailable'
  categoryAvailable: boolean
  categoryCoverageState: 'observed' | 'partial' | 'unavailable'
  categoryContractVersion: string | null
  topScopedStreams: number
  preCategoryStreams: number
  preCategoryViewers: number
  selectedPopulationStreams: number
  selectedPopulationViewers: number
  unknownCategoryStreams: number
  dictionaryMissingItems: number
  availableCategories: PopulationCategory[]
  languageFilterAvailable: false
  languageUsedForPopulationFiltering: false
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
  populationFilter: StreamMapPopulationFilter
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
    populationFilterBeforeEvidenceFilter: true
    languageUsedForPopulationFiltering: false
  }
  state: string
}

type CountrySelection = ReturnType<typeof countrySelectionState>

declare global {
  interface Window {
    maplibregl?: MapLibreNamespace
  }
}

window.maplibregl = maplibregl as unknown as MapLibreNamespace

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
const clearCountryButton = document.querySelector<HTMLButtonElement>('[data-clear-selected-country]')
const populationTop = document.querySelector<HTMLSelectElement>('[data-population-top]')
const populationMinViewers = document.querySelector<HTMLSelectElement>('[data-population-min-viewers]')
const populationCategory = document.querySelector<HTMLSelectElement>('[data-population-category]')
const resetPopulationButton = document.querySelector<HTMLButtonElement>('[data-reset-population-filters]')

let payload: StreamMapPayload | null = null
let map: MapLibreMap | null = null
let mapReady = false
let mapFailed = false
let loadError = ''
let populationLoading = false
let loadRequestId = 0
let markers: MapLibreMarker[] = []
let selectedCountry: string | null = null
let selectedCountryLabel = ''

for (const input of [...sourceInputs, ...typeInputs]) input.addEventListener('change', renderView)
for (const select of [populationTop, populationMinViewers, populationCategory]) {
  select?.addEventListener('change', () => void loadData())
}
clearButton?.addEventListener('click', () => {
  for (const input of [...sourceInputs, ...typeInputs]) input.checked = false
  renderView()
})
clearCountryButton?.addEventListener('click', clearSelectedCountry)
resetPopulationButton?.addEventListener('click', () => {
  if (populationTop) populationTop.value = '300'
  if (populationMinViewers) populationMinViewers.value = '0'
  if (populationCategory) populationCategory.value = 'all'
  void loadData()
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
  const requestId = ++loadRequestId
  populationLoading = true
  loadError = ''
  syncStatus()

  try {
    const requestUrl = new URL('/api/twitch-stream-map', window.location.origin)
    requestUrl.searchParams.set('top', populationTop?.value || '300')
    requestUrl.searchParams.set('min_viewers', populationMinViewers?.value || '0')
    requestUrl.searchParams.set('category', populationCategory?.value || 'all')
    const response = await fetch(requestUrl.toString(), { cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const next = await response.json() as StreamMapPayload
    if (next.version !== 'viewloom-stream-map-live-v1' || next.platform !== 'twitch' || next.source !== 'real' || !next.coverage || !next.populationFilter) {
      throw new Error('Unexpected Stream Map data contract.')
    }
    if (requestId !== loadRequestId) return
    payload = next
    syncPopulationControls(next.populationFilter)
    populationLoading = false
    renderView()
  } catch (error) {
    if (requestId !== loadRequestId) return
    populationLoading = false
    loadError = error instanceof Error ? error.message : String(error)
    renderView()
  }
}

function syncPopulationControls(filter: StreamMapPopulationFilter): void {
  if (populationTop) populationTop.value = String(filter.selectedTop)
  if (populationMinViewers) populationMinViewers.value = String(filter.minViewers)
  if (!populationCategory) return

  populationCategory.replaceChildren()
  const all = document.createElement('option')
  all.value = 'all'
  all.textContent = 'All categories'
  populationCategory.append(all)

  for (const category of filter.availableCategories) {
    const option = document.createElement('option')
    option.value = category.id
    option.textContent = `${category.name} · ${formatNumber(category.streamCount)}`
    populationCategory.append(option)
  }

  if (filter.selectedCategory !== 'all' && !filter.availableCategories.some((category) => category.id === filter.selectedCategory)) {
    const retained = document.createElement('option')
    retained.value = filter.selectedCategory
    retained.textContent = filter.categoryState === 'category_unavailable'
      ? `Category unavailable · ${filter.selectedCategory}`
      : `Not in selected population · ${filter.selectedCategory}`
    populationCategory.append(retained)
  }
  populationCategory.value = filter.selectedCategory
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
  const selection = countrySelectionState(filtered, selectedCountry)
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
  renderPopulationSummary(payload.populationFilter)

  const note = document.getElementById('stream-map-filter-note')
  if (note) {
    note.textContent = filtering
      ? `Filtered coverage: ${formatPercent(summary.mappedPercent)} of selected-population streams. Unmatched accepted evidence is treated as unmapped in this view.`
      : `All accepted evidence: ${formatPercent(payload.coverage.mappedPercent)} of selected-population streams and ${formatPercent(payload.coverage.mappedViewerPercent)} of selected-population viewers are mapped.`
  }

  renderUnmappedReasonAnalysis({
    coverage: payload.coverage,
    excludedNonPersonStreams: payload.excludedNonPersonStreams,
    filteredMappedStreams: summary.mappedStreams,
  })
  renderCountrySummary(filtered)
  renderSelectedCountry(selection)
  renderStreamList(selection.visibleStreams, selection)
  renderMarkers(filtered)
  syncStatus(filtered.length, selection)
}

function renderPopulationSummary(filter: StreamMapPopulationFilter): void {
  const categoryLabel = filter.selectedCategory === 'all'
    ? 'all categories'
    : filter.selectedCategoryName || filter.selectedCategory
  const viewerLabel = filter.minViewers > 0 ? `${formatNumber(filter.minViewers)}+ viewers` : 'all viewers'
  text('stream-map-population-summary', `Top ${formatNumber(filter.selectedTop)} · ${viewerLabel} · ${categoryLabel}`)

  const node = document.getElementById('stream-map-population-state')
  if (!node) return
  node.dataset.categoryState = filter.categoryState
  node.dataset.categoryCoverage = filter.categoryCoverageState
  if (filter.categoryState === 'unknown_category') {
    node.textContent = `Selected category is not present inside the current Top-N/min-viewer scope. Selected population: 0 streams.`
    return
  }
  if (filter.categoryState === 'category_unavailable' && filter.selectedCategory !== 'all') {
    node.textContent = 'Category data is unavailable for this snapshot, so the selected category returns an explicit zero population instead of falling back to all categories.'
    return
  }
  const categoryNote = filter.categoryCoverageState === 'partial'
    ? ` Category coverage is partial: ${formatNumber(filter.unknownCategoryStreams)} rows have no category and ${formatNumber(filter.dictionaryMissingItems)} category names are unresolved.`
    : filter.categoryCoverageState === 'unavailable'
      ? ' Category data is unavailable; all-category mode keeps the Top-N/min-viewer population.'
      : ' Category coverage is observed for this scope.'
  node.textContent = `${formatNumber(filter.selectedPopulationStreams)} streams · ${formatNumber(filter.selectedPopulationViewers)} viewers selected.${categoryNote}`
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

  const countries = groupMappedStreamsByCountry(streams)
  if (countries.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = selectedCountry
      ? 'No mapped country matches the selected population/evidence filters. The selected country is retained until you clear it.'
      : 'No accepted mapped country matches the selected population/evidence filters.'
    list.append(empty)
    return
  }

  for (const country of countries) {
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'stream-map-country-row'
    row.dataset.countryCode = country.countryCode
    row.setAttribute('aria-pressed', String(selectedCountry === country.countryCode))
    row.setAttribute('aria-label', `Show ${country.countryName} drilldown: ${country.streams.length} mapped streams, ${formatNumber(country.viewers)} viewers`)
    if (selectedCountry === country.countryCode) row.classList.add('is-selected')

    const name = document.createElement('strong')
    name.textContent = country.countryName
    const detail = document.createElement('span')
    detail.textContent = `${formatNumber(country.streams.length)} stream${country.streams.length === 1 ? '' : 's'} · ${formatNumber(country.viewers)} viewers`
    row.append(name, detail)
    row.addEventListener('click', () => selectCountry(country.countryCode, country.countryName, false))
    list.append(row)
  }
}

function renderSelectedCountry(selection: CountrySelection): void {
  const panel = document.getElementById('stream-map-selected-country')
  if (!panel) return
  panel.hidden = !selection.selectedCountry
  if (!selection.selectedCountry) return

  const country = selection.country
  const label = country?.countryName || selectedCountryLabel || selection.selectedCountry
  if (country?.countryName) selectedCountryLabel = country.countryName
  text('stream-map-selected-country-name', label)
  text('stream-map-selected-country-streams', formatNumber(country?.streams.length ?? 0))
  text('stream-map-selected-country-viewers', formatNumber(country?.viewers ?? 0))

  const sourceList = document.getElementById('stream-map-selected-country-sources')
  if (sourceList) {
    sourceList.replaceChildren()
    const entries = Object.entries(country?.sourceCounts ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    if (entries.length === 0) {
      const empty = document.createElement('span')
      empty.className = 'stream-map-selected-country-source-empty'
      empty.textContent = 'No selected accepted evidence matches current population/source/type filters.'
      sourceList.append(empty)
    } else {
      for (const [source, count] of entries) {
        const item = document.createElement('span')
        item.className = 'stream-map-selected-country-source'
        item.append(sourceBadge(source), document.createTextNode(` ${formatNumber(count)}`))
        sourceList.append(item)
      }
    }
  }

  const note = document.getElementById('stream-map-selected-country-note')
  if (note) {
    note.textContent = country
      ? `${label} is selected. The streamer list below is restricted to this country and still obeys the active population/evidence filters.`
      : `${label} remains selected, but no accepted mapped evidence for it matches the active population/evidence filters. The selection was not silently changed.`
  }

  const listTitle = document.getElementById('stream-map-stream-list-title')
  if (listTitle) listTitle.textContent = `${label} mapped streams`
}

function renderStreamList(streams: StreamMapMappedStream[], selection: CountrySelection): void {
  const list = document.getElementById('stream-map-stream-list')
  if (!list) return
  list.replaceChildren()

  const listTitle = document.getElementById('stream-map-stream-list-title')
  if (!selection.selectedCountry && listTitle) listTitle.textContent = 'Mapped streams'

  if (streams.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = selection.selectedCountry
      ? 'The selected country has no mapped streamer under the active population/evidence filters. Clear the country or change the filters.'
      : 'No mapped streamer matches the selected population/source/type combination.'
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

  for (const country of groupMappedStreamsByCountry(streams)) {
    const coordinates = COUNTRY_CENTROIDS[country.countryCode]
    if (!coordinates) continue
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'stream-map-country-marker'
    element.dataset.countryCode = country.countryCode
    element.setAttribute('aria-pressed', String(selectedCountry === country.countryCode))
    element.setAttribute('aria-label', `Show ${country.countryName} drilldown: ${country.streams.length} mapped streams, ${formatNumber(country.viewers)} viewers`)
    if (selectedCountry === country.countryCode) element.classList.add('is-selected')

    const count = document.createElement('strong')
    count.textContent = formatNumber(country.streams.length)
    const label = document.createElement('span')
    label.textContent = country.countryCode
    element.append(count, label)
    element.addEventListener('click', () => selectCountry(country.countryCode, country.countryName, true))
    markers.push(new window.maplibregl.Marker({ element, anchor: 'center' }).setLngLat(coordinates).addTo(map))
  }
}

function selectCountry(countryCode: string, countryName: string, scrollToDrilldown: boolean): void {
  selectedCountry = countryCode.toUpperCase()
  selectedCountryLabel = countryName
  renderView()
  if (scrollToDrilldown) {
    document.getElementById('stream-map-selected-country')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

function clearSelectedCountry(): void {
  selectedCountry = null
  selectedCountryLabel = ''
  renderView()
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

function syncStatus(filteredCount?: number, selection?: CountrySelection): void {
  if (state) {
    state.textContent = loadError
      ? 'Data error'
      : populationLoading
        ? 'Updating population'
        : payload
          ? (mapFailed ? 'Data ready' : mapReady ? 'Ready' : 'Map loading')
          : 'Loading'
  }
  if (!status) return

  if (loadError) {
    status.dataset.state = 'error'
    status.replaceChildren(statusStrong('Stream Map data unavailable'), statusSpan(loadError))
    return
  }
  if (populationLoading) {
    status.dataset.state = 'loading'
    status.replaceChildren(
      statusStrong(payload ? 'Updating selected Twitch population…' : 'Loading live Twitch population…'),
      statusSpan('Population changes are applied before location evidence filters.'),
    )
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
  if (selection?.selectedCountry) {
    const label = selection.country?.countryName || selectedCountryLabel || selection.selectedCountry
    status.replaceChildren(
      statusStrong(`${label}: ${formatNumber(selection.visibleStreams.length)} mapped streams in drilldown`),
      statusSpan(selection.selectedEmpty ? 'Selected country retained with zero matching population/evidence under the active filters.' : 'Country drilldown is active; population and source/type filters still apply.'),
    )
    return
  }
  status.replaceChildren(statusStrong(`${filteredCount ?? payload.mappedStreams.length} mapped streams in view`), statusSpan('Unknown and rejected geography remains unmapped.'))
}

function renderFailure(message: string): void {
  text('stream-map-observed', 'Unavailable')
  text('stream-map-mapped', 'Unavailable')
  text('stream-map-unmapped', 'Unavailable')
  text('stream-map-strip-updated', 'Unavailable')
  text('stream-map-strip-coverage', 'Unavailable')
  text('stream-map-population-summary', 'Unavailable')
  text('stream-map-population-state', 'Selected population unavailable.')
  text('stream-map-unmapped-current', 'Unavailable')
  text('stream-map-unmapped-baseline', 'Unavailable')
  text('stream-map-unmapped-filtered-out', 'Unavailable')
  syncStatus()
  const list = document.getElementById('stream-map-stream-list')
  if (list) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = `Real Stream Map data could not be loaded. ${message}`
    list.replaceChildren(empty)
  }
  for (const id of ['stream-map-unmapped-reason-list', 'stream-map-excluded-nonperson-list']) {
    const node = document.getElementById(id)
    if (!node) continue
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = `Unmapped analysis unavailable because real Stream Map data could not be loaded. ${message}`
    node.replaceChildren(empty)
  }
  text('stream-map-unmapped-reconciliation', 'Reason accounting unavailable while real Stream Map data is unavailable.')
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
