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
import { evaluateStartWait } from './wait-12a4-twitch-category-capture-canary-start.mjs'

const MB = 1024 * 1024
const HOUR_MS = 60 * 60 * 1000
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
    exactExecutionPackagePr: 591,
    exactExecutionPackageMergeSha: 'execution-merge-sha',
    storagePreflightStatusRequired: 'accepted',
    acceptedBaselinePreflightIdentityRequired: true,
    startBoundaryWaitBeforeFreshPreflightRequired: true,
    startBoundaryWaitMaximumHours: 3,
    freshReadOnlyPreflightInStartJobRequired: true,
    freshReadOnlyPreflightMustCompleteAfterStartBoundary: true,
    freshReadOnlyPreflightMustCompleteBeforeDeploy: true,
  },
  acceptance: {
    pr: 591,
    mergeSha: 'execution-merge-sha',
    mergeShaRecorded: true,
  },
}
const storagePreflight = {
  schemaVersion: 'viewloom-12a4-twitch-category-capture-canary-storage-preflight-v1',
  status: 'accepted',
  provider: 'twitch',
  observedAt: '2026-07-17T16:57:55.343Z',
  storage: { pass: true },
  acceptance: { pr: 599, mergeSha: '785a271a7b95808e01478b9fb3846028229faa24' },
  evidence: { digest: 'sha256:baseline-storage-preflight' },
}
const trigger = {
  schemaVersion: executionContract.trigger.schemaVersion,
  status: 'armed',
  provider: 'twitch',
  oneTime: true,
  confirmation: 'RUN_TWITCH_CATEGORY_CAPTURE_CANARY',
  attempt: 2,
  packagePr: 590,
  packageMergeSha: executionContract.trigger.exactPackageMergeSha,
  executionPackagePr: 591,
  executionPackageMergeSha: 'execution-merge-sha',
  storagePreflightPr: 599,
  storagePreflightMergeSha: storagePreflight.acceptance.mergeSha,
  storagePreflightObservedAt: storagePreflight.observedAt,
  storagePreflightEvidenceDigest: storagePreflight.evidence.digest,
  startAt: '2026-07-18T03:00:00.000Z',
  until: '2026-07-19T03:00:00.000Z',
}

const absent = inspectTwitchCanaryTrigger({
  trigger: null,
  executionContract,
  packageContract,
  storagePreflight: null,
  eventName: 'schedule',
  now: new Date('2026-07-18T01:00:00.000Z'),
})
assert.equal(absent.ok, true)
assert.equal(absent.present, false)
assert.equal(absent.action, 'noop')

const pushWithOldAcceptedBaseline = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  storagePreflight,
  eventName: 'push',
  now: new Date('2026-07-18T02:45:00.000Z'),
})
assert.equal(pushWithOldAcceptedBaseline.ok, true)
assert.equal(pushWithOldAcceptedBaseline.action, 'start')
assert.equal(pushWithOldAcceptedBaseline.phase, 'before_start')
assert.equal(pushWithOldAcceptedBaseline.acceptedBaselinePreflightPinned, true)
assert.equal(pushWithOldAcceptedBaseline.startBoundaryWaitRequiredBeforeFreshPreflight, true)
assert.equal(pushWithOldAcceptedBaseline.freshReadOnlyPreflightRequiredAfterStartBoundary, true)
assert.equal(pushWithOldAcceptedBaseline.freshReadOnlyPreflightRequiredBeforeDeploy, true)

const active = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  storagePreflight,
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
  storagePreflight,
  eventName: 'schedule',
  now: new Date('2026-07-19T03:01:00.000Z'),
})
assert.equal(expired.ok, true)
assert.equal(expired.action, 'finalize')

const expiredPush = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  storagePreflight,
  eventName: 'push',
  now: new Date('2026-07-19T03:01:00.000Z'),
})
assert.equal(expiredPush.ok, false)
assert.equal(expiredPush.action, 'reject')

const missingPreflight = inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  storagePreflight: null,
  eventName: 'push',
  now: new Date('2026-07-18T02:45:00.000Z'),
})
assert.equal(missingPreflight.ok, false)
assert.ok(missingPreflight.failures.some((failure) => failure.name === 'storage preflight present'))

const preflightMismatch = inspectTwitchCanaryTrigger({
  trigger: { ...trigger, storagePreflightEvidenceDigest: 'sha256:wrong' },
  executionContract,
  packageContract,
  storagePreflight,
  eventName: 'push',
  now: new Date('2026-07-18T02:45:00.000Z'),
})
assert.equal(preflightMismatch.ok, false)
assert.ok(preflightMismatch.failures.some((failure) => failure.name === 'storage preflight digest identity'))

const noStartWait = inspectTwitchCanaryTrigger({
  trigger,
  executionContract: {
    ...executionContract,
    trigger: { ...executionContract.trigger, startBoundaryWaitBeforeFreshPreflightRequired: false },
  },
  packageContract,
  storagePreflight,
  eventName: 'push',
  now: new Date('2026-07-18T02:45:00.000Z'),
})
assert.equal(noStartWait.ok, false)
assert.ok(noStartWait.failures.some((failure) => failure.name === 'start boundary wait required before fresh preflight'))

const preflightNotAfterBoundary = inspectTwitchCanaryTrigger({
  trigger,
  executionContract: {
    ...executionContract,
    trigger: { ...executionContract.trigger, freshReadOnlyPreflightMustCompleteAfterStartBoundary: false },
  },
  packageContract,
  storagePreflight,
  eventName: 'push',
  now: new Date('2026-07-18T02:45:00.000Z'),
})
assert.equal(preflightNotAfterBoundary.ok, false)
assert.ok(preflightNotAfterBoundary.failures.some((failure) => failure.name === 'fresh read-only preflight after start boundary'))

