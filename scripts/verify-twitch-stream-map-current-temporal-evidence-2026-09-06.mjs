import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const live = JSON.parse(readFileSync('docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-06.json', 'utf8'))
const review = JSON.parse(readFileSync('docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-09-06.json', 'utf8'))
const acceptedClasses = [
  'self_controlled_current_statement',
  'official_affiliated_current_statement',
  'attributable_editorial_current_statement',
  'reviewed_direct_self_statement_transcript',
]

assert.equal(live.schemaVersion, 'viewloom-twitch-stream-map-current-review-queue-live-result-v0.1')
assert.equal(live.provider, 'twitch')
assert.equal(live.layer, 'current')
assert.equal(live.source.workflowRunId, 34036562297)
assert.equal(live.source.artifactId, 9990351519)
assert.equal(live.source.mainSha, '08d15987f4d804bf4c8f851d5b24c4d0a76e8c12')
assert.equal(live.source.probePackageMergeSha, 'e86e231167a1bf0909ed71a9701f3d641f59eed2')
assert.equal(live.source.artifactSha256, '6d7fab8b736af22b07f242476bc04f314527db72eaa945b928cb6556f510cadb')
assert.equal(live.population.requestedSize, 300)
assert.equal(live.population.sampleSize, 300)
assert.equal(live.population.coveredPages, 3)
assert.equal(live.population.stableIdentity, 'twitchUserId')
assert.equal(live.population.stableIdentityUnique, true)
assert.equal(live.population.duplicateStableIdentityRowsDropped, 0)
assert.deepEqual(live.apiRequests, { token: 1, streams: 3, users: 0 })
assert.equal(live.summary.reviewableCandidates, 10)
assert.equal(live.summary.rejectedFutureTravel, 2)
assert.equal(live.summary.invalidIdentity, 0)
assert.equal(live.summary.conflictingCandidates, 2)
assert.equal(live.reviewQueue.length, 10)
assert.equal(live.rejected.length, 2)
assert.equal(live.invalid.length, 0)
assert.equal(live.persistence.d1Writes, 0)
assert.equal(live.persistence.productionDeployment, false)
assert.equal(live.persistence.rawTextArtifactAllowed, false)
assert.equal(live.decision.acceptanceAuthorized, false)
assert.equal(live.decision.publicCurrentPlacementAuthorized, false)
assert.equal(live.decision.baseMutationAuthorized, false)

assert.equal(review.schemaVersion, 'viewloom-twitch-stream-map-current-temporal-evidence-acquisition-result-v0.2')
assert.equal(review.sourceLiveResult, 'docs/audits/twitch-stream-map-current-review-queue-live-result-2026-09-06.json')
assert.equal(review.sourceProbe.workflowRunId, live.source.workflowRunId)
assert.equal(review.sourceProbe.artifactId, live.source.artifactId)
assert.equal(review.sourceProbe.mainSha, live.source.mainSha)
assert.equal(review.sourceProbe.observedAt, live.observedAt)
assert.equal(review.supersedesSourceProbeRunId, 34015266644)
assert.deepEqual(review.acceptedEvidenceClassesReviewed, acceptedClasses)
assert.equal(review.taskAccounting.livePopulationMeasured, 300)
assert.equal(review.taskAccounting.reviewableCandidateCount, 10)
assert.equal(review.taskAccounting.identityClassPairsReviewed, 40)
assert.equal(review.taskAccounting.plannedAcceptedEvidenceClasses, 4)
assert.equal(review.taskAccounting.providerRequests, 0)
assert.equal(review.taskAccounting.externalSearchRequestCountMechanicallyAudited, false)
assert.equal(review.taskAccounting.supplementalVerificationQueriesPerformed, true)
assert.equal(review.taskAccounting.lookupBudgetComplianceClaimed, false)
assert.equal(review.summary.identitiesReviewed, 10)
assert.equal(review.summary.freshQualifyingEvidence, 0)
assert.equal(review.summary.promotedToReview, 0)
assert.equal(review.summary.acceptedCurrentPlacement, 0)
assert.equal(review.summary.noFreshQualifyingEvidence, 10)
assert.equal(review.summary.conflictUnmapped, 0)
assert.equal(review.summary.sameCountryGranularityMachineConflictsClosed, 2)
assert.equal(review.summary.publicCurrentPlacementAuthorized, false)
assert.equal(review.summary.baseMutationAuthorized, false)
assert.equal(review.entries.length, 10)

