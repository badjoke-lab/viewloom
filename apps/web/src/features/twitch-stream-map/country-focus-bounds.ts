type GeoJsonGeometry = {
  type: string
  coordinates?: unknown
  geometries?: GeoJsonGeometry[]
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

type FocusMap = {
  fitBounds(bounds: [[number, number], [number, number]], options?: {
    padding?: number
    maxZoom?: number
    duration?: number
  }): void
  easeTo(options: {
    center: [number, number]
    zoom: number
    duration?: number
  }): void
  setMinZoom(zoom: number): void
  setMaxZoom(zoom: number): void
}

type FocusWindow = Window & {
  __viewloomCountryRegionMap?: FocusMap
}

const COUNTRY_GEOMETRY_URLS = [
  '/data/geo/countries-110m-1.geojson',
  '/data/geo/countries-110m-2.geojson',
  '/data/geo/countries-110m-3.geojson',
  '/data/geo/countries-110m-4.geojson',
] as const

const WORLD_CENTER: [number, number] = [10, 18]
const DESKTOP_WORLD_ZOOM = 1.15
const MOBILE_WORLD_ZOOM = 0
const COUNTRY_MIN_ZOOM = 0
const COUNTRY_MAX_ZOOM = 4.2
const SMALL_COUNTRY_FALLBACKS: Record<string, { center: [number, number]; zoom: number }> = {
  HK: { center: [114.2, 22.3], zoom: 4.0 },
  SG: { center: [103.8, 1.35], zoom: 4.0 },
}

const requestedCity = new URL(window.location.href).searchParams.get('geography') === 'city'
let geometryPromise: Promise<GeoJsonFeatureCollection> | null = null
let observer: MutationObserver | null = null
let focusedCountryCode: string | null = null
let syncTimer = 0
let cameraLimitsConfigured = false
let worldCameraInitialized = false

if (!requestedCity) bootCountryFocus()

function bootCountryFocus(): void {
  const run = () => {
    const list = document.getElementById('stream-map-country-list')
    if (!list || observer) return
    observer = new MutationObserver(scheduleFocusSync)
    observer.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'class'],
    })
    document.querySelector<HTMLButtonElement>('[data-clear-selected-country]')?.addEventListener('click', () => {
      focusedCountryCode = null
      window.setTimeout(() => resetWorldCamera(450), 0)
    })
    scheduleFocusSync()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
}

function scheduleFocusSync(): void {
  window.clearTimeout(syncTimer)
  syncTimer = window.setTimeout(() => void syncFocusCamera(), 0)
}

async function syncFocusCamera(): Promise<void> {
  const map = (window as FocusWindow).__viewloomCountryRegionMap
  if (!map) {
    window.setTimeout(scheduleFocusSync, 50)
    return
  }
  configureCountryCameraLimits(map)

  const selected = document.querySelector<HTMLButtonElement>('.stream-map-country-row[data-country-code][aria-pressed="true"]')
  const countryCode = validCountryCode(selected?.dataset.countryCode)

  if (!countryCode) {
    if (!worldCameraInitialized || focusedCountryCode) {
      focusedCountryCode = null
      resetWorldCamera(worldCameraInitialized ? 450 : 0)
      worldCameraInitialized = true
    }
    return
  }
  if (countryCode === focusedCountryCode) return

  focusedCountryCode = countryCode
  worldCameraInitialized = true
  const geometry = await loadCountryGeometry()
  if (focusedCountryCode !== countryCode) return
  const feature = geometry.features.find((candidate) => validCountryCode(candidate.properties?.viewloomCountryCode) === countryCode)
  const bounds = feature?.geometry ? geometryBounds(feature.geometry) : null
  const root = document.querySelector<HTMLElement>('#stream-map-root')

  if (bounds && bounds[1][0] - bounds[0][0] <= 180) {
    map.fitBounds(bounds, { padding: 48, maxZoom: COUNTRY_MAX_ZOOM, duration: 500 })
    if (root) {
      root.dataset.countryCamera = 'focused'
      root.dataset.countryCameraCode = countryCode
      root.dataset.countryCameraMode = 'bounds'
    }
    return
  }

  const fallback = SMALL_COUNTRY_FALLBACKS[countryCode]
  if (fallback) {
    map.easeTo({ center: fallback.center, zoom: fallback.zoom, duration: 500 })
    if (root) {
      root.dataset.countryCamera = 'focused'
      root.dataset.countryCameraCode = countryCode
      root.dataset.countryCameraMode = 'fallback'
    }
  }
}

