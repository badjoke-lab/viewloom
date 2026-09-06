import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const audit = json('docs/audits/twitch-stream-map-current-r2-preauthorization-readiness-2026-09-06.json')
const collectorSource = read('workers/collector-twitch/src/index-category.ts')
const readinessSource = read('scripts/verify-twitch-stream-map-current-public-readiness.mjs')
const streamMapCoreSource = read('apps/web/functions/api/twitch-stream-map-core.mjs')
const geographyUiSource = read('apps/web/src/features/twitch-stream-map/geography-ui-bootstrap.ts')

assert.equal(audit.schemaVersion, 'viewloom-twitch-current-r2-preauthorization-readiness-v0.1')
assert.equal(audit.status, 'blocked_pending_explicit_production_collector_authorization')
assert.equal(audit.provider, 'twitch')
assert.equal(audit.layer, 'current')
assert.equal(audit.auditedMain, '418a2472468258c844d0a5b6e9173d98d4bf2b12')

assert.deepEqual(audit.blockers, [
  'production_twitch_snapshot_does_not_retain_user_id',
  'public_current_geography_mode_not_wired',
  'no_fresh_reviewed_current_evidence',
])
assert.equal(audit.currentState.collectorStableIdentityPersistence, 'blocked')
assert.equal(audit.currentState.streamMapStableIdentityConsumption, 'ready_in_code')
assert.equal(audit.currentState.currentResponseCore, 'ready_in_code')
assert.equal(audit.currentState.publicCurrentGeographyMode, 'blocked')
assert.equal(audit.currentState.freshReviewedCurrentEvidence, 'blocked')
assert.equal(audit.currentState.publicCurrentActivationReady, false)
assert.equal(audit.currentState.publicCurrentControl, 'disabled')

assert.equal(audit.evidence.sourceProbeRun, 33961161696)
assert.equal(audit.evidence.liveSampleSize, 300)
assert.equal(audit.evidence.reviewableCandidates, 8)
assert.equal(audit.evidence.identitiesReviewed, 8)
assert.equal(audit.evidence.freshQualifyingEvidence, 0)
assert.equal(audit.evidence.acceptedCurrentPlacement, 0)
assert.equal(audit.evidence.noFreshQualifyingEvidence, 6)
assert.equal(audit.evidence.conflictUnmapped, 2)

const r2 = audit.r2CandidateBoundary
assert.equal(r2.sourceField, 'helix_streams.user_id')
assert.equal(r2.storedField, 'twitchUserId')
assert.equal(r2.requiredFutureCollectorChanges.length, 4)
assert.equal(r2.additionalTwitchApiRequests, 0)
assert.equal(r2.helixUsersRequestAllowed, false)
assert.equal(r2.loginFallbackAllowed, false)
assert.equal(r2.d1SchemaChangeRequired, false)
assert.equal(r2.bindingChangeRequired, false)
assert.equal(r2.cadenceChangeRequired, false)
assert.equal(r2.retentionChangeRequired, false)
assert.equal(r2.backfillRequired, false)

// Pre-authorization means the production collector must still be unchanged.
for (const forbiddenBeforeAuthorization of [
  'twitchUserId: string | null',
  'user_id?: string',
  "const twitchUserId = String(stream.user_id ?? '').trim()",
  'twitchUserId: twitchUserId || null',
]) {
  assert.equal(
    collectorSource.includes(forbiddenBeforeAuthorization),
    false,
    `R2 collector mutation appeared before explicit authorization: ${forbiddenBeforeAuthorization}`,
  )
}
assert.equal(collectorSource.includes('/helix/users'), false, 'R2 must not introduce a /helix/users request')
assert.equal(streamMapCoreSource.includes('value.twitchUserId ?? value.user_id'), true, 'Current stable-ID consumption must remain ready in code')
assert.equal(geographyUiSource.includes('Current / IRL remains unavailable'), true, 'Current / IRL must remain unavailable')
assert.equal(geographyUiSource.includes('disabled aria-disabled="true" title="Current / IRL requires fresh current-location evidence"'), true, 'Current / IRL control must remain disabled')

for (const fragment of [
  "assert.equal(collectorRetainsStableId, false",
  "'production_twitch_snapshot_does_not_retain_user_id'",
  "'public_current_geography_mode_not_wired'",
  "'no_fresh_reviewed_current_evidence'",
  'assert.equal(freshReviewedEvidence, 0',
  'assert.equal(acceptedCurrentPlacement, 0',
]) {
  assert.equal(readinessSource.includes(fragment), true, `Current readiness v0.3 boundary missing: ${fragment}`)
}

assert.equal(audit.staleDraft.pullRequest, 1107)
assert.equal(audit.staleDraft.headSha, '77990aca065bfbc20aae3ddfac3b22841253bba2')
assert.equal(audit.staleDraft.mergeAsIsAllowed, false)
for (const [key, value] of Object.entries(audit.invariants)) {
  if (key === 'stableIdentity') assert.equal(value, 'twitchUserId')
  else assert.equal(value, false, `${key} must remain false`)
}
for (const value of Object.values(audit.authorization)) assert.equal(value, false)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: audit.schemaVersion,
  r2Status: audit.status,
  blockers: audit.blockers,
  evidence: audit.evidence,
  staleDraft: audit.staleDraft,
  collectorMutationAuthorized: audit.authorization.r2ProductionCollectorChangeAuthorized,
}, null, 2))
