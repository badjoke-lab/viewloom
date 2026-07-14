import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const triggerPath = path.resolve('docs/audits/12a4-category-execution-cost-probe-trigger.json')
const requirePresent = process.argv.includes('--require-present')

if (!fs.existsSync(triggerPath)) {
  if (requirePresent) {
    console.error('execution cost probe trigger is required but missing')
    process.exit(1)
  }
  console.log(JSON.stringify({ ok: true, triggerPresent: false, armed: false, retired: false }, null, 2))
  process.exit(0)
}

const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
const execution = JSON.parse(fs.readFileSync(path.resolve('docs/audits/12a4-category-execution-cost-probe-execution-contract.json'), 'utf8'))
const evidence = JSON.parse(fs.readFileSync(path.resolve('docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json'), 'utf8'))

assert.equal(trigger.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-trigger-v1')
assert.equal(trigger.status, 'consumed_and_retired')
assert.equal(trigger.confirmation, 'RUN_BOUNDED_CATEGORY_EXECUTION_COST_PROBE')
assert.equal(trigger.trackingIssue, 519)
assert.equal(trigger.oneTime, true)
assert.equal(trigger.consumed, true)
assert.equal(trigger.retired, true)
assert.equal(trigger.rearm, false)
assert.equal(trigger.rearmAuthorized, false)
assert.equal(trigger.attempt, 3)
assert.equal(trigger.runId, 'category-cost-probe-attempt-3')
assert.deepEqual(trigger.providerOrder, ['twitch', 'kick'])
assert.equal(trigger.stopBeforeKickOnTwitchFailure, true)
assert.equal(trigger.categoryCaptureEnablementAuthorized, false)
assert.equal(trigger.persistentProductionCategoryRowsAuthorized, false)
assert.equal(trigger.packagePr, 547)
assert.equal(trigger.executionPackagePr, 555)
assert.equal(trigger.expectedExecutionPackageHeadSha, '6ebdee7053e9b94b62d21bda5a4572aa925a7555')
assert.equal(trigger.expectedExecutionPackageMergeSha, '003d4988df821294fd33fc3e0f8ed38da00af4cf')
assert.equal(trigger.acceptedMeasurement.acceptancePr, 558)
assert.equal(trigger.acceptedMeasurement.acceptanceMergeSha, '7e272dcf831b1f3a3f331efa94996115d84f1add')
assert.equal(trigger.acceptedMeasurement.evidence, 'docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json')
assert.equal(trigger.acceptedMeasurement.sourceWorkflowRunId, 29358245194)
assert.equal(trigger.acceptedMeasurement.sourceArtifactId, 8321254541)
assert.equal(trigger.acceptedMeasurement.acceptanceArtifactId, 8321258554)
assert.equal(trigger.acceptedMeasurement.twitchGatePass, true)
assert.equal(trigger.acceptedMeasurement.kickGatePass, true)
assert.equal(trigger.acceptedMeasurement.cleanupRemainingRows, 0)
assert.equal(trigger.acceptedMeasurement.providerLeakageRows, 0)
assert.equal(trigger.acceptedMeasurement.temporaryWorkersRetained, false)

assert.equal(execution.status, 'accepted_and_retired')
assert.equal(evidence.status, 'accepted')
assert.equal(evidence.source.triggerMergeSha, trigger.acceptedMeasurement.acceptancePr === 558 ? '741e080187cfc3c92595120e57899d52664dd85e' : '')
assert.equal(evidence.gates.executionCostProbePass, true)
assert.equal(evidence.gates.runtimeCaptureEnablementAuthorized, false)

console.log(JSON.stringify({
  ok: true,
  triggerPresent: true,
  armed: false,
  consumed: true,
  retired: true,
  rearmAuthorized: false,
  attempt: trigger.attempt,
  runId: trigger.runId,
  acceptedMeasurementPr: trigger.acceptedMeasurement.acceptancePr,
  runtimeCaptureEnablementAuthorized: false,
}, null, 2))
