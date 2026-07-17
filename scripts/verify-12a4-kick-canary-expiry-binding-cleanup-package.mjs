import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const categoryTrigger = json('docs/audits/12a4-kick-category-capture-canary-trigger.json')
const cleanupTrigger = json(contract.trigger.path)
const finalEvidence = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const twitchConfig = read('workers/collector-twitch/wrangler.toml')
const workflow = read('.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml')
const note = read('docs/work-in-progress/phase12a4-kick-canary-expiry-binding-cleanup.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-canary-expiry-binding-cleanup-v1')
assert.equal(contract.status, 'accepted_and_retired')
assert.equal(contract.provider, 'kick')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.rejectedAcceptanceEvidence.workflowRunId, 29488056134)
assert.equal(contract.rejectedAcceptanceEvidence.artifactId, 8398761959)
assert.equal(contract.rejectedAcceptanceEvidence.onlyFailedGate, 'canaryBindingsAbsent')
assert.equal(contract.cleanup.deployNormalConfigOnly, true)
assert.equal(contract.cleanup.manualCollect, false)
assert.equal(Object.values(contract.hardBoundary).every((value) => value === false), true)

assert.equal(contract.evidence.cleanupPackagePr, 586)
assert.equal(contract.evidence.cleanupPackageMergeSha, 'aaafab2266ef717b2e51dd5006044578bbfd8ae2')
assert.equal(contract.evidence.triggerPr, 587)
assert.equal(contract.evidence.triggerMergeSha, '7fbc343207de235ae583e827ba2fa7796083faf4')
assert.equal(contract.evidence.finalReadOnlyWorkflowRunId, 29488056134)
assert.equal(contract.evidence.finalReadOnlyArtifactId, 8399137444)
assert.equal(contract.acceptance.outcome, 'accepted')
assert.equal(contract.acceptance.canaryBindingsAbsent, true)
assert.equal(contract.acceptance.permanentCategoryCaptureFlagPresent, false)
assert.equal(contract.acceptance.normalSnapshotAuthenticated, true)
assert.equal(contract.acceptance.normalSnapshotNonempty, true)
assert.equal(contract.acceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(contract.acceptance.providerLeakageRows, 0)
assert.equal(contract.acceptance.twitchChanged, false)
assert.equal(contract.retirement.productionPushTriggerRetired, true)
assert.equal(contract.retirement.productionDeploymentJobRetired, true)
assert.equal(contract.retirement.cloudflareCredentialsReferencedByWorkflow, false)
assert.equal(contract.retirement.triggerRearmAuthorized, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.currentWorkstream.phase, '12A-4-12')
assert.equal(gate.currentWorkstream.acceptedKickCanaryFinalEvidence, true)
assert.equal(gate.currentWorkstream.kickCanaryExecutionRetired, true)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickFinalEvidence, false)
assert.equal(gate.currentWorkstream.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.kickCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.kickCanaryProductionPathRetired, true)

assert.equal(categoryTrigger.status, 'consumed_and_retired')
assert.equal(categoryTrigger.provider, 'kick')
assert.equal(categoryTrigger.oneTime, true)
assert.equal(categoryTrigger.retired, true)
assert.equal(categoryTrigger.attempt, 3)
assert.equal(categoryTrigger.startAt, contract.acceptedCanaryIdentity.startAt)
assert.equal(categoryTrigger.until, contract.acceptedCanaryIdentity.until)
assert.equal(categoryTrigger.finalArtifactId, 8399137444)

assert.equal(cleanupTrigger.schemaVersion, contract.trigger.schemaVersion)
assert.equal(cleanupTrigger.status, 'consumed_and_retired')
assert.equal(cleanupTrigger.provider, 'kick')
assert.equal(cleanupTrigger.oneTime, true)
assert.equal(cleanupTrigger.retired, true)
assert.equal(cleanupTrigger.confirmation, contract.trigger.confirmation)
assert.equal(cleanupTrigger.attempt, 1)
assert.equal(cleanupTrigger.cleanupPackagePr, 586)
assert.equal(cleanupTrigger.triggerPr, 587)
assert.equal(cleanupTrigger.acceptedFinalArtifactId, 8399137444)

assert.equal(finalEvidence.outcome, 'accepted')
assert.equal(finalEvidence.artifact.artifactId, 8399137444)
assert.equal(finalEvidence.gates.canaryBindingsAbsent, true)
assert.equal(finalEvidence.gates.permanentDirectFlagAbsent, true)
assert.equal(finalEvidence.gates.noCategoryPayloadAfterGracePass, true)
assert.equal(finalEvidence.gates.providerLeakagePass, true)

assert.ok(normalConfig.includes(`crons = ["${contract.cleanup.expectedCron}"]`))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchConfig), false)

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes('cleanup-expired-bindings:'), false)
assert.equal(workflow.includes('run-12a4-kick-canary-expiry-binding-cleanup.mjs'), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.ok(workflow.includes('wrangler@4 deploy --dry-run'))
assert.equal(workflow.includes('workers/collector-twitch/wrangler.toml'), false)

for (const fragment of [
  'Accepted and retired.',
  'final artifact `8399137444`',
  'canary bindings: absent',
  'production cleanup workflow is retired',
  'Twitch remains blocked until the accepted final evidence is frozen',
]) assert.ok(note.includes(fragment), `working note missing ${fragment}`)

console.log(JSON.stringify({
  ok: true,
  packageStatus: contract.status,
  cleanupPackagePr: contract.evidence.cleanupPackagePr,
  triggerPr: contract.evidence.triggerPr,
  finalArtifactId: contract.evidence.finalReadOnlyArtifactId,
  canaryBindingsAbsent: true,
  productionWorkflowRetired: true,
  canonicalFinalEvidenceAccepted: true,
  twitchChanged: false,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))
