import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveKickCountryLiveStates } from './kick-stream-map-country-live-join-core.mjs'

const collectorSource = readFileSync('workers/collector-kick/src/official-livestreams.ts', 'utf8')
const snapshotSource = readFileSync('apps/web/functions/api/kick-stream-map-snapshot-source-core.mjs', 'utf8')
const publicAdapterSource = readFileSync('apps/web/functions/api/kick-stream-map-public-adapter-core.mjs', 'utf8')
const publicRouteSource = readFileSync('apps/web/functions/api/kick-stream-map.ts', 'utf8')
const reviewedEvidenceBridgeSource = readFileSync('scripts/kick-stream-map-reviewed-country-evidence-core.mjs', 'utf8')
const responseCoreSource = readFileSync('scripts/kick-stream-map-country-response-core.mjs', 'utf8')
const runtimeStagingSource = readFileSync('scripts/kick-stream-map-country-runtime-staging-core.mjs', 'utf8')
const reviewedEvidenceVerifierSource = readFileSync('scripts/verify-kick-stream-map-reviewed-country-evidence-core.mjs', 'utf8')

// Production remains blocked until the collector actually retains the official
// broadcaster_user_id. The staged public source/parser and adapter are already
// capable of consuming that field when it eventually appears; slug is never a
// stable identity fallback.
const collectorRetainsStableId = collectorSource.includes('broadcaster_user_id')
const snapshotSourceAcceptsStableId = snapshotSource.includes('row.broadcaster_user_id') &&
  snapshotSource.includes('broadcaster_user_id: stableKickUserId || null')
const publicAdapterAcceptsStableId = publicAdapterSource.includes('row?.broadcaster_user_id') &&
  publicAdapterSource.includes("stableKey: 'broadcaster_user_id'") &&
  publicAdapterSource.includes('slugIsStableIdentity: false')
const publicRouteUsesStagedAdapter = publicRouteSource.includes("from './kick-stream-map-snapshot-source-core.mjs'") &&
  publicRouteSource.includes("from './kick-stream-map-public-adapter-core.mjs'") &&
  publicRouteSource.includes('extractKickStreamMapSnapshotItems(latest.payload_json)') &&
  publicRouteSource.includes('buildKickStreamMapPublicAdapter({')
const reviewedEvidenceBridgeReady = reviewedEvidenceBridgeSource.includes('buildKickReviewedCountryEvidence') &&
  reviewedEvidenceBridgeSource.includes("stableKickUserId: id") &&
  reviewedEvidenceBridgeSource.includes("provider: 'kick'")
const responseCoreReady = responseCoreSource.includes('buildKickCountryResponse') &&
  responseCoreSource.includes("stableIdentity: 'broadcaster_user_id'") &&
  responseCoreSource.includes('publicActivationAuthorized: false')
const reviewedEvidenceRuntimeStaged = runtimeStagingSource.includes("from './kick-stream-map-reviewed-country-evidence-core.mjs'") &&
  runtimeStagingSource.includes("from './kick-stream-map-country-response-core.mjs'") &&
  runtimeStagingSource.includes('buildKickReviewedCountryEvidence(reviewResults)') &&
  runtimeStagingSource.includes('buildKickCountryResponse({') &&
  runtimeStagingSource.includes('publicActivationAuthorized: false') &&
  reviewedEvidenceVerifierSource.includes("from './kick-stream-map-country-runtime-staging-core.mjs'") &&
  reviewedEvidenceVerifierSource.includes('buildKickCountryRuntimeStaging({')
const publicReviewedEvidenceRuntimeActivated = publicRouteSource.includes('buildKickReviewedCountryEvidence') ||
  publicRouteSource.includes('buildKickCountryResponse') ||
  publicRouteSource.includes('kick-stream-map-country-runtime-staging-core.mjs')
const publicActivationAuthorized = !publicAdapterSource.includes('publicActivationAuthorized: false') ||
  !responseCoreSource.includes('publicActivationAuthorized: false')

assert.equal(collectorRetainsStableId, false, 'production Kick collector stable-ID state changed; re-audit before public activation')
assert.equal(snapshotSourceAcceptsStableId, true, 'Kick public snapshot source must remain capable of consuming broadcaster_user_id')
assert.equal(publicAdapterAcceptsStableId, true, 'Kick public adapter must remain stable-ID capable without slug fallback')
assert.equal(publicRouteUsesStagedAdapter, true, 'Kick public route must remain wired to the staged snapshot source and public adapter')
assert.equal(reviewedEvidenceBridgeReady, true, 'reviewed Kick Country evidence bridge must remain ready in code')
assert.equal(responseCoreReady, true, 'Kick Country response core must remain ready in code')
assert.equal(reviewedEvidenceRuntimeStaged, true, 'reviewed Kick Country evidence must remain connected to the internal runtime staging path')
assert.equal(publicReviewedEvidenceRuntimeActivated, false, 'reviewed Kick Country evidence unexpectedly reached the public route; re-audit activation boundary')
assert.equal(publicActivationAuthorized, false, 'Kick Country public activation must remain unauthorized')

