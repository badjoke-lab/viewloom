import { filterMappedStreams, type StreamMapMappedStream } from './location-filter-core.mjs'
import { cityAggregateKeyFromStream, citySelectionState, type CitySelectionState } from './city-aggregate-core.mjs'
import { cityReferencePointAggregates, cityReferencePointForAggregate } from './city-reference-point-core.mjs'
import { subscribeStreamMapRuntimeMap, type StreamMapRuntimeMap } from './stream-map-runtime'

type CityPayload = {
  mappedStreams?: StreamMapMappedStream[]
}

type CityPayloadWindow = Window & {
  __viewloomStreamMapCityPayload?: CityPayload | null
}

type CityMapLibreMarker = {
  setLngLat(lngLat: [number, number]): CityMapLibreMarker
  addTo(map: StreamMapRuntimeMap): CityMapLibreMarker
  remove(): void
}

type CityMapLibreNamespace = {
  Marker: new (options: { element: HTMLElement; anchor?: string }) => CityMapLibreMarker
}

type CityMapWindow = CityPayloadWindow & {
  maplibregl?: CityMapLibreNamespace
}

const requestedCity = new URL(window.location.href).searchParams.get('geography') === 'city'
let selectedCityKey: string | null = null
let selectedCityLabel = ''
let latestRows: StreamMapMappedStream[] = []
let lastPayload: CityPayload | null = null
let streamListObserver: MutationObserver | null = null
let payloadObserver: MutationObserver | null = null
let runtimeMap: StreamMapRuntimeMap | null = null
let cityMarkers: CityMapLibreMarker[] = []

if (requestedCity) bootCityRendering()

function bootCityRendering(): void {
  document.documentElement.classList.add('stream-map-city-mode')
  injectCityStyles()
  updateStaticCityCopy()
  bindFilterRefresh()
  subscribeStreamMapRuntimeMap((map) => {
    runtimeMap = map
    renderCityView()
  })
  renderWhenPayloadArrives()
}

function injectCityStyles(): void {
  const style = document.createElement('style')
  style.id = 'stream-map-city-render-style'
  style.textContent = `
    .stream-map-city-mode .stream-map-country-marker{display:none!important}
    .stream-map-city-mode #stream-map-selected-country{display:none!important}
    .stream-map-city-mode .stream-map-stream-row[hidden],.stream-map-selected-city[hidden]{display:none!important}
    .stream-map-city-places{grid-column:1/-1;display:grid;gap:8px;border-top:1px solid var(--line,#30363d);padding-top:12px}
    .stream-map-city-place{width:100%;display:flex;justify-content:space-between;gap:14px;padding:9px 0;border:0;border-bottom:1px solid var(--line,#30363d);background:transparent;color:inherit;text-align:left;cursor:pointer}
    .stream-map-city-place span{color:var(--muted,#9ca3af);font-size:13px;text-align:right}
    .stream-map-city-place[aria-pressed="true"]{font-weight:700;border-bottom-color:currentColor}
    .stream-map-city-place:focus-visible,.stream-map-selected-city button:focus-visible,.stream-map-city-reference-marker:focus-visible{outline:2px solid currentColor;outline-offset:3px}
    .stream-map-selected-city{grid-column:1/-1;display:grid;gap:9px;border-top:1px solid var(--line,#30363d);padding-top:12px}
    .stream-map-selected-city__head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .stream-map-selected-city__actions{display:flex;gap:8px;flex-wrap:wrap}
    .stream-map-selected-city__facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    .stream-map-selected-city__facts div{display:flex;flex-direction:column;gap:3px}.stream-map-selected-city__facts small{color:var(--muted,#9ca3af)}
    .stream-map-selected-city__sources{display:flex;gap:6px;flex-wrap:wrap}
    .stream-map-city-reference-marker{display:grid;place-items:center;min-width:48px;min-height:48px;padding:5px 8px;border:1px solid rgba(255,255,255,.58);border-radius:999px;background:rgba(12,18,28,.92);box-shadow:0 3px 14px rgba(0,0,0,.34);color:#fff;cursor:pointer;line-height:1.05;text-align:center}
    .stream-map-city-reference-marker strong{font-size:13px}.stream-map-city-reference-marker span{max-width:92px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;color:#d8dee9}
    .stream-map-city-reference-marker.is-selected{border-width:2px;background:rgba(28,43,61,.98);box-shadow:0 0 0 3px rgba(255,255,255,.18),0 4px 16px rgba(0,0,0,.38)}
    @media (max-width:720px){.stream-map-city-place{min-height:44px;align-items:center}.stream-map-city-place span{text-align:left}.stream-map-selected-city__head{display:grid}.stream-map-selected-city__facts{grid-template-columns:1fr}.stream-map-city-reference-marker{min-width:44px;min-height:44px;padding:4px 7px}}
  `
  document.head.append(style)
}

