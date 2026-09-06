import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { deriveKickCountryLiveStates } from './kick-stream-map-country-live-join-core.mjs'

const collectorSource = readFileSync('workers/collector-kick/src/official-livestreams.ts', 'utf8')
const snapshotSource = readFileSync('apps/web/functions/api/kick-stream-map-snapshot-source-core.mjs', 'utf8')
const publicAdapterSource = readFileSync('apps/web/functions/api/kick-stream-map-public-adapter-core.mjs', 'utf8')
const publicRouteSource = readFileSync('apps/web/functions/api/kick-stream-map.ts', 'utf8')
const productionRuntimeSource = readFileSync('apps/web/functions/api/kick-stream-map-country-runtime-core.mjs', 'utf8')
const productionRuntimeDataSource = readFileSync('apps/web/functions/api/kick-stream-map-reviewed-country-runtime-data.mjs', 'utf8')
const reviewedEvidenceBridgeSource = readFileSync('scripts/kick-stream-map-reviewed-country-evidence-core.mjs', 'utf8')
const responseCoreSource = readFileSync('scripts/kick-stream-map-country-response-core.mjs', 'utf8')
const runtimeStagingSource = readFileSync('scripts/kick-stream-map-country-runtime-staging-core.mjs', 'utf8')
const reviewedEvidenceVerifierSource = readFileSync('scripts/verify-kick-stream-map-reviewed-country-evidence-core.mjs', 'utf8')
const k3VerifierSource = readFileSync('scripts/verify-kick-stream-map-k3-runtime-connection.mjs', 'utf8')

const collectorRetainsStableId = collectorSource.includes('broadcaster_user_id: string | null') &&
  collectorSource.includes('asIdentifier(raw.broadcaster_user_id)') &&
  collectorSource.includes('broadcaster_user_id: broadcasterUserId || null')
const snapshotSourceAcceptsStableId = snapshotSource.includes('row.broadcaster_user_id') &&
  snapshotSource.includes('broadcaster_user_id: stableKickUserId || null')
const publicAdapterAcceptsStableId = publicAdapterSource.includes('row?.broadcaster_user_id') &&
  publicAdapterSource.includes("stableKey: 'broadcaster_user_id'") &&
  publicAdapterSource.includes('slugIsStableIdentity: false') &&
  publicAdapterSource.includes('publicActivationAuthorized = false') &&
  publicAdapterSource.includes('publicActivationAuthorized: activationAuthorized')
const publicRouteUsesCountryRuntime = publicRouteSource.includes("from './kick-stream-map-country-runtime-core.mjs'") &&
  publicRouteSource.includes('extractKickStreamMapSnapshotItems(latest.payload_json)') &&
  publicRouteSource.includes('buildKickStreamMapCountryRuntime({')
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
const productionReviewedEvidenceRuntimeConnected = publicRouteUsesCountryRuntime &&
  productionRuntimeSource.includes('KICK_REVIEWED_COUNTRY_RUNTIME_DATA') &&
  productionRuntimeSource.includes('REVIEWED_EVIDENCE_BY_STABLE_ID.get(stableKickUserId)') &&
  productionRuntimeSource.includes("reason: 'reviewed_country_accepted'") &&
  productionRuntimeSource.includes('stableIdentityPublished: false') &&
  productionRuntimeSource.includes('publicActivationAuthorized = false') &&
  productionRuntimeSource.includes("...(!activationAuthorized ? ['public_country_activation_not_authorized'] : [])") &&
  productionRuntimeDataSource.includes('viewloom-kick-reviewed-country-runtime-data-v0.1') &&
  k3VerifierSource.includes('assert.deepEqual(KICK_REVIEWED_COUNTRY_RUNTIME_DATA, expected)')
const publicActivationAuthorized = publicRouteSource.includes('const K4_PUBLIC_ACTIVATION_AUTHORIZED = true') &&
  (publicRouteSource.match(/publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED/g)?.length ?? 0) >= 3
const publicKickMapPresent = existsSync('apps/web/kick/map/index.html') && existsSync('apps/web/src/features/kick-stream-map/public-entry.ts')

