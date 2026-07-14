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
  'docs/audits/12a4-category-execution-cost-probe-contract.json',
  'docs/audits/12a4-category-execution-cost-probe-execution-contract.json',
  'docs/audits/12a4-category-execution-cost-probe-trigger.json',
  'docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json',
  'docs/audits/12a4-category-controlled-schema-apply-trigger.json',
  'docs/audits/12a4-category-schema-recovery-audit-trigger.json',
  'docs/audits/12a4-kick-category-schema-recovery-trigger.json',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  '.github/workflows/analytics-12a4-category-controlled-schema-apply-execution.yml',
  '.github/workflows/analytics-12a4-category-schema-recovery-audit.yml',
  '.github/workflows/analytics-12a4-kick-category-schema-recovery.yml',
  '.github/workflows/analytics-12a4-category-execution-cost-probe-execution.yml',
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
]) {
  check(file, ['category capture'], { caseInsensitive: true })
}

check('docs/work-in-progress/phase12a4-category-execution-cost-probe.md', [
  'Status: accepted and retired',
  'Accepted evidence PR: #558',
  'Production path retirement PR: #559',
  'Twitch provider gate passed',
  'Kick provider gate passed',
  'reserved probe rows remaining after cleanup: 0',
  'provider leakage rows: 0',
  'production push trigger removed',
  'production execution job removed',
  'Current gate: provider-separated category capture enablement decision',
  'CATEGORY_CAPTURE_ENABLED remains absent',
])

check('docs/operations/development-and-deployment-policy.md', [
  '`main` is the production branch',
  'Merge only completed candidates',
  'Feature work and operating-policy work should remain separate',
  'Provider separation remains mandatory',
  'Twitch and Kick remain separate',
  'Coverage remains bounded and explicitly non-provider-wide',
  'production deployment deliberate and observable',
])

const gate = json('docs/audits/12a2-current-gate-state.json')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v15')
assert.equal(gate.status, '12a4_cost_probe_accepted_capture_decision_current')
assert.equal(gate.categorySourceAudit.status, 'accepted')
assert.equal(gate.categoryStorageDesign.status, 'accepted')
assert.equal(gate.categoryStorageDesign.productionCostProbeRequired, false)
assert.equal(gate.categoryStorageDesign.productionCostProbeAccepted, true)
assert.equal(gate.categoryMigrationRuntime.status, 'accepted_and_schema_applied')
assert.equal(gate.categoryMigrationRuntime.remoteMigrationApplied, true)
assert.equal(gate.categoryMigrationRuntime.runtimeCaptureStarted, false)
assert.equal(gate.categoryReadOnlyPreflight.status, 'accepted')
assert.equal(gate.categorySchemaExecution.status, 'accepted_and_retired')
assert.equal(gate.categorySchemaExecution.twitchSchemaState, 'complete')
assert.equal(gate.categorySchemaExecution.kickSchemaState, 'complete')
assert.equal(gate.categorySchemaExecution.providerLeakageRows, 0)
assert.equal(gate.categorySchemaExecution.allExecutionTriggersRetired, true)
assert.equal(gate.categorySchemaExecution.productionWorkflowPushTriggersRetired, true)
assert.equal(gate.categoryExecutionCostProbe.status, 'accepted_and_retired')
assert.equal(gate.categoryExecutionCostProbe.executionFixPr, 555)
assert.equal(gate.categoryExecutionCostProbe.triggerPr, 557)
assert.equal(gate.categoryExecutionCostProbe.acceptancePr, 558)
assert.equal(gate.categoryExecutionCostProbe.retirementPr, 559)
assert.equal(gate.categoryExecutionCostProbe.sourceWorkflowRunId, 29358245194)
assert.equal(gate.categoryExecutionCostProbe.twitchGatePass, true)
assert.equal(gate.categoryExecutionCostProbe.kickGatePass, true)
assert.equal(gate.categoryExecutionCostProbe.cleanupRemainingRows, 0)
assert.equal(gate.categoryExecutionCostProbe.providerLeakageRows, 0)
assert.equal(gate.categoryExecutionCostProbe.temporaryWorkersRetained, false)
assert.equal(gate.categoryExecutionCostProbe.allExecutionTriggersRetired, true)
assert.equal(gate.categoryExecutionCostProbe.productionWorkflowPushTriggersRetired, true)
assert.equal(gate.categoryExecutionCostProbe.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.productionSchemaPresent, true)
assert.equal(gate.categoryCapture.productionCostProbeRequired, false)
assert.equal(gate.categoryCapture.productionCostProbeAccepted, true)
assert.equal(gate.categoryCapture.productionCostProbeRetired, true)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, false)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.deepEqual(gate.openBlockers, [
  'category_capture_enablement_decision_not_accepted',
  'runtime_category_capture_not_authorized',
])
assert.equal(gate.currentWorkstream.phase, '12A-4-7')
assert.equal(gate.currentWorkstream.name, 'provider-separated category capture enablement decision')
assert.equal(gate.currentWorkstream.acceptedSchemaEvidence, true)
assert.equal(gate.currentWorkstream.acceptedCostEvidence, true)
assert.equal(gate.currentWorkstream.schemaExecutionRetired, true)
assert.equal(gate.currentWorkstream.costProbeExecutionRetired, true)
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
assert.equal(storageEvidence.gate.categoryStorageDesignPass, true)
assert.equal(storageEvidence.gate.runtimeCaptureAuthorized, false)

