import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (file) => readFileSync(join(root, file), 'utf8')
const exists = (file) => existsSync(join(root, file))
const json = (file) => JSON.parse(read(file))
const check = (file, fragments, { caseInsensitive = false } = {}) => {
  const source = read(file)
  const haystack = caseInsensitive ? source.toLowerCase() : source
  for (const fragment of fragments) {
    const needle = caseInsensitive ? fragment.toLowerCase() : fragment
    assert.ok(haystack.includes(needle), `${file}: missing ${fragment}`)
  }
}

const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-category-source-audit-evidence.json',
  'docs/audits/12a4-category-storage-design-contract.json',
  'docs/audits/12a4-category-storage-budget-evidence.json',
  'docs/audits/12a4-category-migration-runtime-contract.json',
  'docs/audits/12a4-disabled-runtime-postmerge-evidence.json',
  'docs/audits/12a4-category-readonly-preflight-evidence.json',
  'docs/audits/12a4-category-schema-recovery-audit-evidence.json',
  'docs/audits/12a4-category-execution-cost-probe-execution-contract.json',
  'docs/audits/12a4-category-execution-cost-probe-trigger.json',
  'docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json',
  'docs/audits/12a4-category-capture-enablement-decision-contract.json',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  'docs/work-in-progress/phase12a4-category-capture-enablement-decision.md',
  '.github/workflows/analytics-12a4-category-controlled-schema-apply-execution.yml',
  '.github/workflows/analytics-12a4-category-schema-recovery-audit.yml',
  '.github/workflows/analytics-12a4-kick-category-schema-recovery.yml',
  '.github/workflows/analytics-12a4-category-execution-cost-probe-execution.yml',
  '.github/workflows/analytics-12a4-category-capture-enablement-decision.yml',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
]
for (const file of requiredFiles) assert.ok(exists(file), `${file}: missing`)

for (const file of [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]) check(file, ['category capture'], { caseInsensitive: true })

check('docs/operations/development-and-deployment-policy.md', [
  '`main` is the production branch',
  'Merge only completed candidates',
  'Feature work and operating-policy work should remain separate',
  'Provider separation remains mandatory',
  'Twitch and Kick remain separate',
  'Coverage remains bounded and explicitly non-provider-wide',
  'production deployment deliberate and observable',
])

check('docs/work-in-progress/phase12a4-category-execution-cost-probe.md', [
  'Status: accepted and retired',
  'Accepted evidence PR: #558',
  'Production path retirement PR: #559',
  'reserved probe rows remaining after cleanup: 0',
  'provider leakage rows: 0',
  'production push trigger removed',
  'production execution job removed',
  'CATEGORY_CAPTURE_ENABLED remains absent',
])
check('docs/work-in-progress/phase12a4-category-capture-enablement-decision.md', [
  'Status: accepted;',
  'Accepted decision PR: #561',
  'Kick canary design: eligible first',
  'Twitch canary design: eligible second',
  'production runtime capture: not authorized',
  'The current gate is 12A-4-8',
])

