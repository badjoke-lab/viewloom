import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildKickStreamMapCityRuntime } from '../apps/web/functions/api/kick-stream-map-city-runtime-core.mjs'
import {
  KICK_REVIEWED_CITY_RUNTIME_DATA,
  KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION,
} from '../apps/web/functions/api/kick-stream-map-reviewed-city-runtime-data.mjs'
import {
  KICK_REVIEWED_CITY_REFERENCE_GEOMETRY,
  KICK_REVIEWED_CITY_REFERENCE_GEOMETRY_VERSION,
  kickCityAggregateKeyFromParts,
  kickReviewedCityReferenceGeometryByKey,
} from '../apps/web/functions/api/kick-stream-map-reviewed-city-reference-geometry.mjs'
import {
  KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA,
} from './kick-stream-map-reviewed-city-runtime-staging-data.mjs'

assert.equal(KICK_REVIEWED_CITY_RUNTIME_DATA_VERSION, 'viewloom-kick-reviewed-city-runtime-data-v0.1')
assert.deepEqual(KICK_REVIEWED_CITY_RUNTIME_DATA, KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA)
assert.equal(KICK_REVIEWED_CITY_REFERENCE_GEOMETRY_VERSION, 'viewloom-kick-reviewed-city-reference-geometry-v0.1')
assert.equal(KICK_REVIEWED_CITY_REFERENCE_GEOMETRY.length, 5)
assert.equal(new Set(KICK_REVIEWED_CITY_REFERENCE_GEOMETRY.map((row) => row.key)).size, 5)

const expectedReferenceGeometry = new Map([
  [kickCityAggregateKeyFromParts({ countryCode: 'TR', region: null, city: 'İstanbul' }), {
    longitude: 28.974277,
    latitude: 41.017602,
    featureId: 1159151579,
    featureName: 'Istanbul',
    sourceCountryName: 'Turkey',
    sourceRegionName: 'Istanbul',
    featureClass: 'Admin-1 capital',
  }],
  [kickCityAggregateKeyFromParts({ countryCode: 'PL', region: null, city: 'Wrocław' }), {
    longitude: 17.030009,
    latitude: 51.110432,
    featureId: 1159139051,
    featureName: 'Wrocław',
    sourceCountryName: 'Poland',
    sourceRegionName: 'Lower Silesian',
    featureClass: 'Admin-1 capital',
  }],
  [kickCityAggregateKeyFromParts({ countryCode: 'BR', region: null, city: 'Rio de Janeiro' }), {
    longitude: -43.212117,
    latitude: -22.907308,
    featureId: 1159151619,
    featureName: 'Rio de Janeiro',
    sourceCountryName: 'Brazil',
    sourceRegionName: 'Rio de Janeiro',
    featureClass: 'Admin-1 capital',
  }],
  [kickCityAggregateKeyFromParts({ countryCode: 'IN', region: null, city: 'Mumbai' }), {
    longitude: 72.875839,
    latitude: 19.068408,
    featureId: 1159151611,
    featureName: 'Mumbai',
    sourceCountryName: 'India',
    sourceRegionName: 'Maharashtra',
    featureClass: 'Admin-1 capital',
  }],
])

const referenceRows = KICK_REVIEWED_CITY_REFERENCE_GEOMETRY.filter((row) => row.geometryStatus === 'reference_point')
const noGeometryRows = KICK_REVIEWED_CITY_REFERENCE_GEOMETRY.filter((row) => row.geometryStatus === 'no_geometry')
assert.equal(referenceRows.length, 4)
assert.equal(noGeometryRows.length, 1)
assert.equal(new Set(referenceRows.map((row) => row.source.featureId)).size, 4)

for (const row of referenceRows) {
  const expected = expectedReferenceGeometry.get(row.key)
  assert.ok(expected, `unexpected Kick City reference key ${row.key}`)
  assert.equal(row.referenceRole, 'city_aggregate_reference')
  assert.deepEqual(row.referencePoint, { longitude: expected.longitude, latitude: expected.latitude })
  assert.equal(row.source.provider, 'Natural Earth')
  assert.equal(row.source.dataset, 'ne_10m_populated_places_simple')
  assert.equal(row.source.version, '5.1.2')
  assert.equal(row.source.geometrySemantics, 'populated_place_point')
  assert.equal(row.source.featureId, expected.featureId)
  assert.equal(row.source.featureName, expected.featureName)
  assert.equal(row.source.sourceCountryName, expected.sourceCountryName)
  assert.equal(row.source.sourceRegionName, expected.sourceRegionName)
  assert.equal(row.source.featureClass, expected.featureClass)
  assert.equal(row.source.countryNameMatchCount, 1)
  assert.equal(row.source.matchBasis, 'country_city_unique')
  assert.equal(row.source.canonicalRegionMatch, null)
}

