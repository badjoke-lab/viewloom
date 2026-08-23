import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const templatePath = 'docs/audits/twitch-stream-map-review-cost-result-template-v0.1.json'
const evaluatorPath = 'scripts/evaluate-twitch-stream-map-review-cost-result.mjs'
const template = JSON.parse(readFileSync(templatePath, 'utf8'))

assert.equal(template.schemaVersion, 'viewloom-twitch-stream-map-review-cost-result-v0.1')
assert.equal(template.status, 'template')
assert.equal(template.parentIssue, 998)
assert.equal(template.sampleIssue, 1003)
assert.equal(template.harnessIssue, 1004)
assert.equal(template.provider, 'twitch')
assert.equal(template.sampleNotBeforeAt, '2026-08-23T08:28:43.300Z')
assert.equal(template.sampleCapturedAt, null)
assert.equal(template.reviewStartedAt, null)
assert.equal(template.reviewFinishedAt, null)
assert.equal(template.researchStartedAfterDurableStartMarker, null)
assert.deepEqual(template.sampleIdentities, [])
assert.deepEqual(template.identityReviews, [])
assert.equal(template.recurringProposalGatePassed, null)
for (const [key, value] of Object.entries(template.authority)) assert.equal(value, false, `${key} must remain false`)

const dir = mkdtempSync(join(tmpdir(), 'viewloom-review-cost-harness-'))
const sampleIdentities = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  twitchUserId: `synthetic-${i + 1}`,
  login: `synthetic_login_${i + 1}`,
  displayName: `Synthetic ${i + 1}`,
  viewers: 1000,
}))
const identityReviews = sampleIdentities.map((row, i) => ({
  rank: row.rank,
  twitchUserId: row.twitchUserId,
  login: row.login,
  entityKind: 'person',
  terminalOutcome: 'accepted',
  searchAttempts: 1,
  acceptedSource: i < 10 ? 'official_external' : 'manual_review',
  acceptedLocationType: i % 2 === 0 ? 'home_base' : 'declared_location',
  acceptedCountryCode: 'US',
  evidenceUrl: `https://example.com/evidence/${i + 1}`,
  evidenceExplicitAttributable: true,
  countryConflictDetected: false,
  silentCountryConflict: false,
}))
const valid = {
  ...template,
  status: 'in_progress',
  sampleCapturedAt: '2026-08-23T08:30:00.000Z',
  sampleIdentities,
  sampleViewers: 20000,
  sampleOverlapFirstCount: 0,
  sampleOverlapSecondCount: 0,
  reviewStartedAt: '2026-08-23T08:31:00.000Z',
  reviewFinishedAt: '2026-08-23T09:31:00.000Z',
  researchStartedAfterDurableStartMarker: true,
  identityReviews,
}

const validPath = join(dir, 'valid.json')
writeFileSync(validPath, JSON.stringify(valid))
const validOutput = JSON.parse(execFileSync(process.execPath, [evaluatorPath, validPath], { encoding: 'utf8' }))
assert.equal(validOutput.measurementValid, true)
assert.equal(validOutput.recurringProposalGatePassed, true)
assert.equal(validOutput.wallClockReviewMinutes, 60)
assert.equal(validOutput.minutesPerReviewedIdentity, 3)
assert.equal(validOutput.minutesPerAcceptedIdentity, 3)
assert.equal(validOutput.acceptedIdentities, 20)
assert.equal(validOutput.acceptedExplicitAttributableIdentities, 20)
assert.equal(validOutput.totalSearchAttempts, 20)
assert.equal(validOutput.thresholdChecks.wallClockReviewMinutes, true)
assert.equal(validOutput.thresholdChecks.minutesPerAcceptedIdentity, true)

const expectInvalid = (name, mutate, expectedReason) => {
  const input = structuredClone(valid)
  mutate(input)
  const path = join(dir, `${name}.json`)
  writeFileSync(path, JSON.stringify(input))
  let stdout = ''
  try {
    stdout = execFileSync(process.execPath, [evaluatorPath, path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    assert.fail(`${name} unexpectedly passed`) 
  } catch (error) {
    stdout = String(error.stdout ?? '')
  }
  const output = JSON.parse(stdout)
  assert.equal(output.measurementValid, false, `${name} must fail closed`)
  assert.ok(output.invalidReasons.includes(expectedReason), `${name} missing ${expectedReason}`)
  assert.equal(output.recurringProposalGatePassed, false)
}

expectInvalid('missing-start', (input) => { input.reviewStartedAt = null }, 'reviewStartedAt_missing')
expectInvalid('late-start-proof', (input) => { input.researchStartedAfterDurableStartMarker = false }, 'research_not_proven_after_durable_start_marker')
expectInvalid('early-sample', (input) => { input.sampleCapturedAt = '2026-08-23T08:28:00.000Z' }, 'sample_captured_before_not_before')
expectInvalid('too-many-searches', (input) => { input.identityReviews[0].searchAttempts = 6 }, 'search_attempts_invalid_rank_1')
expectInvalid('current-location', (input) => { input.identityReviews[0].acceptedLocationType = 'current_location' }, 'accepted_location_type_invalid_rank_1')

console.log(JSON.stringify({
  ok: true,
  template: templatePath,
  evaluator: evaluatorPath,
  validFixtureGatePassed: validOutput.recurringProposalGatePassed,
  failClosedCases: 5,
}, null, 2))
