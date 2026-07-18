import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { inspectTwitchCanaryTrigger } from './inspect-12a4-twitch-category-capture-canary-trigger.mjs'

const TRIGGER_PATH = 'docs/audits/12a4-twitch-category-capture-canary-trigger.json'
const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const changed = changedFiles()
assert.deepEqual(changed, [TRIGGER_PATH], `exact one-file trigger required: ${JSON.stringify(changed)}`)
assert.equal(fs.existsSync(TRIGGER_PATH), true, 'Twitch trigger must exist')

const trigger = json(TRIGGER_PATH)
const executionContract = json('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-twitch-category-capture-canary-package-contract.json')
const storagePreflight = json(executionContract.trigger.storagePreflightContract)
const workflow = read(executionContract.workflow.path)
const normalConfig = read('workers/collector-twitch/wrangler.toml')
const canaryConfig = read('workers/collector-twitch/wrangler.category-canary.toml')

assert.equal(executionContract.status, 'accepted')
assert.equal(executionContract.trigger.oneFileTriggerPrRequired, true)
assert.equal(executionContract.trigger.acceptedBaselinePreflightIdentityRequired, true)
assert.equal(executionContract.trigger.freshReadOnlyPreflightInStartJobRequired, true)
assert.equal(executionContract.trigger.freshReadOnlyPreflightMustCompleteBeforeDeploy, true)
assert.deepEqual(executionContract.trigger.freshReadOnlyPreflightMethods.cloudflareApi, ['GET'])
assert.deepEqual(executionContract.trigger.freshReadOnlyPreflightMethods.d1, ['SELECT'])

const inspected = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  storagePreflight,
  eventName: 'push',
  now: new Date(),
})
assert.equal(inspected.ok, true, JSON.stringify(inspected.failures ?? []))
assert.equal(inspected.present, true)
assert.equal(inspected.action, 'start')
assert.equal(inspected.provider, 'twitch')
assert.equal(inspected.acceptedBaselinePreflightPinned, true)
assert.equal(inspected.freshReadOnlyPreflightRequiredBeforeDeploy, true)

assert.equal(trigger.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-trigger-v1')
assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'twitch')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.confirmation, 'RUN_TWITCH_CATEGORY_CAPTURE_CANARY')
assert.equal(Number.isSafeInteger(trigger.attempt) && trigger.attempt > 0, true)
assert.equal(trigger.packagePr, 590)
assert.equal(trigger.packageMergeSha, 'e798df275b2fad0601b2e9ef89c76a6a30f1d038')
assert.equal(trigger.executionPackagePr, 591)
assert.equal(trigger.executionPackageMergeSha, '5c302c8b674edd1d13ab5a467465ed60d0fb96c5')
assert.equal(trigger.storagePreflightPr, storagePreflight.acceptance.pr)
assert.equal(trigger.storagePreflightMergeSha, storagePreflight.acceptance.mergeSha)
assert.equal(trigger.storagePreflightObservedAt, storagePreflight.observedAt)
assert.equal(trigger.storagePreflightEvidenceDigest, storagePreflight.evidence.digest)

const now = Date.now()
const start = Date.parse(trigger.startAt)
const until = Date.parse(trigger.until)
assert.equal(Number.isFinite(start), true)
assert.equal(Number.isFinite(until), true)
assert.equal(until - start >= 23 * 60 * 60 * 1000, true)
assert.equal(until - start <= 25 * 60 * 60 * 1000, true)
assert.equal(start - now <= 3 * 60 * 60 * 1000, true, 'start must be within runner wait limit')
assert.equal(until > now, true, 'trigger must not already be expired')

assert.ok(workflow.includes('Create ephemeral read-only preflight request'))
assert.ok(workflow.includes('Run fresh read-only production preflight'))
assert.ok(workflow.includes('Start bounded Twitch category canary'))
assert.ok(workflow.indexOf('Run fresh read-only production preflight') < workflow.indexOf('Start bounded Twitch category canary'))
assert.ok(workflow.includes('fresh-storage-preflight.json'))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=\s*"false"/.test(canaryConfig), true)
assert.equal(/\nCATEGORY_CAPTURE_ENABLED\s*=/.test(canaryConfig), false)

console.log(JSON.stringify({
  ok: true,
  changed,
  provider: trigger.provider,
  attempt: trigger.attempt,
  startAt: trigger.startAt,
  until: trigger.until,
  baselinePreflightPr: trigger.storagePreflightPr,
  acceptedBaselinePinned: true,
  freshReadOnlyPreflightRequiredBeforeDeploy: true,
  triggerOnly: true,
  productionExecutionFromPullRequest: false,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))

function changedFiles() {
  const baseRef = String(process.env.GITHUB_BASE_REF ?? '').trim()
  let range
  if (baseRef) {
    const base = `origin/${baseRef}`
    const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
    range = `${mergeBase}...HEAD`
  } else {
    const before = String(process.env.GITHUB_EVENT_BEFORE ?? '').trim()
    const validBefore = /^[a-f0-9]{40}$/i.test(before) && !/^0+$/.test(before)
    range = validBefore ? `${before}...HEAD` : 'HEAD^...HEAD'
  }
  return execFileSync('git', ['diff', '--name-only', range], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
    .sort()
}
