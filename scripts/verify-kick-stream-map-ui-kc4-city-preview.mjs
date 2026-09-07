import assert from 'node:assert/strict'

import { buildKickCityPreviewModel } from '../apps/web/src/features/kick-stream-map/city-preview-model.mjs'
import { kickMapKc4Scenarios } from '../apps/web/src/features/kick-stream-map/kc4-fixtures.mjs'

assert.equal(kickMapKc4Scenarios.length, 2, 'KC4 must keep the ready + stable-blocked deterministic fixture pair')

const readyFixture = kickMapKc4Scenarios.find((row) => row.id === 'city-ready-mixed')
const blockedFixture = kickMapKc4Scenarios.find((row) => row.id === 'city-stable-blocked')
assert.ok(readyFixture, 'missing city-ready-mixed fixture')
assert.ok(blockedFixture, 'missing city-stable-blocked fixture')

const ready = buildKickCityPreviewModel(readyFixture.payload, { allowGeography: true })
assert.equal(ready.provider, 'kick')
assert.equal(ready.geographyMode, 'city')
assert.equal(ready.publicCityActivationAuthorized, false, 'KC4 must not authorize KC5')
assert.equal(ready.contractSafe, true)
assert.equal(ready.runtimeReady, true)
assert.equal(ready.previewAllowed, true)
assert.equal(ready.accounting.reconciliationPasses, true)
assert.equal(ready.accounting.observedStreams, 7)
assert.equal(ready.accounting.stableIdentityStreams, 7)
assert.equal(ready.accounting.mappedStreams, 3)
assert.equal(ready.accounting.unmappedStreams, 2)
assert.equal(ready.accounting.excludedStreams, 1)
assert.equal(ready.accounting.conflictStreams, 1)
assert.equal(ready.cityRows.length, 2)
assert.equal(ready.referenceRows.length, 1)
assert.equal(ready.listOnlyRows.length, 1)
assert.equal(ready.mappedStreams.length, 3)
assert.deepEqual(
  ready.referenceRows.map((row) => ({ city: row.city, state: row.referenceGeometry.state, semantics: row.referenceGeometry.semantics })),
  [{ city: 'Los Angeles', state: 'reference_point', semantics: 'city_aggregate_reference' }],
)
assert.deepEqual(
  ready.listOnlyRows.map((row) => ({ city: row.city, state: row.referenceGeometry.state, point: row.referenceGeometry.referencePoint })),
  [{ city: 'Sant Cugat del Valles', state: 'no_geometry', point: null }],
)
assert.deepEqual(ready.referenceRows[0].referenceGeometry.referencePoint, {
  longitude: -118.231986,
  latitude: 34.049219,
})
assert.equal(ready.semantics.creatorCoordinatesUsed, false)
assert.equal(ready.semantics.twitchEvidenceReused, false)
assert.equal(ready.semantics.countryInferredToCity, false)
assert.equal(ready.semantics.currentLocationPromoted, false)
assert.equal(ready.semantics.aggregateReferenceOnly, true)

const blocked = buildKickCityPreviewModel(blockedFixture.payload, { allowGeography: true })
assert.equal(blocked.publicCityActivationAuthorized, false)
assert.equal(blocked.contractSafe, true)
assert.equal(blocked.runtimeReady, false)
assert.equal(blocked.previewAllowed, false)
assert.equal(blocked.cityRows.length, 0, 'stable-ID failure must suppress City rows even if response contains them')
assert.equal(blocked.referenceRows.length, 0)
assert.equal(blocked.listOnlyRows.length, 0)
assert.equal(blocked.mappedStreams.length, 0)
assert.equal(blocked.accounting.mappedStreams, 0)
assert.ok(blocked.blockers.includes('production_livestream_snapshot_missing_broadcaster_user_id'))

const hidden = buildKickCityPreviewModel(readyFixture.payload, { allowGeography: false })
assert.equal(hidden.previewAllowed, false)
assert.equal(hidden.cityRows.length, 0)
assert.equal(hidden.mappedStreams.length, 0)

for (const scenario of kickMapKc4Scenarios) {
  assert.equal(scenario.payload.provider, 'kick')
  assert.equal(scenario.payload.geographyMode, 'city')
  assert.equal(scenario.payload.publicCityActivationAuthorized, false)
  assert.equal(scenario.payload.semantics.countryInferenceToCityAllowed, false)
  assert.equal(scenario.payload.semantics.currentLocationUsedForBaseCity, false)
  assert.equal(scenario.payload.semantics.temporaryLocationUsedForBaseCity, false)
  assert.equal(scenario.payload.semantics.creatorCoordinatesAllowed, false)
  assert.equal(scenario.payload.semantics.reviewedAggregateReferenceOnly, true)
  assert.equal(scenario.payload.semantics.noGeometryListOnly, true)
  const forbiddenKeys = collectKeys(scenario.payload).filter((key) => key === 'stableKickUserId' || key === 'broadcaster_user_id' || key === 'currentLocation' || key === 'temporaryLocation' || key === 'address' || key === 'coordinates')
  assert.deepEqual(forbiddenKeys, [], `${scenario.id}: public KC4 fixture leaked forbidden keys`)
}

console.log(JSON.stringify({
  ok: true,
  fixtures: kickMapKc4Scenarios.length,
  ready: {
    observedStreams: ready.accounting.observedStreams,
    mappedStreams: ready.accounting.mappedStreams,
    cityRows: ready.cityRows.length,
    referenceRows: ready.referenceRows.length,
    listOnlyRows: ready.listOnlyRows.length,
  },
  blocked: {
    runtimeReady: blocked.runtimeReady,
    previewAllowed: blocked.previewAllowed,
    cityRows: blocked.cityRows.length,
  },
  publicCityActivationAuthorized: ready.publicCityActivationAuthorized,
  creatorCoordinatesUsed: ready.semantics.creatorCoordinatesUsed,
}, null, 2))

function collectKeys(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, output)
    return output
  }
  if (!value || typeof value !== 'object') return output
  for (const [key, child] of Object.entries(value)) {
    output.push(key)
    collectKeys(child, output)
  }
  return output
}
