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
  console.log(JSON.stringify({ ok: true, triggerPresent: false, armed: false }, null, 2))
  process.exit(0)
}

const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
const packageContract = JSON.parse(fs.readFileSync(path.resolve('docs/audits/12a4-category-execution-cost-probe-package-contract.json'), 'utf8'))
const executionContract = JSON.parse(fs.readFileSync(path.resolve('docs/audits/12a4-category-execution-cost-probe-execution-contract.json'), 'utf8'))

assert.equal(packageContract.status, 'accepted')
assert.equal(executionContract.status, 'accepted')
assert.equal(trigger.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-trigger-v1')
assert.equal(trigger.status, 'armed_for_one_time_main_push')
assert.equal(trigger.confirmation, 'RUN_BOUNDED_CATEGORY_EXECUTION_COST_PROBE')
assert.equal(trigger.trackingIssue, 519)
assert.equal(trigger.oneTime, true)
assert.equal(trigger.rearm, false)
assert.equal(Number.isInteger(trigger.attempt), true)
assert.ok(trigger.attempt >= 1 && trigger.attempt <= 10)
assert.equal(trigger.runId, `category-cost-probe-attempt-${trigger.attempt}`)
assert.ok(/^[a-z0-9][a-z0-9-]{7,63}$/.test(trigger.runId))
assert.deepEqual(trigger.providerOrder, ['twitch', 'kick'])
assert.equal(trigger.stopBeforeKickOnTwitchFailure, true)
assert.equal(trigger.categoryCaptureEnablementAuthorized, false)
assert.equal(trigger.persistentProductionCategoryRowsAuthorized, false)

const historicalAttemptOne = trigger.attempt === 1
if (historicalAttemptOne) {
  assert.equal(executionContract.previousAttempt?.attempt, 1)
  assert.equal(executionContract.previousAttempt?.status, 'accepted_safe_failure')
  assert.equal(executionContract.previousAttempt?.reservedWritesPerformed, false)
  assert.equal(trigger.packagePr, 547)
  assert.equal(trigger.expectedPackageHeadSha, '4556a5708ec3a33cd4b1835ca9e32baf78c5690d')
  assert.equal(trigger.expectedPackageMergeSha, 'cb2673eec8424288bbee7b4403c415261926097a')
  assert.equal(trigger.executionPackagePr, 548)
  assert.equal(trigger.expectedExecutionPackageHeadSha, '95baf064e0e8dfd42c274971af36cab940ba12c1')
  assert.equal(trigger.expectedExecutionPackageMergeSha, '219d79351388a15a599e72f8e85228d498488f11')
} else {
  assert.equal(trigger.attempt, executionContract.previousAttempt?.attempt + 1)
  assert.equal(trigger.packagePr, packageContract.acceptance.pr)
  assert.equal(trigger.expectedPackageHeadSha, executionContract.acceptedPackage.headSha)
  assert.equal(trigger.expectedPackageMergeSha, executionContract.acceptedPackage.mergeSha)
  assert.equal(trigger.executionPackagePr, executionContract.acceptance.pr)
  assert.equal(trigger.expectedExecutionPackageHeadSha, executionContract.acceptance.validatedImplementationHeadSha)
  assert.equal(trigger.expectedExecutionPackageMergeSha, executionContract.acceptance.mergeSha)
}

assert.ok(/^[0-9a-f]{40}$/.test(trigger.expectedExecutionPackageHeadSha))
assert.ok(/^[0-9a-f]{40}$/.test(trigger.expectedExecutionPackageMergeSha))

console.log(JSON.stringify({
  ok: true,
  triggerPresent: true,
  armed: true,
  attempt: trigger.attempt,
  historicalAttemptOne,
  runId: trigger.runId,
  providerOrder: trigger.providerOrder,
  packagePr: trigger.packagePr,
  executionPackagePr: trigger.executionPackagePr,
  exactExecutionIdentityVerifiedByWorkflowApi: true,
}, null, 2))
