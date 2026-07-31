import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  trigger: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  executionContract: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-package-contract.json',
  executionAcceptance: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-package-acceptance.json',
  triggerContract: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger-contract.json',
  dormantContract: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json',
  dormantAcceptance: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-acceptance.json',
  twitchPermanentConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kickPermanentConfig: 'workers/collector-kick/wrangler.category-permanent.toml',
}
for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const trigger = json(files.trigger)
const executionContract = json(files.executionContract)
const executionAcceptance = json(files.executionAcceptance)
const triggerContract = json(files.triggerContract)
const dormantContract = json(files.dormantContract)
const dormantAcceptance = json(files.dormantAcceptance)

assert.equal(executionContract.status, 'accepted')
assert.equal(executionContract.packageIdentity.packagePr, 685)
assert.equal(executionContract.packageIdentity.packageMergeSha, '0a8f2931524d08dae42dee302df24a30da544949')
assert.equal(executionContract.packageIdentity.acceptancePr, 686)
assert.equal(executionContract.packageIdentity.productionExecutionPerformed, false)
assert.equal(executionContract.startBoundary.executeImmediatelyAfterExactTriggerMerge, true)
assert.equal(executionContract.startBoundary.startAtFieldAllowed, false)
assert.equal(executionContract.startBoundary.preStartSleepAllowed, false)
assert.equal(executionContract.startBoundary.longInJobWaitAllowed, false)
assert.equal(executionContract.timeoutEnvelopeMinutes.requiredMaximum, 44)
assert.equal(executionContract.timeoutEnvelopeMinutes.jobTimeout, 50)
assert.ok(executionContract.timeoutEnvelopeMinutes.jobTimeout > executionContract.timeoutEnvelopeMinutes.requiredMaximum)

assert.equal(executionAcceptance.status, 'accepted')
assert.equal(executionAcceptance.packagePr, executionContract.packageIdentity.packagePr)
assert.equal(executionAcceptance.packageMergeSha, executionContract.packageIdentity.packageMergeSha)
assert.equal(executionAcceptance.acceptancePr, executionContract.packageIdentity.acceptancePr)
assert.equal(executionAcceptance.validation.conclusion, 'success')
assert.equal(executionAcceptance.acceptedCapabilities.immediateExactTriggerRequired, true)
assert.equal(executionAcceptance.acceptedCapabilities.startAtForbidden, true)
assert.equal(executionAcceptance.acceptedCapabilities.preStartSleepForbidden, true)
assert.equal(executionAcceptance.acceptedCapabilities.separateExactTriggerRequired, true)
assert.equal(executionAcceptance.acceptedCapabilities.semanticMappingAccepted, false)
assert.equal(executionAcceptance.acceptedCapabilities.stabilityClockStartAccepted, false)
assert.equal(executionAcceptance.acceptedCapabilities.finalModeAccepted, false)
assert.equal(executionAcceptance.acceptedCapabilities.publicCategoryUiAccepted, false)
for (const value of Object.values(executionAcceptance.boundaries)) assert.equal(value, false)

assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.executionPackageIdentity.packagePr, executionContract.packageIdentity.packagePr)
assert.equal(triggerContract.executionPackageIdentity.packageMergeSha, executionContract.packageIdentity.packageMergeSha)
assert.equal(triggerContract.executionPackageIdentity.acceptancePr, executionContract.packageIdentity.acceptancePr)
assert.equal(triggerContract.trigger.exactOneFilePrRequired, true)
assert.equal(triggerContract.trigger.executeImmediately, true)
assert.equal(triggerContract.trigger.startAtAllowed, false)

assert.equal(dormantContract.status, 'accepted')
assert.equal(dormantContract.packageIdentity.packagePr, 682)
assert.equal(dormantContract.packageIdentity.acceptancePr, 684)
assert.equal(dormantAcceptance.status, 'accepted')
assert.equal(dormantAcceptance.acceptedCapabilities.productionActivationAccepted, false)

const expectedKeys = [
  'acceptancePr',
  'confirmation',
  'executeImmediately',
  'mode',
  'oneTime',
  'packageMergeSha',
  'packagePr',
  'phase',
  'provider',
  'schemaVersion',
  'status',
  'trackingIssue',
].sort()
assert.deepEqual(Object.keys(trigger).sort(), expectedKeys)
assert.equal(Object.hasOwn(trigger, 'startAt'), false)
assert.equal(trigger.schemaVersion, triggerContract.trigger.schemaVersion)
assert.equal(trigger.status, triggerContract.trigger.status)
assert.equal(trigger.phase, '12A-5B-R2')
assert.equal(trigger.trackingIssue, 659)
assert.equal(trigger.provider, 'twitch')
assert.equal(trigger.mode, 'category_source_v2_observation')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.executeImmediately, true)
assert.equal(trigger.confirmation, triggerContract.trigger.confirmation)
assert.equal(trigger.packagePr, executionContract.packageIdentity.packagePr)
assert.equal(trigger.packageMergeSha, executionContract.packageIdentity.packageMergeSha)
assert.equal(trigger.acceptancePr, executionContract.packageIdentity.acceptancePr)

const twitchPermanent = read(files.twitchPermanentConfig)
const kickPermanent = read(files.kickPermanentConfig)
assert.equal(twitchPermanent.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(kickPermanent.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(kickPermanent.includes('category-source-v2-candidate'), false)

console.log(JSON.stringify({
  ok: true,
  trigger: 'exact_immediate_one_file',
  provider: trigger.provider,
  packagePr: trigger.packagePr,
  packageMergeSha: trigger.packageMergeSha,
  acceptancePr: trigger.acceptancePr,
  startAtPresent: false,
  productionExecutionOnPullRequest: false,
  publicCategoryUiAuthorized: false,
}, null, 2))