assert.equal(collectorRetainsStableId, true, 'K2 must retain official broadcaster_user_id directly from Livestreams')
assert.equal(snapshotSourceAcceptsStableId, true, 'Kick public snapshot source must remain capable of consuming broadcaster_user_id')
assert.equal(publicAdapterAcceptsStableId, true, 'Kick fallback public adapter must remain stable-ID capable without slug fallback')
assert.equal(reviewedEvidenceBridgeReady, true, 'reviewed Kick Country evidence bridge must remain ready in code')
assert.equal(responseCoreReady, true, 'Kick Country response core must remain ready in code')
assert.equal(reviewedEvidenceRuntimeStaged, true, 'reviewed Kick Country evidence must remain connected to the internal runtime staging path')
assert.equal(productionReviewedEvidenceRuntimeConnected, true, 'K3 must remain connected while K4 activates the public route')
assert.equal(publicActivationAuthorized, true, 'K4 must be explicitly authorized by the public API route')
assert.equal(publicKickMapPresent, true, 'K4 must create the public /kick/map/ page and public entry')

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
  !reviewedEvidenceRuntimeStaged ? 'reviewed_kick_country_evidence_runtime_not_staged' : null,
  !productionReviewedEvidenceRuntimeConnected ? 'reviewed_kick_country_evidence_public_runtime_not_connected' : null,
  !publicActivationAuthorized ? 'public_country_activation_not_authorized' : null,
  !publicKickMapPresent ? 'public_kick_map_page_missing' : null,
].filter(Boolean)

const readiness = {
  schemaVersion: 'viewloom-kick-stream-map-country-public-readiness-v0.6',
  provider: 'kick',
  publicCountryActivationReady: blockers.length === 0,
  blockers,
  stages: {
    collectorStableIdentityPersistence: collectorRetainsStableId ? 'ready_in_code' : 'blocked',
    publicSnapshotStableIdentityConsumption: snapshotSourceAcceptsStableId ? 'ready_in_code' : 'blocked',
    publicAdapterStableIdentityConsumption: publicAdapterAcceptsStableId ? 'ready_in_code' : 'blocked',
    reviewedCountryEvidenceBridge: reviewedEvidenceBridgeReady ? 'ready_in_code' : 'blocked',
    countryResponseCore: responseCoreReady ? 'ready_in_code' : 'blocked',
    reviewedCountryEvidenceRuntimeStaging: reviewedEvidenceRuntimeStaged ? 'ready_in_code' : 'blocked',
    productionReviewedCountryRuntime: productionReviewedEvidenceRuntimeConnected ? 'active' : 'not_activated',
    publicCountryActivation: publicActivationAuthorized ? 'authorized' : 'blocked',
    publicKickMapPage: publicKickMapPresent ? 'present' : 'absent',
  },
  invariant: {
    stableIdentity: 'broadcaster_user_id',
    slugIsStableIdentity: false,
    stableIdentityPublished: false,
    twitchEvidenceReuseAllowed: false,
    automaticGeographyPromotionAllowed: false,
    providerAggregationAllowed: false,
    cityInferenceAllowed: false,
    currentLocationPromotionAllowed: false,
  },
}

assert.equal(readiness.publicCountryActivationReady, true)
assert.deepEqual(readiness.blockers, [])
assert.equal(readiness.stages.collectorStableIdentityPersistence, 'ready_in_code')
assert.equal(readiness.stages.publicSnapshotStableIdentityConsumption, 'ready_in_code')
assert.equal(readiness.stages.publicAdapterStableIdentityConsumption, 'ready_in_code')
assert.equal(readiness.stages.reviewedCountryEvidenceBridge, 'ready_in_code')
assert.equal(readiness.stages.countryResponseCore, 'ready_in_code')
assert.equal(readiness.stages.reviewedCountryEvidenceRuntimeStaging, 'ready_in_code')
assert.equal(readiness.stages.productionReviewedCountryRuntime, 'active')
assert.equal(readiness.stages.publicCountryActivation, 'authorized')
assert.equal(readiness.stages.publicKickMapPage, 'present')

console.log(JSON.stringify(readiness, null, 2))
