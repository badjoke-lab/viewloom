import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildKickStreamMapCityRuntime } from '../apps/web/functions/api/kick-stream-map-city-runtime-core.mjs'
import { kickCityReferenceGeometry } from '../apps/web/functions/api/kick-stream-map-city-reference-points.mjs'
import {
  KICK_REVIEWED_CITY_RUNTIME_DATA,
  KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION,
} from '../apps/web/functions/api/kick-stream-map-reviewed-city-runtime-data.mjs'
import {
  KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA,
} from './kick-stream-map-reviewed-city-runtime-staging-data.mjs'

assert.equal(KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION, 'viewloom-kick-reviewed-city-runtime-data-v0.1')
assert.ok(KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA.length >= KICK_REVIEWED_CITY_RUNTIME_DATA.length)
assert.deepEqual(
  KICK_REVIEWED_CITY_RUNTIME_DATA,
  KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA.slice(0, KICK_REVIEWED_CITY_RUNTIME_DATA.length),
)
assert.ok(KICK_REVIEWED_CITY_RUNTIME_DATA.length >= 107)

const houstonReference = kickCityReferenceGeometry({ countryCode: 'US', region: 'Texas', city: 'Houston' })
assert.deepEqual(houstonReference, {
  state: 'reference_point',
  referenceKey: 'US|texas|houston',
  semantics: 'city_aggregate_reference',
  referencePoint: { latitude: 29.82192, longitude: -95.341925 },
})

const snapshotItems = [
  { slug: 'absi', displayName: 'Absi', viewer_count: 10, broadcaster_user_id: '27894320' },
  { slug: 'nexxuz', displayName: 'Nexxuz', viewer_count: 20, broadcaster_user_id: '37423182' },
  { slug: 'eray', displayName: 'Eray', viewer_count: 100, broadcaster_user_id: '11096104' },
  { slug: 'niter', displayName: 'Niter', viewer_count: 200, broadcaster_user_id: '190599' },
  { slug: 'beenielol', displayName: 'Beenie', viewer_count: 300, broadcaster_user_id: '75943919' },
  { slug: '8bitheadflicker', displayName: '8bit', viewer_count: 400, broadcaster_user_id: '106756949' },
  { slug: 'binks69', displayName: 'Binks', viewer_count: 500, broadcaster_user_id: '106763992' },
  { slug: 'deenthegreat', displayName: 'DeenTheGreat', viewer_count: 31, broadcaster_user_id: '5508767' },
  { slug: 'lospollostv', displayName: 'LosPollosTV', viewer_count: 32, broadcaster_user_id: '35467' },
  { slug: 'fissure_cs_a', displayName: 'fissure_cs_a', viewer_count: 33, broadcaster_user_id: '68312242' },
  { slug: 'agusneta', displayName: 'agusneta', viewer_count: 34, broadcaster_user_id: '31377709' },
  { slug: 'gaules', displayName: 'Gaules', viewer_count: 35, broadcaster_user_id: '68422390' },
  { slug: 'unreviewed', displayName: 'Unreviewed', viewer_count: 30, broadcaster_user_id: '999999999' },
  { slug: 'missing-id', displayName: 'Missing', viewer_count: 40 },
]

const response = buildKickStreamMapCityRuntime({
  snapshotItems,
  updatedAt: '2026-09-11T00:00:00Z',
  sourceMode: 'fixture',
})

assert.equal(response.version, 'viewloom-kick-stream-map-city-runtime-v0.1')
assert.equal(response.provider, 'kick')
assert.equal(response.geographyMode, 'city')
assert.equal(response.implementationState, 'reviewed_city_runtime_connected')
assert.equal(response.publicActivationAuthorized, false)
assert.equal(response.publicCityActivationAuthorized, false)
assert.equal(response.state, 'blocked_stable_identity')
assert.equal(response.activation.publicCityActivationReady, false)
assert.deepEqual(response.activation.blockers, [
  'production_livestream_snapshot_missing_broadcaster_user_id',
  'public_city_activation_not_authorized',
])

assert.equal(response.coverage.observedStreams, 14)
assert.equal(response.coverage.stableIdentityStreams, 13)
assert.equal(response.coverage.reviewedEvidenceCatalogSize, KICK_REVIEWED_CITY_RUNTIME_DATA.length)
assert.equal(response.coverage.reviewedIdentityStreams, 12)
assert.equal(response.coverage.unreviewedStableIdentityStreams, 1)
assert.equal(response.coverage.mappedStreams, 5)
assert.equal(response.coverage.unmappedStreams, 8)
assert.equal(response.coverage.excludedStreams, 1)
assert.equal(response.coverage.conflictStreams, 0)
assert.equal(response.coverage.mappedViewers, 1500)
assert.equal(response.coverage.unmappedViewers, 232)
assert.equal(response.coverage.excludedViewers, 33)
assert.equal(response.coverage.mappedCityAggregateCount, 5)
assert.equal(response.coverage.referenceGeometryAggregates, 0)
assert.equal(response.coverage.listOnlyAggregates, 5)
assert.equal(response.coverage.reconciliation.selectedPopulation, 14)
assert.equal(response.coverage.reconciliation.reconciledPopulation, 14)
assert.equal(response.coverage.reconciliation.passes, true)
assert.equal(response.coverage.unmappedReasons.no_qualifying_reviewed_city, 6)
assert.equal(response.coverage.unmappedReasons.no_reviewed_kick_city_evidence, 1)
assert.equal(response.coverage.unmappedReasons.stable_identity_unavailable, 1)

const excludedBySlug = new Map(response.excludedStreams.map((row) => [row.slug, row]))
assert.equal(excludedBySlug.get('fissure_cs_a')?.geography?.state, 'excluded')
assert.equal(excludedBySlug.get('fissure_cs_a')?.geography?.reason, 'reviewed_nonperson_exclusion')