const migration = json('docs/audits/12a4-category-migration-runtime-contract.json')
assert.equal(migration.status, 'implemented_candidate')
assert.equal(migration.runtime.defaultEnabled, false)
assert.equal(migration.rollup.generatorMaximumQueries, 12)
assert.equal(migration.nextGate.runtimeCaptureEnablementAuthorized, false)

const disabled = json('docs/audits/12a4-disabled-runtime-postmerge-evidence.json')
assert.equal(disabled.status, 'accepted')
assert.equal(disabled.gate.disabledRuntimePostMergePass, true)
assert.equal(disabled.gate.runtimeCaptureEnablementAuthorized, false)

const preflight = json('docs/audits/12a4-category-readonly-preflight-evidence.json')
assert.equal(preflight.status, 'accepted')
assert.equal(preflight.gate.readOnlyPreflightPass, true)
assert.equal(preflight.providers.twitch.providerGatePass, true)
assert.equal(preflight.providers.kick.providerGatePass, true)
assert.equal(preflight.gate.runtimeCaptureEnablementAuthorized, false)

const schemaEvidence = json('docs/audits/12a4-category-schema-recovery-audit-evidence.json')
assert.equal(schemaEvidence.status, 'accepted')
assert.equal(schemaEvidence.gate.recoveryAuditPass, true)
assert.equal(schemaEvidence.providers.twitch.schemaState, 'complete')
assert.equal(schemaEvidence.providers.kick.schemaState, 'complete')
assert.equal(schemaEvidence.providers.twitch.providerLeakageRows, 0)
assert.equal(schemaEvidence.providers.kick.providerLeakageRows, 0)
assert.equal(schemaEvidence.providers.twitch.lifecycle.deleteHttpStatus, 404)
assert.equal(schemaEvidence.providers.kick.lifecycle.deleteHttpStatus, 404)
assert.equal(schemaEvidence.gate.categoryRuntimeEnablementAuthorized, false)

const probeDesign = json('docs/audits/12a4-category-execution-cost-probe-contract.json')
assert.equal(probeDesign.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-contract-v2')
assert.equal(probeDesign.status, 'production_schema_accepted_bounded_probe_current')
assert.equal(probeDesign.acceptanceThresholds.categoryGeneratorQueriesMax, 12)
assert.equal(probeDesign.acceptanceThresholds.probeCleanupRemainingRowsMax, 0)
assert.equal(probeDesign.acceptanceThresholds.providerLeakageRowsMax, 0)
assert.equal(probeDesign.currentDesign.runtimeCaptureEnablementIncluded, false)

const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
assert.equal(execution.status, 'accepted_and_retired')
assert.equal(execution.acceptedMeasurement.acceptancePr, 558)
assert.equal(execution.acceptedMeasurement.twitchGatePass, true)
assert.equal(execution.acceptedMeasurement.kickGatePass, true)
assert.equal(execution.acceptedMeasurement.allReservedRowsRemoved, true)
assert.equal(execution.acceptedMeasurement.providerLeakageRowsZero, true)
assert.equal(execution.acceptedMeasurement.temporaryWorkersDeleted, true)
assert.equal(execution.acceptedMeasurement.runtimeCaptureEnablementAuthorized, false)
assert.equal(execution.retirement.productionPushTriggerPresent, false)
assert.equal(execution.retirement.productionJobPresent, false)
assert.equal(execution.retirement.cloudflareSecretsReferenced, false)
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
assert.equal(costEvidence.providers.twitch.temporaryWorkerFinalHttpStatus, 404)
assert.equal(costEvidence.providers.kick.temporaryWorkerFinalHttpStatus, 404)
assert.equal(costEvidence.gates.executionCostProbePass, true)
assert.equal(costEvidence.gates.runtimeCaptureEnablementAuthorized, false)

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
  providerSchemas: {
    twitch: schemaEvidence.providers.twitch.schemaState,
    kick: schemaEvidence.providers.kick.schemaState,
  },
  acceptedCostEvidence: gate.currentWorkstream.acceptedCostEvidence,
  costProbeExecutionRetired: gate.currentWorkstream.costProbeExecutionRetired,
  runtimeCaptureAuthorized: gate.categoryCapture.runtimeCaptureAuthorized,
}, null, 2))
