import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { inspectTwitchCanaryTrigger } from './inspect-12a4-twitch-category-capture-canary-trigger.mjs'

const triggerPath = 'docs/audits/12a4-twitch-category-capture-canary-trigger.json'
const temporaryPath = `${triggerPath}.active-policy-check`
const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

assert.equal(fs.existsSync(triggerPath), true, 'armed Twitch trigger must exist')
assert.equal(fs.existsSync(temporaryPath), false, 'temporary trigger path must be absent')

const trigger = json(triggerPath)
const executionContract = json('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-twitch-category-capture-canary-package-contract.json')
const storagePreflight = json(executionContract.trigger.storagePreflightContract)
const workflow = read(executionContract.workflow.path)
const normalConfig = read('workers/collector-twitch/wrangler.toml')
const kickConfig = read('workers/collector-kick/wrangler.toml')

const inspected = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  storagePreflight,
  eventName: 'schedule',
  now: new Date(),
})
assert.equal(inspected.ok, true, JSON.stringify(inspected.failures ?? []))
assert.equal(inspected.present, true)
assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'twitch')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.confirmation, 'RUN_TWITCH_CATEGORY_CAPTURE_CANARY')
assert.equal(trigger.packagePr, 590)
assert.equal(trigger.packageMergeSha, 'e798df275b2fad0601b2e9ef89c76a6a30f1d038')
assert.equal(trigger.executionPackagePr, 591)
assert.equal(trigger.executionPackageMergeSha, '5c302c8b674edd1d13ab5a467465ed60d0fb96c5')
assert.equal(trigger.storagePreflightPr, storagePreflight.acceptance.pr)
assert.equal(trigger.storagePreflightMergeSha, storagePreflight.acceptance.mergeSha)
assert.equal(trigger.storagePreflightObservedAt, storagePreflight.observedAt)
assert.equal(trigger.storagePreflightEvidenceDigest, storagePreflight.evidence.digest)
assert.equal(executionContract.trigger.freshReadOnlyPreflightInStartJobRequired, true)
assert.equal(executionContract.trigger.freshReadOnlyPreflightMustCompleteBeforeDeploy, true)
assert.deepEqual(executionContract.trigger.freshReadOnlyPreflightMethods.cloudflareApi, ['GET'])
assert.deepEqual(executionContract.trigger.freshReadOnlyPreflightMethods.d1, ['SELECT'])
assert.ok(workflow.includes('Run fresh read-only production preflight'))
assert.ok(workflow.includes('Start bounded Twitch category canary'))
assert.ok(workflow.indexOf('Run fresh read-only production preflight') < workflow.indexOf('Start bounded Twitch category canary'))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickConfig), false)

let result
try {
  fs.renameSync(triggerPath, temporaryPath)
  result = spawnSync(process.execPath, ['scripts/verify-development-policy.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  })
} finally {
  if (fs.existsSync(temporaryPath)) fs.renameSync(temporaryPath, triggerPath)
}

if (result?.stdout) process.stdout.write(result.stdout)
if (result?.stderr) process.stderr.write(result.stderr)
assert.equal(result?.status, 0, 'canonical development policy failed with armed trigger safely isolated')
assert.equal(fs.existsSync(triggerPath), true, 'armed trigger must be restored')

console.log(JSON.stringify({
  ok: true,
  triggerStatus: trigger.status,
  triggerProvider: trigger.provider,
  triggerAttempt: trigger.attempt,
  triggerPhase: inspected.phase,
  triggerAction: inspected.action,
  acceptedBaselinePinned: true,
  freshReadOnlyPreflightRequiredBeforeDeploy: true,
  canonicalVerifierPass: true,
  permanentRuntimeCaptureAuthorized: false,
  kickChanged: false,
}, null, 2))
