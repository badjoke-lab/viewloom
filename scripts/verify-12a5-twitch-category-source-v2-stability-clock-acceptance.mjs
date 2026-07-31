import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const paths = {
  acceptance: 'docs/audits/12a5-twitch-category-source-v2-stability-clock-acceptance.json',
  decision: 'docs/audits/12a5-twitch-category-source-v2-semantic-clock-decision.json',
  contract: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  twitchConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kickConfig: 'workers/collector-kick/wrangler.category-permanent.toml',
}
for (const path of Object.values(paths)) assert.equal(existsSync(path), true, `${path}: missing`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const acceptance = json(paths.acceptance)
const decision = json(paths.decision)
const contract = json(paths.contract)

assert.equal(acceptance.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-stability-clock-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.phase, '12A-5B-R2')
assert.equal(acceptance.trackingIssue, 659)
assert.equal(acceptance.provider, 'twitch')
assert.equal(acceptance.acceptancePr, 700)
assert.equal(acceptance.semanticDecisionPr, 699)
assert.equal(acceptance.semanticDecisionMergeSha, 'ec4792712c24c5e1ed05cfa8a0ba5e600e748b8e')
assert.equal(acceptance.semanticDecision, paths.decision)
assert.equal(acceptance.auditContract, paths.contract)

assert.equal(decision.semanticDecision.status, 'accepted_on_decision_merge')
assert.equal(decision.semanticDecision.identityScope, 'provider_scoped')
assert.deepEqual(decision.semanticDecision.identityKey, ['provider', 'categoryProviderId'])
assert.equal(decision.semanticDecision.syntheticMappingAllowed, false)
assert.equal(decision.semanticDecision.nameOnlyIdentityAllowed, false)
assert.equal(decision.semanticDecision.crossProviderIdentityAllowed, false)
assert.equal(decision.semanticDecision.combinedProviderRankingAllowed, false)

const window = acceptance.window
assert.equal(window.semantics, 'half_open')
assert.equal(window.startAt, '2026-07-31T17:00:00.000Z')
assert.equal(window.endExclusiveAt, '2026-08-07T17:00:00.000Z')
assert.equal(window.timezoneDisplay, '2026-08-01 02:00 JST to 2026-08-08 02:00 JST')
assert.equal(window.minimumStableDays, 7)
assert.equal(window.cadenceMinutes, 5)
assert.equal(window.expectedFinalSlots, 2016)
assert.equal(window.retroactiveStartAllowed, false)
assert.equal(window.dataBeforeStartExcluded, true)
const start = Date.parse(window.startAt)
const end = Date.parse(window.endExclusiveAt)
assert.equal(start % (5 * 60 * 1000), 0)
assert.equal(end % (5 * 60 * 1000), 0)
assert.equal((end - start) / (5 * 60 * 1000), 2016)

assert.equal(contract.status, 'accepted_active')
assert.equal(contract.governingMainSha, acceptance.semanticDecisionMergeSha)
assert.equal(contract.semanticDecision, paths.decision)
assert.equal(contract.stabilityClockAcceptance, paths.acceptance)
assert.deepEqual(contract.window, {
  semantics: window.semantics,
  startAt: window.startAt,
  endExclusiveAt: window.endExclusiveAt,
  minimumStableDays: window.minimumStableDays,
  cadenceMinutes: window.cadenceMinutes,
  expectedFinalSlots: window.expectedFinalSlots,
  originalWindowValid: true,
})
assert.equal(contract.stabilityClock.status, 'accepted_on_pr_700_merge')
assert.equal(contract.stabilityClock.semanticDecisionPr, 699)
assert.equal(contract.stabilityClock.semanticDecisionMergeSha, acceptance.semanticDecisionMergeSha)
assert.equal(contract.stabilityClock.acceptancePr, 700)
assert.equal(contract.stabilityClock.startsAutomaticallyAtBoundary, true)
assert.equal(contract.stabilityClock.manualOperatorActionAtStartRequired, false)
assert.equal(contract.stabilityClock.existingCollectorContinues, true)
assert.equal(contract.stabilityClock.firstExpectedBucketMinute, window.startAt)
assert.equal(contract.stabilityClock.domainChangeIncluded, false)

assert.equal(acceptance.activation.clockStartsAutomaticallyAtBoundary, true)
assert.equal(acceptance.activation.manualOperatorActionAtStartRequired, false)
assert.equal(acceptance.activation.existingTwitchCollectorContinues, true)
assert.equal(acceptance.activation.newWorkflowAtStartRequired, false)
assert.equal(acceptance.activation.newCronRequired, false)
assert.equal(acceptance.activation.checkpointExecutionRequiredAtStart, false)
assert.equal(acceptance.activation.firstExpectedBucketMinute, window.startAt)

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(cron(read(paths.twitchConfig)), '*/5 * * * *')
assert.equal(cron(read(paths.kickConfig)), '*/5 * * * *')
assert.equal(contract.runtime.collectorCron, '*/5 * * * *')
assert.equal(contract.runtime.categoryContractVersion, 'category-source-v1')
assert.equal(contract.readOnlyBoundary.publicExposureAuthorized, false)
assert.equal(contract.acceptanceBoundary.passingFinalAuditExposesUi, false)

for (const [key, value] of Object.entries(acceptance.boundaries)) {
  if (key === 'finalModeAuthorizedBeforeEnd') assert.equal(value, false)
  else assert.equal(value, false, `${key}: boundary must remain false`)
}

console.log(JSON.stringify({
  ok: true,
  status: acceptance.status,
  startAt: window.startAt,
  endExclusiveAt: window.endExclusiveAt,
  expectedFinalSlots: window.expectedFinalSlots,
  automaticAtBoundary: acceptance.activation.clockStartsAutomaticallyAtBoundary,
  manualStartActionRequired: acceptance.activation.manualOperatorActionAtStartRequired,
  cadence: contract.runtime.collectorCron,
  domainChanged: acceptance.boundaries.domainChanged,
  publicCategoryUiAuthorized: acceptance.boundaries.publicCategoryUiAuthorized,
}, null, 2))
