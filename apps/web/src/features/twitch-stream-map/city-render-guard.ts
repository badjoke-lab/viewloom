import { filterMappedStreams, type StreamMapMappedStream } from './location-filter-core.mjs'
import { cityAggregateKeyFromStream, citySelectionState, type CitySelectionState } from './city-aggregate-core.mjs'

type CityPayload = {
  mappedStreams?: StreamMapMappedStream[]
}

type CityPayloadWindow = Window & {
  __viewloomStreamMapCityPayload?: CityPayload | null
}

const requestedCity = new URL(window.location.href).searchParams.get('geography') === 'city'
let selectedCityKey: string | null = null
let selectedCityLabel = ''
let latestRows: StreamMapMappedStream[] = []
let streamListObserver: MutationObserver | null = null

if (requestedCity) bootCityRendering()

function bootCityRendering(): void {
  document.documentElement.classList.add('stream-map-city-mode')
  injectCityStyles()
  updateStaticCityCopy()
  bindFilterRefresh()
  renderWhenPayloadArrives()
}

function injectCityStyles(): void {
  const style = document.createElement('style')
  style.id = 'stream-map-city-render-style'
  style.textContent = `
    .stream-map-city-mode .stream-map-country-marker{display:none!important}
    .stream-map-city-mode #stream-map-selected-country{display:none!important}
    .stream-map-city-places{grid-column:1/-1;display:grid;gap:8px;border-top:1px solid var(--line,#30363d);padding-top:12px}
    .stream-map-city-place{width:100%;display:flex;justify-content:space-between;gap:14px;padding:9px 0;border:0;border-bottom:1px solid var(--line,#30363d);background:transparent;color:inherit;text-align:left;cursor:pointer}
    .stream-map-city-place span{color:var(--muted,#9ca3af);font-size:13px;text-align:right}
    .stream-map-city-place[aria-pressed="true"]{font-weight:700;border-bottom-color:currentColor}
    .stream-map-city-place:focus-visible,.stream-map-selected-city button:focus-visible{outline:2px solid currentColor;outline-offset:3px}
    .stream-map-selected-city{grid-column:1/-1;display:grid;gap:9px;border-top:1px solid var(--line,#30363d);padding-top:12px}
    .stream-map-selected-city__head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .stream-map-selected-city__actions{display:flex;gap:8px;flex-wrap:wrap}
    .stream-map-selected-city__facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    .stream-map-selected-city__facts div{display:flex;flex-direction:column;gap:3px}.stream-map-selected-city__facts small{color:var(--muted,#9ca3af)}
    .stream-map-selected-city__sources{display:flex;gap:6px;flex-wrap:wrap}
    @media (max-width:720px){.stream-map-city-place{min-height:44px;align-items:center}.stream-map-city-place span{text-align:left}.stream-map-selected-city__head{display:grid}.stream-map-selected-city__facts{grid-template-columns:1fr}}
  `
  document.head.append(style)
}

function updateStaticCityCopy(): void {
  const run = () => {
    const shell = document.querySelector<HTMLElement>('.stream-map-shell__head')
    const heading = shell?.querySelector<HTMLElement>('h2')
    const copy = shell?.querySelector<HTMLElement>('p')
    if (heading) heading.textContent = 'City view'
    if (copy) copy.textContent = 'City mode groups only accepted home/base or declared-location evidence by City. Creator coordinates are not published, so country-centroid markers are intentionally suppressed.'

    const interaction = document.querySelector<HTMLElement>('.stream-map-interaction-note')
    if (interaction) interaction.textContent = 'Select an accepted City aggregate from the list. The basemap remains geographic context; creator City coordinates are not published or inferred.'

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
    root?.setAttribute('aria-label', 'World basemap for City mode; creator city coordinates are not published')
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
  const render = () => {
    const payload = (window as CityPayloadWindow).__viewloomStreamMapCityPayload
    if (!payload) return false
    latestRows = Array.isArray(payload.mappedStreams) ? payload.mappedStreams : []
    renderCityView()
    installStreamListObserver()
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
    const row = document.createElement('button')
    row.type = 'button'
    row.className = 'stream-map-city-place'
    row.dataset.cityAggregateKey = place.key
    row.setAttribute('aria-pressed', String(selection.selectedKey === place.key))
    row.setAttribute('aria-label', `Show ${place.label}: ${format(place.streams.length)} mapped streams, ${format(place.viewers)} viewers`)
    const name = document.createElement('strong')
    name.textContent = place.label
    const detail = document.createElement('span')
    detail.textContent = `${format(place.streams.length)} stream${place.streams.length === 1 ? '' : 's'} · ${format(place.viewers)} viewers`
    row.append(name, detail)
    row.addEventListener('click', () => {
      selectedCityKey = place.key
      selectedCityLabel = place.label
      renderCityView()
    })
    host.append(row)
  }
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
    ? `${label} is selected. Stream drilldown is restricted to this accepted City aggregate; this is not a creator exact/current location.`
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