const gate = json('docs/audits/12a2-current-gate-state.json')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v16')
assert.equal(gate.status, '12a4_capture_decision_accepted_kick_canary_design_current')
assert.equal(gate.categorySourceAudit.status, 'accepted')
assert.equal(gate.categoryStorageDesign.status, 'accepted')
assert.equal(gate.categoryMigrationRuntime.status, 'accepted_and_schema_applied')
assert.equal(gate.categoryMigrationRuntime.runtimeCaptureStarted, false)
assert.equal(gate.categoryReadOnlyPreflight.status, 'accepted')
assert.equal(gate.categorySchemaExecution.status, 'accepted_and_retired')
assert.equal(gate.categorySchemaExecution.twitchSchemaState, 'complete')
assert.equal(gate.categorySchemaExecution.kickSchemaState, 'complete')
assert.equal(gate.categorySchemaExecution.providerLeakageRows, 0)
assert.equal(gate.categoryExecutionCostProbe.status, 'accepted_and_retired')
assert.equal(gate.categoryExecutionCostProbe.twitchGatePass, true)
assert.equal(gate.categoryExecutionCostProbe.kickGatePass, true)
assert.equal(gate.categoryExecutionCostProbe.cleanupRemainingRows, 0)
assert.equal(gate.categoryExecutionCostProbe.providerLeakageRows, 0)
assert.equal(gate.categoryExecutionCostProbe.allExecutionTriggersRetired, true)
assert.equal(gate.categoryCaptureEnablementDecision.status, 'accepted')
assert.equal(gate.categoryCaptureEnablementDecision.pr, 561)
assert.deepEqual(gate.categoryCaptureEnablementDecision.sequence, ['kick', 'twitch'])
assert.equal(gate.categoryCaptureEnablementDecision.productionRuntimeCaptureAuthorized, false)
assert.equal(gate.categoryCaptureEnablementDecision.productionFlagChangeAuthorized, false)
assert.equal(gate.categoryCapture.enablementDecisionAccepted, true)
assert.equal(gate.categoryCapture.kickFirstCanaryDesignAuthorized, true)
assert.equal(gate.categoryCapture.twitchSecondCanaryDesignAuthorized, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, false)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.deepEqual(gate.openBlockers, [
  'kick_category_capture_canary_package_not_accepted',
  'runtime_category_capture_not_authorized',
])
assert.equal(gate.currentWorkstream.phase, '12A-4-8')
assert.equal(gate.currentWorkstream.name, 'Kick-first disabled-by-default category capture canary package design')
assert.equal(gate.currentWorkstream.acceptedSchemaEvidence, true)
assert.equal(gate.currentWorkstream.acceptedCostEvidence, true)
assert.equal(gate.currentWorkstream.acceptedEnablementDecision, true)
assert.deepEqual(gate.currentWorkstream.providerSequence, ['kick', 'twitch'])
assert.equal(gate.currentWorkstream.kickPackageDesignCurrent, true)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickEvidence, true)
assert.equal(gate.currentWorkstream.productionExecutionIncluded, false)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)

const source = json('docs/audits/12a4-category-source-audit-evidence.json')
assert.equal(source.gate.categorySourceAuditPass, true)
assert.equal(source.providers.twitch.captureApproved, true)
assert.equal(source.providers.kick.captureApproved, true)
assert.equal(source.gate.runtimeCaptureAuthorized, false)

const storageContract = json('docs/audits/12a4-category-storage-design-contract.json')
const storageEvidence = json('docs/audits/12a4-category-storage-budget-evidence.json')
assert.equal(storageContract.status, 'accepted')
assert.equal(storageContract.selectedDesign.model, 'embedded_hourly')
assert.equal(storageEvidence.status, 'accepted')
assert.equal(storageEvidence.providers.kick.projectedHeadroomMb, 135.43)
assert.equal(storageEvidence.providers.twitch.projectedHeadroomMb, 11.3)
assert.equal(storageEvidence.gate.runtimeCaptureAuthorized, false)

const migration = json('docs/audits/12a4-category-migration-runtime-contract.json')
assert.equal(migration.runtime.flag, 'CATEGORY_CAPTURE_ENABLED')
assert.equal(migration.runtime.defaultEnabled, false)
assert.equal(migration.runtime.committedWranglerValue, false)
assert.equal(migration.runtime.productionCaptureStarted, false)
assert.equal(migration.runtime.dictionary.failureChangesCollectorSuccess, false)
assert.equal(migration.rollup.generatorMaximumQueries, 12)

const schemaEvidence = json('docs/audits/12a4-category-schema-recovery-audit-evidence.json')
assert.equal(schemaEvidence.status, 'accepted')
assert.equal(schemaEvidence.providers.twitch.schemaState, 'complete')
assert.equal(schemaEvidence.providers.kick.schemaState, 'complete')
assert.equal(schemaEvidence.providers.twitch.providerLeakageRows, 0)
assert.equal(schemaEvidence.providers.kick.providerLeakageRows, 0)
assert.equal(schemaEvidence.gate.categoryRuntimeEnablementAuthorized, false)

const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
assert.equal(execution.status, 'accepted_and_retired')
assert.equal(execution.acceptedMeasurement.acceptancePr, 558)
assert.equal(execution.acceptedMeasurement.twitchGatePass, true)
assert.equal(execution.acceptedMeasurement.kickGatePass, true)
assert.equal(execution.acceptedMeasurement.allReservedRowsRemoved, true)
assert.equal(execution.acceptedMeasurement.providerLeakageRowsZero, true)
assert.equal(execution.retirement.productionPushTriggerPresent, false)
assert.equal(execution.retirement.productionJobPresent, false)
assert.equal(execution.retirement.rearmAuthorized, false)
assert.deepEqual(execution.requiredSecrets, [])

