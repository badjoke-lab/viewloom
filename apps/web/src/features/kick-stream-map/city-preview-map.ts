import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { metricBucket } from './country-preview-model.mjs'
import type { KickCityPreviewModel } from './city-preview-model.mjs'

type Metric = 'streams' | 'viewers'

const SOURCE_ID = 'kick-preview-city-aggregate-reference-points'
const CIRCLE_ID = 'kick-preview-city-aggregate-reference-circles'
const SAFE_WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-179.999, -78],
  [179.999, 82],
]

maplibregl.setWorkerUrl(workerUrl)

export type KickCityPreviewMapController = {
  setMetric(metric: Metric): void
  selectCity(cityAggregateKey: string | null): void
  destroy(): void
}

export async function renderKickCityPreviewMap(
  container: HTMLElement,
  model: KickCityPreviewModel,
): Promise<KickCityPreviewMapController | null> {
  if (!model.previewAllowed || !model.contractSafe || model.referenceRows.length === 0) return null

  container.dataset.mapState = 'basemap-loading'
  let metric: Metric = 'viewers'
  let selectedCityKey: string | null = null
  let loaded = false

  const map = new maplibregl.Map({
    container,
    style: {
      version: 8,
      sources: {},
      layers: [{
        id: 'kick-city-preview-background',
        type: 'background',
        paint: { 'background-color': '#0d1117' },
      }],
    },
    center: [0, 18],
    zoom: 0.55,
    minZoom: 0.25,
    maxZoom: 8,
    maxBounds: SAFE_WORLD_BOUNDS,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
  })
  map.scrollZoom.disable()
  map.touchZoomRotate.disableRotation()
  map.addControl(new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }), 'top-right')

  const tooltip = document.createElement('div')
  tooltip.className = 'kick-map-preview__tooltip'
  tooltip.hidden = true
  container.append(tooltip)

  map.on('error', () => {
    if (!loaded) container.dataset.mapState = 'basemap-error'
  })

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Kick City preview basemap load timed out')), 20_000)
    map.once('load', () => {
      window.clearTimeout(timeout)
      loaded = true
      resolve()
    })
  })

  map.addSource(SOURCE_ID, { type: 'geojson', data: buildData(model, metric, selectedCityKey) as any })
  map.addLayer({
    id: CIRCLE_ID,
    type: 'circle',
    source: SOURCE_ID,
    paint: {
      'circle-color': ['case', ['==', ['get', 'viewloomSelected'], true], '#ffffff', '#53fc18'],
      'circle-stroke-color': '#0d1117',
      'circle-stroke-width': 2,
      'circle-opacity': 0.9,
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'viewloomMetricBucket'],
        1, 8,
        5, 18,
      ],
    },
  })
  container.dataset.mapState = 'basemap-ready'

  const points = model.referenceRows
    .map((row) => row.referenceGeometry.referencePoint)
    .filter((point): point is { longitude: number; latitude: number } => Boolean(point))
  if (points.length === 1) {
    map.jumpTo({ center: [points[0].longitude, points[0].latitude], zoom: 3.2 })
  } else if (points.length > 1) {
    const bounds = new maplibregl.LngLatBounds()
    for (const point of points) bounds.extend([point.longitude, point.latitude])
    map.fitBounds(bounds, { padding: 80, maxZoom: 4.5, duration: 0 })
  }

  map.on('click', CIRCLE_ID, (event) => {
    const key = clean(event.features?.[0]?.properties?.viewloomCityAggregateKey)
    if (!key) return
    selectedCityKey = key
    updateSource()
    container.dispatchEvent(new CustomEvent('kick-city-select', { bubbles: true, detail: { cityAggregateKey: key } }))
  })

  map.on('mousemove', CIRCLE_ID, (event) => {
    const properties = event.features?.[0]?.properties ?? {}
    const key = clean(properties.viewloomCityAggregateKey)
    if (!key) return hideTooltip()
    const city = clean(properties.viewloomCity) || key
    const region = clean(properties.viewloomRegion)
    const code = clean(properties.viewloomCountryCode)
    const streams = count(properties.viewloomStreams)
    const viewers = count(properties.viewloomViewers)
    tooltip.replaceChildren()
    const strong = document.createElement('strong')
    strong.textContent = [city, region, code].filter(Boolean).join(' · ')
    const detail = document.createElement('span')
    detail.textContent = `${format(streams)} stream${streams === 1 ? '' : 's'} · ${format(viewers)} viewers · aggregate reference point`
    tooltip.append(strong, detail)
    if (event.point) {
      tooltip.style.left = `${event.point.x + 12}px`
      tooltip.style.top = `${event.point.y + 12}px`
    }
    tooltip.hidden = false
    map.getCanvas().style.cursor = 'pointer'
  })
  map.on('mouseleave', CIRCLE_ID, () => {
    hideTooltip()
    map.getCanvas().style.cursor = ''
  })

  function hideTooltip(): void {
    tooltip.hidden = true
  }

  function updateSource(): void {
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(buildData(model, metric, selectedCityKey) as any)
  }

  return {
    setMetric(nextMetric) {
      metric = nextMetric === 'streams' ? 'streams' : 'viewers'
      updateSource()
    },
    selectCity(key) {
      selectedCityKey = clean(key) || null
      updateSource()
    },
    destroy() {
      map.remove()
    },
  }
}

function buildData(model: KickCityPreviewModel, metric: Metric, selectedCityKey: string | null) {
  const values = model.referenceRows.map((row) => metric === 'viewers' ? row.viewers : row.streams)
  const max = Math.max(0, ...values)
  return {
    type: 'FeatureCollection' as const,
    features: model.referenceRows.flatMap((row) => {
      const point = row.referenceGeometry.referencePoint
      if (!point) return []
      const value = metric === 'viewers' ? row.viewers : row.streams
      return [{
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [point.longitude, point.latitude],
        },
        properties: {
          viewloomCityAggregateKey: row.cityAggregateKey,
          viewloomCountryCode: row.countryCode,
          viewloomRegion: row.region ?? '',
          viewloomCity: row.city,
          viewloomStreams: row.streams,
          viewloomViewers: row.viewers,
          viewloomMetricBucket: metricBucket(value, max),
          viewloomSelected: selectedCityKey === row.cityAggregateKey,
          viewloomReferenceRole: 'city_aggregate_reference',
        },
      }]
    }),
  }
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
