import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { buildTwitchCurrentResponse } from './twitch-stream-map-current-response-core.mjs'

const fixture = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-response-fixture-v0.1.json', 'utf8'),
)
assert.equal(
  fixture.schemaVersion,
  'viewloom-twitch-stream-map-current-response-fixture-v0.1',
)

const snapshotItems = fixture.snapshotItems.map((row) => ({
  ...row,
  title: 'raw title must not reach Current response',
  tags: ['Japan'],
  language: 'en',
  latitude: 1.23,
  longitude: 4.56,
}))

const response = buildTwitchCurrentResponse({
  snapshotItems,
  reviewedEvidence: fixture.reviewedEvidence,
  evaluatedAt: fixture.evaluatedAt,
})

assert.equal(response.version, 'viewloom-twitch-stream-map-current-response-core-v0.1')
assert.equal(response.provider, 'twitch')
assert.equal(response.layer, 'current')
assert.equal(response.publicActivationAuthorized, false)
assert.equal(response.evaluatedAt, fixture.evaluatedAt)

for (const key of [
  'observedStreams',
  'observedViewers',
  'mappedStreams',
  'mappedViewers',
  'unmappedStreams',
  'unmappedViewers',
  'conflictStreams',
  'conflictViewers',
  'streamCoverage',
  'viewerCoverage',
]) {
  assert.equal(response.coverage[key], fixture.expected[key], `coverage mismatch: ${key}`)
}
assert.equal(response.coverage.reconciliation.passes, true)

const fresh = response.mappedStreams.find((row) => row.userLogin === 'fresh')
assert.equal(fresh?.twitchUserId, '1001')
assert.equal(fresh?.geography.countryCode, 'JP')
assert.equal(fresh?.geography.city, 'Tokyo')
assert.deepEqual(fresh?.geography.evidenceClasses, ['self_controlled_current_statement'])

const samePlace = response.mappedStreams.find((row) => row.userLogin === 'same-place')
assert.equal(samePlace?.geography.countryCode, 'GB')
assert.equal(samePlace?.geography.city, 'London')
assert.equal(samePlace?.geography.evidenceCount, 2)
assert.deepEqual(samePlace?.geography.claimKinds, ['current_location', 'temporary_location'])
assert.equal(samePlace?.geography.expiresAt, '2026-08-29T14:00:00.000Z')

const reasons = Object.fromEntries(response.unmappedStreams.map((row) => [row.userLogin, row.geography.reason]))
assert.equal(reasons.expired, 'no_fresh_current_location')
assert.equal(reasons.candidate, 'no_qualifying_current_evidence')
assert.equal(reasons['missing-id'], 'stable_identity_unavailable')
assert.equal(reasons.none, 'no_reviewed_current_evidence')
assert.equal(reasons.future, 'current_location_not_started')

assert.equal(response.conflictStreams.length, 1)
assert.equal(response.conflictStreams[0]?.userLogin, 'conflict')
assert.equal(response.conflictStreams[0]?.geography.reason, 'conflicting_current_location')
assert.equal(response.conflictStreams[0]?.geography.freshPlaceCount, 2)

assert.equal(response.semantics.stableIdentity, 'twitchUserId')
assert.equal(response.semantics.stableTwitchUserIdRequired, true)
for (const key of [
  'loginIsStableIdentity',
  'titleOrTagCanPlaceCurrent',
  'candidateOnlyPlacementAllowed',
  'baseMutationAuthorized',
  'currentFromBaseInferenceAllowed',
  'providerAggregationAllowed',
  'preciseAddressPublished',
  'coordinatesPublished',
  'expiredEvidenceCanPlaceCurrent',
]) {
  assert.equal(response.semantics[key], false, `${key} must remain false`)
}

const serialized = JSON.stringify(response)
for (const forbidden of [
  'raw title must not reach Current response',
  '"tags"',
  '"language"',
  '"latitude"',
  '"longitude"',
  'sourceUrl',
  'example.com',
]) {
  assert.equal(serialized.includes(forbidden), false, `response leaked forbidden field/value: ${forbidden}`)
}

const loginOnly = buildTwitchCurrentResponse({
  snapshotItems: [{ userLogin: 'fresh', viewers: 1 }],
  reviewedEvidence: fixture.reviewedEvidence,
  evaluatedAt: fixture.evaluatedAt,
})
assert.equal(loginOnly.mappedStreams.length, 0)
assert.equal(loginOnly.unmappedStreams[0]?.geography.reason, 'stable_identity_unavailable')

console.log(JSON.stringify({
  ok: true,
  provider: response.provider,
  layer: response.layer,
  observedStreams: response.coverage.observedStreams,
  mappedStreams: response.coverage.mappedStreams,
  unmappedStreams: response.coverage.unmappedStreams,
  conflictStreams: response.coverage.conflictStreams,
  stableIdentity: response.semantics.stableIdentity,
  loginIsStableIdentity: response.semantics.loginIsStableIdentity,
  publicActivationAuthorized: response.publicActivationAuthorized,
  routeAdded: false,
}, null, 2))
