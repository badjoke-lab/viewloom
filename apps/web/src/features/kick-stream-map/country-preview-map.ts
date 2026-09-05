import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { metricBucket, type KickCountryPreviewModel } from './country-preview-model.mjs'

type Metric = 'streams' | 'viewers'

type GeoJsonFeature = {
  type: 'Feature'
  properties?: Record<string, unknown> | null
  geometry?: unknown
}

type GeoJsonCollection = {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

const GEOMETRY_URLS = [
  '/data/geo/countries-110m-1.geojson',
  '/data/geo/countries-110m-2.geojson',
  '/data/geo/countries-110m-3.geojson',
  '/data/geo/countries-110m-4.geojson',
] as const

const SOURCE_ID = 'kick-preview-country-regions'
const FILL_ID = 'kick-preview-country-fill'
const OUTLINE_ID = 'kick-preview-country-outline'

maplibregl.setWorkerUrl(workerUrl)

export type KickCountryPreviewMapController = {
  setMetric(metric: Metric): void
  selectCountry(countryCode: string | null): void
  destroy(): void
}

export async function renderKickCountryPreviewMap(
  container: HTMLElement,
  model: KickCountryPreviewModel,
): Promise<KickCountryPreviewMapController | null> {
  if (!model.allowGeography || !model.contractSafe || model.countryRows.length === 0) return null

  const geometry = await loadGeometry()
  let metric: Metric = 'viewers'
  let selectedCountryCode: string | null = null

  const map = new maplibregl.Map({
    container,
    center: [0, 18],
    zoom: 0.55,
    minZoom: 0.25,
    maxZoom: 5,
    maxBounds: [[-179.999, -78], [179.999, 82]],
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    style: {
      version: 8,
      sources: {},
      layers: [{
        id: 'kick-preview-background',
        type: 'background',
        paint: { 'background-color': '#0d1117' },
      }],
    },
  })
  map.scrollZoom.disable()
  map.touchZoomRotate.disableRotation()
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

  const tooltip = document.createElement('div')
  tooltip.className = 'kick-map-preview__tooltip'
  tooltip.hidden = true
  container.append(tooltip)

  await new Promise<void>((resolve) => map.once('load', () => resolve()))
  map.addSource(SOURCE_ID, { type: 'geojson', data: buildData(geometry, model, metric, selectedCountryCode) as any })
  map.addLayer({
    id: FILL_ID,
    type: 'fill',
    source: SOURCE_ID,
    filter: ['>', ['get', 'viewloomStreams'], 0],
    paint: {
      'fill-color': ['match', ['get', 'viewloomMetricBucket'],
        1, '#17351c',
        2, '#1d5424',
        3, '#287832',
        4, '#35a443',
        5, '#53fc18',
        '#17351c'],
      'fill-opacity': 0.78,
    },
  })
  map.addLayer({
    id: OUTLINE_ID,
    type: 'line',
    source: SOURCE_ID,
    filter: ['>', ['get', 'viewloomStreams'], 0],
    paint: {
      'line-color': ['case', ['==', ['get', 'viewloomSelected'], true], '#ffffff', '#6e8070'],
      'line-width': ['case', ['==', ['get', 'viewloomSelected'], true], 2.2, 0.7],
      'line-opacity': 0.95,
    },
  })

  map.on('click', FILL_ID, (event) => {
    const code = validCountryCode(event.features?.[0]?.properties?.viewloomCountryCode)
    if (!code) return
    selectedCountryCode = code
    updateSource()
    container.dispatchEvent(new CustomEvent('kick-country-select', { bubbles: true, detail: { countryCode: code } }))
  })
  map.on('mousemove', FILL_ID, (event) => {
    const properties = event.features?.[0]?.properties ?? {}
    const code = validCountryCode(properties.viewloomCountryCode)
    if (!code) return hideTooltip()
    const streams = count(properties.viewloomStreams)
    const viewers = count(properties.viewloomViewers)
    const name = clean(properties.viewloomCountryName) || code
    tooltip.replaceChildren()
    const strong = document.createElement('strong')
    strong.textContent = name
    const span = document.createElement('span')
    span.textContent = `${format(streams)} stream${streams === 1 ? '' : 's'} · ${format(viewers)} viewers`
    tooltip.append(strong, span)
    if (event.point) {
      tooltip.style.left = `${event.point.x + 12}px`
      tooltip.style.top = `${event.point.y + 12}px`
    }
    tooltip.hidden = false
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', FILL_ID, () => {
    hideTooltip()
    map.getCanvas().style.cursor = ''
  })

  function hideTooltip(): void {
    tooltip.hidden = true
  }

  function updateSource(): void {
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(buildData(geometry, model, metric, selectedCountryCode) as any)
  }

  return {
    setMetric(nextMetric) {
      metric = nextMetric === 'streams' ? 'streams' : 'viewers'
      updateSource()
    },
    selectCountry(code) {
      selectedCountryCode = validCountryCode(code) || null
      updateSource()
    },
    destroy() {
      map.remove()
    },
  }
}

async function loadGeometry(): Promise<GeoJsonCollection> {
  const collections = await Promise.all(GEOMETRY_URLS.map(async (url) => {
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) throw new Error(`${url} HTTP ${response.status}`)
    return normalize(await response.json() as GeoJsonCollection)
  }))
  return { type: 'FeatureCollection', features: collections.flatMap((collection) => collection.features) }
}

function normalize(raw: GeoJsonCollection): GeoJsonCollection {
  if (raw?.type !== 'FeatureCollection' || !Array.isArray(raw.features)) throw new Error('Invalid Country GeoJSON')
  return {
    type: 'FeatureCollection',
    features: raw.features.flatMap((feature) => {
      const properties = feature?.properties ?? {}
      const code = validCountryCode(properties.viewloomCountryCode)
        || validCountryCode(properties.ISO_A2)
        || validCountryCode(properties.ISO_A2_EH)
        || validCountryCode(properties.WB_A2)
      if (!code || !feature.geometry) return []
      const name = clean(properties.viewloomCountryName)
        || clean(properties.NAME_EN)
        || clean(properties.ADMIN)
        || clean(properties.NAME)
        || code
      return [{ type: 'Feature' as const, geometry: feature.geometry, properties: { viewloomCountryCode: code, viewloomCountryName: name } }]
    }),
  }
}

function buildData(
  geometry: GeoJsonCollection,
  model: KickCountryPreviewModel,
  metric: Metric,
  selectedCountryCode: string | null,
): GeoJsonCollection {
  const byCode = new Map(model.countryRows.map((row) => [row.countryCode, row]))
  const values = model.countryRows.map((row) => metric === 'viewers' ? row.viewers : row.streams)
  const max = Math.max(0, ...values)
  return {
    type: 'FeatureCollection',
    features: geometry.features.map((feature) => {
      const properties = feature.properties ?? {}
      const code = validCountryCode(properties.viewloomCountryCode)
      const row = code ? byCode.get(code) : undefined
      const value = row ? (metric === 'viewers' ? row.viewers : row.streams) : 0
      return {
        ...feature,
        properties: {
          ...properties,
          viewloomStreams: row?.streams ?? 0,
          viewloomViewers: row?.viewers ?? 0,
          viewloomMetricBucket: metricBucket(value, max),
          viewloomSelected: Boolean(code && selectedCountryCode === code),
        },
      }
    }),
  }
}

function validCountryCode(value: unknown): string {
  const code = clean(value).toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function count(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function format(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
