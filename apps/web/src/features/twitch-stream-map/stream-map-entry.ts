type MapLibreControl = object

type MapLibreMap = {
  addControl(control: MapLibreControl, position?: string): void
  scrollZoom: { disable(): void }
  on(event: 'load' | 'error', handler: () => void): void
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
  NavigationControl: new (options?: { showCompass?: boolean; visualizePitch?: boolean }) => MapLibreControl
}

declare global {
  interface Window {
    maplibregl?: MapLibreNamespace
  }
}

const root = document.querySelector<HTMLElement>('#stream-map-root')
const status = document.querySelector<HTMLElement>('[data-stream-map-status]')
const state = document.querySelector<HTMLElement>('[data-stream-map-state]')
const maplibregl = window.maplibregl

if (!root) {
  // Route may not be mounted on non-map pages.
} else if (!maplibregl) {
  root.dataset.mapState = 'renderer-error'
  if (state) state.textContent = 'Renderer unavailable'
  if (status) {
    status.innerHTML = '<strong>Map renderer unavailable</strong><span>MapLibre could not be loaded. No location data is being shown.</span>'
  }
} else {
  root.dataset.mapState = 'basemap-loading'

  const map = new maplibregl.Map({
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
    root.dataset.mapState = 'basemap-ready'
    if (state) state.textContent = 'Basemap ready'
    if (status) {
      status.innerHTML = '<strong>World basemap ready</strong><span>Country and city context is visible. Streamer location evidence is not connected yet.</span>'
      status.dataset.state = 'ready'
    }
  })

  map.on('error', () => {
    if (root.dataset.mapState === 'basemap-ready') return
    root.dataset.mapState = 'basemap-error'
    if (state) state.textContent = 'Basemap error'
    if (status) {
      status.innerHTML = '<strong>World basemap failed to load</strong><span>No streamer geography is being inferred or substituted.</span>'
      status.dataset.state = 'error'
    }
  })
}

export {}
