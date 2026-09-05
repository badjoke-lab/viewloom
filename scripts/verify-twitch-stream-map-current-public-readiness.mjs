import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const collectorSource = readFileSync('workers/collector-twitch/src/index-category.ts', 'utf8')
const publicRouteSource = readFileSync('apps/web/functions/api/twitch-stream-map.ts', 'utf8')
const responseCoreSource = readFileSync('scripts/twitch-stream-map-current-response-core.mjs', 'utf8')
const acquisitionResult = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-08-29.json', 'utf8'),
)

const collectorRetainsStableId = collectorSource.includes('twitchUserId: string | null') &&
  collectorSource.includes("const twitchUserId = String(stream.user_id ?? '').trim()") &&
  collectorSource.includes('twitchUserId: twitchUserId || null')
const publicRouteConsumesStableId = publicRouteSource.includes('twitchUserId') || publicRouteSource.includes('user_id')
const responseCoreRequiresStableId = responseCoreSource.includes("stableIdentity: 'twitchUserId'") &&
  responseCoreSource.includes('stableTwitchUserIdRequired: true') &&
  responseCoreSource.includes("reason: 'stable_identity_unavailable'")
const freshReviewedEvidence = Number(acquisitionResult?.summary?.freshQualifyingEvidence ?? 0)

const blockers = [
  !collectorRetainsStableId ? 'production_twitch_snapshot_does_not_retain_user_id' : null,
  !publicRouteConsumesStableId ? 'public_twitch_map_route_does_not_consume_stable_user_id' : null,
  freshReviewedEvidence <= 0 ? 'no_fresh_reviewed_current_evidence' : null,
].filter(Boolean)

const readiness = {
  schemaVersion: 'viewloom-twitch-stream-map-current-public-readiness-v0.1',
  provider: 'twitch',
  layer: 'current',
  publicCurrentActivationReady: blockers.length === 0,
  blockers,
  stages: {
    collectorStableIdentityPersistence: collectorRetainsStableId ? 'ready_in_code' : 'blocked',
    publicStableIdentityExposure: publicRouteConsumesStableId ? 'ready_in_code' : 'blocked',
    currentResponseCore: responseCoreRequiresStableId ? 'ready_in_code' : 'blocked',
    freshReviewedCurrentEvidence: freshReviewedEvidence > 0 ? 'available' : 'blocked',
  },
  evidence: {
    freshQualifyingEvidence: freshReviewedEvidence,
    acceptedCurrentPlacement: Number(acquisitionResult?.summary?.acceptedCurrentPlacement ?? 0),
  },
  invariant: {
    stableIdentity: 'twitchUserId',
    loginIsStableIdentity: false,
    candidateOnlyPlacementAllowed: false,
    baseMutationAuthorized: false,
    providerAggregationAllowed: false,
    publicActivationAuthorized: false,
  },
}

assert.equal(responseCoreRequiresStableId, true, 'Current response core stable-ID contract must remain present')
assert.equal(readiness.publicCurrentActivationReady, false, 'Draft persistence must not make public Current ready by itself')
assert.equal(readiness.stages.collectorStableIdentityPersistence, 'ready_in_code')
assert.equal(readiness.stages.publicStableIdentityExposure, 'blocked')
assert.equal(readiness.stages.currentResponseCore, 'ready_in_code')
assert.equal(readiness.stages.freshReviewedCurrentEvidence, 'blocked')
assert.deepEqual(readiness.blockers, [
  'public_twitch_map_route_does_not_consume_stable_user_id',
  'no_fresh_reviewed_current_evidence',
])
assert.equal(readiness.invariant.loginIsStableIdentity, false)
assert.equal(readiness.invariant.candidateOnlyPlacementAllowed, false)
assert.equal(readiness.invariant.baseMutationAuthorized, false)
assert.equal(readiness.invariant.providerAggregationAllowed, false)
assert.equal(readiness.invariant.publicActivationAuthorized, false)

console.log(JSON.stringify(readiness, null, 2))