const fazilkaKey = kickCityAggregateKeyFromParts({ countryCode: 'IN', region: 'Punjab', city: 'Fazilka' })
const fazilkaRegistry = kickReviewedCityReferenceGeometryByKey(fazilkaKey)
assert.ok(fazilkaRegistry)
assert.equal(fazilkaRegistry.geometryStatus, 'no_geometry')
assert.equal(fazilkaRegistry.referencePoint, null)
assert.equal(fazilkaRegistry.source, null)
assert.equal(fazilkaRegistry.reason, 'natural_earth_v5_1_2_no_matching_reference_feature')
assert.equal(kickReviewedCityReferenceGeometryByKey('ZZ|__none__|missing'), null)

const snapshotItems = [
  { slug: 'absi', displayName: 'Absi', viewer_count: 10, broadcaster_user_id: '27894320' },
  { slug: 'nexxuz', displayName: 'Nexxuz', viewer_count: 20, broadcaster_user_id: '37423182' },
  { slug: 'eray', displayName: 'Eray', viewer_count: 100, broadcaster_user_id: '11096104' },
  { slug: 'niter', displayName: 'Niter', viewer_count: 200, broadcaster_user_id: '190599' },
  { slug: 'beenielol', displayName: 'Beenie', viewer_count: 300, broadcaster_user_id: '75943919' },
  { slug: '8bitheadflicker', displayName: '8bit', viewer_count: 400, broadcaster_user_id: '106756949' },
  { slug: 'binks69', displayName: 'Binks', viewer_count: 500, broadcaster_user_id: '106763992' },
  { slug: 'unreviewed', displayName: 'Unreviewed', viewer_count: 30, broadcaster_user_id: '999999999' },
  { slug: 'missing-id', displayName: 'Missing', viewer_count: 40 },
]

const response = buildKickStreamMapCityRuntime({
  snapshotItems,
  updatedAt: '2026-09-07T00:00:00Z',
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

assert.equal(response.coverage.observedStreams, 9)
assert.equal(response.coverage.stableIdentityStreams, 8)
assert.equal(response.coverage.reviewedEvidenceCatalogSize, 7)
assert.equal(response.coverage.reviewedIdentityStreams, 7)
assert.equal(response.coverage.unreviewedStableIdentityStreams, 1)
assert.equal(response.coverage.mappedStreams, 5)
assert.equal(response.coverage.unmappedStreams, 4)
assert.equal(response.coverage.excludedStreams, 0)
assert.equal(response.coverage.conflictStreams, 0)
assert.equal(response.coverage.mappedViewers, 1500)
assert.equal(response.coverage.unmappedViewers, 100)
assert.equal(response.coverage.mappedCityAggregateCount, 5)
assert.equal(response.coverage.referenceGeometryAggregates, 4)
assert.equal(response.coverage.listOnlyAggregates, 1)
assert.equal(response.coverage.reconciliation.selectedPopulation, 9)
assert.equal(response.coverage.reconciliation.reconciledPopulation, 9)
assert.equal(response.coverage.reconciliation.passes, true)
assert.equal(response.coverage.unmappedReasons.no_qualifying_reviewed_city, 2)
assert.equal(response.coverage.unmappedReasons.no_reviewed_kick_city_evidence, 1)
assert.equal(response.coverage.unmappedReasons.stable_identity_unavailable, 1)

const stableComplete = buildKickStreamMapCityRuntime({
  snapshotItems: snapshotItems.filter((row) => row.broadcaster_user_id),
  updatedAt: '2026-09-07T00:00:00Z',
  sourceMode: 'fixture',
})
assert.equal(stableComplete.coverage.observedStreams, 8)
assert.equal(stableComplete.coverage.stableIdentityStreams, 8)
assert.equal(stableComplete.activation.publicCityActivationReady, true)
assert.equal(stableComplete.publicCityActivationAuthorized, false)
assert.equal(stableComplete.state, 'blocked_public_activation')
assert.deepEqual(stableComplete.activation.blockers, ['public_city_activation_not_authorized'])

const kc5Authorized = buildKickStreamMapCityRuntime({
  snapshotItems: snapshotItems.filter((row) => row.broadcaster_user_id),
  updatedAt: '2026-09-07T00:00:00Z',
  sourceMode: 'fixture',
  publicCityActivationAuthorized: true,
})
assert.equal(kc5Authorized.publicCityActivationAuthorized, true)
assert.equal(kc5Authorized.activation.publicCityActivationReady, true)
assert.equal(kc5Authorized.state, 'ready')
assert.deepEqual(kc5Authorized.activation.blockers, [])
assert.equal(kc5Authorized.coverage.referenceGeometryAggregates, 4)
assert.equal(kc5Authorized.coverage.listOnlyAggregates, 1)
assert.equal(kc5Authorized.coverage.reconciliation.passes, true)

const mappedCities = new Map(response.mappedStreams.map((row) => [row.slug, row.geography]))
assert.equal(mappedCities.get('eray')?.city, 'İstanbul')
assert.equal(mappedCities.get('niter')?.city, 'Wrocław')
assert.equal(mappedCities.get('beenielol')?.city, 'Rio de Janeiro')
assert.equal(mappedCities.get('8bitheadflicker')?.city, 'Fazilka')
assert.equal(mappedCities.get('binks69')?.city, 'Mumbai')
assert.equal(mappedCities.get('8bitheadflicker')?.region, 'Punjab')

const aggregateByKey = new Map(response.cityAggregates.map((row) => [row.cityAggregateKey, row]))
for (const [key, expected] of expectedReferenceGeometry) {
  const aggregate = aggregateByKey.get(key)
  assert.ok(aggregate, `missing runtime aggregate ${key}`)
  assert.deepEqual(aggregate.referenceGeometry, {
    state: 'reference_point',
    referenceKey: key,
    semantics: 'city_aggregate_reference',
    referencePoint: { longitude: expected.longitude, latitude: expected.latitude },
  })
}

const fazilkaAggregate = aggregateByKey.get(fazilkaKey)
assert.ok(fazilkaAggregate)
assert.deepEqual(fazilkaAggregate.referenceGeometry, {
  state: 'no_geometry',
  referenceKey: null,
  semantics: 'list_only',
})
assert.deepEqual(mappedCities.get('8bitheadflicker')?.referenceGeometry, fazilkaAggregate.referenceGeometry)

assert.equal(response.semantics.reviewedCityEvidenceRuntimeConnected, true)
assert.equal(response.semantics.reviewedCityReferenceGeometryDataVersion, KICK_REVIEWED_CITY_REFERENCE_GEOMETRY_VERSION)
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

function collectSensitiveCoordinatePaths(value, path = [], output = []) {
  if (Array.isArray(value)) {
    value.forEach((child, index) => collectSensitiveCoordinatePaths(child, [...path, String(index)], output))
    return output
  }
  if (!value || typeof value !== 'object') return output
  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key]
    if (['latitude', 'longitude', 'lat', 'lng', 'coordinates'].includes(key)) {
      const joined = nextPath.join('.')
      const aggregateReferenceCoordinate = /referenceGeometry\.referencePoint\.(latitude|longitude)$/.test(joined)
      if (!aggregateReferenceCoordinate) output.push(joined)
    }
    collectSensitiveCoordinatePaths(child, nextPath, output)
  }
  return output
}

