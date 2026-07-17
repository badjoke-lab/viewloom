import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json')
const trigger = json(contract.trigger.path)
const finalEvidence = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-evidence.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const twitchConfig = read('workers/collector-twitch/wrangler.toml')
const workflow = read('.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml')
const note = read('docs/work-in-progress/phase12a4-kick-canary-expiry-binding-cleanup.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-canary-expiry-binding-cleanup-v1')
assert.equal(contract.status, 'accepted_and_retired')
assert.equal(contract.provider, 'kick')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.rejectedAcceptanceEvidence.onlyFailedGate, 'canaryBindingsAbsent')
assert.equal(contract.cleanup.deployNormalConfigOnly, true)
assert.equal(contract.cleanup.manualCollect, false)
assert.equal(Object.values(contract.hardBoundary).every((value) => value === false), true)
assert.equal(contract.acceptance.cleanupPackagePr, 586)
assert.equal(contract.acceptance.cleanupTriggerPr, 587)
assert.equal(contract.acceptance.finalWorkflowJobId, 87822408236)
assert.equal(contract.acceptance.finalArtifactId, 8399137444)
assert.equal(contract.acceptance.canaryBindingsAbsent, true)
assert.equal(contract.acceptance.permanentCategoryFlagAbsent, true)
assert.equal(contract.acceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(contract.acceptance.providerLeakageRows, 0)
assert.equal(contract.acceptance.outcome, 'accepted')
assert.equal(contract.acceptance.productionPathRetired, true)
assert.equal(contract.acceptance.twitchChanged, false)

assert.equal(trigger.status, 'consumed_and_retired')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.retired, true)
assert.equal(trigger.consumedByPr, 587)
assert.equal(trigger.consumedByMergeSha, '7fbc343207de235ae583e827ba2fa7796083faf4')
assert.equal(trigger.acceptedArtifactId, 8399137444)

assert.equal(finalEvidence.outcome, 'accepted')
assert.equal(finalEvidence.gates.canaryBindingsAbsent, true)
assert.equal(finalEvidence.gates.permanentDirectFlagAbsent, true)
assert.equal(finalEvidence.gates.noCategoryPayloadAfterGracePass, true)
assert.equal(finalEvidence.gates.providerLeakagePass, true)
assert.equal(finalEvidence.gates.normalSnapshotAuthenticatedPass, true)
assert.equal(finalEvidence.gates.normalSnapshotNonemptyPass, true)
assert.equal(finalEvidence.gates.twitchStartAuthorized, false)
assert.equal(finalEvidence.gates.productionMutationAuthorized, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.status, '12a4_kick_canary_final_evidence_accepted')
assert.equal(gate.categoryCapture.kickCanaryFinalAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.kickCanaryObservationActive, false)
assert.equal(gate.categoryCapture.boundedCanaryRuntimeCaptureActive, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.phase, '12A-4-12')
assert.equal(gate.currentWorkstream.finalRollbackPending, false)
assert.equal(gate.currentWorkstream.twitchCanaryAutomaticStartAuthorized, false)

assert.ok(normalConfig.includes(`crons = ["${contract.cleanup.expectedCron}"]`))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchConfig), false)

assert.match(workflow, /^\s*pull_request:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('run-12a4-kick-canary-expiry-binding-cleanup.mjs'), false)
assert.ok(workflow.includes('Verify retired cleanup package'))
assert.ok(workflow.includes('Bundle canonical normal Kick collector without deploying'))

for (const fragment of [
  'Accepted.',
  'cleanup package PR: #586',
  'exact one-file cleanup trigger PR: #587',
  'Twitch change: none',
]) assert.ok(note.includes(fragment), `working note missing ${fragment}`)

console.log(JSON.stringify({
  ok: true,
  packageStatus: contract.status,
  triggerStatus: trigger.status,
  finalArtifactId: contract.acceptance.finalArtifactId,
  productionPathRetired: true,
  normalConfigOnly: true,
  twitchChanged: false,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))
