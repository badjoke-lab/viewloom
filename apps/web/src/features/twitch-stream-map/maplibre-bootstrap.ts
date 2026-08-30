import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './maplibre-bootstrap.css'

type StreamMapOptions = ConstructorParameters<typeof maplibregl.Map>[0]

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
await import('./stream-map-entry')
