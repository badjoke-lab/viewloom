type CountryMetric = 'streams' | 'viewers'

type GeoJsonGeometry = {
  type: string
  coordinates?: unknown
  geometries?: unknown[]
}

type GeoJsonFeature = {
  type: 'Feature'
  properties?: Record<string, unknown> | null
  geometry?: GeoJsonGeometry | null
}

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

type RegionMapEvent = {
  point?: { x: number; y: number }
  features?: Array<{ properties?: Record<string, unknown> | null }>
}

type RegionGeoJsonSource = {
  setData(data: GeoJsonFeatureCollection): void
}

type RegionMap = {
  on(event: 'load', handler: () => void): void
  on(event: 'click' | 'mousemove', layerId: string, handler: (event: RegionMapEvent) => void): void
  on(event: 'mouseleave', layerId: string, handler: () => void): void
  addSource(id: string, source: { type: 'geojson'; data: GeoJsonFeatureCollection }): void
  getSource(id: string): RegionGeoJsonSource | undefined
  addLayer(layer: Record<string, unknown>): void
  getLayer(id: string): unknown
  setLayoutProperty(layerId: string, name: string, value: unknown): void
  getCanvas(): HTMLCanvasElement
}

type AnyMapConstructor = new (...args: any[]) => any

type RegionWindow = Window & {
  __viewloomCountryRegionMap?: RegionMap
}

type CountryRowMetric = {
  countryCode: string
  countryName: string
  streams: number
  viewers: number
  selected: boolean
}

const REGION_SOURCE_ID = 'viewloom-country-regions'
const REGION_FILL_LAYER_ID = 'viewloom-country-regions-fill'
const REGION_OUTLINE_LAYER_ID = 'viewloom-country-regions-outline'
const COUNTRY_GEOMETRY_URLS = [
  '/data/geo/countries-110m-1.geojson',
  '/data/geo/countries-110m-2.geojson',
  '/data/geo/countries-110m-3.geojson',
  '/data/geo/countries-110m-4.geojson',
] as const

const requestedCity = new URL(window.location.href).searchParams.get('geography') === 'city'

let metric: CountryMetric = 'streams'
let mapReady = false
let geometryState: 'idle' | 'loading' | 'ready' | 'error' = 'idle'
let baseGeometry: GeoJsonFeatureCollection | null = null
let lastSelectedCountryCode: string | null = null
let observer: MutationObserver | null = null
let tooltip: HTMLElement | null = null
let statusNode: HTMLElement | null = null
let metricSelect: HTMLSelectElement | null = null

if (!requestedCity) {
  captureMapInstance()
  bootRegionUi()
}

function captureMapInstance(): void {
  const namespace = (window as unknown as { maplibregl?: { Map?: AnyMapConstructor } }).maplibregl
  const ExistingMap = namespace?.Map
  if (!namespace || !ExistingMap) return

  namespace.Map = new Proxy(ExistingMap, {
    construct(target, args, newTarget) {
      const captured = Reflect.construct(target, args, newTarget) as RegionMap
      ;(window as RegionWindow).__viewloomCountryRegionMap = captured
      captured.on('load', () => {
        mapReady = true
        void ensureRegionLayer()
      })
      return captured
    },
  })
}

