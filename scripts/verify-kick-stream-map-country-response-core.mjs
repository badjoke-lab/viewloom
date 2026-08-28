import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildKickCountryResponse } from './kick-stream-map-country-response-core.mjs'

const fixture = JSON.parse(readFileSync('docs/audits/kick-stream-map-country-response-fixture-v0.1.json', 'utf8'))
assert.equal(fixture.schemaVersion, 'viewloom-kick-stream-map-country-response-fixture-v0.1')

const response = buildKickCountryResponse(fixture)
const expected = fixture.expected

assert.equal(response.version, 'viewloom-kick-stream-map-country-response-v0.1')
assert.equal(response.provider, 'kick')
assert.equal(response.geographyMode, 'country')
assert.equal(response.observedAt, fixture.observedAt)
assert.equal(response.publicActivationAuthorized, false)

for (const key of [
  'observedStreams',
  'observedViewers',
  'mappedStreams',
  'mappedViewers',
  'unmappedStreams',
  'unmappedViewers',
  'conflictStreams',
  'conflictViewers',
  'excludedStreams',
  'excludedViewers',
  'streamCoverage',
  'viewerCoverage',
]) {
  assert.equal(response.coverage[key], expected[key], `coverage mismatch: ${key}`)
}
assert.equal(response.coverage.reconciliation.passes, true)
assert.equal(response.coverage.reconciliation.selectedPopulation, 7)
assert.equal(response.coverage.reconciliation.reconciledPopulation, 7)

const mapped = response.mappedStreams[0]
assert.equal(mapped.slug, 'mapped')
assert.equal(mapped.identity.stableKickUserId, '42')
assert.equal(mapped.identity.stableIdAvailable, true)
assert.equal(mapped.identity.slugIsStableIdentity, false)
assert.equal(mapped.geography.countryCode, 'US')

const missing = response.unmappedStreams.find((row) => row.slug === 'missing-id')
assert.equal(missing?.geography.reason, 'stable_identity_unavailable')
assert.equal(missing?.identity.stableIdAvailable, false)

const ambiguous = response.unmappedStreams.filter((row) => row.slug === 'ambiguous')
assert.equal(ambiguous.length, 2)
assert.ok(ambiguous.every((row) => row.geography.reason === 'ambiguous_channel_join'))

const twitchOnly = response.unmappedStreams.find((row) => row.slug === 'twitch-only')
assert.equal(twitchOnly?.geography.reason, 'no_reviewed_kick_evidence')

assert.equal(response.conflictStreams[0]?.geography.reason, 'reviewed_country_conflict')
assert.equal(response.excludedStreams[0]?.geography.reason, 'reviewed_nonperson_exclusion')

for (const key of [
  'slugIsStableIdentity',
  'twitchEvidenceReuseAllowed',
  'providerAggregationAllowed',
  'automaticGeographyPromotionAllowed',
  'cityInferenceFromCountryAllowed',
  'currentLocationUsedForBasePlacement',
  'preciseAddressPublished',
  'coordinatesPublished',
]) {
  assert.equal(response.semantics[key], false, `${key} must remain false`)
}

const serialized = JSON.stringify(response)
for (const rawField of ['title', 'channel_description', 'custom_tags', 'latitude', 'longitude']) {
  assert.equal(serialized.includes(`\"${rawField}\"`), false, `response must not expose raw/precise field ${rawField}`)
}

console.log(JSON.stringify({
  ok: true,
  provider: response.provider,
  geographyMode: response.geographyMode,
  observedStreams: response.coverage.observedStreams,
  mappedStreams: response.coverage.mappedStreams,
  streamCoverage: response.coverage.streamCoverage,
  viewerCoverage: response.coverage.viewerCoverage,
  reconciliationPasses: response.coverage.reconciliation.passes,
  stableIdentity: response.semantics.stableIdentity,
  twitchEvidenceReuseAllowed: response.semantics.twitchEvidenceReuseAllowed,
  publicActivationAuthorized: response.publicActivationAuthorized
}, null, 2))
