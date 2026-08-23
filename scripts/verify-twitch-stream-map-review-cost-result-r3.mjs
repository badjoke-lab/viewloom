import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const resultPath = 'docs/audits/twitch-stream-map-review-cost-result-2026-08-23-r3.json'
const raw = execFileSync(process.execPath, [
  'scripts/evaluate-twitch-stream-map-review-cost-result.mjs',
  resultPath,
], { encoding: 'utf8' })
const result = JSON.parse(raw)

assert.equal(result.schemaVersion, 'viewloom-twitch-stream-map-review-cost-result-v0.1')
assert.equal(result.provider, 'twitch')
assert.equal(result.sampleCapturedAt, '2026-08-23T09:22:22.534Z')
assert.equal(result.sampleNotBeforeAt, '2026-08-23T08:28:43.300Z')
assert.equal(result.sampleIdentities.length, 20)
assert.equal(result.sampleViewers, 886296)
assert.equal(result.sampleOverlapFirstCount, 4)
assert.equal(result.sampleOverlapSecondCount, 8)
assert.equal(result.reviewStartedAt, '2026-08-23T09:23:44.340Z')
assert.equal(result.reviewFinishedAt, '2026-08-23T09:28:54.276Z')
assert.equal(result.researchStartedAfterDurableStartMarker, true)

assert.equal(result.reviewedIdentities, 20)
assert.equal(result.acceptedIdentities, 3)
assert.equal(result.excludedNonPersonIdentities, 8)
assert.equal(result.eligibleUnmappedIdentities, 9)
assert.equal(result.conflictUnmappedIdentities, 0)
assert.equal(result.currentLocationAcceptedIdentities, 0)
assert.equal(result.acceptedExplicitAttributableIdentities, 3)
assert.equal(result.silentCountryConflicts, 0)
assert.equal(result.totalSearchAttempts, 55)
assert.deepEqual(result.acceptedSourceMix, { official_external: 3, manual_review: 0 })

assert.ok(Math.abs(result.wallClockReviewMinutes - 5.1656) < 1e-9)
assert.ok(Math.abs(result.minutesPerReviewedIdentity - 0.25828) < 1e-9)
assert.ok(Math.abs(result.minutesPerAcceptedIdentity - 1.7218666666666664) < 1e-9)
assert.ok(Math.abs(result.rawAcceptedCoverage - 0.15) < 1e-9)
assert.ok(Math.abs(result.personEligibleAcceptedCoverage - 0.25) < 1e-9)
assert.ok(Math.abs(result.mappedViewerCoverage - 0.058322501737568484) < 1e-12)
assert.equal(result.acceptedEvidenceExplicitAttributableRatio, 1)

assert.deepEqual(
  result.identityReviews
    .filter((row) => row.terminalOutcome === 'accepted')
    .map((row) => [row.login, row.acceptedCountryCode, row.acceptedSource, row.acceptedLocationType]),
  [
    ['ramzes', 'RU', 'official_external', 'declared_location'],
    ['jasontheween', 'US', 'official_external', 'home_base'],
    ['fps_shaka', 'JP', 'official_external', 'declared_location'],
  ],
)

assert.deepEqual(
  result.identityReviews
    .filter((row) => row.terminalOutcome === 'excluded_nonperson')
    .map((row) => [row.login, row.entityKind]),
  [
    ['dota2ti', 'event_broadcast'],
    ['dota2ti_ru', 'event_broadcast'],
    ['ow_esports', 'event_broadcast'],
    ['lck', 'event_broadcast'],
    ['lck_carry', 'organization'],
    ['otplol_', 'organization'],
    ['echo_esports', 'organization'],
    ['eslcs', 'organization'],
  ],
)

assert.deepEqual(result.invalidReasons, [])
assert.equal(result.measurementValid, true)
assert.deepEqual(result.thresholdChecks, {
  rawAcceptedCountryCoverage: true,
  personEligibleAcceptedCountryCoverage: true,
  wallClockReviewMinutes: true,
  minutesPerAcceptedIdentity: true,
  acceptedEvidenceExplicitAttributableRatio: true,
  silentCountryConflicts: true,
})
assert.equal(result.recurringProposalGatePassed, true)

for (const [key, value] of Object.entries(result.authority)) {
  assert.equal(value, false, `${key} must remain unauthorized by this measurement`)
}

console.log('twitch stream map review-cost R3 result verification passed')
