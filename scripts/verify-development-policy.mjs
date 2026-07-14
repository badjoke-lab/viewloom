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
  'docs/audits/12a4-category-controlled-schema-apply-trigger.json',
  'docs/audits/12a4-category-schema-recovery-audit-trigger.json',
  'docs/audits/12a4-kick-category-schema-recovery-trigger.json',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  '.github/workflows/analytics-12a4-category-controlled-schema-apply-execution.yml',
  '.github/workflows/analytics-12a4-category-schema-recovery-audit.yml',
  '.github/workflows/analytics-12a4-kick-category-schema-recovery.yml',
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
  check(file, [
    '12A-4-5',
    'bounded provider-separated category execution-cost probe',
    'category capture',
  ], { caseInsensitive: true })
}

check('docs/work-in-progress/phase12a4-category-execution-cost-probe.md', [
  'Status: current umbrella gate',
  'Post-apply schema audit acceptance PR: #545',
  'Twitch category schema complete',
  'Kick category schema complete',
  'all schema execution triggers consumed and retired',
  'bounded probe design',
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
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v14')
assert.equal(gate.status, '12a4_schema_complete_bounded_cost_probe_current')
assert.equal(gate.categorySourceAudit.status, 'accepted')
assert.equal(gate.categoryStorageDesign.status, 'accepted')
assert.equal(gate.categoryMigrationRuntime.status, 'accepted_and_schema_applied')
assert.equal(gate.categoryMigrationRuntime.remoteMigrationApplied, true)
assert.equal(gate.categoryMigrationRuntime.runtimeCaptureStarted, false)
assert.equal(gate.categoryReadOnlyPreflight.status, 'accepted')
assert.equal(gate.categorySchemaExecution.status, 'accepted_and_retired')
assert.equal(gate.categorySchemaExecution.postApplyAuditAcceptancePr, 545)
assert.equal(gate.categorySchemaExecution.twitchSchemaState, 'complete')
assert.equal(gate.categorySchemaExecution.kickSchemaState, 'complete')
assert.equal(gate.categorySchemaExecution.providerLeakageRows, 0)
assert.equal(gate.categorySchemaExecution.allExecutionTriggersRetired, true)
assert.equal(gate.categorySchemaExecution.productionWorkflowPushTriggersRetired, true)
assert.equal(gate.categoryExecutionCostProbe.status, 'bounded_probe_design_current')
assert.equal(gate.categoryExecutionCostProbe.twitchSchemaComplete, true)
assert.equal(gate.categoryExecutionCostProbe.kickSchemaComplete, true)
assert.equal(gate.categoryExecutionCostProbe.productionProbeAuthorized, false)
assert.equal(gate.categoryExecutionCostProbe.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.productionSchemaPresent, true)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.equal(gate.currentWorkstream.phase, '12A-4-5')
assert.equal(gate.currentWorkstream.bothProviderSchemasComplete, true)
assert.equal(gate.currentWorkstream.schemaExecutionRetired, true)
assert.equal(gate.currentWorkstream.productionExecutionIncluded, false)

const source = json('docs/audits/12a4-category-source-audit-evidence.json')
assert.equal(source.gate.categorySourceAuditPass, true)
assert.equal(source.providers.twitch.metrics.categoryPresenceRatio, 1)
assert.equal(source.providers.kick.metrics.categoryPresenceRatio, 1)
assert.equal(source.providers.twitch.captureApproved, true)
assert.equal(source.providers.kick.captureApproved, true)
assert.equal(source.gate.runtimeCaptureAuthorized, false)

const storageContract = json('docs/audits/12a4-category-storage-design-contract.json')
const storageEvidence = json('docs/audits/12a4-category-storage-budget-evidence.json')
assert.equal(storageContract.status, 'accepted')
assert.equal(storageContract.selectedStorage.model, 'embedded_hourly')
assert.equal(storageEvidence.status, 'accepted')
assert.equal(storageEvidence.gate.storageDesignPass, true)
assert.equal(storageEvidence.gate.remoteMigrationApplyAuthorized, false)
assert.equal(storageEvidence.gate.runtimeCaptureAuthorized, false)

const migration = json('docs/audits/12a4-category-migration-runtime-contract.json')
assert.equal(migration.status, 'accepted')
assert.equal(migration.runtime.defaultEnabled, false)
assert.equal(migration.runtime.maxQueriesPerGeneration, 12)
assert.equal(migration.execution.remoteMigrationApplyAuthorized, false)
assert.equal(migration.execution.productionCategoryCaptureAuthorized, false)

const disabled = json('docs/audits/12a4-disabled-runtime-postmerge-evidence.json')
assert.equal(disabled.status, 'accepted')
assert.equal(disabled.gate.disabledRuntimePostMergePass, true)
assert.equal(disabled.gate.productionCategoryPayloadFieldsAbsent, true)
assert.equal(disabled.gate.categoryRuntimeEnablementAuthorized, false)

const preflight = json('docs/audits/12a4-category-readonly-preflight-evidence.json')
assert.equal(preflight.status, 'accepted')
assert.equal(preflight.gate.readOnlyPreflightPass, true)
assert.equal(preflight.providers.twitch.providerGatePass, true)
assert.equal(preflight.providers.kick.providerGatePass, true)
assert.equal(preflight.gate.runtimeCaptureEnablementAuthorized, false)

const schemaEvidence = json('docs/audits/12a4-category-schema-recovery-audit-evidence.json')
assert.equal(schemaEvidence.status, 'accepted')
assert.equal(schemaEvidence.gate.recoveryAuditPass, true)
assert.equal(schemaEvidence.gate.providerStatesKnown, true)
assert.equal(schemaEvidence.providers.twitch.schemaState, 'complete')
assert.equal(schemaEvidence.providers.kick.schemaState, 'complete')
assert.equal(schemaEvidence.providers.twitch.providerGatePass, true)
assert.equal(schemaEvidence.providers.kick.providerGatePass, true)
assert.equal(schemaEvidence.providers.twitch.query.rowsWritten, 0)
assert.equal(schemaEvidence.providers.kick.query.rowsWritten, 0)
assert.equal(schemaEvidence.providers.twitch.query.changes, 0)
assert.equal(schemaEvidence.providers.kick.query.changes, 0)
assert.equal(schemaEvidence.providers.twitch.providerLeakageRows, 0)
assert.equal(schemaEvidence.providers.kick.providerLeakageRows, 0)
assert.equal(schemaEvidence.providers.twitch.lifecycle.deleteHttpStatus, 404)
assert.equal(schemaEvidence.providers.kick.lifecycle.deleteHttpStatus, 404)
assert.equal(schemaEvidence.parseErrors.length, 0)
assert.equal(schemaEvidence.gate.remoteSchemaApplyAuthorized, false)
assert.equal(schemaEvidence.gate.categoryRuntimeEnablementAuthorized, false)

const probe = json('docs/audits/12a4-category-execution-cost-probe-contract.json')
assert.equal(probe.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-contract-v2')
assert.equal(probe.status, 'production_schema_accepted_bounded_probe_current')
assert.equal(probe.trackingIssue, 519)
assert.equal(probe.acceptedStartingPoint.postApplyAuditAcceptancePr, 545)
assert.equal(probe.acceptedStartingPoint.twitchCategorySchemaState, 'complete')
assert.equal(probe.acceptedStartingPoint.kickCategorySchemaState, 'complete')
assert.equal(probe.acceptedStartingPoint.productionCategoryCaptureEnabled, false)
assert.equal(probe.acceptedStartingPoint.productionCategoryRowsPresent, false)
assert.equal(probe.acceptedStartingPoint.schemaExecutionTriggersRetired, true)
assert.deepEqual(probe.providerBindings, { twitch: 'DB_TWITCH_HOT', kick: 'DB_KICK_HOT' })
assert.equal(probe.acceptanceThresholds.categoryGeneratorQueriesMax, 12)
assert.equal(probe.acceptanceThresholds.dictionarySecondPassChangesMax, 0)
assert.equal(probe.acceptanceThresholds.probeCleanupRemainingRowsMax, 0)
assert.equal(probe.acceptanceThresholds.providerLeakageRowsMax, 0)
assert.equal(probe.currentDesign.productionExecutionIncluded, false)
assert.equal(probe.currentDesign.runtimeCaptureEnablementIncluded, false)
assert.equal(Object.values(probe.planningPrBoundary).every((value) => value === false), true)

for (const file of [
  'docs/audits/12a4-category-controlled-schema-apply-trigger.json',
  'docs/audits/12a4-category-schema-recovery-audit-trigger.json',
  'docs/audits/12a4-kick-category-schema-recovery-trigger.json',
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
  schemaExecutionRetired: gate.currentWorkstream.schemaExecutionRetired,
  productionProbeAuthorized: gate.categoryExecutionCostProbe.productionProbeAuthorized,
  runtimeCaptureAuthorized: gate.categoryCapture.runtimeCaptureAuthorized,
}, null, 2))