const serialized = JSON.stringify(response)
const publicKeys = collectObjectKeys(response)
for (const forbiddenKey of [
  'stableKickUserId',
  'broadcaster_user_id',
  'sourceUrl',
  'researchNote',
  'current_location',
  'temporary_location',
  'address',
  'featureId',
  'featureName',
  'sourceCountryName',
  'sourceRegionName',
  'featureClass',
  'matchBasis',
  'countryNameMatchCount',
]) {
  assert.equal(publicKeys.has(forbiddenKey), false, `public City runtime must not expose key ${forbiddenKey}`)
}
assert.deepEqual(collectSensitiveCoordinatePaths(response), [], 'only aggregate reference-point longitude/latitude may be public')
for (const stableId of snapshotItems.map((row) => row.broadcaster_user_id).filter(Boolean)) {
  assert.equal(serialized.includes(stableId), false, `public City runtime must not expose stable identity value ${stableId}`)
}
for (const aggregate of response.cityAggregates) {
  if (aggregate.referenceGeometry.state !== 'reference_point') continue
  assert.deepEqual(
    Object.keys(aggregate.referenceGeometry).sort(),
    ['referenceKey', 'referencePoint', 'semantics', 'state'],
  )
  assert.deepEqual(Object.keys(aggregate.referenceGeometry.referencePoint).sort(), ['latitude', 'longitude'])
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
assert.equal(countryRuntimeSource.includes('kick-stream-map-reviewed-city-reference-geometry'), false)
assert.equal(countryRuntimeSource.includes('buildKickStreamMapCityRuntime'), false)

console.log(JSON.stringify({
  ok: true,
  runtimeVersion: response.version,
  reviewedCatalog: response.coverage.reviewedEvidenceCatalogSize,
  geometryCatalog: KICK_REVIEWED_CITY_REFERENCE_GEOMETRY.length,
  observedStreams: response.coverage.observedStreams,
  mappedStreams: response.coverage.mappedStreams,
  mappedCityAggregates: response.coverage.mappedCityAggregateCount,
  referenceGeometryAggregates: response.coverage.referenceGeometryAggregates,
  listOnlyAggregates: response.coverage.listOnlyAggregates,
  fazilkaGeometryStatus: fazilkaAggregate.referenceGeometry.state,
  stableCompleteState: stableComplete.state,
  kc5AuthorizedState: kc5Authorized.state,
  publicCityActivationAuthorized: kc5Authorized.publicCityActivationAuthorized,
  countryDefaultActivationPreserved: true,
  stableIdentityPublished: response.semantics.stableIdentityPublished,
}, null, 2))