function configureCountryCameraLimits(map: FocusMap): void {
  if (cameraLimitsConfigured) return
  map.setMinZoom(COUNTRY_MIN_ZOOM)
  map.setMaxZoom(COUNTRY_MAX_ZOOM)
  cameraLimitsConfigured = true
}

function resetWorldCamera(duration = 450): void {
  const map = (window as FocusWindow).__viewloomCountryRegionMap
  if (!map) return
  configureCountryCameraLimits(map)
  map.easeTo({ center: WORLD_CENTER, zoom: worldOverviewZoom(), duration })
  worldCameraInitialized = true
  const root = document.querySelector<HTMLElement>('#stream-map-root')
  if (root) {
    root.dataset.countryCamera = 'world'
    delete root.dataset.countryCameraCode
    root.dataset.countryCameraMode = 'world'
    root.dataset.countryCameraViewport = isMobileCountryViewport() ? 'mobile' : 'desktop'
  }
}

function worldOverviewZoom(): number {
  return isMobileCountryViewport() ? MOBILE_WORLD_ZOOM : DESKTOP_WORLD_ZOOM
}

function isMobileCountryViewport(): boolean {
  return window.innerWidth <= 720
}

async function loadCountryGeometry(): Promise<GeoJsonFeatureCollection> {
  if (geometryPromise) return geometryPromise
  geometryPromise = Promise.all(COUNTRY_GEOMETRY_URLS.map(async (url) => {
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) throw new Error(`${url} HTTP ${response.status}`)
    return normalizeCountryGeometry(await response.json() as GeoJsonFeatureCollection)
  })).then((collections) => ({
    type: 'FeatureCollection' as const,
    features: collections.flatMap((collection) => collection.features),
  }))
  return geometryPromise
}

function normalizeCountryGeometry(raw: GeoJsonFeatureCollection): GeoJsonFeatureCollection {
  if (raw?.type !== 'FeatureCollection' || !Array.isArray(raw.features)) {
    throw new Error('Invalid country GeoJSON')
  }
  return {
    type: 'FeatureCollection',
    features: raw.features.flatMap((feature) => {
      const properties = feature.properties ?? {}
      const countryCode = validCountryCode(properties.viewloomCountryCode)
        || validCountryCode(properties.ISO_A2)
        || validCountryCode(properties.ISO_A2_EH)
        || validCountryCode(properties.WB_A2)
      if (!countryCode || !feature.geometry) return []
      return [{
        type: 'Feature' as const,
        geometry: feature.geometry,
        properties: { viewloomCountryCode: countryCode },
      }]
    }),
  }
}

function geometryBounds(geometry: GeoJsonGeometry): [[number, number], [number, number]] | null {
  const points: Array<[number, number]> = []
  collectCoordinates(geometry, points)
  if (points.length === 0) return null

  let west = 180
  let south = 90
  let east = -180
  let north = -90
  for (const [lng, lat] of points) {
    west = Math.min(west, lng)
    south = Math.min(south, lat)
    east = Math.max(east, lng)
    north = Math.max(north, lat)
  }
  return [[west, south], [east, north]]
}

function collectCoordinates(geometry: GeoJsonGeometry, output: Array<[number, number]>): void {
  if (geometry.type === 'GeometryCollection') {
    for (const child of geometry.geometries ?? []) collectCoordinates(child, output)
    return
  }
  collectCoordinateValue(geometry.coordinates, output)
}

function collectCoordinateValue(value: unknown, output: Array<[number, number]>): void {
  if (!Array.isArray(value)) return
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    output.push([value[0], value[1]])
    return
  }
  for (const child of value) collectCoordinateValue(child, output)
}

function validCountryCode(value: unknown): string {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

export {}
