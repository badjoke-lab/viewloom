import * as maplibregl from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import './maplibre-bootstrap.css'

type StreamMapOptions = ConstructorParameters<typeof maplibregl.Map>[0]

// MapLibre 6 no longer inlines its worker. Under Vite the default worker URL can
// resolve next to the bundled application chunk and silently 404, leaving vector
// sources stuck forever while the canvas and controls still mount. Bundle the
// worker through Vite's worker pipeline and register its emitted URL before any
// map instance is created.
maplibregl.setWorkerUrl(workerUrl)

// MapLibre 6 can produce a singular inverse projection matrix when maxBounds spans
// exactly 360 degrees of longitude. Keep the same practical world constraint while
// staying just inside that singular full-wrap boundary.
const safeWorldBounds: [[number, number], [number, number]] = [
  [-179.999, -78],
  [179.999, 82],
]

class ViewLoomStreamMap extends maplibregl.Map {
  constructor(options: StreamMapOptions) {
    super({ ...options, maxBounds: safeWorldBounds })
  }
}

const bundledMaplibregl = { ...maplibregl, Map: ViewLoomStreamMap }
Object.assign(window, { maplibregl: bundledMaplibregl })

// Geography mode must be installed before the main renderer performs its first
// /api/twitch-stream-map request. The City guard keeps City mode truthful when
// the public contract intentionally does not publish creator coordinates.
await import('./geography-ui-bootstrap')
await import('./city-render-guard')
// Country is a geographic chart rather than a street-navigation map. Prune the
// provider style to background/water/admin context before the region layer is
// installed; City mode intentionally keeps the normal basemap.
await import('./country-minimal-basemap')
// Country uses polygon fills as the primary visualization. Aggregate markers are
// retained only as a fail-safe and for tiny places without a usable 110m polygon.
await import('./country-regions')
await import('./stream-map-entry')
// Country selection is a data-selection action, not a camera action. The compact
// UI layer owns explicit World view reset, density, drilldown placement and the
// mobile filter presentation without changing the API or City contract.
await import('./country-ui-density')