const slugOnly = deriveKickCountryLiveStates({
  liveRows: [{ provider: 'kick', channel: { slug: 'example' } }],
  channelRows: [{ provider: 'kick', slug: 'example' }],
  reviewedEvidence: [{ provider: 'kick', stableKickUserId: '42', outcome: 'accepted', placement: { state: 'mapped', countryCode: 'US' } }],
})
assert.deepEqual(slugOnly.map(({ state, reason, stableKickUserId }) => ({ state, reason, stableKickUserId })), [
  { state: 'unmapped', reason: 'stable_identity_unavailable', stableKickUserId: null },
])

const stableJoin = deriveKickCountryLiveStates({
  liveRows: [{ provider: 'kick', channel: { slug: 'example' } }],
  channelRows: [{ provider: 'kick', slug: 'example', broadcaster_user_id: 42 }],
  reviewedEvidence: [{ provider: 'kick', stableKickUserId: '42', outcome: 'accepted', placement: { state: 'mapped', countryCode: 'US' } }],
})
assert.deepEqual(stableJoin.map(({ state, reason, stableKickUserId, placement }) => ({ state, reason, stableKickUserId, placement })), [
  { state: 'mapped', reason: 'reviewed_country_accepted', stableKickUserId: '42', placement: { countryCode: 'US' } },
])

const blockers = [
  !collectorRetainsStableId ? 'production_livestream_snapshot_does_not_retain_broadcaster_user_id' : null,
  !reviewedEvidenceRuntimeStaged ? 'reviewed_kick_country_evidence_runtime_not_connected' : null,
  !publicActivationAuthorized ? 'public_country_activation_not_authorized' : null,
].filter(Boolean)

const readiness = {
  schemaVersion: 'viewloom-kick-stream-map-country-public-readiness-v0.3',
  provider: 'kick',
  publicCountryActivationReady: blockers.length === 0,
  blockers,
  stages: {
    collectorStableIdentityPersistence: collectorRetainsStableId ? 'ready_in_code' : 'blocked',
    publicSnapshotStableIdentityConsumption: snapshotSourceAcceptsStableId ? 'ready_in_code' : 'blocked',
    publicAdapterStableIdentityConsumption: publicAdapterAcceptsStableId && publicRouteUsesStagedAdapter ? 'ready_in_code' : 'blocked',
    reviewedCountryEvidenceBridge: reviewedEvidenceBridgeReady ? 'ready_in_code' : 'blocked',
    countryResponseCore: responseCoreReady ? 'ready_in_code' : 'blocked',
    reviewedCountryEvidenceRuntimeStaging: reviewedEvidenceRuntimeStaged ? 'ready_in_code' : 'blocked',
    publicReviewedEvidenceRuntime: publicReviewedEvidenceRuntimeActivated ? 'active' : 'not_activated',
    publicCountryActivation: publicActivationAuthorized ? 'authorized' : 'blocked',
  },
  invariant: {
    stableIdentity: 'broadcaster_user_id',
    slugIsStableIdentity: false,
    twitchEvidenceReuseAllowed: false,
    automaticGeographyPromotionAllowed: false,
    providerAggregationAllowed: false,
  },
}

assert.equal(readiness.publicCountryActivationReady, false)
assert.deepEqual(readiness.blockers, [
  'production_livestream_snapshot_does_not_retain_broadcaster_user_id',
  'public_country_activation_not_authorized',
])
assert.equal(readiness.stages.collectorStableIdentityPersistence, 'blocked')
assert.equal(readiness.stages.publicSnapshotStableIdentityConsumption, 'ready_in_code')
assert.equal(readiness.stages.publicAdapterStableIdentityConsumption, 'ready_in_code')
assert.equal(readiness.stages.reviewedCountryEvidenceBridge, 'ready_in_code')
assert.equal(readiness.stages.countryResponseCore, 'ready_in_code')
assert.equal(readiness.stages.reviewedCountryEvidenceRuntimeStaging, 'ready_in_code')
assert.equal(readiness.stages.publicReviewedEvidenceRuntime, 'not_activated')
assert.equal(readiness.stages.publicCountryActivation, 'blocked')

console.log(JSON.stringify(readiness, null, 2))