function bootRegionUi(): void {
  const run = () => {
    injectStyles()
    injectControls()
    observeCountryRows()
    bindClearCountry()
    document.documentElement.classList.add('stream-map-country-regions-active')
    updateStaticCopy()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
}

function injectStyles(): void {
  if (document.getElementById('stream-map-country-regions-style')) return
  const style = document.createElement('style')
  style.id = 'stream-map-country-regions-style'
  style.textContent = `
    .stream-map-country-regions-active .stream-map-country-marker:not(.stream-map-country-marker--region-fallback){display:none!important}
    .stream-map-country-marker--region-fallback{box-shadow:0 0 0 1px rgba(255,255,255,.28),0 5px 18px rgba(0,0,0,.28)}
    .stream-map-region-controls{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;border:1px solid var(--line,#30363d);border-radius:10px;background:rgba(12,15,22,.72)}
    .stream-map-region-controls__metric{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .stream-map-region-controls__label{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#9ca3af)}
    .stream-map-region-controls select{min-height:34px;border:1px solid var(--line,#3b4250);border-radius:8px;background:#151923;color:#f6f7fb;font:inherit;padding:5px 30px 5px 9px}
    .stream-map-region-controls__status{font-size:12px;color:var(--muted,#9ca3af)}
    .stream-map-region-tooltip{position:absolute;z-index:5;pointer-events:none;min-width:150px;max-width:220px;padding:8px 10px;border:1px solid var(--line,#3b4250);border-radius:8px;background:rgba(10,12,18,.94);box-shadow:0 8px 24px rgba(0,0,0,.28);color:#f5f7fb;font-size:12px;line-height:1.4;transform:translate(10px,10px)}
    .stream-map-region-tooltip strong{display:block;margin-bottom:2px;font-size:13px}
    .stream-map-region-tooltip[hidden]{display:none!important}
    @media (max-width:720px){.stream-map-region-controls{align-items:flex-start}.stream-map-region-controls__metric,.stream-map-region-controls__status{width:100%}}
  `
  document.head.append(style)
}

function injectControls(): void {
  if (document.querySelector('[data-stream-map-region-controls]')) return
  const shell = document.querySelector<HTMLElement>('.stream-map-shell')
  const stage = shell?.querySelector<HTMLElement>('.stream-map-stage')
  if (!shell || !stage) return

  const controls = document.createElement('div')
  controls.className = 'stream-map-region-controls'
  controls.dataset.streamMapRegionControls = ''
  controls.setAttribute('aria-label', 'Country region controls')

  const metricGroup = document.createElement('label')
  metricGroup.className = 'stream-map-region-controls__metric'
  const metricLabel = document.createElement('span')
  metricLabel.className = 'stream-map-region-controls__label'
  metricLabel.textContent = 'Country intensity'
  metricSelect = document.createElement('select')
  metricSelect.setAttribute('aria-label', 'Country intensity metric')
  metricSelect.append(new Option('Streams', 'streams'), new Option('Viewers', 'viewers'))
  metricSelect.value = metric
  metricSelect.addEventListener('change', () => {
    metric = metricSelect?.value === 'viewers' ? 'viewers' : 'streams'
    updateRegionData()
    updateStaticCopy()
  })
  metricGroup.append(metricLabel, metricSelect)

  statusNode = document.createElement('span')
  statusNode.className = 'stream-map-region-controls__status'
  statusNode.setAttribute('role', 'status')
  statusNode.setAttribute('aria-live', 'polite')
  statusNode.textContent = 'Country regions loading…'

  controls.append(metricGroup, statusNode)
  shell.insertBefore(controls, stage)

  tooltip = document.createElement('div')
  tooltip.className = 'stream-map-region-tooltip'
  tooltip.hidden = true
  tooltip.setAttribute('role', 'status')
  stage.append(tooltip)
}

async function ensureRegionLayer(): Promise<void> {
  const map = (window as RegionWindow).__viewloomCountryRegionMap
  if (!map || !mapReady) {
    setStatus('Country regions waiting for basemap')
    return
  }

  if (geometryState === 'ready' && baseGeometry) {
    installOrUpdateRegionLayers(map)
    return
  }
  if (geometryState === 'loading') return

  geometryState = 'loading'
  setStatus('Loading local country regions…')
  try {
    const collections = await Promise.all(COUNTRY_GEOMETRY_URLS.map(async (url) => {
      const response = await fetch(url, { cache: 'force-cache' })
      if (!response.ok) throw new Error(`${url} HTTP ${response.status}`)
      return normalizeCountryGeometry(await response.json() as GeoJsonFeatureCollection)
    }))
    baseGeometry = {
      type: 'FeatureCollection',
      features: collections.flatMap((collection) => collection.features),
    }
    geometryState = 'ready'
    installOrUpdateRegionLayers(map)
    syncRegionFallbackMarkers()
    setStatus(`Country regions ready · intensity by ${metric}`)
  } catch (error) {
    geometryState = 'error'
    document.documentElement.classList.remove('stream-map-country-regions-active')
    setStatus(`Country regions unavailable · aggregate markers restored · ${error instanceof Error ? error.message : String(error)}`)
  }
}

function normalizeCountryGeometry(raw: GeoJsonFeatureCollection): GeoJsonFeatureCollection {
  if (raw?.type !== 'FeatureCollection' || !Array.isArray(raw.features)) {
    throw new Error('Invalid country GeoJSON')
  }
  const features = raw.features.flatMap((feature) => {
    const properties = feature?.properties ?? {}
    const countryCode = validCountryCode(properties.viewloomCountryCode)
      || validCountryCode(properties.ISO_A2)
      || validCountryCode(properties.ISO_A2_EH)
      || validCountryCode(properties.WB_A2)
    if (!countryCode || !feature.geometry) return []
    const countryName = clean(properties.viewloomCountryName)
      || clean(properties.NAME_EN)
      || clean(properties.ADMIN)
      || clean(properties.NAME)
      || countryCode
    return [{
      type: 'Feature' as const,
      geometry: feature.geometry,
      properties: {
        viewloomCountryCode: countryCode,
        viewloomCountryName: countryName,
      },
    }]
  })
  return { type: 'FeatureCollection', features }
}

function installOrUpdateRegionLayers(map: RegionMap): void {
  if (!baseGeometry) return
  const data = buildRegionData(baseGeometry)
  const source = map.getSource(REGION_SOURCE_ID)
  if (source) source.setData(data)
  else map.addSource(REGION_SOURCE_ID, { type: 'geojson', data })

  if (!map.getLayer(REGION_FILL_LAYER_ID)) {
    map.addLayer({
      id: REGION_FILL_LAYER_ID,
      type: 'fill',
      source: REGION_SOURCE_ID,
      filter: ['>', ['get', 'viewloomStreams'], 0],
      paint: {
        'fill-color': ['match', ['get', 'viewloomMetricBucket'],
          1, '#302447',
          2, '#44305f',
          3, '#604084',
          4, '#7f53aa',
          5, '#aa70dd',
          '#302447'],
        'fill-opacity': 0.76,
      },
      layout: { visibility: 'visible' },
    })
    map.on('click', REGION_FILL_LAYER_ID, handleRegionClick)
    map.on('mousemove', REGION_FILL_LAYER_ID, handleRegionHover)
    map.on('mouseleave', REGION_FILL_LAYER_ID, handleRegionLeave)
  }

  if (!map.getLayer(REGION_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: REGION_OUTLINE_LAYER_ID,
      type: 'line',
      source: REGION_SOURCE_ID,
      filter: ['>', ['get', 'viewloomStreams'], 0],
      paint: {
        'line-color': ['case', ['==', ['get', 'viewloomSelected'], true], '#ffffff', '#a29ab2'],
        'line-width': ['case', ['==', ['get', 'viewloomSelected'], true], 2.2, 0.7],
        'line-opacity': 0.9,
      },
      layout: { visibility: 'visible' },
    })
  }

  syncRegionFallbackMarkers()
}