const wrongProvider = inspectTwitchCanaryTrigger({
  trigger: { ...trigger, provider: 'kick' },
  executionContract,
  packageContract,
  storagePreflight,
  eventName: 'push',
  now: new Date('2026-07-18T02:45:00.000Z'),
})
assert.equal(wrongProvider.ok, false)

const waitBeforeStart = evaluateStartWait(trigger, new Date('2026-07-18T02:45:00.000Z'))
assert.equal(waitBeforeStart.ok, true)
assert.equal(waitBeforeStart.waitMs, 15 * 60 * 1000)
assert.equal(waitBeforeStart.reached, false)

const waitAtStart = evaluateStartWait(trigger, new Date(trigger.startAt))
assert.equal(waitAtStart.ok, true)
assert.equal(waitAtStart.waitMs, 0)
assert.equal(waitAtStart.reached, true)

const waitAfterStart = evaluateStartWait(trigger, new Date('2026-07-18T03:05:00.000Z'))
assert.equal(waitAfterStart.ok, true)
assert.equal(waitAfterStart.waitMs, 0)
assert.equal(waitAfterStart.reached, true)

const waitTooLong = evaluateStartWait(trigger, new Date('2026-07-17T23:59:59.000Z'), 3 * HOUR_MS)
assert.equal(waitTooLong.ok, false)
assert.equal(waitTooLong.failure.name, 'start_wait_exceeds_limit')

const waitExpired = evaluateStartWait(trigger, new Date('2026-07-19T03:00:00.000Z'))
assert.equal(waitExpired.ok, false)
assert.equal(waitExpired.failure.name, 'trigger_expired_before_wait')

const invalidStart = evaluateStartWait({ ...trigger, startAt: 'invalid' }, new Date('2026-07-18T02:45:00.000Z'))
assert.equal(invalidStart.ok, false)
assert.equal(invalidStart.failure.name, 'invalid_start_at')

const invalidWindow = evaluateStartWait({ ...trigger, until: trigger.startAt }, new Date('2026-07-18T02:45:00.000Z'))
assert.equal(invalidWindow.ok, false)
assert.equal(invalidWindow.failure.name, 'invalid_window')

const acceptedStorage = projectTwitchStorage(390.38 * MB, 3716.59 * MB)
assert.equal(acceptedStorage.projectedNinetyDaySizeMb, 438.7)
assert.equal(acceptedStorage.projectedProviderHeadroomMb, 11.3)
assert.equal(acceptedStorage.projectedAccountWideHeadroomMb, 843.09)
assert.equal(acceptedStorage.pass, true)
assert.equal(projectTwitchStorage(395 * MB, 3716.59 * MB).pass, false)
assert.equal(projectTwitchStorage(390.38 * MB, 4100 * MB).pass, false)

const template = fs.readFileSync('workers/collector-twitch/wrangler.category-canary.toml', 'utf8')
const normal = fs.readFileSync('workers/collector-twitch/wrangler.toml', 'utf8')
const rendered = renderActiveCanaryConfig(template, trigger)
assert.ok(rendered.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "true"'))
assert.ok(rendered.includes('CATEGORY_CAPTURE_CANARY_PROVIDER = "twitch"'))
assert.ok(rendered.includes(`CATEGORY_CAPTURE_CANARY_STARTED_AT = "${trigger.startAt}"`))
assert.ok(rendered.includes(`CATEGORY_CAPTURE_CANARY_UNTIL = "${trigger.until}"`))
assert.ok(rendered.includes('CATEGORY_CAPTURE_CANARY_ATTEMPT = "2"'))
assert.equal(rendered.includes('\nCATEGORY_CAPTURE_ENABLED ='), false)
assert.equal(activeTomlValue(template, 'database_id'), activeTomlValue(normal, 'database_id'))
assert.equal(activeTomlValue(template, 'name'), activeTomlValue(normal, 'name'))

const generated = generatedCanaryConfigPath('workers/collector-twitch/wrangler.category-canary.toml', 3)
assert.equal(path.basename(generated), '.wrangler.category-canary.active-attempt-3.toml')
assert.throws(() => generatedCanaryConfigPath('workers/collector-twitch/wrangler.category-canary.toml', 0), /invalid_canary_attempt/)

const activeBindings = canaryBindingsFromSettings({
  result: {
    bindings: [
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ENABLED', text: 'true' },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_PROVIDER', text: 'twitch' },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_STARTED_AT', text: trigger.startAt },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_UNTIL', text: trigger.until },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ATTEMPT', text: '2' },
    ],
  },
})
assert.equal(bindingsMatchTrigger(activeBindings, trigger), true)
assert.equal(canaryBindingsAbsent(activeBindings), false)

const normalBindings = canaryBindingsFromSettings({ result: { bindings: [] } })
assert.equal(canaryBindingsAbsent(normalBindings), true)
assert.equal(bindingsMatchTrigger(normalBindings, trigger), false)

console.log(JSON.stringify({
  ok: true,
  triggerAbsentNoop: true,
  oldAcceptedBaselineIdentityAccepted: true,
  startBoundaryWaitRequired: true,
  inlineFreshPreflightRequiredAfterStartBoundary: true,
  startActionVerified: true,
  monitorActionVerified: true,
  finalizeActionVerified: true,
  expiredPushRejected: true,
  missingBaselineRejected: true,
  baselineIdentityMismatchRejected: true,
  providerMismatchRejected: true,
  exactWaitVerified: true,
  waitLimitVerified: true,
  expiredWaitRejected: true,
  invalidWaitInputsRejected: true,
  providerStorageGateVerified: true,
  accountStorageGateVerified: true,
  generatedConfigContainsNoDirectFlag: true,
  normalBindingNoopVerified: true,
}, null, 2))
