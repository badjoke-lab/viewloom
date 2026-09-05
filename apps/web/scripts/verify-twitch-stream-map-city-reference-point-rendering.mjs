import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  cityReferencePointAggregates,
  cityReferencePointForAggregate,
} from '../src/features/twitch-stream-map/city-reference-point-core.mjs'
import { TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY } from '../src/features/twitch-stream-map/city-reference-geometry-registry.mjs'

const aggregates = TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.map((entry) => ({
  key: entry.key,
  countryCode: entry.countryCode,
  region: entry.region,
  city: entry.city,
  label: [entry.city, entry.region, entry.countryCode].filter(Boolean).join(' · '),
  streams: [{}],
  viewers: 1,
  // Payload coordinates must never be a City rendering source.
  longitude: 0,
  latitude: 0,
  lon: 0,
  lat: 0,
}))

const renderable = cityReferencePointAggregates(aggregates)
assert.equal(renderable.length, 8, 'exactly the eight reviewed reference_point registry entries should render')

for (const { aggregate, referencePoint } of renderable) {
  const registry = TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.find((entry) => entry.key === aggregate.key)
  assert.ok(registry)
  assert.equal(registry.geometryStatus, 'reference_point')
  assert.equal(referencePoint.referenceRole, 'city_aggregate_reference')
  assert.equal(referencePoint.longitude, registry.referencePoint.longitude)
  assert.equal(referencePoint.latitude, registry.referencePoint.latitude)
  assert.notDeepEqual([referencePoint.longitude, referencePoint.latitude], [aggregate.longitude, aggregate.latitude])
}

const listOnly = TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.find((entry) => entry.geometryStatus === 'no_geometry')
assert.ok(listOnly, 'one reviewed no_geometry City must remain explicit')
assert.equal(listOnly.city, 'Sant Cugat del Valles')
assert.equal(cityReferencePointForAggregate({ ...listOnly, longitude: 2.0, latitude: 41.0 }), null, 'no_geometry cannot be upgraded from payload coordinates')
assert.equal(cityReferencePointForAggregate({ key: 'ZZ|__none__|invented', longitude: 10, latitude: 10 }), null, 'unknown City cannot render from payload coordinates')

const cityGuard = await readFile(new URL('../src/features/twitch-stream-map/city-render-guard.ts', import.meta.url), 'utf8')
assert.match(cityGuard, /cityReferencePointAggregates\(selection\.aggregates\)/)
assert.match(cityGuard, /referencePoint\.longitude/)
assert.match(cityGuard, /referencePoint\.latitude/)
for (const forbidden of ['aggregate.lon', 'aggregate.lat', 'aggregate.longitude', 'aggregate.latitude', 'place.lon', 'place.lat', 'place.longitude', 'place.latitude']) {
  assert.equal(cityGuard.includes(forbidden), false, `City renderer must not use payload coordinate field: ${forbidden}`)
}

console.log(JSON.stringify({
  registryEntries: TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.length,
  referencePointEntries: renderable.length,
  listOnlyEntries: TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.length - renderable.length,
  listOnlyCity: listOnly.city,
  coordinateSource: 'reviewed_registry_only',
}))
