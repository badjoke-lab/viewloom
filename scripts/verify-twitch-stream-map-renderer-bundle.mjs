import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const fail = (message) => {
  throw new Error(`Twitch Stream Map renderer bundle verification failed: ${message}`)
}

const packageJson = JSON.parse(read('apps/web/package.json'))
const page = read('apps/web/twitch/map/index.html')
const bootstrap = read('apps/web/src/features/twitch-stream-map/maplibre-bootstrap.ts')
const bootstrapCss = read('apps/web/src/features/twitch-stream-map/maplibre-bootstrap.css')
const entry = read('apps/web/src/features/twitch-stream-map/stream-map-entry.ts')
const regions = read('apps/web/src/features/twitch-stream-map/country-regions.ts')
const countryUi = read('apps/web/src/features/twitch-stream-map/country-ui-density.ts')

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
if (page.includes('Select a country marker') || page.includes('Country markers are buttons')) {
  fail('static Stream Map copy must not describe the retired marker-first Country renderer')
}
if (!page.includes('Select a country on the map or in the country list')) {
  fail('static Stream Map copy must describe Country selection without marker-first semantics')
}
if (!page.includes('small-country fallback controls remain aggregate selectors, not creator locations')) {
  fail('static Stream Map copy must preserve the small-country aggregate fallback boundary')
}
if (!bootstrap.includes("from 'maplibre-gl'")) {
  fail('bootstrap must import MapLibre from the web dependency graph')
}
const maplibreCssIndex = bootstrap.indexOf("'maplibre-gl/dist/maplibre-gl.css'")
const compatCssIndex = bootstrap.indexOf("'./maplibre-bootstrap.css'")
if (maplibreCssIndex < 0 || compatCssIndex < 0 || maplibreCssIndex > compatCssIndex) {
  fail('Stream Map layout compatibility CSS must load after bundled MapLibre CSS')
}
if (!bootstrapCss.includes('.stream-map-stage > .stream-map-canvas.maplibregl-map')) {
  fail('layout compatibility CSS must target the rendered Stream Map root')
}
if (!bootstrapCss.includes('position: absolute') || !bootstrapCss.includes('height: 100%')) {
  fail('layout compatibility CSS must keep the bundled renderer visible inside the map stage')
}
if (!bootstrap.includes('[-179.999, -78]') || !bootstrap.includes('[179.999, 82]')) {
  fail('bootstrap must keep Stream Map maxBounds inside the MapLibre full-wrap singularity')
}
if (!bootstrap.includes('class ViewLoomStreamMap extends maplibregl.Map')) {
  fail('bootstrap must apply the Stream Map bounds compatibility wrapper')
}
const assignIndex = bootstrap.indexOf('Object.assign(window, { maplibregl: bundledMaplibregl })')
const regionIndex = bootstrap.indexOf("await import('./country-regions')")
const entryIndex = bootstrap.indexOf("await import('./stream-map-entry')")
const countryUiIndex = bootstrap.indexOf("await import('./country-ui-density')")
if (assignIndex < 0 || regionIndex < 0 || entryIndex < 0 || countryUiIndex < 0 || assignIndex > regionIndex || regionIndex > entryIndex || entryIndex > countryUiIndex) {
  fail('bootstrap must install Country regions, the data renderer, then the compact Country interaction layer in order')
}
if (bootstrap.includes("country-focus-bounds")) {
  fail('Country selection must not be wired to automatic fitBounds camera movement')
}
if (bootstrap.includes("country-region-ab")) {
  fail('the obsolete Country A/B renderer must not remain wired into the public bootstrap')
}
if (!regions.includes("const REGION_SOURCE_ID = 'viewloom-country-regions'")) {
  fail('finalized Country region source id is missing')
}
if (!regions.includes("document.documentElement.classList.add('stream-map-country-regions-active')")) {
  fail('Country regions must be the primary Country renderer')
}
if (regions.includes("data.mapView") || regions.includes("CountryMapMode") || regions.includes("setMapMode(")) {
  fail('the public Country renderer must not expose the retired Markers/Regions A/B switch')
}
if (!regions.includes('stream-map-country-marker--region-fallback')) {
  fail('small-country aggregate marker fallback must remain available')
}
if (!countryUi.includes("world.textContent = 'World view'") || !countryUi.includes('resetWorldCamera')) {
  fail('Country UI must expose an explicit World view camera reset')
}
if (!countryUi.includes("document.documentElement.classList.add('stream-map-country-ui-v2')")) {
  fail('Country density layout activation is missing')
}
if (!entry.includes("style: 'https://tiles.openfreemap.org/styles/dark'")) {
  fail('the accepted OpenFreeMap basemap style contract changed unexpectedly')
}
if (!entry.includes("root.dataset.mapState = 'renderer-error'")) {
  fail('the existing fail-closed renderer state must remain available')
}

console.log('Twitch Stream Map renderer bundle contract verified.')
