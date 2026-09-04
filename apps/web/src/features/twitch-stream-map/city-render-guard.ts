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

declare global {
  interface Window {
    __viewloomStreamMapCityPayload?: CityPayload | null
  }
}

const requestedCity = new URL(window.location.href).searchParams.get('geography') === 'city'

if (requestedCity) bootCityRendering()

function bootCityRendering(): void {
  document.documentElement.classList.add('stream-map-city-mode')
  injectCityStyles()
  updateStaticCityCopy()
  renderWhenPayloadArrives()
}

function injectCityStyles(): void {
  const style = document.createElement('style')
  style.id = 'stream-map-city-render-style'
  style.textContent = `
    .stream-map-city-mode .stream-map-country-marker{display:none!important}
    .stream-map-city-mode #stream-map-selected-country{display:none!important}
    .stream-map-city-places{grid-column:1/-1;display:grid;gap:8px;border-top:1px solid var(--line,#30363d);padding-top:12px}
    .stream-map-city-place{display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid var(--line,#30363d)}
    .stream-map-city-place span{color:var(--muted,#9ca3af);font-size:13px;text-align:right}
  `
  document.head.append(style)
}

function updateStaticCityCopy(): void {
  const run = () => {
    const shell = document.querySelector<HTMLElement>('.stream-map-shell__head')
    const heading = shell?.querySelector<HTMLElement>('h2')
    const copy = shell?.querySelector<HTMLElement>('p')
    if (heading) heading.textContent = 'City view'
    if (copy) copy.textContent = 'City mode lists only accepted home/base or declared-location evidence with a city. Creator coordinates are not published, so country-centroid markers are intentionally suppressed.'

    const interaction = document.querySelector<HTMLElement>('.stream-map-interaction-note')
    if (interaction) interaction.textContent = 'The basemap remains available for geographic context. City coordinates are not published or inferred, so City mode does not place approximate markers.'

    const countryList = document.getElementById('stream-map-country-list')
    const countryCard = countryList?.closest<HTMLElement>('.stream-map-results-card')
    if (countryCard) countryCard.hidden = true

    const listTitle = document.getElementById('stream-map-stream-list-title')
    if (listTitle) listTitle.textContent = 'City-placeable streams'

    const root = document.getElementById('stream-map-root')
    root?.setAttribute('aria-label', 'World basemap for City mode; creator city coordinates are not published')
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
}

function renderWhenPayloadArrives(): void {
  const render = () => {
    const payload = window.__viewloomStreamMapCityPayload
    if (!payload) return false
    renderCityPlaces(Array.isArray(payload.mappedStreams) ? payload.mappedStreams : [])
    return true
  }

  if (render()) return
  const observer = new MutationObserver(() => {
    if (!render()) return
    observer.disconnect()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
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

  const grouped = new Map<string, { label: string; streams: number; viewers: number }>()
  for (const row of rows) {
    const city = clean(row.location?.cities?.[0])
    if (!city) continue
    const region = clean(row.location?.regions?.[0])
    const country = clean(row.location?.countryName) || clean(row.location?.countryCode)
    const label = [city, region, country].filter(Boolean).join(' · ')
    const key = [clean(row.location?.countryCode), region, city].join('|').toLowerCase()
    const current = grouped.get(key) ?? { label, streams: 0, viewers: 0 }
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

  for (const place of places) {
    const row = document.createElement('div')
    row.className = 'stream-map-city-place'
    const name = document.createElement('strong')
    name.textContent = place.label
    const detail = document.createElement('span')
    detail.textContent = `${format(place.streams)} stream${place.streams === 1 ? '' : 's'} · ${format(place.viewers)} viewers`
    row.append(name, detail)
    host.append(row)
  }
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

export {}