const liveById = new Map(live.reviewQueue.map((entry) => [entry.twitchUserId, entry]))
const reviewById = new Map(review.entries.map((entry) => [entry.twitchUserId, entry]))
assert.equal(liveById.size, 10)
assert.equal(reviewById.size, 10)
assert.deepEqual([...reviewById.keys()].sort(), [...liveById.keys()].sort())
for (const [id, entry] of reviewById) {
  const candidate = liveById.get(id)
  assert.ok(candidate, `review entry missing live candidate: ${id}`)
  assert.equal(entry.userLogin, candidate.userLogin)
  assert.deepEqual(entry.candidatePlaces, candidate.candidatePlaces)
  assert.deepEqual(entry.reviewedEvidenceClasses, acceptedClasses)
  assert.deepEqual(entry.freshQualifyingEvidence, [])
  assert.equal(entry.outcome, 'no_fresh_qualifying_temporal_evidence')
  assert.ok(Array.isArray(entry.notableRejectedOrExpiredReferences) && entry.notableRejectedOrExpiredReferences.length > 0)
}

const machineConflicts = live.reviewQueue.filter((entry) => entry.reviewState === 'candidate_conflict_review_required')
assert.equal(machineConflicts.length, 2)
assert.deepEqual(machineConflicts.map((entry) => entry.twitchUserId).sort(), ['169185650', '76020989'])
for (const entry of machineConflicts) {
  assert.deepEqual([...new Set(entry.candidatePlaces.map((place) => place.countryCode))], ['JP'])
  assert.equal(reviewById.get(entry.twitchUserId)?.outcome, 'no_fresh_qualifying_temporal_evidence')
}
assert.equal(review.entries.some((entry) => entry.outcome === 'conflict_unmapped'), false)

const reviewedAt = Date.parse(review.reviewedAt)
const freshnessCutoff = Date.parse(review.freshnessCutoff)
assert.ok(Number.isFinite(reviewedAt))
assert.ok(Number.isFinite(freshnessCutoff))
assert.equal(reviewedAt - freshnessCutoff, 24 * 60 * 60 * 1000)
for (const candidate of live.reviewQueue) {
  assert.ok(reviewedAt >= Date.parse(candidate.observedAt))
  assert.ok(reviewedAt < Date.parse(candidate.reviewWindowExpiresAt))
  assert.equal(candidate.acceptedCurrentPlacement, false)
  assert.equal(candidate.candidateSourceCanAutoAccept, false)
  assert.equal(candidate.rawTextRetained, false)
}
for (const rejected of live.rejected) {
  assert.equal(rejected.reason, 'future_or_planned_travel_wording')
  assert.equal(rejected.acceptedCurrentPlacement, false)
  assert.equal(rejected.rawTextRetained, false)
}

for (const key of ['candidateTitleOrTagCanQualify','profileBaseContextCanQualifyWithoutCurrentTimeMeaning','plannedFutureTravelCanQualify','searchSnippetCanQualify','automaticAcceptanceAuthorized','publicCurrentPlacementAuthorized','baseMutationAuthorized','rawTitleTagLanguageRetained','preciseLocationAllowed','twitchKickAggregationAuthorized','canonicalMutationApplied','productionDeployment']) {
  assert.equal(review.boundary[key], false, `${key} must remain false`)
}
assert.equal(review.boundary.d1Writes, 0)

const forbiddenExactKeys = new Set(['title', 'tags', 'language', 'latitude', 'longitude', 'coordinates', 'gps', 'address'])
function assertNoForbiddenKeys(value, path = '$') {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`))
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenExactKeys.has(key), false, `forbidden key ${key} at ${path}`)
    assertNoForbiddenKeys(child, `${path}.${key}`)
  }
}
assertNoForbiddenKeys(live)
assertNoForbiddenKeys(review)

console.log(JSON.stringify({
  ok: true,
  sourceProbeRun: live.source.workflowRunId,
  sampleSize: live.population.sampleSize,
  reviewableCandidates: live.summary.reviewableCandidates,
  futureTravelRejected: live.summary.rejectedFutureTravel,
  machineConflicts: live.summary.conflictingCandidates,
  identitiesReviewed: review.summary.identitiesReviewed,
  identityClassPairsReviewed: review.taskAccounting.identityClassPairsReviewed,
  freshQualifyingEvidence: review.summary.freshQualifyingEvidence,
  acceptedCurrentPlacement: review.summary.acceptedCurrentPlacement,
  noFreshQualifyingEvidence: review.summary.noFreshQualifyingEvidence,
  sameCountryGranularityMachineConflictsClosed: review.summary.sameCountryGranularityMachineConflictsClosed,
  publicCurrentPlacementAuthorized: review.summary.publicCurrentPlacementAuthorized,
}, null, 2))
