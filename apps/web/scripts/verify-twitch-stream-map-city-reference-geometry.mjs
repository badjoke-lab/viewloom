import assert from 'node:assert/strict'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../functions/api/twitch-stream-map-reviewed-evidence.mjs'
import { cityAggregateKeyFromParts } from '../src/features/twitch-stream-map/city-aggregate-core.mjs'
import { TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY } from '../src/features/twitch-stream-map/city-reference-geometry-registry.mjs'

const TARGET_CLAIM_KINDS = new Set(['home_base', 'declared_location'])
const EMPTY_GEOMETRY_STATUSES = new Set(['no_geometry', 'review_needed'])
const NATURAL_EARTH_DATASET = 'ne_10m_populated_places_simple'
const NATURAL_EARTH_VERSION = '5.1.2'
const NATURAL_EARTH_URL = 'https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_10m_populated_places_simple.geojson'
const NATURAL_EARTH_NO_MATCH_REASON = 'natural_earth_v5_1_2_no_matching_reference_feature'

const expectedKeys = [...new Set(TWITCH_REVIEWED_LOCATION_RECORDS.flatMap((record) => {
  if (record.entityKind !== 'person') return []
  return record.evidences.flatMap((evidence) => {
    if (evidence.status !== 'accepted') return []
    if (!TARGET_CLAIM_KINDS.has(evidence.claimKind)) return []
    if (!evidence.countryCode || !evidence.city) return []
    const key = cityAggregateKeyFromParts({
      countryCode: evidence.countryCode,
      region: evidence.region,
      city: evidence.city,
    })
    return key ? [key] : []
  })
}))].sort()

assert.equal(expectedKeys.length, 9, 'canonical reviewed City aggregate count changed; review registry coverage')

const registryKeys = TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.map((entry) => entry.key)
assert.equal(new Set(registryKeys).size, registryKeys.length, 'City reference geometry registry keys must be unique')
assert.deepEqual([...registryKeys].sort(), expectedKeys, 'City reference geometry registry must exactly cover accepted City aggregates')

let reviewedReferencePointCount = 0
let noGeometryCount = 0

for (const entry of TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY) {
  assert.equal(
    entry.key,
    cityAggregateKeyFromParts({
      countryCode: entry.countryCode,
      region: entry.region,
      city: entry.city,
    }),
    `registry key must use canonical City aggregate normalization: ${entry.key}`,
  )
  assert.ok(
    ['no_geometry', 'review_needed', 'reference_point'].includes(entry.geometryStatus),
    `unknown geometry status: ${entry.geometryStatus}`,
  )

  if (EMPTY_GEOMETRY_STATUSES.has(entry.geometryStatus)) {
    if (entry.geometryStatus === 'no_geometry') noGeometryCount += 1
    assert.equal(entry.referenceRole, null, `${entry.geometryStatus} entry must not claim a reference role: ${entry.key}`)
    assert.equal(entry.referencePoint, null, `${entry.geometryStatus} entry must not expose a reference point: ${entry.key}`)
    assert.equal(entry.source, null, `${entry.geometryStatus} entry must not claim a source: ${entry.key}`)
    assert.equal(typeof entry.reason, 'string')
    assert.ok(entry.reason.length > 0)
    continue
  }

  reviewedReferencePointCount += 1
  assert.equal(entry.referenceRole, 'city_aggregate_reference', `reference point must be City aggregate reference only: ${entry.key}`)
  assert.equal(entry.reason, null, `reviewed reference point must not carry a no-geometry reason: ${entry.key}`)

  const { latitude, longitude } = entry.referencePoint ?? {}
  assert.ok(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90, `invalid reference latitude: ${entry.key}`)
  assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180, `invalid reference longitude: ${entry.key}`)

  assert.equal(entry.source?.provider, 'Natural Earth', `unexpected reference source provider: ${entry.key}`)
  assert.equal(entry.source?.dataset, NATURAL_EARTH_DATASET, `unexpected Natural Earth dataset: ${entry.key}`)
  assert.equal(entry.source?.version, NATURAL_EARTH_VERSION, `unexpected Natural Earth version: ${entry.key}`)
  assert.equal(entry.source?.url, NATURAL_EARTH_URL, `unexpected Natural Earth source URL: ${entry.key}`)
  assert.equal(entry.source?.geometrySemantics, 'populated_place_point', `reference source must remain point semantics: ${entry.key}`)
  assert.equal(entry.source?.sourceCountryCode, entry.countryCode, `reference source country mismatch: ${entry.key}`)
  assert.equal(typeof entry.source?.sourceCountryName, 'string')
  assert.ok(entry.source.sourceCountryName.length > 0)
  assert.equal(typeof entry.source?.sourceRegionName, 'string')
  assert.ok(entry.source.sourceRegionName.length > 0)
  assert.equal(typeof entry.source?.featureName, 'string')
  assert.ok(entry.source.featureName.length > 0)
  assert.equal(typeof entry.source?.featureClass, 'string')
  assert.ok(entry.source.featureClass.length > 0)
  assert.ok(Number.isSafeInteger(entry.source?.featureId) && entry.source.featureId > 0, `invalid Natural Earth feature id: ${entry.key}`)
  assert.equal(entry.source?.countryNameMatchCount, 1, `Natural Earth country/name match must be unique: ${entry.key}`)

  if (entry.region) {
    assert.equal(entry.source?.matchBasis, 'country_city_region', `region-bearing City must use country/city/region match basis: ${entry.key}`)
    assert.equal(entry.source?.canonicalRegionMatch, true, `reference source region must match canonical region: ${entry.key}`)
    assert.equal(entry.source.sourceRegionName, entry.region, `reference source region mismatch: ${entry.key}`)
  } else {
    assert.equal(entry.source?.matchBasis, 'country_city_unique', `regionless City must use unique country/city match basis: ${entry.key}`)
    assert.equal(entry.source?.canonicalRegionMatch, null, `regionless City must not claim a canonical region match: ${entry.key}`)
  }
}

assert.equal(reviewedReferencePointCount, 8, 'completed City reference review must contain eight reviewed Natural Earth points')
assert.equal(noGeometryCount, 1, 'completed City reference review must leave exactly one no-geometry City')

const santCugat = TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.find((entry) => entry.city === 'Sant Cugat del Valles')
assert.equal(santCugat?.geometryStatus, 'no_geometry')
assert.equal(santCugat?.reason, NATURAL_EARTH_NO_MATCH_REASON)

console.log(`Verified Twitch City reference geometry registry: ${expectedKeys.length} City aggregates, ${reviewedReferencePointCount} reviewed reference points, ${noGeometryCount} no-geometry City.`)