function buildRegionData(geometry: GeoJsonFeatureCollection): GeoJsonFeatureCollection {
  const rows = readCountryRows()
  const byCode = new Map(rows.map((row) => [row.countryCode, row]))
  const values = rows.map((row) => metric === 'viewers' ? row.viewers : row.streams).filter((value) => value > 0)
  const max = Math.max(0, ...values)

  return {
    type: 'FeatureCollection',
    features: geometry.features.map((feature) => {
      const base = feature.properties ?? {}
      const countryCode = validCountryCode(base.viewloomCountryCode)
      const row = countryCode ? byCode.get(countryCode) : undefined
      const metricValue = row ? (metric === 'viewers' ? row.viewers : row.streams) : 0
      return {
        ...feature,
        properties: {
          ...base,
          viewloomStreams: row?.streams ?? 0,
          viewloomViewers: row?.viewers ?? 0,
          viewloomMetricValue: metricValue,
          viewloomMetricBucket: metricBucket(metricValue, max),
          viewloomSelected: Boolean(countryCode && countryCode === lastSelectedCountryCode),
        },
      }
    }),
  }
}

function metricBucket(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0
  const normalized = Math.log1p(value) / Math.log1p(max)
  return Math.max(1, Math.min(5, Math.ceil(normalized * 5)))
}

function readCountryRows(): CountryRowMetric[] {
  const rows: CountryRowMetric[] = []
  let selectedSeen = false
  for (const button of document.querySelectorAll<HTMLButtonElement>('.stream-map-country-row[data-country-code]')) {
    const countryCode = validCountryCode(button.dataset.countryCode)
    if (!countryCode) continue
    const countryName = clean(button.querySelector('strong')?.textContent) || countryCode
    const detail = clean(button.querySelector('span')?.textContent)
    const counts = detail.match(/([\d,]+)\s+streams?\s+·\s+([\d,]+)\s+viewers?/i)
    const selected = button.getAttribute('aria-pressed') === 'true'
    if (selected) {
      lastSelectedCountryCode = countryCode
      selectedSeen = true
    }
    rows.push({
      countryCode,
      countryName,
      streams: parseCount(counts?.[1]),
      viewers: parseCount(counts?.[2]),
      selected,
    })
  }

  const selectedPanel = document.getElementById('stream-map-selected-country')
  if (!selectedSeen && selectedPanel?.hidden) lastSelectedCountryCode = null
  return rows
}

