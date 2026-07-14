import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const trigger = json('docs/audits/12a4-category-execution-cost-probe-trigger.json')
const evidence = json('docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json')
const packageContract = json('docs/audits/12a4-category-execution-cost-probe-package-contract.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe-execution.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const triggerVerifier = read('scripts/verify-12a4-category-execution-cost-probe-trigger.mjs')
const packageScope = read('scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs')

assert.equal(execution.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-execution-contract-v1')
assert.equal(execution.status, 'accepted_and_retired')
assert.equal(execution.trackingIssue, 519)
assert.equal(execution.acceptedImplementation.packagePr, 547)
assert.equal(execution.acceptedImplementation.executionHardeningPr, 551)
assert.equal(execution.acceptedImplementation.d1CompatibilityFixPr, 555)
assert.equal(execution.acceptedImplementation.validatedImplementationHeadSha, '6ebdee7053e9b94b62d21bda5a4572aa925a7555')
assert.equal(execution.acceptedImplementation.mergeSha, '003d4988df821294fd33fc3e0f8ed38da00af4cf')
assert.equal(execution.acceptedMeasurement.attempt, 3)
assert.equal(execution.acceptedMeasurement.triggerPr, 557)
assert.equal(execution.acceptedMeasurement.triggerMergeSha, '741e080187cfc3c92595120e57899d52664dd85e')
assert.equal(execution.acceptedMeasurement.acceptancePr, 558)
assert.equal(execution.acceptedMeasurement.acceptanceMergeSha, '7e272dcf831b1f3a3f331efa94996115d84f1add')
assert.equal(execution.acceptedMeasurement.sourceWorkflowRunId, 29358245194)
assert.equal(execution.acceptedMeasurement.sourceArtifactId, 8321254541)
assert.equal(execution.acceptedMeasurement.acceptanceArtifactId, 8321258554)
assert.deepEqual(execution.acceptedMeasurement.providerOrder, ['twitch', 'kick'])
assert.equal(execution.acceptedMeasurement.twitchGatePass, true)
assert.equal(execution.acceptedMeasurement.kickGatePass, true)
assert.equal(execution.acceptedMeasurement.allReservedRowsRemoved, true)
assert.equal(execution.acceptedMeasurement.providerLeakageRowsZero, true)
assert.equal(execution.acceptedMeasurement.temporaryWorkersDeleted, true)
assert.equal(execution.acceptedMeasurement.categoryCaptureRemainedDisabled, true)
assert.equal(execution.acceptedMeasurement.runtimeCaptureEnablementAuthorized, false)

for (const provider of ['twitch', 'kick']) {
  const measured = execution.measurements[provider]
  const frozen = evidence.providers[provider]
  assert.equal(measured.categoryGeneratorQueries, 4)
  assert.equal(measured.d1Statements, 10)
  assert.equal(measured.d1RowsRead, 7)
  assert.equal(measured.d1RowsWritten, 10)
  assert.equal(measured.d1Changes, 6)
  assert.equal(measured.databaseSizeDeltaBytes, 0)
  assert.equal(measured.probeCleanupRemainingRows, 0)
  assert.equal(measured.providerLeakageRows, 0)
  assert.equal(frozen.providerGatePass, true)
  assert.equal(frozen.temporaryWorkerFinalHttpStatus, 404)
}

assert.equal(execution.retirement.triggerStatus, 'consumed_and_retired')
assert.equal(execution.retirement.productionPushTriggerPresent, false)
assert.equal(execution.retirement.productionJobPresent, false)
assert.equal(execution.retirement.cloudflareSecretsReferenced, false)
assert.equal(execution.retirement.productionWorkerDeployPresent, false)
assert.equal(execution.retirement.verificationOnlyWorkflow, true)
assert.equal(execution.retirement.rearmAuthorized, false)
assert.deepEqual(execution.requiredSecrets, [])
assert.equal(Object.values(execution.historicalExecutionBoundary).every((value) => value === false || value === true || value === '1900-01-02'), true)

assert.equal(packageContract.status, 'accepted')
assert.equal(trigger.status, 'consumed_and_retired')
assert.equal(trigger.consumed, true)
assert.equal(trigger.retired, true)
assert.equal(trigger.rearmAuthorized, false)
assert.equal(evidence.status, 'accepted')
assert.equal(evidence.gates.executionCostProbePass, true)
assert.equal(evidence.gates.runtimeCaptureEnablementAuthorized, false)

assert.ok(workflow.includes('Category Execution Cost Probe Retired'))
assert.ok(workflow.includes('verify-retired-execution-package:'))
assert.ok(workflow.includes('Verify accepted and retired execution package'))
assert.ok(workflow.includes('Verify retired trigger'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run'))
assert.ok(workflow.includes('workflow_dispatch:'))
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(workflow.includes('production-probe:'), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('GH_TOKEN'), false)
assert.equal(workflow.includes('gh api'), false)
assert.equal(workflow.includes('run-12a4-category-execution-cost-probe-provider.mjs'), false)
assert.equal(workflow.includes('actions/upload-artifact@v4'), false)
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED='), false)

const dictionaryStart = worker.indexOf('async function dictionaryUpsert')
const dictionaryEnd = worker.indexOf('async function inspectProvider')
const dictionaryBlock = worker.slice(dictionaryStart, dictionaryEnd)
assert.ok(dictionaryStart >= 0 && dictionaryEnd > dictionaryStart)
assert.equal(dictionaryBlock.includes('WITH incoming(category_id, category_name)'), false)
assert.equal(dictionaryBlock.includes(') VALUES (?, ?, ?, ?, ?, ?)'), true)
assert.equal(dictionaryBlock.includes('ON CONFLICT(provider, category_id) DO UPDATE SET'), true)
assert.equal(triggerVerifier.includes('consumed_and_retired'), true)
assert.equal(triggerVerifier.includes('rearmAuthorized'), true)
assert.equal(packageScope.includes("'docs/audits/12a4-category-execution-cost-probe-trigger.json'"), true)

console.log(JSON.stringify({
  ok: true,
  status: execution.status,
  acceptedMeasurementPr: execution.acceptedMeasurement.acceptancePr,
  sourceRunId: execution.acceptedMeasurement.sourceWorkflowRunId,
  productionPushTriggerPresent: false,
  productionJobPresent: false,
  cloudflareSecretsReferenced: false,
  rearmAuthorized: false,
  categoryCaptureEnablementAuthorized: false,
}, null, 2))
