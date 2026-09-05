import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const collectorSource = readFileSync('workers/collector-twitch/src/index-category.ts', 'utf8')
const streamMapCoreSource = readFileSync('apps/web/functions/api/twitch-stream-map-core.mjs', 'utf8')
const publicRouteSource = readFileSync('apps/web/functions/api/twitch-stream-map.ts', 'utf8')
const geographyUiSource = readFileSync('apps/web/src/features/twitch-stream-map/geography-ui-bootstrap.ts', 'utf8')
const responseCoreSource = readFileSync('scripts/twitch-stream-map-current-response-core.mjs', 'utf8')
const liveResult = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-05.json', 'utf8'),
)
const acquisitionResult = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-09-05.json', 'utf8'),
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

const sourceProbeRun = Number(acquisitionResult?.sourceProbe?.workflowRunId ?? 0)
const liveProbeRun = Number(liveResult?.source?.workflowRunId ?? 0)
const liveSampleSize = Number(liveResult?.population?.sampleSize ?? 0)
const liveReviewableCandidates = Number(liveResult?.summary?.reviewableCandidates ?? 0)
const liveConflictingCandidates = Number(liveResult?.summary?.conflictingCandidates ?? 0)
const reviewedCandidates = Number(acquisitionResult?.summary?.identitiesReviewed ?? 0)
const noFreshQualifyingEvidence = Number(acquisitionResult?.summary?.noFreshQualifyingEvidence ?? 0)
const conflictUnmapped = Number(acquisitionResult?.summary?.conflictUnmapped ?? 0)
const freshReviewedEvidence = Number(acquisitionResult?.summary?.freshQualifyingEvidence ?? 0)
const acceptedCurrentPlacement = Number(acquisitionResult?.summary?.acceptedCurrentPlacement ?? 0)
const acquisitionEntries = Array.isArray(acquisitionResult?.entries) ? acquisitionResult.entries : []

const blockers = [
  !collectorRetainsStableId ? 'production_twitch_snapshot_does_not_retain_user_id' : null,
  !publicCurrentRouteWired ? 'public_current_geography_mode_not_wired' : null,
  freshReviewedEvidence <= 0 ? 'no_fresh_reviewed_current_evidence' : null,
].filter(Boolean)

const readiness = {
  schemaVersion: 'viewloom-twitch-stream-map-current-public-readiness-v0.3',
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
    sourceProbeRun,
    sourceObservedAt: acquisitionResult?.sourceProbe?.observedAt ?? null,
    liveSampleSize,
    liveReviewableCandidates,
    liveConflictingCandidates,
    reviewedCandidates,
    noFreshQualifyingEvidence,
    conflictUnmapped,
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

assert.equal(liveResult?.schemaVersion, 'viewloom-twitch-stream-map-current-review-queue-live-result-v0.1')
assert.equal(acquisitionResult?.schemaVersion, 'viewloom-twitch-stream-map-current-temporal-evidence-acquisition-result-v0.2')
assert.equal(sourceProbeRun, 33961161696, 'Current evidence review must point at the September 5 live probe')
assert.equal(liveProbeRun, sourceProbeRun, 'Current live result and evidence review must use the same probe run')
assert.equal(liveSampleSize, 300)
assert.equal(liveReviewableCandidates, 8)
assert.equal(liveConflictingCandidates, 3)
assert.equal(liveResult?.persistence?.d1Writes, 0)
assert.equal(liveResult?.persistence?.productionDeployment, false)
assert.equal(liveResult?.persistence?.rawTextArtifactAllowed, false)
assert.equal(liveResult?.decision?.acceptanceAuthorized, false)
assert.equal(liveResult?.decision?.publicCurrentPlacementAuthorized, false)
assert.equal(reviewedCandidates, 8)
assert.equal(acquisitionEntries.length, reviewedCandidates)
assert.equal(noFreshQualifyingEvidence, 6)
assert.equal(conflictUnmapped, 2)
assert.equal(acquisitionEntries.filter((entry) => entry?.outcome === 'conflict_unmapped').length, conflictUnmapped)
assert.equal(acquisitionEntries.filter((entry) => entry?.outcome === 'no_fresh_qualifying_temporal_evidence').length, noFreshQualifyingEvidence)
assert.equal(acquisitionEntries.some((entry) => Array.isArray(entry?.freshQualifyingEvidence) && entry.freshQualifyingEvidence.length > 0), false)
assert.equal(acquisitionResult?.boundary?.automaticAcceptanceAuthorized, false)
assert.equal(acquisitionResult?.boundary?.publicCurrentPlacementAuthorized, false)
assert.equal(acquisitionResult?.boundary?.baseMutationAuthorized, false)
assert.equal(acquisitionResult?.boundary?.productionDeployment, false)
assert.equal(acquisitionResult?.boundary?.d1Writes, 0)

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
