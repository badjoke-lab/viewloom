import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildKickCountryPreviewModel, metricBucket } from '../apps/web/src/features/kick-stream-map/country-preview-model.mjs'

const response = {
  version: 'viewloom-kick-stream-map-country-response-v0.1',
  provider: 'kick',
  geographyMode: 'country',
  mappedStreams: [
    { slug: 'alpha', displayName: 'Alpha', viewers: 1000, url: 'https://kick.com/alpha', geography: { state: 'mapped', countryCode: 'US' } },
    { slug: 'beta', displayName: 'Beta', viewers: 500, url: 'https://kick.com/beta', geography: { state: 'mapped', countryCode: 'US' } },
    { slug: 'gamma', displayName: 'Gamma', viewers: 700, url: 'https://kick.com/gamma', geography: { state: 'mapped', countryCode: 'JP' } },
  ],
  unmappedStreams: [{ slug: 'unknown' }],
  excludedStreams: [{ slug: 'org' }],
  conflictStreams: [{ slug: 'conflict' }],
  coverage: {
    observedStreams: 6,
    mappedStreams: 3,
    mappedViewers: 2200,
    unmappedStreams: 1,
    excludedStreams: 1,
    conflictStreams: 1,
    reconciliation: { selectedPopulation: 6, reconciledPopulation: 6, passes: true },
  },
  semantics: {
    stableIdentity: 'broadcaster_user_id',
    slugIsStableIdentity: false,
    twitchEvidenceReuseAllowed: false,
    providerAggregationAllowed: false,
    automaticGeographyPromotionAllowed: false,
    cityInferenceFromCountryAllowed: false,
    currentLocationUsedForBasePlacement: false,
    preciseAddressPublished: false,
    coordinatesPublished: false,
  },
}

const blocked = buildKickCountryPreviewModel(response, { allowGeography: false })
assert.equal(blocked.countryRows.length, 0)
assert.equal(blocked.mappedStreams.length, 0)
assert.equal(blocked.accounting.mappedStreams, 0)
assert.equal(blocked.semantics.creatorCoordinatesUsed, false)
assert.equal(blocked.semantics.twitchEvidenceReused, false)

const allowed = buildKickCountryPreviewModel(response, { allowGeography: true })
assert.equal(allowed.contractSafe, true)
assert.deepEqual(allowed.countryRows, [
  { countryCode: 'US', streams: 2, viewers: 1500 },
  { countryCode: 'JP', streams: 1, viewers: 700 },
])
assert.equal(allowed.mappedStreams.length, 3)
assert.equal(allowed.accounting.observedStreams, 6)
assert.equal(allowed.accounting.unmappedStreams, 1)
assert.equal(allowed.accounting.excludedStreams, 1)
assert.equal(allowed.accounting.conflictStreams, 1)
assert.equal(allowed.accounting.reconciliationPasses, true)
assert.equal(metricBucket(0, 100), 0)
assert.equal(metricBucket(100, 100), 5)

const unsafe = buildKickCountryPreviewModel({
  ...response,
  semantics: { ...response.semantics, twitchEvidenceReuseAllowed: true },
}, { allowGeography: true })
assert.equal(unsafe.contractSafe, false)
assert.equal(unsafe.countryRows.length, 0)
assert.equal(unsafe.mappedStreams.length, 0)

const serialized = JSON.stringify(allowed)
for (const forbidden of ['"lat"', '"lng"', '"latitude"', '"longitude"', '"coordinates"']) {
  assert.equal(serialized.includes(forbidden), false, `preview model must not expose ${forbidden}`)
}

const mapSource = readFileSync('apps/web/src/features/kick-stream-map/country-preview-map.ts', 'utf8')
assert.ok(mapSource.includes('/data/geo/countries-110m-1.geojson'))
assert.ok(mapSource.includes("type: 'fill'"), 'Country visualization must use region fill')
assert.equal(mapSource.includes('new maplibregl.Marker'), false, 'creator/country marker rendering is not allowed in Kick Country preview')
assert.equal(mapSource.includes('twitch-stream-map'), false, 'Kick renderer must not import Twitch feature modules')

const entry = readFileSync('apps/web/src/features/kick-stream-map/preview-entry.ts', 'utf8')
assert.ok(entry.includes('buildKickCountryPreviewModel'))
assert.ok(entry.includes('readiness.canRenderCountryGeography'))
assert.ok(entry.includes('reviewed Country terminal state · stable join only'))

const html = readFileSync('apps/web/preview/kick-stream-map/index.html', 'utf8')
assert.ok(html.includes('data-kick-preview-map'))
assert.ok(html.includes('Country intensity'))
assert.ok(html.includes('noindex,nofollow'))
assert.equal(html.includes('href="/kick/map/"'), false)
assert.equal(html.includes('rel="canonical"'), false)

console.log(JSON.stringify({
  ok: true,
  countryAggregation: true,
  countryRegionFill: true,
  creatorCoordinates: false,
  twitchEvidenceReuse: false,
  publicRouteCreated: false,
  dualGateInherited: true,
}, null, 2))
