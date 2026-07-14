import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const umbrella = json('docs/audits/12a4-category-execution-cost-probe-contract.json')
const packageContract = json('docs/audits/12a4-category-execution-cost-probe-package-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const evidence = json('docs/audits/12a4-category-schema-recovery-audit-evidence.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const twitch = read('workers/category-cost-probe/wrangler.twitch.toml')
const kick = read('workers/category-cost-probe/wrangler.kick.toml')
const localFixture = read('scripts/test-12a4-category-execution-cost-probe.py')
const evidenceFixture = read('scripts/test-12a4-category-execution-cost-probe-evidence.mjs')
const collector = read('scripts/collect-12a4-category-execution-cost-probe-evidence.mjs')
const evidenceVerifier = read('scripts/verify-12a4-category-execution-cost-probe-evidence.mjs')
const scopeVerifier = read('scripts/check-12a4-category-execution-cost-probe-package-scope.mjs')

assert.equal(umbrella.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-contract-v2')
assert.equal(umbrella.status, 'production_schema_accepted_bounded_probe_current')
assert.equal(umbrella.trackingIssue, 519)
assert.equal(umbrella.acceptedStartingPoint.postApplyAuditAcceptancePr, 545)
assert.equal(umbrella.acceptedStartingPoint.twitchCategorySchemaState, 'complete')
assert.equal(umbrella.acceptedStartingPoint.kickCategorySchemaState, 'complete')
assert.equal(umbrella.acceptedStartingPoint.productionCategoryCaptureEnabled, false)
assert.equal(umbrella.acceptedStartingPoint.productionCategoryRowsPresent, false)
assert.equal(umbrella.acceptedStartingPoint.schemaExecutionTriggersRetired, true)
assert.equal(umbrella.currentDesign.productionExecutionIncluded, false)
assert.equal(umbrella.currentDesign.runtimeCaptureEnablementIncluded, false)

assert.equal(packageContract.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-package-contract-v1')
assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.trackingIssue, 519)
assert.equal(packageContract.acceptance.pr, 547)
assert.equal(packageContract.acceptance.validatedImplementationHeadSha, 'dbb52103ab34becd9873d07299b20128f3e9c0de')
assert.equal(packageContract.acceptance.workflowRunId, 29337578641)
assert.equal(packageContract.acceptance.workflowJobId, 87100634321)
assert.equal(packageContract.acceptance.packageValidationPass, true)
assert.equal(packageContract.acceptedStartingPoint.retirementPr, 546)
assert.equal(packageContract.acceptedStartingPoint.retirementMergeSha, 'b79bbeb6ad9c71b79af3dbbd7d35bc5c10680b1b')
assert.equal(packageContract.acceptedStartingPoint.twitchSchemaState, 'complete')
assert.equal(packageContract.acceptedStartingPoint.kickSchemaState, 'complete')
assert.equal(packageContract.acceptedStartingPoint.categoryCaptureEnabled, false)
assert.equal(packageContract.acceptedStartingPoint.productionCategoryRowsPresent, false)
assert.deepEqual(packageContract.providerOrder, ['twitch', 'kick'])
assert.deepEqual(packageContract.providerBindings, { twitch: 'DB_TWITCH_HOT', kick: 'DB_KICK_HOT' })
assert.equal(packageContract.worker.confirmation, 'RUN_RESERVED_CATEGORY_COST_PROBE')
assert.equal(packageContract.worker.probeDay, '1900-01-02')
assert.equal(packageContract.worker.reservedPrefix, '__viewloom_category_cost_probe__:')
assert.equal(packageContract.worker.arbitraryProductionIdentifiersAllowed, false)
assert.equal(packageContract.operation.cleanupRunsInFinally, true)
assert.equal(packageContract.operation.collectorStatusWrites, false)
assert.equal(packageContract.acceptanceThresholds.categoryGeneratorQueriesMax, 12)
assert.equal(packageContract.acceptanceThresholds.dictionaryFirstPassChanges, 1)
assert.equal(packageContract.acceptanceThresholds.dictionarySecondPassChangesMax, 0)
assert.equal(packageContract.acceptanceThresholds.probeRowsAfterWrite, 3)
assert.equal(packageContract.acceptanceThresholds.probeCleanupRemainingRowsMax, 0)
assert.equal(packageContract.acceptanceThresholds.providerLeakageRowsMax, 0)
assert.equal(Object.values(packageContract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v14')
assert.equal(gate.currentWorkstream.phase, '12A-4-5')
assert.equal(gate.categoryExecutionCostProbe.status, 'bounded_probe_design_current')
assert.equal(gate.categoryExecutionCostProbe.productionProbeAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, false)

assert.equal(evidence.status, 'accepted')
assert.equal(evidence.providers.twitch.schemaState, 'complete')
assert.equal(evidence.providers.kick.schemaState, 'complete')
assert.equal(evidence.providers.twitch.query.rowsWritten, 0)
assert.equal(evidence.providers.kick.query.rowsWritten, 0)
assert.equal(evidence.gate.recoveryAuditPass, true)

assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(/wrangler@4 deploy(?! --dry-run)/.test(workflow), false)
assert.equal(workflow.includes('check-12a4-category-execution-cost-probe-package-scope.mjs'), true)
assert.equal(workflow.includes('test-12a4-category-execution-cost-probe-evidence.mjs'), true)
assert.equal(workflow.includes('verify-12a4-category-execution-cost-probe.mjs'), true)
assert.equal(workflow.includes('verify-development-policy.mjs'), true)
assert.equal(workflow.includes('wrangler@4 deploy --dry-run --config workers/category-cost-probe/wrangler.twitch.toml'), true)
assert.equal(workflow.includes('wrangler@4 deploy --dry-run --config workers/category-cost-probe/wrangler.kick.toml'), true)

for (const fragment of [
  "const CONFIRMATION = 'RUN_RESERVED_CATEGORY_COST_PROBE'",
  "const PROBE_DAY = '1900-01-02'",
  "const PROBE_PREFIX = '__viewloom_category_cost_probe__:'",
  "url.pathname === '/probe'",
  'invalid_reserved_probe_run_id',
  'dictionary_second_pass',
  "operationStage = 'cleanup'",
  'finally',
  'DELETE FROM streamer_intraday_rollups',
  'DELETE FROM intraday_rollup_status',
  'DELETE FROM provider_category_dictionary',
  'probeCleanupRemainingRows',
  'providerLeakageRows',
  'collectorStatePreserved',
  'categoryCaptureStillDisabled',
]) {
  assert.equal(worker.includes(fragment), true, `worker missing ${fragment}`)
}
assert.equal(worker.includes('scheduled('), false)
assert.equal(worker.includes('payload_json'), false)
assert.equal(worker.includes('CATEGORY_CAPTURE_ENABLED'), false)
assert.equal(worker.includes('collector_status\n          SET'), false)

for (const [provider, config] of [['twitch', twitch], ['kick', kick]]) {
  assert.equal(config.includes(`name = "viewloom-category-cost-probe-${provider}"`), true)
  assert.equal(config.includes(`PROVIDER = "${provider}"`), true)
  assert.equal(config.includes('CATEGORY_CAPTURE_ENABLED'), false)
  assert.equal(config.includes('REMOTE_SCHEMA_APPLY'), false)
  assert.equal(config.includes('[triggers]'), false)
}
assert.notEqual(twitch.match(/database_id = "([^"]+)"/)?.[1], kick.match(/database_id = "([^"]+)"/)?.[1])

for (const fragment of [
  'twitch_first == 1',
  'twitch_second == 0',
  'kick_first == 1',
  'kick_second == 0',
  'failure_caught',
  'cleanupRemainingRows',
]) {
  assert.equal(localFixture.includes(fragment), true, `local fixture missing ${fragment}`)
}
assert.equal(evidenceFixture.includes('cleanupFailure'), true)
assert.equal(evidenceFixture.includes('latencyFailure'), true)
assert.equal(evidenceFixture.includes('missingProvider'), true)
assert.equal(collector.includes("status: executionCostProbePass ? 'observed_pass' : 'observed_fail'"), true)
assert.equal(evidenceVerifier.includes("assert.equal(evidence.gate.runtimeCaptureEnablementAuthorized, false)"), true)
assert.equal(scopeVerifier.includes("'workers/category-cost-probe/src/index.ts'"), true)

console.log(JSON.stringify({
  ok: true,
  workstream: packageContract.workstream,
  status: packageContract.status,
  providerSchemas: { twitch: 'complete', kick: 'complete' },
  localFixtures: true,
  evidenceFixtures: true,
  twitchDryRunRequired: true,
  kickDryRunRequired: true,
  productionExecutionIncluded: false,
  categoryCaptureEnablementIncluded: false,
  providerSeparated: true,
}, null, 2))
