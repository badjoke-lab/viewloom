import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildCurrentLocationReviewQueue,
  validateCurrentLocationReviewResult,
} from '../tools/twitch-stream-map-current-location/reviewability.mjs'

const fixture = JSON.parse(readFileSync('docs/audits/twitch-stream-map-current-reviewability-fixture-v0.1.json', 'utf8'))
const contract = readFileSync('docs/product/stream-map-current-location-reviewability-contract-v0.1.md', 'utf8')

assert.equal(fixture.schemaVersion, 'viewloom-twitch-stream-map-current-reviewability-fixture-v0.1')
const queue = buildCurrentLocationReviewQueue(fixture.streams, { observedAt: fixture.observedAt })

for (const [key, value] of Object.entries(fixture.expected)) {
  if (key === 'queueLogins') continue
  assert.equal(queue.summary[key], value, `summary mismatch: ${key}`)
}
assert.deepEqual(queue.reviewQueue.map((row) => row.userLogin), fixture.expected.queueLogins)
assert.equal(queue.boundary.titleOrTagCanAutoAccept, false)
assert.equal(queue.boundary.publicCurrentPlacementAuthorized, false)
assert.equal(queue.boundary.baseMutationAuthorized, false)
assert.equal(queue.boundary.rawTextRetained, false)
assert.equal(queue.boundary.languageUsedForPlacement, false)
assert.equal(queue.rejected[0]?.userLogin, 'future_trip')
assert.equal(queue.rejected[0]?.reason, 'future_or_planned_travel_wording')
assert.equal(queue.reviewQueue.find((row) => row.userLogin === 'candidate_conflict')?.reviewState, 'candidate_conflict_review_required')

const serializedQueue = JSON.stringify(queue)
for (const rawValue of fixture.streams.flatMap((row) => [row.title, ...(row.tags ?? []), row.language]).filter(Boolean)) {
  assert.equal(serializedQueue.includes(rawValue), false, `raw input leaked into queue: ${rawValue}`)
}
for (const rawField of ['title', 'tags', 'language']) {
  assert.equal(serializedQueue.includes(`\"${rawField}\"`), false, `raw field leaked into queue: ${rawField}`)
}

const tokyoQueue = queue.reviewQueue.find((row) => row.userLogin === 'tokyo_live')
const accepted = validateCurrentLocationReviewResult(tokyoQueue, fixture.acceptedCurrentResult)
assert.equal(accepted.ok, true)
assert.equal(accepted.accepted, true)
assert.equal(accepted.claimKind, 'current_location')
assert.equal(accepted.placement.countryCode, 'JP')
assert.equal(accepted.placement.city, 'Tokyo')
assert.equal(accepted.titleOrTagAcceptedAsEvidence, false)
assert.equal(accepted.baseMutationAuthorized, false)

const candidateSourceRejected = validateCurrentLocationReviewResult(tokyoQueue, {
  ...fixture.acceptedCurrentResult,
  qualifyingEvidence: {
    ...fixture.acceptedCurrentResult.qualifyingEvidence,
    sourceClass: 'stream_title',
  },
})
assert.equal(candidateSourceRejected.ok, false)
assert.equal(candidateSourceRejected.reason, 'candidate_source_not_qualifying_evidence')

const mismatchedCountryRejected = validateCurrentLocationReviewResult(tokyoQueue, {
  ...fixture.acceptedCurrentResult,
  qualifyingEvidence: {
    ...fixture.acceptedCurrentResult.qualifyingEvidence,
    countryCode: 'US',
    countryName: 'United States',
    city: null,
  },
})
assert.equal(mismatchedCountryRejected.ok, false)
assert.equal(mismatchedCountryRejected.reason, 'qualifying_evidence_does_not_match_candidate_place')

const temporaryTooLong = validateCurrentLocationReviewResult(
  queue.reviewQueue.find((row) => row.userLogin === 'japan_tag'),
  {
    outcome: 'accepted_temporary',
    reviewedAt: '2026-08-28T10:15:00.000Z',
    qualifyingEvidence: {
      sourceClass: 'reviewed_direct_self_statement',
      sourceUrl: 'https://example.com/reviewed-direct-statement',
      countryCode: 'JP',
      observedAt: '2026-08-28T10:10:00.000Z',
      expiresAt: '2026-09-12T10:10:01.000Z'
    },
  },
)
assert.equal(temporaryTooLong.ok, false)
assert.equal(temporaryTooLong.reason, 'freshness_window_exceeds_contract_ceiling')

const conflictOutcome = validateCurrentLocationReviewResult(
  queue.reviewQueue.find((row) => row.userLogin === 'candidate_conflict'),
  { outcome: 'conflict_unmapped', reviewedAt: '2026-08-28T10:20:00.000Z' },
)
assert.equal(conflictOutcome.ok, true)
assert.equal(conflictOutcome.accepted, false)
assert.equal(conflictOutcome.placement, null)

const expiredReview = validateCurrentLocationReviewResult(tokyoQueue, {
  ...fixture.acceptedCurrentResult,
  reviewedAt: '2026-08-29T10:00:00.000Z',
})
assert.equal(expiredReview.ok, false)
assert.equal(expiredReview.reason, 'review_window_expired')

for (const required of [
  'stream_title',
  'stream_tag',
  'candidate sources only',
  'future/planned travel',
  'accepted_current',
  'accepted_temporary',
  '24 hours',
  '14 days',
  'baseMutationAuthorized = false',
  'production deploy',
  'public Current / IRL API activation',
]) {
  assert.ok(contract.includes(required), `contract missing: ${required}`)
}

console.log(JSON.stringify({
  ok: true,
  inputStreams: queue.summary.inputStreams,
  reviewableCandidates: queue.summary.reviewableCandidates,
  rejectedFutureTravel: queue.summary.rejectedFutureTravel,
  conflictingCandidates: queue.summary.conflictingCandidates,
  rawTextRetained: queue.boundary.rawTextRetained,
  titleOrTagCanAutoAccept: queue.boundary.titleOrTagCanAutoAccept,
  acceptedResultValidated: accepted.accepted,
  baseMutationAuthorized: accepted.baseMutationAuthorized,
  publicCurrentPlacementAuthorized: queue.boundary.publicCurrentPlacementAuthorized
}, null, 2))