function observeCountryRows(): void {
  const list = document.getElementById('stream-map-country-list')
  if (!list || observer) return
  observer = new MutationObserver(() => {
    if (geometryState === 'ready') updateRegionData()
    syncRegionFallbackMarkers()
  })
  observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed', 'class'] })
}

function bindClearCountry(): void {
  document.querySelector<HTMLButtonElement>('[data-clear-selected-country]')?.addEventListener('click', () => {
    lastSelectedCountryCode = null
    window.setTimeout(updateRegionData, 0)
  })
}

function updateRegionData(): void {
  const map = (window as RegionWindow).__viewloomCountryRegionMap
  if (!map || !baseGeometry || geometryState !== 'ready') return
  installOrUpdateRegionLayers(map)
  syncRegionFallbackMarkers()
  setStatus(`Country regions · intensity by ${metric}`)
}

function geometryCountryCodes(): Set<string> {
  if (!baseGeometry) return new Set()
  return new Set(baseGeometry.features.flatMap((feature) => {
    const code = validCountryCode(feature.properties?.viewloomCountryCode)
    return code ? [code] : []
  }))
}

function syncRegionFallbackMarkers(): void {
  if (geometryState !== 'ready') return
  const geometryCodes = geometryCountryCodes()
  for (const marker of document.querySelectorAll<HTMLElement>('.stream-map-country-marker[data-country-code]')) {
    const code = validCountryCode(marker.dataset.countryCode)
    marker.classList.toggle('stream-map-country-marker--region-fallback', Boolean(code && !geometryCodes.has(code)))
  }
}

function handleRegionClick(event: RegionMapEvent): void {
  const countryCode = validCountryCode(event.features?.[0]?.properties?.viewloomCountryCode)
  if (!countryCode) return
  const row = document.querySelector<HTMLButtonElement>(`.stream-map-country-row[data-country-code="${countryCode}"]`)
  if (!row) return
  lastSelectedCountryCode = countryCode
  row.click()
  window.setTimeout(updateRegionData, 0)
}

function handleRegionHover(event: RegionMapEvent): void {
  const feature = event.features?.[0]
  const properties = feature?.properties ?? {}
  const streams = parseCount(properties.viewloomStreams)
  if (!tooltip || streams <= 0) {
    hideTooltip()
    return
  }
  const countryName = clean(properties.viewloomCountryName) || clean(properties.viewloomCountryCode) || 'Country'
  const viewers = parseCount(properties.viewloomViewers)
  tooltip.replaceChildren()
  const name = document.createElement('strong')
  name.textContent = countryName
  const detail = document.createElement('span')
  detail.textContent = `${formatNumber(streams)} stream${streams === 1 ? '' : 's'} · ${formatNumber(viewers)} viewers`
  tooltip.append(name, detail)
  if (event.point) {
    tooltip.style.left = `${event.point.x}px`
    tooltip.style.top = `${event.point.y}px`
  }
  tooltip.hidden = false
  const map = (window as RegionWindow).__viewloomCountryRegionMap
  if (map) map.getCanvas().style.cursor = 'pointer'
}

function handleRegionLeave(): void {
  hideTooltip()
  const map = (window as RegionWindow).__viewloomCountryRegionMap
  if (map) map.getCanvas().style.cursor = ''
}

function hideTooltip(): void {
  if (tooltip) tooltip.hidden = true
}

function updateStaticCopy(): void {
  const shellHead = document.querySelector<HTMLElement>('.stream-map-shell__head')
  const copy = shellHead?.querySelector<HTMLElement>('p')
  const interaction = document.querySelector<HTMLElement>('.stream-map-interaction-note')
  if (copy) copy.textContent = `Countries with accepted mapped evidence are filled by ${metric === 'viewers' ? 'viewer count' : 'stream count'}. Select a region to open the country drilldown and filters.`
  if (interaction) interaction.textContent = 'Drag to move. Use the +/− controls to zoom. Region intensity uses the same filtered country totals. Small countries without a usable 110m polygon remain aggregate country markers.'
}

function setStatus(value: string): void {
  if (statusNode) statusNode.textContent = value
}

function validCountryCode(value: unknown): string {
  const code = clean(value).toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function parseCount(value: unknown): number {
  const parsed = Number(clean(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)))
}

export {}
