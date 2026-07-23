import assert from 'node:assert/strict'
import fs from 'node:fs'
import { inspectReleaseTrigger } from './inspect-12a4-kick-permanent-category-release-trigger.mjs'
import { releaseAccepted, requiredReleaseGates } from './run-12a4-kick-permanent-category-release.mjs'
import { evaluateReleaseStartWait } from './wait-12a4-kick-permanent-category-release-start.mjs'

const HOUR = 60 * 60 * 1000
const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-kick-permanent-category-release-contract.json', 'utf8'))
const gate = JSON.parse(fs.readFileSync(contract.acceptedPackage.canonicalGate, 'utf8'))
const packageContract = JSON.parse(fs.readFileSync(contract.acceptedPackage.packageContract, 'utf8'))
const permanent = fs.readFileSync(contract.acceptedPackage.permanentConfig, 'utf8')
const normal = fs.readFileSync(contract.acceptedPackage.rollbackConfig, 'utf8')
const twitch = fs.readFileSync('workers/collector-twitch/wrangler.category-permanent.toml', 'utf8')
const observer = fs.readFileSync(contract.acceptedPackage.readOnlyObserver, 'utf8')

const now = new Date('2026-07-23T12:00:00.000Z')
const trigger = {
  schemaVersion: contract.trigger.schemaVersion,
  status: contract.trigger.status,
  provider: 'kick',
  oneTime: true,
  confirmation: contract.trigger.confirmation,
  implementationPr: contract.trigger.implementationPr,
  implementationMergeSha: contract.trigger.implementationMergeSha,
  acceptancePr: contract.trigger.acceptancePr,
  acceptanceMergeSha: contract.trigger.acceptanceMergeSha,
  releasePackagePr: contract.trigger.releasePackagePr,
  releasePackageMergeSha: 'a'.repeat(40),
  startAt: '2026-07-23T12:30:00.000Z',
}
const acceptedContract = {
  ...contract,
  status: 'accepted',
  acceptance: { pr: 999, mergeSha: trigger.releasePackageMergeSha },
}
const acceptedGate = {
  ...gate,
  currentWorkstream: {
    ...gate.currentWorkstream,
    kickReleasePackageAccepted: true,
    kickPermanentCaptureActive: false,
    twitchPermanentCaptureActive: true,
    twitchHeatmapCategoryFilterPublicExposureAuthorized: false,
  },
}

const absent = inspectReleaseTrigger({ trigger: null, contract, gate, eventName: 'pull_request', now })
assert.equal(absent.ok, true)
assert.equal(absent.action, 'noop')
assert.equal(absent.productionAuthorized, false)

const validated = inspectReleaseTrigger({ trigger, contract: acceptedContract, gate: acceptedGate, eventName: 'pull_request', now })
assert.equal(validated.ok, true)
assert.equal(validated.action, 'validate')
assert.equal(validated.productionAuthorized, false)
const start = inspectReleaseTrigger({ trigger, contract: acceptedContract, gate: acceptedGate, eventName: 'push', now })
assert.equal(start.ok, true)
assert.equal(start.action, 'start')
assert.equal(start.productionAuthorized, true)

for (const [name, changed] of [
  ['wrong provider', { provider: 'twitch' }],
  ['wrong confirmation', { confirmation: 'NO' }],
  ['wrong implementation', { implementationMergeSha: 'b'.repeat(40) }],
  ['wrong acceptance', { acceptanceMergeSha: 'c'.repeat(40) }],
  ['wrong release package', { releasePackagePr: 999 }],
  ['wrong release merge', { releasePackageMergeSha: 'd'.repeat(40) }],
  ['invalid start', { startAt: 'invalid' }],
]) {
  const result = inspectReleaseTrigger({ trigger: { ...trigger, ...changed }, contract: acceptedContract, gate: acceptedGate, eventName: 'push', now })
  assert.equal(result.ok, false, name)
  assert.equal(result.action, 'reject', name)
}

const wrongGate = inspectReleaseTrigger({
  trigger,
  contract: acceptedContract,
  gate: { ...acceptedGate, schemaVersion: 'old' },
  eventName: 'push',
  now,
})
assert.equal(wrongGate.ok, false)
const wrongTwitchBoundary = inspectReleaseTrigger({
  trigger,
  contract: acceptedContract,
  gate: {
    ...acceptedGate,
    currentWorkstream: { ...acceptedGate.currentWorkstream, twitchPermanentCaptureActive: false },
  },
  eventName: 'push',
  now,
})
assert.equal(wrongTwitchBoundary.ok, false)

const before = evaluateReleaseStartWait(trigger, now)
assert.equal(before.ok, true)
assert.equal(before.waitMs, 30 * 60 * 1000)
assert.equal(before.reached, false)
const at = evaluateReleaseStartWait(trigger, new Date(trigger.startAt))
assert.equal(at.ok, true)
assert.equal(at.waitMs, 0)
assert.equal(at.reached, true)
const tooEarly = evaluateReleaseStartWait({ ...trigger, startAt: '2026-07-23T16:00:01.000Z' }, now, 3 * HOUR)
assert.equal(tooEarly.ok, false)
assert.equal(tooEarly.failure.name, 'start_wait_exceeds_limit')
const tooLate = evaluateReleaseStartWait(trigger, new Date('2026-07-23T15:30:00.000Z'))
assert.equal(tooLate.ok, false)
assert.equal(tooLate.failure.name, 'release_start_too_stale')

const acceptedEvidence = {
  triggerPass: true,
  preflight: { outcome: 'accepted' },
  permanentDeploymentExitCode: 0,
  initialObservation: {
    outcome: 'accepted',
    gates: { bindingsPass: true, providerLeakagePass: true, categorySnapshotPass: true },
  },
  gates: { twitchChanged: false },
}
assert.equal(requiredReleaseGates(acceptedEvidence).length, 8)
assert.equal(releaseAccepted(acceptedEvidence), true)
assert.equal(releaseAccepted({ ...acceptedEvidence, permanentDeploymentExitCode: 1 }), false)
assert.equal(releaseAccepted({ ...acceptedEvidence, gates: { twitchChanged: true } }), false)
assert.equal(releaseAccepted({
  ...acceptedEvidence,
  initialObservation: { ...acceptedEvidence.initialObservation, gates: { ...acceptedEvidence.initialObservation.gates, categorySnapshotPass: false } },
}), false)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.packagePr, 637)
assert.equal(packageContract.acceptance.packageMergeSha, contract.acceptedPackage.implementationMergeSha)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanent), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(twitch), true)
assert.ok(observer.includes("schemaVersion: 'viewloom-12a4-kick-permanent-category-readonly-evidence-v1'"))
assert.ok(observer.includes('latestNormalSnapshot'))
assert.ok(observer.includes('rollbackNormalSnapshotPass'))
assert.ok(observer.includes('normal_payload_rows_since_start'))
assert.ok(observer.includes('twitchMutationAuthorized: false'))

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-24B',
  provider: 'kick',
  absentTriggerNoop: true,
  pullRequestValidationOnly: true,
  pushStartVerified: true,
  identityMismatchesRejected: true,
  exactStartWaitVerified: true,
  releaseAcceptanceGatesVerified: true,
  rollbackNormalSnapshotProofRequired: true,
  twitchBoundaryVerified: true,
}, null, 2))