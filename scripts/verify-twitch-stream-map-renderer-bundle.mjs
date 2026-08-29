import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const fail = (message) => {
  throw new Error(`Twitch Stream Map renderer bundle verification failed: ${message}`)
}

const packageJson = JSON.parse(read('apps/web/package.json'))
const page = read('apps/web/twitch/map/index.html')
const bootstrap = read('apps/web/src/features/twitch-stream-map/maplibre-bootstrap.ts')
const entry = read('apps/web/src/features/twitch-stream-map/stream-map-entry.ts')

if (packageJson.dependencies?.['maplibre-gl'] !== '6.4.1') {
  fail('maplibre-gl must be pinned to 6.4.1 in web runtime dependencies')
}
if (page.includes('unpkg.com/maplibre-gl')) {
  fail('the public Stream Map page must not depend on the unpkg MapLibre runtime')
}
if (!page.includes('/src/features/twitch-stream-map/maplibre-bootstrap.ts')) {
  fail('the public Stream Map page must load the bundled MapLibre bootstrap')
}
if (page.includes('/src/features/twitch-stream-map/stream-map-entry.ts')) {
  fail('the page must not bypass the renderer bootstrap and load stream-map-entry directly')
}
if (!bootstrap.includes("from 'maplibre-gl'")) {
  fail('bootstrap must import MapLibre from the web dependency graph')
}
if (!bootstrap.includes("'maplibre-gl/dist/maplibre-gl.css'")) {
  fail('bootstrap must bundle MapLibre CSS')
}
const assignIndex = bootstrap.indexOf('Object.assign(window, { maplibregl })')
const entryIndex = bootstrap.indexOf("await import('./stream-map-entry')")
if (assignIndex < 0 || entryIndex < 0 || assignIndex > entryIndex) {
  fail('bootstrap must install window.maplibregl before importing the existing Stream Map entry')
}
if (!entry.includes("style: 'https://tiles.openfreemap.org/styles/dark'")) {
  fail('the accepted OpenFreeMap basemap style contract changed unexpectedly')
}
if (!entry.includes("root.dataset.mapState = 'renderer-error'")) {
  fail('the existing fail-closed renderer state must remain available')
}

console.log('Twitch Stream Map renderer bundle contract verified.')
