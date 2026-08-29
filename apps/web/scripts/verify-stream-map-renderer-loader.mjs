import { readFileSync } from 'node:fs'

const entryPath = new URL('../src/features/twitch-stream-map/stream-map-entry.ts', import.meta.url)
const corePath = new URL('../src/features/twitch-stream-map/stream-map-entry-core.ts', import.meta.url)
const pagePath = new URL('../twitch/map/index.html', import.meta.url)

const entry = readFileSync(entryPath, 'utf8')
const core = readFileSync(corePath, 'utf8')
const page = readFileSync(pagePath, 'utf8')

function requireText(source, text, message) {
  if (!source.includes(text)) throw new Error(message)
}

requireText(entry, 'https://unpkg.com/maplibre-gl@6.4.1/dist/maplibre-gl.mjs', 'Stream Map entry must load the MapLibre v6 ESM bundle.')
requireText(entry, 'await import(/* @vite-ignore */ MAPLIBRE_MODULE_URL)', 'Stream Map entry must await the external MapLibre module before starting the renderer core.')
requireText(entry, "await import('./stream-map-entry-core')", 'Stream Map entry must start the renderer core after the dependency attempt.')
requireText(core, 'const maplibregl = window.maplibregl', 'Renderer core must consume the loader-provided MapLibre namespace.')
requireText(core, 'new maplibregl.Map({', 'Renderer core must still construct the interactive map.')
requireText(page, 'src="/src/features/twitch-stream-map/stream-map-entry.ts"', 'Twitch Stream Map page must load the guarded renderer entry.')

const dependencyLoad = entry.indexOf('await import(/* @vite-ignore */ MAPLIBRE_MODULE_URL)')
const coreLoad = entry.indexOf("await import('./stream-map-entry-core')")
if (dependencyLoad < 0 || coreLoad < 0 || dependencyLoad >= coreLoad) {
  throw new Error('MapLibre dependency must be attempted before the renderer core is imported.')
}

if (entry.includes('dist/maplibre-gl.js')) {
  throw new Error('The guarded entry must not use the removed MapLibre v6 classic JS bundle.')
}

console.log('Stream Map renderer loader contract verified.')