function updateStaticCityCopy(): void {
  const run = () => {
    const shell = document.querySelector<HTMLElement>('.stream-map-shell__head')
    const heading = shell?.querySelector<HTMLElement>('h2')
    const copy = shell?.querySelector<HTMLElement>('p')
    if (heading) heading.textContent = 'City view'
    if (copy) copy.textContent = 'City mode groups only accepted home/base or declared-location evidence by City. Reviewed City aggregate reference points may appear on the map; they are not creator positions.'

    const interaction = document.querySelector<HTMLElement>('.stream-map-interaction-note')
    if (interaction) interaction.textContent = 'Select a reviewed City aggregate reference point or use the full City list. Cities without reviewed geometry remain list-only; creator coordinates are never inferred.'

    const resultsHead = document.querySelector<HTMLElement>('.stream-map-results__head')
    const resultsHeading = resultsHead?.querySelector<HTMLElement>('h2')
    const resultsCopy = resultsHead?.querySelector<HTMLElement>('p')
    if (resultsHeading) resultsHeading.textContent = 'Mapped City streams'
    if (resultsCopy) resultsCopy.textContent = 'City selection restricts the mapped stream drilldown without changing evidence acceptance. Country-only evidence stays in accounting and is not promoted.'
    const countryFactLabel = document.getElementById('stream-map-country-count')?.parentElement?.querySelector<HTMLElement>('small')
    if (countryFactLabel) countryFactLabel.textContent = 'Countries with City evidence'
    const currentFactLabel = document.getElementById('stream-map-current-count')?.parentElement?.querySelector<HTMLElement>('small')
    if (currentFactLabel) currentFactLabel.textContent = 'Current-location placement'
    textNode('stream-map-current-count', '0')

    const countryList = document.getElementById('stream-map-country-list')
    const countryCard = countryList?.closest('.stream-map-results-card') as HTMLElement | null | undefined
    if (countryCard) countryCard.hidden = true

    const root = document.getElementById('stream-map-root')
    root?.setAttribute('aria-label', 'World basemap with reviewed City aggregate reference points; reference points are not creator exact or current locations')
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
}

function bindFilterRefresh(): void {
  const bind = () => {
    for (const input of document.querySelectorAll<HTMLInputElement>('[data-location-source],[data-location-type]')) {
      input.addEventListener('change', () => queueMicrotask(renderCityView))
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true })
  else bind()
}

function renderWhenPayloadArrives(): void {
  const sync = () => {
    if (!syncLatestPayload()) return false
    installStreamListObserver()
    installPayloadObserver()
    window.setTimeout(updateStaticCityCopy, 0)
    return true
  }

  if (sync()) return
  const observer = new MutationObserver(() => {
    if (!sync()) return
    observer.disconnect()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

function syncLatestPayload(): boolean {
  const payload = (window as CityPayloadWindow).__viewloomStreamMapCityPayload ?? null
  if (!payload) return false
  if (payload === lastPayload) return true
  lastPayload = payload
  latestRows = Array.isArray(payload.mappedStreams) ? payload.mappedStreams : []
  renderCityView()
  return true
}

function installPayloadObserver(): void {
  if (payloadObserver) return
  const panel = document.querySelector<HTMLElement>('[data-stream-map-geography-panel]')
  if (!panel) {
    window.setTimeout(installPayloadObserver, 0)
    return
  }
  payloadObserver = new MutationObserver(() => {
    const before = lastPayload
    syncLatestPayload()
    if (lastPayload !== before) window.setTimeout(updateStaticCityCopy, 0)
  })
  payloadObserver.observe(panel, { childList: true, subtree: true })
}

function currentFilteredRows(): StreamMapMappedStream[] {
  const sources = new Set([...document.querySelectorAll<HTMLInputElement>('[data-location-source]')].filter((input) => input.checked).map((input) => input.value))
  const types = new Set([...document.querySelectorAll<HTMLInputElement>('[data-location-type]')].filter((input) => input.checked).map((input) => input.value))
  return filterMappedStreams(latestRows, { sources, types })
}

function renderCityView(): void {
  const filtered = currentFilteredRows()
  const selection = citySelectionState(filtered, selectedCityKey) as CitySelectionState<StreamMapMappedStream>
  renderCityPlaces(selection)
  renderSelectedCity(selection)
  applyStreamSelection(selection, filtered)
  renderCityReferenceMarkers(selection)
}

function renderCityPlaces(selection: CitySelectionState<StreamMapMappedStream>): void {
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

  const title = document.createElement('strong')
  title.textContent = 'Accepted City locations'
  host.append(title)

  if (!selection.aggregates.length) {
    const empty = document.createElement('p')
    empty.className = 'stream-map-empty'
    empty.textContent = selectedCityKey
      ? 'No accepted City aggregate matches the active population/evidence filters. The City selection remains until cleared.'
      : 'No accepted City placement exists in the selected population. Country-only evidence remains accounted but is not promoted to City.'
    host.append(empty)
    return
  }

  for (const place of selection.aggregates) {
    const referencePoint = cityReferencePointForAggregate(place)
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'stream-map-city-place'
    row.dataset.cityAggregateKey = place.key
    row.dataset.cityGeometry = referencePoint ? 'reference_point' : 'list_only'
    row.setAttribute('aria-pressed', String(selection.selectedKey === place.key))
    row.setAttribute('aria-label', `Show ${place.label}: ${format(place.streams.length)} mapped streams, ${format(place.viewers)} viewers${referencePoint ? ', reviewed map reference available' : ', list only because reviewed map geometry is unavailable'}`)
    const name = document.createElement('strong')
    name.textContent = place.label
    const detail = document.createElement('span')
    detail.textContent = `${format(place.streams.length)} stream${place.streams.length === 1 ? '' : 's'} · ${format(place.viewers)} viewers · ${referencePoint ? 'map reference' : 'list only'}`
    row.append(name, detail)
    row.addEventListener('click', () => {
      selectedCityKey = place.key
      selectedCityLabel = place.label
      renderCityView()
    })
    host.append(row)
  }
}

function renderCityReferenceMarkers(selection: CitySelectionState<StreamMapMappedStream>): void {
  clearCityReferenceMarkers()
  const maplibregl = (window as CityMapWindow).maplibregl
  if (!runtimeMap || !maplibregl) return

  for (const { aggregate, referencePoint } of cityReferencePointAggregates(selection.aggregates)) {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'stream-map-city-reference-marker'
    element.dataset.cityAggregateKey = aggregate.key
    element.dataset.referenceRole = referencePoint.referenceRole
    element.setAttribute('aria-pressed', String(selection.selectedKey === aggregate.key))
    element.setAttribute('aria-label', `Select ${aggregate.label} City aggregate reference point: ${format(aggregate.streams.length)} mapped streams, ${format(aggregate.viewers)} viewers. This point is not a creator exact or current location.`)
    element.title = `City aggregate reference point · ${aggregate.label}`
    if (selection.selectedKey === aggregate.key) element.classList.add('is-selected')

    const count = document.createElement('strong')
    count.textContent = format(aggregate.streams.length)
    const label = document.createElement('span')
    label.textContent = aggregate.city
    element.append(count, label)
    element.addEventListener('click', () => {
      selectedCityKey = aggregate.key
      selectedCityLabel = aggregate.label
      renderCityView()
    })

    cityMarkers.push(
      new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([referencePoint.longitude, referencePoint.latitude])
        .addTo(runtimeMap),
    )
  }
}

function clearCityReferenceMarkers(): void {
  for (const marker of cityMarkers) marker.remove()
  cityMarkers = []
}

function renderSelectedCity(selection: CitySelectionState<StreamMapMappedStream>): void {
  const panel = document.querySelector<HTMLElement>('[data-stream-map-geography-panel]')
  if (!panel) return
  let host = panel.querySelector<HTMLElement>('[data-selected-city]')
  if (!host) {
    host = document.createElement('section')
    host.className = 'stream-map-selected-city'
    host.dataset.selectedCity = ''
    host.setAttribute('aria-live', 'polite')
    panel.append(host)
  }

  host.hidden = !selection.selectedKey
  host.replaceChildren()
  if (!selection.selectedKey) return

  const aggregate = selection.aggregate
  if (aggregate?.label) selectedCityLabel = aggregate.label
  const label = aggregate?.label || selectedCityLabel || selection.selectedKey

  const head = document.createElement('div')
  head.className = 'stream-map-selected-city__head'
  const heading = document.createElement('div')
  const eyebrow = document.createElement('small')
  eyebrow.textContent = 'Selected City aggregate'
  const name = document.createElement('strong')
  name.textContent = label
  heading.append(eyebrow, name)

  const actions = document.createElement('div')
  actions.className = 'stream-map-selected-city__actions'
  const show = document.createElement('button')
  show.type = 'button'
  show.className = 'stream-map-filter-clear'
  show.dataset.showSelectedCityStreams = ''
  show.textContent = 'Show streams'
  show.addEventListener('click', () => document.getElementById('stream-map-stream-list')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  const clear = document.createElement('button')
  clear.type = 'button'
  clear.className = 'stream-map-filter-clear'
  clear.dataset.clearSelectedCity = ''
  clear.textContent = 'Clear City'
  clear.addEventListener('click', () => {
    selectedCityKey = null
    selectedCityLabel = ''
    renderCityView()
  })
  actions.append(show, clear)
  head.append(heading, actions)

  const facts = document.createElement('div')
  facts.className = 'stream-map-selected-city__facts'
  facts.append(fact('Mapped streams', aggregate?.streams.length ?? 0), fact('Mapped viewers', aggregate?.viewers ?? 0), sourceFact(aggregate?.sourceCounts ?? {}))

  const note = document.createElement('p')
  note.className = 'stream-map-filter-note'
  note.textContent = aggregate
    ? `${label} is selected. Stream drilldown is restricted to this accepted City aggregate; any map point is only a reviewed City aggregate reference and is not a creator exact/current location.`
    : `${label} remains selected, but no accepted City row matches the active population/evidence filters. No alternative City was inferred.`

  host.append(head, facts, note)
}

function fact(label: string, value: number): HTMLElement {
  const node = document.createElement('div')
  const small = document.createElement('small')
  small.textContent = label
  const strong = document.createElement('strong')
  strong.textContent = format(value)
  node.append(small, strong)
  return node
}

function sourceFact(sourceCounts: Record<string, number>): HTMLElement {
  const node = document.createElement('div')
  const small = document.createElement('small')
  small.textContent = 'Evidence sources'
  const list = document.createElement('span')
  list.className = 'stream-map-selected-city__sources'
  const entries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  list.textContent = entries.length ? entries.map(([source, count]) => `${source} ${format(count)}`).join(' · ') : 'No active match'
  node.append(small, list)
  return node
}

function applyStreamSelection(selection: CitySelectionState<StreamMapMappedStream>, filtered: StreamMapMappedStream[]): void {
  const list = document.getElementById('stream-map-stream-list')
  if (!list) return

  const keysByUrl = new Map(filtered.map((stream) => [normalizeUrl(stream.url), cityAggregateKeyFromStream(stream)]))
  let visible = 0
  for (const article of list.querySelectorAll<HTMLElement>('.stream-map-stream-row')) {
    const href = article.querySelector<HTMLAnchorElement>('.stream-map-stream-row__head a')?.href ?? ''
    const key = keysByUrl.get(normalizeUrl(href)) ?? ''
    article.dataset.cityAggregateKey = key
    const show = !selection.selectedKey || key === selection.selectedKey
    article.hidden = !show
    if (show) visible += 1
  }

  list.dataset.citySelectionEmpty = String(Boolean(selection.selectedKey && visible === 0))
  const title = document.getElementById('stream-map-stream-list-title')
  if (title) title.textContent = selection.selectedKey ? `${selection.aggregate?.label || selectedCityLabel || 'Selected City'} streams` : 'City-placeable streams'
}

function installStreamListObserver(): void {
  if (streamListObserver) return
  const list = document.getElementById('stream-map-stream-list')
  if (!list) {
    window.setTimeout(installStreamListObserver, 0)
    return
  }
  streamListObserver = new MutationObserver(() => {
    const filtered = currentFilteredRows()
    applyStreamSelection(citySelectionState(filtered, selectedCityKey) as CitySelectionState<StreamMapMappedStream>, filtered)
  })
  streamListObserver.observe(list, { childList: true })
}

function textNode(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value, window.location.origin)
    return `${url.origin}${url.pathname}`.replace(/\/$/, '').toLowerCase()
  } catch {
    return String(value ?? '').trim().replace(/\/$/, '').toLowerCase()
  }
}

function format(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export {}
