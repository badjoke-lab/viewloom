type GeographyMode = 'country' | 'city'

type CityPayload = {
  version?: string
  platform?: string
  source?: string
  geographyMode?: string
  publicCityUiActivated?: boolean
  identityContract?: {
    stableTwitchUserIdAvailableInMinuteSnapshot?: boolean
    stableTwitchUserIdState?: string
    stableIdentityStreams?: number
    missingStableIdentityStreams?: number
    loginIsStableIdentity?: boolean
  }
  coverage?: Record<string, unknown>
  cityCoverage?: {
    observedStreams?: number
    observedViewers?: number
    cityPlaceableStreams?: number
    cityPlaceableViewers?: number
    countryOnlyStreams?: number
    countryOnlyViewers?: number
    conflictUnmappedStreams?: number
    upstreamCountryConflictCount?: number
  }
  mappedStreams?: Array<Record<string, any>>
  countryOnlyStreams?: Array<Record<string, any>>
  baseCityConflicts?: Array<Record<string, any>>
  [key: string]: any
}

declare global {
  interface Window {
    __viewloomStreamMapGeographyFetchInstalled?: boolean
    __viewloomStreamMapCityPayload?: CityPayload | null
  }
}

const pageUrl = new URL(window.location.href)
const requestedMode: GeographyMode = pageUrl.searchParams.get('geography') === 'city' ? 'city' : 'country'

installGeographyFetchAdapter()
bootGeographyUi()

function installGeographyFetchAdapter(): void {
  if (window.__viewloomStreamMapGeographyFetchInstalled) return
  window.__viewloomStreamMapGeographyFetchInstalled = true
  window.__viewloomStreamMapCityPayload = null

  const nativeFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? new URL(input.url, window.location.origin) : new URL(String(input), window.location.origin)
    const isStreamMapApi = request.origin === window.location.origin && request.pathname === '/api/twitch-stream-map'

    if (!isStreamMapApi) return nativeFetch(input, init)

    if (requestedMode === 'city') request.searchParams.set('geography', 'city')
    else request.searchParams.delete('geography')

    const nextInput: RequestInfo | URL = input instanceof Request
      ? new Request(request.toString(), {
          method: input.method,
          headers: input.headers,
          credentials: input.credentials,
          cache: input.cache,
          redirect: input.redirect,
          referrer: input.referrer,
          referrerPolicy: input.referrerPolicy,
          integrity: input.integrity,
          keepalive: input.keepalive,
          signal: input.signal,
        })
      : request
    const response = await nativeFetch(nextInput, init)
    if (requestedMode !== 'city' || !response.ok) return response

    const raw = await response.clone().json() as CityPayload
    if (raw?.version !== 'viewloom-stream-map-city-contract-v0.1' || raw?.geographyMode !== 'city') return response

    window.__viewloomStreamMapCityPayload = raw
    queueMicrotask(() => renderCityAccounting(raw))
    return jsonResponse(adaptCityPayloadForExistingRenderer(raw), response)
  }
}

function adaptCityPayloadForExistingRenderer(raw: CityPayload): CityPayload {
  const cityCoverage = raw.cityCoverage ?? {}
  const observedStreams = count(cityCoverage.observedStreams ?? raw.coverage?.observedStreams)
  const observedViewers = count(cityCoverage.observedViewers ?? raw.coverage?.observedViewers)
  const mappedStreams = Array.isArray(raw.mappedStreams) ? raw.mappedStreams : []
  const mappedCount = count(cityCoverage.cityPlaceableStreams ?? mappedStreams.length)
  const mappedViewers = count(cityCoverage.cityPlaceableViewers ?? mappedStreams.reduce((sum, row) => sum + count(row?.viewers), 0))
  const countryOnlyCount = count(cityCoverage.countryOnlyStreams ?? raw.countryOnlyStreams?.length)
  const baseConflictCount = Array.isArray(raw.baseCityConflicts) ? raw.baseCityConflicts.length : 0
  const upstreamReasons = { ...((raw.coverage?.unmappedReasons as Record<string, number> | undefined) ?? {}) }

  if (countryOnlyCount > 0) upstreamReasons.country_only_at_city_resolution = countryOnlyCount
  if (baseConflictCount > 0) upstreamReasons.base_city_conflict = baseConflictCount

  const mappedCountryCount = new Set(mappedStreams
    .map((row) => String(row?.location?.countryCode ?? '').trim())
    .filter(Boolean)).size

  return {
    ...raw,
    version: 'viewloom-stream-map-live-v1',
    clientGeographyMode: 'city',
    sourceCityContractVersion: raw.version,
    coverage: {
      ...raw.coverage,
      observedStreams,
      observedViewers,
      mappedStreams: mappedCount,
      unmappedStreams: Math.max(0, observedStreams - mappedCount),
      mappedViewers,
      unmappedViewers: Math.max(0, observedViewers - mappedViewers),
      mappedPercent: ratio(mappedCount, observedStreams),
      mappedViewerPercent: ratio(mappedViewers, observedViewers),
      mappedCountryCount,
      currentLocationStreams: 0,
      currentLocationPercent: 0,
      unmappedReasons: upstreamReasons,
    },
  }
}

