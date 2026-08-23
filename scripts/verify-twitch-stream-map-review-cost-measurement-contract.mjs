import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const contract = JSON.parse(read('docs/audits/twitch-stream-map-review-cost-measurement-contract-v0.1.json'))
const plan = read('docs/product/stream-map-review-cost-measurement-plan-v0.1.md')
const maintenance = read('docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md')

assert.equal(contract.schemaVersion, 'viewloom-twitch-stream-map-review-cost-measurement-contract-v0.1')
assert.equal(contract.status, 'candidate')
assert.equal(contract.parentIssue, 998)
assert.equal(contract.preparationIssue, 999)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.publicGeographyScope, 'country_only')

assert.equal(contract.sample.source, '/helix/streams')
assert.equal(contract.sample.topN, 20)
assert.equal(contract.sample.notBeforeAt, '2026-08-23T08:28:43.300Z')
assert.equal(contract.sample.minimumSecondsAfterPriorSample, 21600)
assert.equal(contract.sample.priorSampleCapturedAt, '2026-08-23T02:28:43.300Z')
assert.equal((Date.parse(contract.sample.notBeforeAt) - Date.parse(contract.sample.priorSampleCapturedAt)) / 1000, 21600)
assert.equal(contract.sample.freshPopulationRequired, true)
assert.equal(contract.sample.reusePriorReviewedPopulationForbidden, true)
assert.equal(contract.sample.refillForbidden, true)
assert.equal(contract.sample.geographyPreselectionForbidden, true)

assert.equal(contract.acquisition.tokenRequestsMax, 1)
assert.equal(contract.acquisition.streamsRequestsMax, 1)
assert.equal(contract.acquisition.usersRequestsExact, 0)
assert.equal(contract.acquisition.d1WritesExact, 0)
assert.equal(contract.acquisition.productionDeploy, false)
assert.deepEqual(contract.acquisition.retainedIdentityFields, ['rank', 'twitchUserId', 'login', 'displayName', 'viewers'])
for (const forbidden of ['title', 'tags', 'language', 'profileDescription', 'category', 'geography', 'coordinates', 'address']) {
  assert.ok(contract.acquisition.forbiddenRetainedFields.includes(forbidden), `missing forbidden retained field: ${forbidden}`)
}

assert.equal(contract.review.policy, 'docs/product/stream-map-reviewed-evidence-maintenance-policy-v0.1.md')
assert.equal(contract.review.maxDistinctSearchAttemptsPerIdentity, 5)
assert.equal(contract.review.reviewStartedAtRequiredBeforeResearch, true)
assert.equal(contract.review.reviewFinishedAtRequiredAfterTwentiethTerminalOutcome, true)
assert.equal(contract.review.reconstructedTimingForbidden, true)
assert.equal(contract.review.failedAndRejectedResearchCountsTowardTime, true)
assert.deepEqual(contract.review.terminalOutcomes, ['accepted', 'no_qualifying_evidence', 'excluded_nonperson', 'conflict_unmapped'])

assert.equal(contract.thresholds.rawAcceptedCountryCoverageMin, 0.1)
assert.equal(contract.thresholds.personEligibleAcceptedCountryCoverageMin, 0.15)
assert.equal(contract.thresholds.wallClockReviewMinutesMax, 120)
assert.equal(contract.thresholds.minutesPerAcceptedIdentityMax, 30)
assert.equal(contract.thresholds.acceptedEvidenceExplicitAttributableRatioExact, 1)
assert.equal(contract.thresholds.silentCountryConflictsExact, 0)

for (const field of [
  'sampleCapturedAt',
  'reviewStartedAt',
  'reviewFinishedAt',
  'wallClockReviewMinutes',
  'minutesPerReviewedIdentity',
  'minutesPerAcceptedIdentity',
  'measurementValid',
  'invalidReasons',
  'recurringProposalGatePassed',
]) assert.ok(contract.requiredResultFields.includes(field), `required result field missing: ${field}`)

for (const key of [
  'recurringAcquisitionAuthorized',
  'persistentCrawlerAuthorized',
  'automaticSearchAcceptanceAuthorized',
  'cityAuthorized',
  'currentLocationAuthorized',
  'irlAuthorized',
  'kickMapAuthorized',
  'cadenceChangeAuthorized',
  'd1SchemaOrBindingChangeAuthorized',
  'retentionExpansionAuthorized',
  'productionMutationAuthorized',
]) assert.equal(contract.authority[key], false, `${key} must remain false`)
assert.equal(contract.authority.passingGateMayAuthorizeProposalDraftOnly, true)

for (const fragment of [
  '2026-08-23T08:28:43.300Z',
  'reviewStartedAt',
  'before the first external/manual lookup',
  'Maximum: 5 per identity.',
  'measurement_valid=false',
  'A passing measurement authorizes **only** drafting a separate bounded recurring-reviewed-evidence maintenance proposal.',
]) assert.ok(plan.includes(fragment), `measurement plan missing: ${fragment}`)

for (const fragment of [
  'raw accepted country coverage             >= 10%',
  'person-eligible accepted country coverage >= 15%',
  'wall-clock review time                     <= 120 minutes / 20 identities',
  'minutes per accepted identity              <= 30 minutes',
]) assert.ok(maintenance.includes(fragment), `maintenance policy threshold missing: ${fragment}`)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: contract.schemaVersion,
  notBeforeAt: contract.sample.notBeforeAt,
  topN: contract.sample.topN,
  wallClockReviewMinutesMax: contract.thresholds.wallClockReviewMinutesMax,
  minutesPerAcceptedIdentityMax: contract.thresholds.minutesPerAcceptedIdentityMax,
  recurringAcquisitionAuthorized: contract.authority.recurringAcquisitionAuthorized,
}, null, 2))
