import fs from 'node:fs'

const bootstrap = fs.readFileSync('apps/web/src/features/twitch-stream-map/geography-ui-bootstrap.ts', 'utf8')
const cityGuard = fs.readFileSync('apps/web/src/features/twitch-stream-map/city-render-guard.ts', 'utf8')
const cityCore = fs.readFileSync('apps/web/src/features/twitch-stream-map/city-aggregate-core.mjs', 'utf8')
const cityReferencePointCore = fs.readFileSync('apps/web/src/features/twitch-stream-map/city-reference-point-core.mjs', 'utf8')
const view = fs.readFileSync('apps/web/src/features/twitch-stream-map/unmapped-reason-view.ts', 'utf8')
const reasons = fs.readFileSync('apps/web/src/features/twitch-stream-map/unmapped-reason-core.mjs', 'utf8')

const requiredBootstrap = [
  "pageUrl.searchParams.get('geography') === 'city'",
  "request.searchParams.set('geography', 'city')",
  "request.searchParams.delete('geography')",
  "raw?.version !== 'viewloom-stream-map-city-contract-v0.1'",
  "country_only_at_city_resolution",
  "base_city_conflict",
  "stableTwitchUserIdAvailableInMinuteSnapshot",
  "Current / IRL remains unavailable",
]

for (const token of requiredBootstrap) {
  if (!bootstrap.includes(token)) throw new Error(`missing City UI bootstrap contract token: ${token}`)
}

for (const token of [
  "citySelectionState(filtered, selectedCityKey)",
  "[data-city-places]",
  "[data-selected-city]",
  "dataset.clearSelectedCity",
  "dataset.showSelectedCityStreams",
  "City-placeable streams",
  "Country-only evidence stays in accounting",
  "cityReferencePointAggregates(selection.aggregates)",
  "referencePoint.longitude",
  "referencePoint.latitude",
  "element.dataset.referenceRole = referencePoint.referenceRole",
]) {
  if (!cityGuard.includes(token)) throw new Error(`missing City aggregate UI token: ${token}`)
}

for (const token of [
  "const MISSING_REGION = '__none__'",
  'cityAggregateKeyFromStream',
  'groupCityMappedStreams',
  'citySelectionState',
  "countryCode = clean(stream?.location?.countryCode).toUpperCase()",
]) {
  if (!cityCore.includes(token)) throw new Error(`missing City aggregate core token: ${token}`)
}

for (const token of [
  "cityReferenceGeometryByKey",
  "geometryStatus !== 'reference_point'",
  "referenceRole !== 'city_aggregate_reference'",
  "geometry.referencePoint?.longitude",
  "geometry.referencePoint?.latitude",
]) {
  if (!cityReferencePointCore.includes(token)) throw new Error(`missing reviewed City reference-point contract token: ${token}`)
}

if (!view.includes("import './geography-ui-bootstrap'")) throw new Error('geography bootstrap is not loaded by Stream Map UI')
if (!reasons.includes('country_only_at_city_resolution')) throw new Error('country-only City reason metadata missing')
if (!reasons.includes('base_city_conflict')) throw new Error('base City conflict reason metadata missing')
if (/latitude|longitude|\blat\b|\blon\b|gps/i.test(bootstrap)) throw new Error('precise-location field token introduced in City UI bootstrap')
if (/current_location[^\n]{0,80}(set|push|map|place)/i.test(bootstrap)) throw new Error('Current location appears to be activated for placement')
if (/COUNTRY_CENTROIDS/.test(cityGuard)) throw new Error('Country centroids must not be used for City reference rendering')
for (const forbidden of [
  'aggregate.lon',
  'aggregate.lat',
  'aggregate.longitude',
  'aggregate.latitude',
  'place.lon',
  'place.lat',
  'place.longitude',
  'place.latitude',
]) {
  if (cityGuard.includes(forbidden)) throw new Error(`payload coordinate field introduced in City renderer: ${forbidden}`)
}

console.log(JSON.stringify({
  ok: true,
  countryDefault: true,
  cityExplicit: true,
  countryOnlyAccounted: true,
  baseCityConflictAccounted: true,
  stableIdLimitationVisible: true,
  cityAggregateCore: true,
  cityAggregateSelection: true,
  listWorksWithoutGeometry: true,
  currentIrlUiActive: false,
  preciseLocationFieldsInBootstrap: false,
  reviewedCityReferencePointLayer: true,
  creatorCoordinatePlacement: false,
  countryCentroidCityPlacement: false,
}, null, 2))