function bootGeographyUi(): void {
  const run = () => {
    injectStyles()
    const anchor = document.querySelector('.stream-map-population-panel')
    if (!anchor || document.querySelector('[data-stream-map-geography-panel]')) return

    const panel = document.createElement('section')
    panel.className = 'surface stream-map-geography-panel'
    panel.dataset.streamMapGeographyPanel = ''
    panel.innerHTML = `
      <div class="stream-map-geography-copy">
        <div class="stream-map-filter-label">Geography</div>
        <strong>Choose map resolution</strong>
        <p>Country is the default. City uses accepted home/base or declared-location evidence only. Current / IRL remains unavailable.</p>
      </div>
      <div class="stream-map-geography-options" role="group" aria-label="Geography resolution">
        <button type="button" data-geography-mode="country">Country</button>
        <button type="button" data-geography-mode="city">City</button>
        <button type="button" disabled aria-disabled="true" title="Current / IRL requires fresh current-location evidence">Current / IRL</button>
      </div>
      <div class="stream-map-geography-state" data-geography-state></div>
    `
    anchor.parentElement?.insertBefore(panel, anchor)

    for (const button of panel.querySelectorAll<HTMLButtonElement>('[data-geography-mode]')) {
      const mode = button.dataset.geographyMode as GeographyMode
      const active = mode === requestedMode
      button.dataset.active = String(active)
      button.setAttribute('aria-pressed', String(active))
      button.addEventListener('click', () => switchMode(mode))
    }
    updateGeographyState(panel)
    if (requestedMode === 'city' && window.__viewloomStreamMapCityPayload) renderCityAccounting(window.__viewloomStreamMapCityPayload)
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
}

function switchMode(mode: GeographyMode): void {
  if (mode === requestedMode) return
  const next = new URL(window.location.href)
  if (mode === 'city') next.searchParams.set('geography', 'city')
  else next.searchParams.delete('geography')
  window.location.assign(next.toString())
}

function updateGeographyState(panel: Element): void {
  const state = panel.querySelector<HTMLElement>('[data-geography-state]')
  if (!state) return
  state.textContent = requestedMode === 'city'
    ? 'City mode · country-only evidence stays accounted but is not placed at city resolution.'
    : 'Country mode · default API contract; no geography query parameter is sent.'
}

function renderCityAccounting(raw: CityPayload): void {
  if (requestedMode !== 'city') return
  const host = document.querySelector('[data-stream-map-geography-panel]')
  if (!host) return

  let details = host.querySelector<HTMLElement>('[data-city-accounting]')
  if (!details) {
    details = document.createElement('div')
    details.className = 'stream-map-city-accounting'
    details.dataset.cityAccounting = ''
    host.append(details)
  }

  const cityCoverage = raw.cityCoverage ?? {}
  const countryOnly = count(cityCoverage.countryOnlyStreams ?? raw.countryOnlyStreams?.length)
  const cityMapped = count(cityCoverage.cityPlaceableStreams ?? raw.mappedStreams?.length)
  const conflicts = Array.isArray(raw.baseCityConflicts) ? raw.baseCityConflicts.length : 0
  const stableState = String(raw.identityContract?.stableTwitchUserIdState ?? 'unavailable')
  const stableCount = count(raw.identityContract?.stableIdentityStreams)
  const missingStableCount = count(raw.identityContract?.missingStableIdentityStreams)

  details.innerHTML = `
    <div><small>City-placeable</small><strong>${format(cityMapped)}</strong></div>
    <div><small>Country-only</small><strong>${format(countryOnly)}</strong></div>
    <div><small>Base City conflicts</small><strong>${format(conflicts)}</strong></div>
    <p>${stableIdentityMessage(stableState, stableCount, missingStableCount)}</p>
  `
}

function stableIdentityMessage(state: string, available: number, missing: number): string {
  if (state === 'available') return `Stable Twitch user ID available for all ${format(available)} parsed snapshot streams.`
  if (state === 'partial') return `Stable Twitch user ID available for ${format(available)} parsed streams; ${format(missing)} still lack it. Login remains a join key only.`
  return 'Minute snapshot has no stable Twitch user ID; login remains a join key only, not a stable identity.'
}

function injectStyles(): void {
  if (document.getElementById('stream-map-geography-ui-style')) return
  const style = document.createElement('style')
  style.id = 'stream-map-geography-ui-style'
  style.textContent = `
    .stream-map-geography-panel{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;margin-bottom:16px;padding:18px}
    .stream-map-geography-copy p,.stream-map-geography-state,.stream-map-city-accounting p{margin:5px 0 0;color:var(--muted,#9ca3af);font-size:13px}
    .stream-map-geography-options{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .stream-map-geography-options button{border:1px solid var(--line,#30363d);background:transparent;color:inherit;border-radius:999px;padding:8px 13px;cursor:pointer}
    .stream-map-geography-options button[data-active="true"]{background:rgba(255,255,255,.09);border-color:currentColor;font-weight:700}
    .stream-map-geography-options button:disabled{opacity:.45;cursor:not-allowed}
    .stream-map-geography-state{grid-column:1/-1}
    .stream-map-city-accounting{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;border-top:1px solid var(--line,#30363d);padding-top:12px}
    .stream-map-city-accounting div{display:flex;flex-direction:column;gap:3px}.stream-map-city-accounting small{color:var(--muted,#9ca3af)}.stream-map-city-accounting p{grid-column:1/-1}
    @media (max-width:720px){.stream-map-geography-panel{grid-template-columns:1fr}.stream-map-geography-options{justify-content:flex-start}.stream-map-city-accounting{grid-template-columns:1fr}}
  `
  document.head.append(style)
}

function jsonResponse(body: unknown, source: Response): Response {
  const headers = new Headers(source.headers)
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.delete('content-length')
  return new Response(JSON.stringify(body), {
    status: source.status,
    statusText: source.statusText,
    headers,
  })
}

function count(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? Number((numerator / denominator).toFixed(6)) : 0
}

function format(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export {}
