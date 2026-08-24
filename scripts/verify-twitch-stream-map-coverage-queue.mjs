import assert from 'node:assert/strict'
import { buildCoverageExpansionQueue } from '../tools/twitch-stream-map-coverage-expansion/queue.mjs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence.mjs'

const identities = [
  { rank: 1, twitchUserId: '1001', login: 'shotzzy', displayName: 'Shotzzy', viewers: 10000 },
  { rank: 2, twitchUserId: '1002', login: 'lck', displayName: 'LCK', viewers: 9000 },
  { rank: 3, twitchUserId: '1003', login: 'brand_new_person', displayName: 'Brand New Person', viewers: 8000 },
  { rank: 4, twitchUserId: '1004', login: 'ohnepixel', displayName: 'ohnePixel', viewers: 7000 },
  { rank: 5, twitchUserId: '1005', login: 'unknown_entity', displayName: 'Unknown Entity', viewers: 6000 },
]

const reviewedRecords = [
  ...TWITCH_REVIEWED_LOCATION_RECORDS,
  { streamerLogin: 'unknown_entity', entityKind: 'unknown', evidences: [] },
]

const result = buildCoverageExpansionQueue({
  capturedAt: '2026-08-24T00:00:00.000Z',
  identities,
  reviewedRecords,
})

assert.equal(result.schemaVersion, 'viewloom-twitch-stream-map-coverage-queue-v0.1')
assert.equal(result.stableIdentityKey, 'twitchUserId')
assert.equal(result.reviewedEvidenceJoinKey, 'currentSampleLogin')
assert.equal(result.invariants.calendarWeekControlsQueue, false)
assert.equal(result.counts.population, 5)
assert.equal(result.counts.excludedFreshEvidence, 2)
assert.equal(result.counts.excludedNonPerson, 1)
assert.equal(result.counts.queued, 2)
assert.equal(result.counts.unresolvedEntity, 1)
assert.deepEqual(result.queue.map((row) => row.login), ['brand_new_person', 'unknown_entity'])
assert.deepEqual(result.excludedFreshEvidence.map((row) => row.login), ['shotzzy', 'ohnepixel'])
assert.deepEqual(result.excludedNonPerson.map((row) => row.login), ['lck'])

const suppressed = buildCoverageExpansionQueue({
  capturedAt: '2026-08-24T00:00:00.000Z',
  identities,
  reviewedRecords,
  suppressedStableUserIds: ['1003'],
})
assert.equal(suppressed.counts.excludedStableHistory, 1)
assert.deepEqual(suppressed.excludedStableHistory.map((row) => row.twitchUserId), ['1003'])
assert.deepEqual(suppressed.queue.map((row) => row.login), ['unknown_entity'])

assert.throws(
  () => buildCoverageExpansionQueue({
    capturedAt: '2026-08-24T00:00:00.000Z',
    identities: [
      { rank: 1, twitchUserId: 'dup', login: 'one', displayName: 'One', viewers: 10 },
      { rank: 2, twitchUserId: 'dup', login: 'two', displayName: 'Two', viewers: 9 },
    ],
    reviewedRecords: [],
  }),
  /duplicate_twitch_user_id/,
)

assert.throws(
  () => buildCoverageExpansionQueue({
    capturedAt: '2026-08-24T00:00:00.000Z',
    identities: [
      { rank: 1, twitchUserId: 'id1', login: 'collision', displayName: 'One', viewers: 10 },
      { rank: 2, twitchUserId: 'id2', login: 'collision', displayName: 'Two', viewers: 9 },
    ],
    reviewedRecords: [],
  }),
  /login_identity_collision/,
)

const currentLocationOnly = buildCoverageExpansionQueue({
  capturedAt: '2026-08-24T00:00:00.000Z',
  identities: [{ rank: 1, twitchUserId: '2001', login: 'current_only', displayName: 'Current Only', viewers: 100 }],
  reviewedRecords: [{
    streamerLogin: 'current_only',
    entityKind: 'person',
    evidences: [{
      status: 'accepted',
      confidence: 'explicit',
      countryCode: 'JP',
      claimKind: 'current_location',
      observedAt: '2026-08-23T00:00:00.000Z',
    }],
  }],
})
assert.equal(currentLocationOnly.counts.queued, 1)
assert.equal(currentLocationOnly.queue[0].reason, 'eligible_unmapped_person')

console.log('Twitch Stream Map coverage queue verification passed')
console.log(JSON.stringify({
  population: result.counts.population,
  queued: result.counts.queued,
  excludedFreshEvidence: result.counts.excludedFreshEvidence,
  excludedNonPerson: result.counts.excludedNonPerson,
  unresolvedEntity: result.counts.unresolvedEntity,
}, null, 2))
