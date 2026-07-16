import assert from 'node:assert/strict'
import path from 'node:path'
import {
  inspectKickCanaryTrigger,
} from './inspect-12a4-kick-category-capture-canary-trigger.mjs'
import {
  activeTomlValue,
  bindingsMatchTrigger,
  canaryBindingsAbsent,
  canaryBindingsFromSettings,
  generatedCanaryConfigPath,
  projectKickStorage,
  renderActiveCanaryConfig,
} from './run-12a4-kick-category-capture-canary-execution.mjs'

const executionContract = {
  status: 'accepted',
  acceptance: { pr: 563, mergeSha: 'execution-merge-sha' },
  trigger: {
    schemaVersion: 'viewloom-12a4-kick-category-capture-canary-trigger-v1',
    exactPackagePr: 562,
    exactPackageMergeSha: '8dc53c6041f425f78e82cddb62328cff1128120f',
  },
}
const packageContract = { status: 'accepted', acceptance: { pr: 562 } }
const start = new Date('2026-07-16T00:00:00.000Z')
const trigger = {
  schemaVersion: 'viewloom-12a4-kick-category-capture-canary-trigger-v1',
  status: 'armed',
  provider: 'kick',
  oneTime: true,
  confirmation: 'RUN_KICK_CATEGORY_CAPTURE_CANARY',
  attempt: 1,
  packagePr: 562,
  packageMergeSha: '8dc53c6041f425f78e82cddb62328cff1128120f',
  executionPackagePr: 563,
  executionPackageMergeSha: 'execution-merge-sha',
  startAt: start.toISOString(),
  until: new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString(),
}

const absent = inspectKickCanaryTrigger({ trigger: null, executionContract, packageContract, eventName: 'pull_request', now: start })
assert.equal(absent.ok, true)
assert.equal(absent.action, 'noop')
assert.equal(absent.phase, 'dormant')

const pushBefore = inspectKickCanaryTrigger({ trigger, executionContract, packageContract, eventName: 'push', now: new Date(start.getTime() - 10 * 60 * 1000) })
assert.equal(pushBefore.ok, true)
assert.equal(pushBefore.action, 'start')
assert.equal(pushBefore.phase, 'before_start')

const scheduleBefore = inspectKickCanaryTrigger({ trigger, executionContract, packageContract, eventName: 'schedule', now: new Date(start.getTime() - 10 * 60 * 1000) })
assert.equal(scheduleBefore.action, 'noop')

const active = inspectKickCanaryTrigger({ trigger, executionContract, packageContract, eventName: 'schedule', now: new Date(start.getTime() + 12 * 60 * 60 * 1000) })
assert.equal(active.action, 'monitor')
assert.equal(active.phase, 'active_window')

const expired = inspectKickCanaryTrigger({ trigger, executionContract, packageContract, eventName: 'schedule', now: new Date(start.getTime() + 24 * 60 * 60 * 1000) })
assert.equal(expired.action, 'finalize')
assert.equal(expired.phase, 'after_expiry')

const badIdentity = inspectKickCanaryTrigger({ trigger: { ...trigger, executionPackageMergeSha: 'wrong' }, executionContract, packageContract, eventName: 'push', now: start })
assert.equal(badIdentity.ok, false)
assert.equal(badIdentity.action, 'reject')

const goodStorage = projectKickStorage(250 * 1024 * 1024)
assert.equal(goodStorage.currentMb, 250)
assert.equal(goodStorage.projectedNinetyDaySizeMb, 272.01)
assert.equal(goodStorage.projectedProviderHeadroomMb, 177.99)
assert.equal(goodStorage.pass, true)

const badStorage = projectKickStorage(310 * 1024 * 1024)
assert.equal(badStorage.projectedNinetyDaySizeMb, 332.01)
assert.equal(badStorage.pass, false)

const template = `
name = "viewloom-collector-kick"
main = "src/entry-category-canary.ts"
# database_id = "placeholder"
CATEGORY_CAPTURE_CANARY_ENABLED = "false"
CATEGORY_CAPTURE_CANARY_PROVIDER = "kick"
CATEGORY_CAPTURE_CANARY_STARTED_AT = ""
CATEGORY_CAPTURE_CANARY_UNTIL = ""
CATEGORY_CAPTURE_CANARY_ATTEMPT = "0"
database_id = "kick-database"
`
const rendered = renderActiveCanaryConfig(template, trigger)
assert.ok(rendered.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "true"'))
assert.ok(rendered.includes(`CATEGORY_CAPTURE_CANARY_STARTED_AT = "${trigger.startAt}"`))
assert.ok(rendered.includes(`CATEGORY_CAPTURE_CANARY_UNTIL = "${trigger.until}"`))
assert.ok(rendered.includes('CATEGORY_CAPTURE_CANARY_ATTEMPT = "1"'))
assert.equal(rendered.includes('\nCATEGORY_CAPTURE_ENABLED ='), false)
assert.equal(activeTomlValue(template, 'database_id'), 'kick-database')

const templatePath = path.resolve('workers/collector-kick/wrangler.category-canary.toml')
const activeConfigPath = generatedCanaryConfigPath(templatePath, trigger.attempt)
assert.equal(path.dirname(activeConfigPath), path.dirname(templatePath))
assert.equal(path.basename(activeConfigPath), '.wrangler.category-canary.active-attempt-1.toml')
assert.throws(() => generatedCanaryConfigPath(templatePath, 0), /invalid_canary_attempt/)

const settings = {
  result: {
    bindings: [
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ENABLED', text: 'true' },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_PROVIDER', text: 'kick' },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_STARTED_AT', text: trigger.startAt },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_UNTIL', text: trigger.until },
      { type: 'plain_text', name: 'CATEGORY_CAPTURE_CANARY_ATTEMPT', text: '1' },
    ],
  },
}
const bindings = canaryBindingsFromSettings(settings)
assert.equal(bindingsMatchTrigger(bindings, trigger), true)
assert.equal(bindings.categoryCaptureDirectFlagPresent, false)
assert.equal(bindingsMatchTrigger({ ...bindings, provider: 'twitch' }, trigger), false)
assert.equal(canaryBindingsAbsent(bindings), false)

const normalBindings = canaryBindingsFromSettings({ result: { bindings: [] } })
assert.equal(canaryBindingsAbsent(normalBindings), true)
assert.equal(bindingsMatchTrigger(normalBindings, trigger), false)

const partialBindings = { ...normalBindings, enabled: 'true' }
assert.equal(canaryBindingsAbsent(partialBindings), false)
assert.equal(bindingsMatchTrigger(partialBindings, trigger), false)

const directFlagBindings = canaryBindingsFromSettings({
  result: { bindings: [{ type: 'plain_text', name: 'CATEGORY_CAPTURE_ENABLED', text: 'true' }] },
})
assert.equal(canaryBindingsAbsent(directFlagBindings), false)
assert.equal(directFlagBindings.categoryCaptureDirectFlagPresent, true)

console.log(JSON.stringify({
  ok: true,
  phases: ['dormant', 'before_start', 'active_window', 'after_expiry'],
  actions: ['noop', 'start', 'monitor', 'finalize', 'reject'],
  projectedStoragePass: goodStorage,
  projectedStorageFailure: badStorage,
  generatedConfigDirectoryMatchesTemplate: true,
  activeBindingsMatch: true,
  normalBindingsAbsent: true,
  partialBindingsRejected: true,
  directCategoryFlagPresent: false,
}, null, 2))
