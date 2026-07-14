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

assert.equal(trigger.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-trigger-v1')
assert.equal(trigger.status, 'armed_for_one_time_main_push')
assert.equal(trigger.confirmation, 'RUN_BOUNDED_CATEGORY_EXECUTION_COST_PROBE')
assert.equal(trigger.trackingIssue, 519)
assert.equal(trigger.oneTime, true)
assert.equal(trigger.rearm, false)
assert.equal(trigger.attempt, 1)
assert.ok(/^[a-z0-9][a-z0-9-]{7,63}$/.test(trigger.runId))
assert.deepEqual(trigger.providerOrder, ['twitch', 'kick'])
assert.equal(trigger.stopBeforeKickOnTwitchFailure, true)
assert.equal(trigger.categoryCaptureEnablementAuthorized, false)
assert.equal(trigger.persistentProductionCategoryRowsAuthorized, false)
assert.equal(trigger.packagePr, packageContract.acceptance.pr)
assert.equal(trigger.expectedPackageHeadSha, packageContract.acceptance.validatedImplementationHeadSha)
assert.equal(trigger.expectedPackageMergeSha, executionContract.acceptedPackage.mergeSha)
assert.equal(trigger.executionPackagePr, executionContract.acceptance.pr)
assert.equal(trigger.expectedExecutionPackageHeadSha, executionContract.acceptance.validatedHeadSha)
assert.equal(trigger.expectedExecutionPackageMergeSha, executionContract.acceptance.mergeSha)

console.log(JSON.stringify({
  ok: true,
  triggerPresent: true,
  armed: true,
  runId: trigger.runId,
  providerOrder: trigger.providerOrder,
  packagePr: trigger.packagePr,
  executionPackagePr: trigger.executionPackagePr,
}, null, 2))
