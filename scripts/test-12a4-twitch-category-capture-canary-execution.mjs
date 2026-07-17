import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { inspectTwitchCanaryTrigger } from './inspect-12a4-twitch-category-capture-canary-trigger.mjs'
import {
  activeTomlValue,
  bindingsMatchTrigger,
  canaryBindingsAbsent,
  canaryBindingsFromSettings,
  generatedCanaryConfigPath,
  projectTwitchStorage,
  renderActiveCanaryConfig,
} from './run-12a4-twitch-category-capture-canary-execution.mjs'

const MB = 1024 * 1024
const packageContract = {
  status: 'accepted',
  acceptance: { pr: 590 },
}
const executionContract = {
  status: 'accepted',
  trigger: {
    schemaVersion: 'viewloom-12a4-twitch-category-capture-canary-trigger-v1',
    exactPackagePr: 590,
    exactPackageMergeSha: 'e798df275b2fad0601b2e9ef89c76a6a30f1d038',
  },
  acceptance: {
    pr: 591,
    mergeSha: 'execution-merge-sha',
    mergeShaRecorded: true,
  },
}
const trigger = {
  schemaVersion: executionContract.trigger.schemaVersion,
  status: 'armed',
  provider: 'twitch',
  oneTime: true,
  confirmation: 'RUN_TWITCH_CATEGORY_CAPTURE_CANARY',
  attempt: 1,
  packagePr: 590,
  packageMergeSha: executionContract.trigger.exactPackageMergeSha,
  executionPackagePr: 591,
  executionPackageMergeSha: 'execution-merge-sha',
  startAt: '2026-07-18T00:00:00.000Z',
  until: '2026-07-19T00:00:00.000Z',
}

const absent = inspectTwitchCanaryTrigger({
  trigger: null,
  executionContract,
  packageContract,
  eventName: 'schedule',
  now: new Date('2026-07-18T01:00:00.000Z'),
})
assert.equal(absent.ok, true)
assert.equal(absent.present, false)
assert.equal(absent.action, 'noop')

const pushBefore = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  eventName: 'push',
  now: new Date('2026-07-17T23:55:00.000Z'),
})
assert.equal(pushBefore.ok, true)
assert.equal(pushBefore.action, 'start')
assert.equal(pushBefore.phase, 'before_start')

const active = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  eventName: 'schedule',
  now: new Date('2026-07-18T12:00:00.000Z'),
})
assert.equal(active.ok, true)
assert.equal(active.action, 'monitor')
assert.equal(active.phase, 'active_window')

const expired = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  eventName: 'schedule',
  now: new Date('2026-07-19T00:01:00.000Z'),
})
assert.equal(expired.ok, true)
assert.equal(expired.action, 'finalize')
assert.equal(expired.phase, 'after_expiry')

const expiredPush = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  eventName: 'push',
  now: new Date('2026-07-19T00:01:00.000Z'),
})
assert.equal(expiredPush.ok, false)
assert.equal(expiredPush.action, 'reject')

const mismatched = inspectTwitchCanaryTrigger({
  trigger: { ...trigger, provider: 'kick' },
  executionContract,
  packageContract,
  eventName: 'push',
  now: new Date('2026-07-18T00:00:00.000Z'),
})
assert.equal(mismatched.ok, false)
assert.equal(mismatched.action, 'reject')

const acceptedStorage = projectTwitchStorage(390.38 * MB, 3716.59 * MB)
assert.equal(acceptedStorage.projectedNinetyDaySizeMb, 438.7)
assert.equal(acceptedStorage.projectedProviderHeadroomMb, 11.3)
assert.equal(acceptedStorage.projectedAccountWideSizeMb, 3764.91)
assert.equal(acceptedStorage.projectedAccountWideHeadroomMb, 843.09)
assert.equal(acceptedStorage.providerPass, true)
assert.equal(acceptedStorage.accountPass, true)
assert.equal(acceptedStorage.pass, true)

const providerFailure = projectTwitchStorage(395 * MB, 3716.59 * MB)
assert.equal(providerFailure.providerPass, false)
assert.equal(providerFailure.pass, false)

const accountFailure = projectTwitchStorage(390.38 * MB, 4100 * MB)
assert.equal(accountFailure.providerPass, true)
assert.equal(accountFailure.accountPass, false)
assert.equal(accountFailure.pass, false)

const template = fs.readFileSync('workers/collector-twitch/wrangler.category-canary.toml', 'utf8')
const normal = fs.readFileSync('workers/collector-twitch/wrangler.toml', 'utf8')
const rendered = renderActiveCanaryConfig(template, trigger)
assert.ok(rendered.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "true"'))
assert.ok(rendered.includes('CATEGORY_CAPTURE_CANARY_PROVIDER = "twitch"'))
assert.ok(rendered.includes(`CATEGORY_CAPTURE_CANARY_STARTED_AT = "${trigger.startAt}"`))
assert.ok(rendered.includes(`CATEGORY_CAPTURE_CANARY_UNTIL = "${trigger.until}"`))
assert.ok(rendered.includes('CATEGORY_CAPTURE_CANARY_ATTEMPT = "1"'))
assert.equal(rendered.includes('\nCATEGORY_CAPTURE_ENABLED ='), false)
assert.equal(normal.includes('CATEGORY_CAPTURE_CANARY_ENABLED'), false)
assert.equal(activeTomlValue(template, 'database_id'), activeTomlValue(normal, 'database_id'))
assert.equal(activeTomlValue(template, 'name'), activeTomlValue(normal, 'name'))

const generated = generatedCanaryConfigPath('workers/collector-twitch/wrangler.category-canary.toml', 3)
assert.equal(path.basename(generated), '.wrangler.category-canary.active-attempt-3.toml')
assert.throws(() => generatedCanaryConfigPath('workers/collector-twitch/wrangler.category-canary.toml', 0), /invalid_canary_attempt/)

const activeSettings = {
  result: {
    bindings: [
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ENABLED', text: 'true' },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_PROVIDER', text: 'twitch' },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_STARTED_AT', text: trigger.startAt },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_UNTIL', text: trigger.until },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ATTEMPT', text: '1' },
    ],
  },
}
const activeBindings = canaryBindingsFromSettings(activeSettings)
assert.equal(bindingsMatchTrigger(activeBindings, trigger), true)
assert.equal(canaryBindingsAbsent(activeBindings), false)

const normalBindings = canaryBindingsFromSettings({ result: { bindings: [] } })
assert.equal(canaryBindingsAbsent(normalBindings), true)
assert.equal(bindingsMatchTrigger(normalBindings, trigger), false)

const mismatchedBindings = canaryBindingsFromSettings({
  result: {
    bindings: [
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ENABLED', text: 'true' },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_PROVIDER', text: 'kick' },
    ],
  },
})
assert.equal(bindingsMatchTrigger(mismatchedBindings, trigger), false)
assert.equal(canaryBindingsAbsent(mismatchedBindings), false)

console.log(JSON.stringify({
  ok: true,
  triggerAbsentNoop: true,
  startActionVerified: true,
  monitorActionVerified: true,
  finalizeActionVerified: true,
  expiredPushRejected: true,
  providerMismatchRejected: true,
  providerStorageGateVerified: true,
  accountStorageGateVerified: true,
  generatedConfigContainsNoDirectFlag: true,
  normalBindingNoopVerified: true,
  mismatchedBindingRollbackRequired: true,
}, null, 2))
