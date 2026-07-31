import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const paths = {
  decision: 'docs/audits/12a5-twitch-category-source-v2-semantic-clock-decision.json',
  evidence: 'docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json',
  executionRetirement: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json',
  v1: 'workers/shared/category-capture.ts',
  v2: 'workers/shared/category-capture-v2-candidate.ts',
  twitchConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kickConfig: 'workers/collector-kick/wrangler.category-permanent.toml',
  auditContract: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
}
for (const path of Object.values(paths)) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  '.github/workflows/analytics-12a5-twitch-category-source-v2-observation-execution.yml',
  'scripts/run-12a5-twitch-category-source-v2-observation.mjs',
  'scripts/build-12a5-twitch-category-source-v2-observation-worker.mjs',
  'execution-packages/twitch-category-source-v2-observation/wrangler.toml',
]) assert.equal(existsSync(path), false, `${path}: retired path present`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const decision = json(paths.decision)
const evidence = json(paths.evidence)
const executionRetirement = json(paths.executionRetirement)
const v1 = read(paths.v1)
const v2 = read(paths.v2)
const auditContract = json(paths.auditContract)

assert.equal(decision.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-semantic-clock-decision-v1')
assert.equal(decision.status, 'candidate')
assert.equal(decision.phase, '12A-5B-R2')
assert.equal(decision.trackingIssue, 659)
assert.equal(decision.provider, 'twitch')
assert.equal(decision.decisionPr, 699)
assert.equal(decision.governingMainSha, '998326831f46beada768070ac88024697171db47')
assert.equal(decision.evidence.successEvidence, paths.evidence)
assert.equal(decision.evidence.executionPathRetirement, paths.executionRetirement)
assert.equal(decision.evidence.workflowRunId, evidence.execution.workflowRunId)
assert.equal(decision.evidence.observeJobId, evidence.execution.observeJobId)
assert.equal(decision.evidence.artifactId, evidence.artifact.id)
assert.equal(decision.evidence.twoConsecutiveCompleteSnapshots, true)
assert.equal(decision.evidence.canonicalRollbackSucceeded, true)
assert.equal(evidence.status, 'observation_accepted')
assert.equal(evidence.observation.snapshots.length, 2)
for (const snapshot of evidence.observation.snapshots) {
  assert.equal(snapshot.bothPresent, 300)
  assert.equal(snapshot.bothEmpty, 0)
  assert.equal(snapshot.providerIdOnly, 0)
  assert.equal(snapshot.categoryNameOnly, 0)
  assert.equal(snapshot.nullRefCount, 0)
  assert.equal(snapshot.invalidRefCount, 0)
  assert.equal(snapshot.unresolvedCategoryIds, 0)
}
assert.equal(evidence.rollback.success, true)
assert.equal(executionRetirement.status, 'retired_on_merge')

const semantic = decision.semanticDecision
assert.equal(semantic.status, 'accepted_on_decision_merge')
assert.equal(semantic.canonicalProductionContractVersion, 'category-source-v1')
assert.equal(semantic.diagnosticContractVersion, 'category-source-v2-candidate')
assert.equal(semantic.identityScope, 'provider_scoped')
assert.deepEqual(semantic.identityKey, ['provider', 'categoryProviderId'])
assert.equal(semantic.displayNameSource, 'latest_nonempty_name_observed_for_same_provider_and_categoryProviderId')
assert.equal(semantic.stateHandling.both_present.eligibleForCategoryReference, true)
assert.equal(semantic.stateHandling.both_present.dictionaryWriteAllowed, true)
for (const state of ['both_empty', 'provider_id_only', 'category_name_only']) {
  assert.equal(semantic.stateHandling[state].eligibleForCategoryReference, false)
  assert.equal(semantic.stateHandling[state].dictionaryWriteAllowed, false)
  assert.equal(semantic.stateHandling[state].categoryReference, null)
}
assert.equal(semantic.syntheticMappingAllowed, false)
assert.equal(semantic.nameOnlyIdentityAllowed, false)
assert.equal(semantic.crossProviderIdentityAllowed, false)
assert.equal(semantic.combinedProviderRankingAllowed, false)
assert.equal(semantic.providerIdReuseAcrossProvidersAllowed, true)
assert.equal(semantic.thresholdRelaxationAllowed, false)
assert.equal(semantic.productionCodeChangeRequired, false)

assert.ok(v1.includes("export const CATEGORY_CONTRACT_VERSION = 'category-source-v1'"))
assert.ok(v1.includes('if (!id || !name) {'))
assert.ok(v1.includes('categoryRefs.push(null)'))
assert.ok(v1.includes('dictionary.set(id, name)'))
assert.ok(v1.includes('ON CONFLICT(provider, category_id) DO UPDATE SET'))
assert.ok(v2.includes("export const CATEGORY_SOURCE_V2_CANDIDATE_CONTRACT_VERSION = 'category-source-v2-candidate'"))
assert.ok(v2.includes("if (id && name) return 'both_present'"))
assert.ok(v2.includes("if (!id && !name) return 'both_empty'"))
assert.ok(v2.includes("if (id) return 'provider_id_only'"))
assert.ok(v2.includes("return 'category_name_only'"))
assert.ok(v2.includes("if (state === 'both_present')"))
assert.ok(v2.includes('categoryRefs.push(null)'))

const clock = decision.clockDecision
assert.equal(clock.status, 'proposed_for_separate_acceptance')
assert.equal(clock.newClockAuthorizedByThisCandidate, false)
assert.equal(clock.proposedStartAt, '2026-07-31T17:00:00.000Z')
assert.equal(clock.proposedEndExclusiveAt, '2026-08-07T17:00:00.000Z')
assert.equal(clock.timezoneDisplay, '2026-08-01 02:00 JST to 2026-08-08 02:00 JST')
assert.equal(clock.semantics, 'half_open')
assert.equal(clock.minimumStableDays, 7)
assert.equal(clock.cadenceMinutes, 5)
assert.equal(clock.expectedSlots, 2016)
assert.equal(clock.retroactiveStartAllowed, false)
assert.equal(clock.decisionAndAcceptanceMustMergeBeforeStart, true)
assert.equal(clock.dataBeforeStartExcluded, true)
assert.equal(clock.automaticResetAllowed, false)
assert.equal(clock.checkpointBeforeEndAuthorizesAcceptance, false)
assert.equal(clock.finalAuditBeforeEndAllowed, false)
assert.equal(clock.separateAcceptancePrRequired, true)
const start = Date.parse(clock.proposedStartAt)
const end = Date.parse(clock.proposedEndExclusiveAt)
assert.equal(start % (5 * 60 * 1000), 0)
assert.equal(end % (5 * 60 * 1000), 0)
assert.equal((end - start) / (5 * 60 * 1000), clock.expectedSlots)
assert.ok(Date.now() < start, 'proposed_start_must_remain_future_during_candidate_validation')

assert.equal(auditContract.status, 'accepted_dormant')
assert.equal(auditContract.window.originalWindowValid, false)
assert.notEqual(auditContract.window.startAt, clock.proposedStartAt)
assert.equal(auditContract.runtime.categoryContractVersion, 'category-source-v1')
assert.equal(auditContract.readOnlyBoundary.publicExposureAuthorized, false)
assert.equal(auditContract.acceptanceBoundary.passingFinalAuditExposesUi, false)

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(cron(read(paths.twitchConfig)), '*/5 * * * *')
assert.equal(cron(read(paths.kickConfig)), '*/5 * * * *')
assert.equal(read(paths.twitchConfig).includes('CATEGORY_SOURCE_V2'), false)
assert.equal(read(paths.kickConfig).includes('CATEGORY_SOURCE_V2'), false)
for (const value of Object.values(decision.unchangedRuntime)) {
  if (typeof value === 'boolean') assert.equal(value, false)
}
for (const value of Object.values(decision.stillUnauthorized)) assert.equal(value, true)

console.log(JSON.stringify({
  ok: true,
  decisionStatus: decision.status,
  semanticStatus: semantic.status,
  identityScope: semantic.identityScope,
  productionCodeChangeRequired: semantic.productionCodeChangeRequired,
  proposedStartAt: clock.proposedStartAt,
  proposedEndExclusiveAt: clock.proposedEndExclusiveAt,
  expectedSlots: clock.expectedSlots,
  clockAuthorizedByCandidate: clock.newClockAuthorizedByThisCandidate,
  finalModeAuthorized: false,
  publicCategoryUiAuthorized: false,
}, null, 2))
