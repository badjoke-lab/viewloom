import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const gate = json('docs/audits/12a2-current-gate-state.json')
const packageContract = json('docs/audits/12a4-category-execution-cost-probe-package-contract.json')
const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const evidence = json('docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json')
const schemaEvidence = json('docs/audits/12a4-category-schema-recovery-audit-evidence.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const twitch = read('workers/category-cost-probe/wrangler.twitch.toml')
const kick = read('workers/category-cost-probe/wrangler.kick.toml')

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 547)
assert.deepEqual(packageContract.providerOrder, ['twitch', 'kick'])
assert.equal(packageContract.operation.cleanupRunsInFinally, true)
assert.equal(packageContract.acceptanceThresholds.categoryGeneratorQueriesMax, 12)
assert.equal(packageContract.acceptanceThresholds.probeCleanupRemainingRowsMax, 0)
assert.equal(packageContract.acceptanceThresholds.providerLeakageRowsMax, 0)
assert.equal(Object.values(packageContract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v18')
assert.equal(gate.status, '12a4_kick_canary_initial_checkpoint_accepted_observation_active')
assert.equal(gate.currentWorkstream.phase, '12A-4-11')
assert.equal(gate.currentWorkstream.name, 'Kick category capture canary 24-hour observation')
assert.equal(gate.currentWorkstream.acceptedCostEvidence, true)
assert.equal(gate.currentWorkstream.acceptedEnablementDecision, true)
assert.equal(gate.currentWorkstream.acceptedKickCanaryPackage, true)
assert.equal(gate.currentWorkstream.acceptedKickCanaryExecutionPackage, true)
assert.equal(gate.currentWorkstream.acceptedKickCanaryInitialCheckpoint, true)
assert.equal(gate.currentWorkstream.exactKickTriggerCurrent, true)
assert.equal(gate.currentWorkstream.costProbeExecutionRetired, true)
assert.equal(gate.currentWorkstream.boundedCanaryCaptureActive, true)
assert.equal(gate.categoryExecutionCostProbe.status, 'accepted_and_retired')
assert.equal(gate.categoryExecutionCostProbe.twitchGatePass, true)
assert.equal(gate.categoryExecutionCostProbe.kickGatePass, true)
assert.equal(gate.categoryExecutionCostProbe.cleanupRemainingRows, 0)
assert.equal(gate.categoryExecutionCostProbe.providerLeakageRows, 0)
assert.equal(gate.categoryExecutionCostProbe.allExecutionTriggersRetired, true)
assert.equal(gate.categoryExecutionCostProbe.productionWorkflowPushTriggersRetired, true)
assert.equal(gate.categoryCaptureEnablementDecision.status, 'accepted')
assert.deepEqual(gate.categoryCaptureEnablementDecision.sequence, ['kick', 'twitch'])
assert.equal(gate.categoryCaptureEnablementDecision.productionRuntimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.kickCanaryPackageAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryExecutionPackageAccepted, true)
assert.equal(gate.categoryCapture.kickExactTriggerAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryExecuted, true)
assert.equal(gate.categoryCapture.kickCanaryInitialAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, true)

assert.equal(schemaEvidence.status, 'accepted')
assert.equal(schemaEvidence.providers.twitch.schemaState, 'complete')
assert.equal(schemaEvidence.providers.kick.schemaState, 'complete')

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
assert.equal(execution.retirement.rearmAuthorized, false)

assert.equal(evidence.status, 'accepted')
assert.deepEqual(evidence.providerOrder, ['twitch', 'kick'])
for (const provider of ['twitch', 'kick']) {
  const item = evidence.providers[provider]
  assert.equal(item.providerGatePass, true)
  assert.equal(item.categoryGeneratorQueries, 4)
  assert.equal(item.dictionaryFirstPassChanges, 1)
  assert.equal(item.dictionarySecondPassChanges, 0)
  assert.equal(item.probeRowsAfterWrite, 3)
  assert.equal(item.probeCleanupRemainingRows, 0)
  assert.equal(item.providerLeakageRows, 0)
  assert.equal(item.databaseSizeDeltaBytes, 0)
  assert.equal(item.temporaryWorkerFinalHttpStatus, 404)
}
assert.equal(evidence.gates.executionCostProbePass, true)
assert.equal(evidence.gates.runtimeCaptureEnablementAuthorized, false)

assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('verify-development-policy.mjs'), true)
assert.equal(workflow.includes('wrangler@4 deploy --dry-run --config workers/category-cost-probe/wrangler.twitch.toml'), true)
assert.equal(workflow.includes('wrangler@4 deploy --dry-run --config workers/category-cost-probe/wrangler.kick.toml'), true)

for (const fragment of [
  "const PROBE_DAY = '1900-01-02'",
  "const PROBE_PREFIX = '__viewloom_category_cost_probe__:'",
  'dictionary_second_pass',
  'DELETE FROM streamer_intraday_rollups',
  'DELETE FROM intraday_rollup_status',
  'DELETE FROM provider_category_dictionary',
  'categoryCaptureStillDisabled',
]) assert.equal(worker.includes(fragment), true, `worker missing ${fragment}`)

for (const config of [twitch, kick]) {
  assert.equal(config.includes('CATEGORY_CAPTURE_ENABLED'), false)
  assert.equal(config.includes('REMOTE_SCHEMA_APPLY'), false)
  assert.equal(config.includes('[triggers]'), false)
}
assert.notEqual(twitch.match(/database_id = "([^"]+)"/)?.[1], kick.match(/database_id = "([^"]+)"/)?.[1])

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  currentWorkstream: gate.currentWorkstream.name,
  acceptedCostEvidence: true,
  acceptedEnablementDecision: true,
  acceptedKickCanaryPackage: true,
  acceptedKickCanaryExecutionPackage: true,
  acceptedKickCanaryInitialCheckpoint: true,
  costProbeExecutionRetired: true,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))