const costEvidence = json('docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json')
assert.equal(costEvidence.status, 'accepted')
assert.deepEqual(costEvidence.providerOrder, ['twitch', 'kick'])
assert.equal(costEvidence.providers.twitch.providerGatePass, true)
assert.equal(costEvidence.providers.kick.providerGatePass, true)
assert.equal(costEvidence.providers.twitch.probeCleanupRemainingRows, 0)
assert.equal(costEvidence.providers.kick.probeCleanupRemainingRows, 0)
assert.equal(costEvidence.providers.twitch.providerLeakageRows, 0)
assert.equal(costEvidence.providers.kick.providerLeakageRows, 0)
assert.equal(costEvidence.gates.executionCostProbePass, true)
assert.equal(costEvidence.gates.runtimeCaptureEnablementAuthorized, false)

const decision = json('docs/audits/12a4-category-capture-enablement-decision-contract.json')
assert.equal(decision.status, 'accepted')
assert.equal(decision.acceptance.pr, 561)
assert.deepEqual(decision.decision.sequencing, ['kick', 'twitch'])
assert.equal(decision.decision.providerSeparatedCanaryDesignAuthorized, true)
assert.equal(decision.decision.productionRuntimeCaptureAuthorized, false)
assert.equal(decision.decision.productionFlagChangeAuthorized, false)
assert.equal(decision.providers.kick.canaryPackageDesignAuthorized, true)
assert.equal(decision.providers.twitch.canaryPackageDesignAuthorized, true)
assert.equal(decision.providers.kick.productionCanaryExecutionAuthorizedByThisContract, false)
assert.equal(decision.providers.twitch.productionCanaryExecutionAuthorizedByThisContract, false)
assert.equal(decision.canaryDesignRequirements.minimumObservationHoursPerProvider, 24)
assert.equal(Object.values(decision.pullRequestBoundary).every((value) => value === false), true)

for (const file of [
  'docs/audits/12a4-category-controlled-schema-apply-trigger.json',
  'docs/audits/12a4-category-schema-recovery-audit-trigger.json',
  'docs/audits/12a4-kick-category-schema-recovery-trigger.json',
  'docs/audits/12a4-category-execution-cost-probe-trigger.json',
]) {
  const trigger = json(file)
  assert.equal(trigger.status, 'consumed_and_retired')
  assert.equal(trigger.oneTime, true)
  assert.equal(trigger.retired, true)
}

for (const file of [
  '.github/workflows/analytics-12a4-category-controlled-schema-apply-execution.yml',
  '.github/workflows/analytics-12a4-category-schema-recovery-audit.yml',
  '.github/workflows/analytics-12a4-kick-category-schema-recovery.yml',
  '.github/workflows/analytics-12a4-category-execution-cost-probe-execution.yml',
]) {
  const workflow = read(file)
  assert.equal(/^\s*push:/m.test(workflow), false, `${file}: production push trigger remains`)
  assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false, `${file}: Cloudflare token remains`)
  assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false, `${file}: Cloudflare account remains`)
  assert.equal(workflow.includes('wrangler@4 deploy --config'), false, `${file}: production deploy remains`)
  assert.ok(workflow.includes('workflow_dispatch:'), `${file}: manual validation entry missing`)
  assert.ok(workflow.includes('verify-development-policy.mjs'), `${file}: policy gate missing`)
}

const twitchConfig = read('workers/collector-twitch/wrangler.toml')
const kickConfig = read('workers/collector-kick/wrangler.toml')
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickConfig), false)
assert.notEqual(twitchConfig.match(/database_id = "([^"]+)"/)?.[1], kickConfig.match(/database_id = "([^"]+)"/)?.[1])

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  currentWorkstream: gate.currentWorkstream.name,
  providerSequence: gate.currentWorkstream.providerSequence,
  acceptedEnablementDecision: gate.currentWorkstream.acceptedEnablementDecision,
  runtimeCaptureAuthorized: gate.categoryCapture.runtimeCaptureAuthorized,
}, null, 2))
