import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const collectorSource = readFileSync('workers/collector-twitch/src/index-category.ts', 'utf8')
const streamMapCoreSource = readFileSync('apps/web/functions/api/twitch-stream-map-core.mjs', 'utf8')
const publicRouteSource = readFileSync('apps/web/functions/api/twitch-stream-map.ts', 'utf8')
const geographyUiSource = readFileSync('apps/web/src/features/twitch-stream-map/geography-ui-bootstrap.ts', 'utf8')
const responseCoreSource = readFileSync('scripts/twitch-stream-map-current-response-core.mjs', 'utf8')
const acquisitionResult = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-08-29.json', 'utf8'),
)

const collectorRetainsStableId = collectorSource.includes('twitchUserId: string | null') &&
  collectorSource.includes('user_id?: string') &&
  collectorSource.includes("const twitchUserId = String(stream.user_id ?? '').trim()") &&
  collectorSource.includes('twitchUserId: twitchUserId || null')

const streamMapCoreConsumesStableId = streamMapCoreSource.includes('value.twitchUserId ?? value.user_id') &&
  streamMapCoreSource.includes('stableIdentityStreams') &&
  streamMapCoreSource.includes('missingStableIdentityStreams')

const currentResponseCoreReady = responseCoreSource.includes("stableIdentity: 'twitchUserId'") &&
  responseCoreSource.includes('stableTwitchUserIdRequired: true') &&
  responseCoreSource.includes("reason: 'stable_identity_unavailable'") &&
  responseCoreSource.includes('publicActivationAuthorized: false')

const publicCurrentRouteWired = /normalized\s*===\s*['"]current['"]/.test(publicRouteSource) ||
  /GeographyMode[^\n]*['"]current['"]/.test(publicRouteSource)

const currentUiRemainsDisabled = geographyUiSource.includes('Current / IRL remains unavailable') &&
  geographyUiSource.includes('disabled aria-disabled="true" title="Current / IRL requires fresh current-location evidence"')

const freshReviewedEvidence = Number(acquisitionResult?.summary?.freshQualifyingEvidence ?? 0)
const acceptedCurrentPlacement = Number(acquisitionResult?.summary?.acceptedCurrentPlacement ?? 0)

const blockers = [
  !collectorRetainsStableId ? 'production_twitch_snapshot_does_not_retain_user_id' : null,
  !publicCurrentRouteWired ? 'public_current_geography_mode_not_wired' : null,
  freshReviewedEvidence <= 0 ? 'no_fresh_reviewed_current_evidence' : null,
].filter(Boolean)

const readiness = {
  schemaVersion: 'viewloom-twitch-stream-map-current-public-readiness-v0.2',
  provider: 'twitch',
  layer: 'current',
  publicCurrentActivationReady: blockers.length === 0,
  blockers,
  stages: {
    collectorStableIdentityPersistence: collectorRetainsStableId ? 'ready_in_code' : 'blocked',
    streamMapStableIdentityConsumption: streamMapCoreConsumesStableId ? 'ready_in_code' : 'blocked',
    currentResponseCore: currentResponseCoreReady ? 'ready_in_code' : 'blocked',
    publicCurrentGeographyMode: publicCurrentRouteWired ? 'ready_in_code' : 'blocked',
    freshReviewedCurrentEvidence: freshReviewedEvidence > 0 ? 'available' : 'blocked',
  },
  evidence: {
    freshQualifyingEvidence: freshReviewedEvidence,
    acceptedCurrentPlacement,
  },
  invariant: {
    stableIdentity: 'twitchUserId',
    loginIsStableIdentity: false,
    currentUiRemainsDisabled,
    candidateOnlyPlacementAllowed: false,
    titleOrTagCanPlaceCurrent: false,
    baseMutationAuthorized: false,
    currentFromBaseInferenceAllowed: false,
    providerAggregationAllowed: false,
    preciseAddressPublished: false,
    coordinatesPublished: false,
    publicActivationAuthorized: false,
  },
}

assert.equal(collectorRetainsStableId, false, 'production Twitch collector stable-ID persistence changed; re-audit before Current activation')
assert.equal(streamMapCoreConsumesStableId, true, 'Stream Map core must remain able to consume stable Twitch IDs when present')
assert.equal(currentResponseCoreReady, true, 'Current response core stable-ID/fail-closed contract must remain present')
assert.equal(publicCurrentRouteWired, false, 'public Current geography mode unexpectedly became wired; explicit activation review is required')
assert.equal(currentUiRemainsDisabled, true, 'Current / IRL public control must remain disabled while readiness is blocked')
assert.equal(freshReviewedEvidence, 0, 'fresh reviewed Current evidence changed; re-audit readiness rather than silently activating')
assert.equal(acceptedCurrentPlacement, 0, 'accepted Current placement changed; re-audit readiness rather than silently activating')
assert.equal(readiness.publicCurrentActivationReady, false)
assert.deepEqual(readiness.blockers, [
  'production_twitch_snapshot_does_not_retain_user_id',
  'public_current_geography_mode_not_wired',
  'no_fresh_reviewed_current_evidence',
])
assert.equal(readiness.stages.collectorStableIdentityPersistence, 'blocked')
assert.equal(readiness.stages.streamMapStableIdentityConsumption, 'ready_in_code')
assert.equal(readiness.stages.currentResponseCore, 'ready_in_code')
assert.equal(readiness.stages.publicCurrentGeographyMode, 'blocked')
assert.equal(readiness.stages.freshReviewedCurrentEvidence, 'blocked')
assert.equal(readiness.invariant.loginIsStableIdentity, false)
assert.equal(readiness.invariant.candidateOnlyPlacementAllowed, false)
assert.equal(readiness.invariant.titleOrTagCanPlaceCurrent, false)
assert.equal(readiness.invariant.baseMutationAuthorized, false)
assert.equal(readiness.invariant.currentFromBaseInferenceAllowed, false)
assert.equal(readiness.invariant.providerAggregationAllowed, false)
assert.equal(readiness.invariant.preciseAddressPublished, false)
assert.equal(readiness.invariant.coordinatesPublished, false)
assert.equal(readiness.invariant.publicActivationAuthorized, false)

console.log(JSON.stringify(readiness, null, 2))
