import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const result = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-result-2026-08-29.json', 'utf8'),
)
const plan = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-plan-2026-08-29.json', 'utf8'),
)
const review = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-review-batch-2026-08-28.json', 'utf8'),
)

assert.equal(result.schemaVersion, 'viewloom-twitch-stream-map-current-temporal-evidence-acquisition-result-v0.1')
assert.equal(result.sourcePlan, 'docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-plan-2026-08-29.json')
assert.equal(result.sourceReviewBatch, 'docs/audits/twitch-stream-map-current-review-batch-2026-08-28.json')
assert.deepEqual(result.acceptedEvidenceClassesReviewed, review.reviewPolicy.acceptedEvidenceClasses)
assert.deepEqual(result.acceptedEvidenceClassesReviewed, [
  'self_controlled_current_statement',
  'official_affiliated_current_statement',
  'attributable_editorial_current_statement',
  'reviewed_direct_self_statement_transcript',
])

const expectedLogins = plan.expected.logins
assert.equal(result.entries.length, plan.expected.identities)
assert.deepEqual(result.entries.map((row) => row.userLogin), expectedLogins)
assert.deepEqual(
  result.entries.map((row) => row.twitchUserId),
  review.entries.map((row) => row.twitchUserId),
)
assert.deepEqual(
  result.entries.map((row) => row.candidate.countryCode),
  review.entries.map((row) => row.candidate.countryCode),
)

for (const row of result.entries) {
  assert.deepEqual(row.reviewedEvidenceClasses, result.acceptedEvidenceClassesReviewed, `${row.userLogin}: accepted class drift`)
  assert.deepEqual(row.freshQualifyingEvidence, [], `${row.userLogin}: fresh evidence must remain empty in this result`)
  assert.equal(row.outcome, 'no_fresh_qualifying_temporal_evidence')
  assert.ok(typeof row.reason === 'string' && row.reason.length > 0)
}

assert.equal(result.taskAccounting.plannedIdentityCount, 10)
assert.equal(result.taskAccounting.plannedAcceptedEvidenceClasses, 4)
assert.equal(result.taskAccounting.plannedLookupTasks, 40)
assert.equal(result.taskAccounting.identityClassPairsReviewed, 40)
assert.equal(result.entries.length * result.acceptedEvidenceClassesReviewed.length, 40)
assert.equal(result.taskAccounting.providerRequests, 0)
assert.equal(result.taskAccounting.externalSearchRequestCountMechanicallyAudited, false)
assert.equal(result.taskAccounting.supplementalVerificationQueriesPerformed, true)
assert.equal(result.taskAccounting.lookupBudgetComplianceClaimed, false)
assert.equal(Object.hasOwn(result.taskAccounting, 'externalLookupsUsed'), false)
assert.equal(Object.hasOwn(result.taskAccounting, 'lookupBudgetCompliant'), false)

assert.deepEqual(result.summary, {
  identitiesReviewed: 10,
  freshQualifyingEvidence: 0,
  promotedToReview: 0,
  acceptedCurrentPlacement: 0,
  noFreshQualifyingEvidence: 10,
  publicCurrentPlacementAuthorized: false,
  baseMutationAuthorized: false,
})

const ray = result.entries.find((row) => row.userLogin === 'rayasianboy')
assert.ok(ray)
assert.equal(ray.candidate.countryCode, 'TW')
assert.equal(ray.notableRejectedOrExpiredReferences?.length, 1)
assert.equal(ray.notableRejectedOrExpiredReferences[0].referenceKind, 'attributable_editorial_current_statement')
assert.equal(ray.notableRejectedOrExpiredReferences[0].countryCode, 'US')
assert.equal(ray.notableRejectedOrExpiredReferences[0].disposition, 'expired_before_current_freshness_cutoff')
assert.ok(Date.parse(ray.notableRejectedOrExpiredReferences[0].publishedAt) < Date.parse(result.freshnessCutoff))

const berticuss = result.entries.find((row) => row.userLogin === 'berticuss')
assert.equal(berticuss?.notableRejectedOrExpiredReferences?.[0]?.referenceKind, 'stream_title_mirror')
assert.equal(berticuss?.notableRejectedOrExpiredReferences?.[0]?.disposition, 'candidate_only')

const deadlyslob = result.entries.find((row) => row.userLogin === 'deadlyslob')
assert.equal(deadlyslob?.notableRejectedOrExpiredReferences?.[0]?.disposition, 'not_current_eligible')

for (const [key, expected] of Object.entries({
  candidateTitleOrTagCanQualify: false,
  profileBaseContextCanQualifyWithoutCurrentTimeMeaning: false,
  plannedFutureTravelCanQualify: false,
  searchSnippetCanQualify: false,
  automaticAcceptanceAuthorized: false,
  publicCurrentPlacementAuthorized: false,
  baseMutationAuthorized: false,
  rawTitleTagLanguageRetained: false,
  preciseLocationAllowed: false,
  twitchKickAggregationAuthorized: false,
  canonicalMutationApplied: false,
  productionDeployment: false,
  d1Writes: 0,
})) {
  assert.equal(result.boundary[key], expected, `boundary mismatch: ${key}`)
}

const serialized = JSON.stringify(result)
for (const forbiddenKey of [
  'rawTitle',
  'rawTag',
  'rawLanguage',
  'latitude',
  'longitude',
  'streetAddress',
  'residentialAddress',
  'postalAddress',
  'gpsTrace',
  'preciseTravelPath',
  'privateVenueDetail',
]) {
  assert.equal(serialized.includes(`\"${forbiddenKey}\"`), false, `forbidden precise/raw field found: ${forbiddenKey}`)
}

console.log(JSON.stringify({
  ok: true,
  identitiesReviewed: result.summary.identitiesReviewed,
  identityClassPairsReviewed: result.taskAccounting.identityClassPairsReviewed,
  freshQualifyingEvidence: result.summary.freshQualifyingEvidence,
  promotedToReview: result.summary.promotedToReview,
  acceptedCurrentPlacement: result.summary.acceptedCurrentPlacement,
  externalSearchRequestCountMechanicallyAudited: result.taskAccounting.externalSearchRequestCountMechanicallyAudited,
  lookupBudgetComplianceClaimed: result.taskAccounting.lookupBudgetComplianceClaimed,
  productionDeployment: result.boundary.productionDeployment,
}, null, 2))