const stableComplete = buildKickStreamMapCityRuntime({
  snapshotItems: snapshotItems.filter((row) => row.broadcaster_user_id),
  updatedAt: '2026-09-11T00:00:00Z',
  sourceMode: 'fixture',
})
assert.equal(stableComplete.coverage.observedStreams, 13)
assert.equal(stableComplete.coverage.stableIdentityStreams, 13)
assert.equal(stableComplete.activation.publicCityActivationReady, true)
assert.equal(stableComplete.publicCityActivationAuthorized, false)
assert.equal(stableComplete.state, 'blocked_public_activation')
assert.deepEqual(stableComplete.activation.blockers, ['public_city_activation_not_authorized'])

const kc5Authorized = buildKickStreamMapCityRuntime({
  snapshotItems: snapshotItems.filter((row) => row.broadcaster_user_id),
  updatedAt: '2026-09-11T00:00:00Z',
  sourceMode: 'fixture',
  publicCityActivationAuthorized: true,
})
assert.equal(kc5Authorized.publicCityActivationAuthorized, true)
assert.equal(kc5Authorized.activation.publicCityActivationReady, true)
assert.equal(kc5Authorized.state, 'ready')
assert.deepEqual(kc5Authorized.activation.blockers, [])
assert.equal(kc5Authorized.coverage.reconciliation.passes, true)

const mappedCities = new Map(response.mappedStreams.map((row) => [row.slug, row.geography]))
assert.equal(mappedCities.get('eray')?.city, 'İstanbul')
assert.equal(mappedCities.get('niter')?.city, 'Wrocław')
assert.equal(mappedCities.get('beenielol')?.city, 'Rio de Janeiro')
assert.equal(mappedCities.get('8bitheadflicker')?.city, 'Fazilka')
assert.equal(mappedCities.get('binks69')?.city, 'Mumbai')
assert.equal(mappedCities.get('8bitheadflicker')?.region, 'Punjab')

for (const row of response.cityAggregates) {
  assert.equal(row.referenceGeometry.state, 'no_geometry')
  assert.equal(row.referenceGeometry.referenceKey, null)
  assert.equal(row.referenceGeometry.semantics, 'list_only')
}

assert.equal(response.semantics.reviewedCityEvidenceRuntimeConnected, true)
assert.equal(response.semantics.stableIdentityPublished, false)
assert.equal(response.semantics.countryInferenceToCityAllowed, false)
assert.equal(response.semantics.currentLocationUsedForBaseCity, false)
assert.equal(response.semantics.temporaryLocationUsedForBaseCity, false)
assert.equal(response.semantics.creatorCoordinatesAllowed, false)
assert.equal(response.semantics.noGeometryListOnly, true)

function collectObjectKeys(value, target = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectObjectKeys(item, target)
    return target
  }
  if (!value || typeof value !== 'object') return target
  for (const [key, child] of Object.entries(value)) {
    target.add(key)
    collectObjectKeys(child, target)
  }
  return target
}

const serialized = JSON.stringify(response)
const publicKeys = collectObjectKeys(response)
for (const forbiddenKey of ['stableKickUserId', 'broadcaster_user_id']) {
  assert.equal(publicKeys.has(forbiddenKey), false, `public City runtime must not expose key ${forbiddenKey}`)
}
for (const stableId of snapshotItems.map((row) => row.broadcaster_user_id).filter(Boolean)) {
  assert.equal(serialized.includes(stableId), false, `public City runtime must not expose stable identity value ${stableId}`)
}
for (const forbidden of [
  'sourceUrl',
  'researchNote',
  'current_location',
  'temporary_location',
  'latitude',
  'longitude',
  'coordinates',
  'address',
]) {
  assert.equal(serialized.includes(forbidden), false, `public City runtime must not expose ${forbidden}`)
}

const routeSource = readFileSync('apps/web/functions/api/kick-stream-map.ts', 'utf8')
assert.ok(routeSource.includes("const K4_PUBLIC_ACTIVATION_AUTHORIZED = true"))
assert.ok(routeSource.includes("const KICK_CITY_PUBLIC_ACTIVATION_AUTHORIZED = true"))
assert.ok(routeSource.includes("normalized === 'city'"))
assert.ok(routeSource.includes("geography must be country or city"))
assert.ok(routeSource.includes('buildKickStreamMapCountryRuntime'))
assert.ok(routeSource.includes('buildKickStreamMapCityRuntime'))

const countryRuntimeSource = readFileSync('apps/web/functions/api/kick-stream-map-country-runtime-core.mjs', 'utf8')
assert.equal(countryRuntimeSource.includes('kick-stream-map-reviewed-city-runtime-data'), false)
assert.equal(countryRuntimeSource.includes('buildKickStreamMapCityRuntime'), false)

console.log(JSON.stringify({
  ok: true,
  runtimeVersion: response.version,
  reviewedCatalog: response.coverage.reviewedEvidenceCatalogSize,
  observedStreams: response.coverage.observedStreams,
  mappedStreams: response.coverage.mappedStreams,
  excludedStreams: response.coverage.excludedStreams,
  mappedCityAggregates: response.coverage.mappedCityAggregateCount,
  referenceGeometryAggregates: response.coverage.referenceGeometryAggregates,
  listOnlyAggregates: response.coverage.listOnlyAggregates,
  stableCompleteState: stableComplete.state,
  kc5AuthorizedState: kc5Authorized.state,
  publicCityActivationAuthorized: kc5Authorized.publicCityActivationAuthorized,
  countryDefaultActivationPreserved: true,
  stableIdentityPublished: response.semantics.stableIdentityPublished,
}, null, 2))
