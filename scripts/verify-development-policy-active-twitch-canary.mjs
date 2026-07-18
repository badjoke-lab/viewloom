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
const gate = json('docs/audits/12a2-current-gate-state.json')
const startEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json')
const checkpointEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json')
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
assert.equal(trigger.attempt, 3)
assert.equal(trigger.startAt, '2026-07-18T05:15:00.000Z')
assert.equal(trigger.until, '2026-07-19T05:15:00.000Z')
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
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v21')
assert.equal(gate.status, '12a4_twitch_canary_attempt3_active_initial_checkpoint_accepted')
assert.equal(gate.currentWorkstream.phase, '12A-4-17')
assert.equal(gate.currentWorkstream.twitchCanaryObservationActive, true)
assert.equal(gate.currentWorkstream.finalRollbackPending, true)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(executionContract.runtimeState, 'active_initial_checkpoint_accepted')
assert.equal(startEvidence.outcome, 'started')
assert.equal(checkpointEvidence.outcome, 'checkpoint_pass')
assert.equal(checkpointEvidence.queryEvidence.providerLeakageRows, 0)
assert.equal(checkpointEvidence.gates.permanentEnablementAuthorized, false)
assert.equal(checkpointEvidence.gates.kickStartAuthorized, false)

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
