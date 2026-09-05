import assert from 'node:assert/strict'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../functions/api/twitch-stream-map-reviewed-evidence.mjs'
import { cityAggregateKeyFromParts } from '../src/features/twitch-stream-map/city-aggregate-core.mjs'
import { TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY } from '../src/features/twitch-stream-map/city-reference-geometry-registry.mjs'

const TARGET_CLAIM_KINDS = new Set(['home_base', 'declared_location'])

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
  assert.ok(['no_geometry', 'reference_point'].includes(entry.geometryStatus), `unknown geometry status: ${entry.geometryStatus}`)

  if (entry.geometryStatus === 'no_geometry') {
    assert.equal(entry.referencePoint, null, `no_geometry entry must not expose a reference point: ${entry.key}`)
    assert.equal(entry.source, null, `no_geometry entry must not claim a source: ${entry.key}`)
    assert.equal(typeof entry.reason, 'string')
    assert.ok(entry.reason.length > 0)
    continue
  }

  const { latitude, longitude } = entry.referencePoint ?? {}
  assert.ok(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90, `invalid reference latitude: ${entry.key}`)
  assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180, `invalid reference longitude: ${entry.key}`)
  assert.equal(typeof entry.source?.dataset, 'string')
  assert.equal(typeof entry.source?.version, 'string')
  assert.equal(typeof entry.source?.url, 'string')
  assert.equal(typeof entry.source?.featureName, 'string')
}

console.log(`Verified Twitch City reference geometry registry: ${expectedKeys.length} reviewed City aggregates.`)
