import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

Object.assign(window, { maplibregl })
await import('./stream-map-entry')
