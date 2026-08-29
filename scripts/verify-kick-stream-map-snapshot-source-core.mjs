import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { extractKickStreamMapSnapshotItems } from '../apps/web/functions/api/kick-stream-map-snapshot-source-core.mjs'
import { buildKickCountryResponse } from './kick-stream-map-country-response-core.mjs'

const fixture = JSON.parse(
  readFileSync('docs/audits/kick-stream-map-snapshot-source-fixture-v0.1.json', 'utf8'),
)
assert.equal(
  fixture.schemaVersion,
  'viewloom-kick-stream-map-snapshot-source-fixture-v0.1',
)

const snapshotItems = extractKickStreamMapSnapshotItems(JSON.stringify(fixture.snapshotPayload))
assert.equal(snapshotItems.length, 7)

const mappedSource = snapshotItems.find((row) => row.slug === 'mapped')
assert.equal(mappedSource?.broadcaster_user_id, '42')
assert.equal(mappedSource?.viewer_count, 100)

const missingSource = snapshotItems.find((row) => row.slug === 'missing-id')
assert.equal(
  missingSource?.broadcaster_user_id,
  null,
  'nested channel IDs must never be promoted to stable Kick identity',
)

const sourceSerialized = JSON.stringify(snapshotItems)
for (const rawField of [
  'title',
  'channel_description',
  'latitude',
  'longitude',
  'categoryProviderId',
  'categoryName',
]) {
  assert.equal(
    sourceSerialized.includes(`\"${rawField}\"`),
    false,
    `snapshot source adapter must discard ${rawField}`,
  )
}

assert.deepEqual(extractKickStreamMapSnapshotItems('{not-json'), [])
assert.deepEqual(extractKickStreamMapSnapshotItems(''), [])

const dataShape = extractKickStreamMapSnapshotItems(JSON.stringify({
  data: [{ slug: 'data-shape', viewer_count: '1,234', broadcaster_user_id: ' 501 ' }],
}))
assert.deepEqual(dataShape, [{
  slug: 'data-shape',
  displayName: 'data-shape',
  viewer_count: 1234,
  url: 'https://kick.com/data-shape',
  broadcaster_user_id: '501',
}])

const response = buildKickCountryResponse({
  snapshotItems,
  reviewedEvidence: fixture.reviewedEvidence,
  observedAt: fixture.observedAt,
})
const expected = fixture.expected

assert.equal(response.version, 'viewloom-kick-stream-map-country-response-v0.1')
assert.equal(response.provider, 'kick')
assert.equal(response.geographyMode, 'country')
assert.equal(response.publicActivationAuthorized, false)
assert.equal(response.observedAt, fixture.observedAt)

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

const mapped = response.mappedStreams.find((row) => row.slug === 'mapped')
assert.equal(mapped?.identity.stableKickUserId, '42')
assert.equal(mapped?.identity.slugIsStableIdentity, false)
assert.equal(mapped?.geography.countryCode, 'US')

const missing = response.unmappedStreams.find((row) => row.slug === 'missing-id')
assert.equal(missing?.geography.reason, 'stable_identity_unavailable')
assert.equal(missing?.identity.stableIdAvailable, false)

const twitchOnly = response.unmappedStreams.find((row) => row.slug === 'twitch-only')
assert.equal(twitchOnly?.geography.reason, 'no_reviewed_kick_evidence')

const ambiguous = response.unmappedStreams.filter((row) => row.slug === 'ambiguous')
assert.equal(ambiguous.length, 2)
assert.ok(ambiguous.every((row) => row.geography.reason === 'ambiguous_channel_join'))

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

const sourceModule = readFileSync(
  'apps/web/functions/api/kick-stream-map-snapshot-source-core.mjs',
  'utf8',
)
assert.equal(sourceModule.includes('export const onRequest'), false, 'source core must not become a public route')
assert.equal(sourceModule.includes('D1Database'), false, 'source core must remain production-independent')
assert.ok(sourceModule.includes('row.broadcaster_user_id'), 'stable identity must come from broadcaster_user_id')
assert.equal(
  sourceModule.includes('channel?.broadcaster_user_id'),
  false,
  'nested channel identity must not be silently accepted',
)

console.log(JSON.stringify({
  ok: true,
  provider: response.provider,
  sourceItems: snapshotItems.length,
  mappedStreams: response.coverage.mappedStreams,
  unmappedStreams: response.coverage.unmappedStreams,
  conflictStreams: response.coverage.conflictStreams,
  excludedStreams: response.coverage.excludedStreams,
  stableIdentity: response.semantics.stableIdentity,
  slugIsStableIdentity: response.semantics.slugIsStableIdentity,
  twitchEvidenceReuseAllowed: response.semantics.twitchEvidenceReuseAllowed,
  publicActivationAuthorized: response.publicActivationAuthorized,
  runtimeRouteAdded: false,
}, null, 2))
