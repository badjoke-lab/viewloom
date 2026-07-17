import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-contract.json')
const evidence = json(contract.evidence.frozenRepositoryPath)
const gate = json(contract.acceptedInputs.currentGatePath)
const trigger = json(contract.acceptedInputs.triggerPath)
const cleanup = json('docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json')
const workflow = read('.github/workflows/analytics-12a4-kick-category-capture-canary-post-rollback-acceptance.yml')
const scope = read('scripts/check-12a4-kick-category-capture-canary-post-rollback-acceptance-scope.mjs')
const doc = read('docs/work-in-progress/phase12a4-kick-category-capture-canary-post-rollback-acceptance.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-post-rollback-acceptance-v1')
assert.equal(contract.status, 'accepted_and_retired')
assert.equal(contract.provider, 'kick')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedInputs.cleanupPackagePr, 586)
assert.equal(contract.acceptedInputs.cleanupTriggerPr, 587)
assert.equal(contract.acceptedInputs.cleanupRetirementPr, 588)
assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT'])
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(contract.evidence.workflowRunId, 29488056134)
assert.equal(contract.evidence.workflowJobId, 87822408236)
assert.equal(contract.evidence.artifactId, 8399137444)
assert.equal(contract.evidence.artifactDigest, 'sha256:070d5de57a141bf3437847070451284e180c908c47de126ff52fda995bc20de1')
assert.equal(contract.acceptance.outcome, 'accepted')
assert.equal(contract.acceptance.allReadOnlyGatesPass, true)
assert.equal(contract.acceptance.canaryBindingsAbsent, true)
assert.equal(contract.acceptance.permanentDirectFlagAbsent, true)
assert.equal(contract.acceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(contract.acceptance.providerLeakageRows, 0)
assert.equal(contract.acceptance.latestNormalSnapshotAfterExpiryAuthenticated, true)
assert.equal(contract.acceptance.latestNormalSnapshotAfterExpiryNonempty, true)
assert.equal(contract.acceptance.twitchStartAuthorized, false)
assert.equal(contract.acceptance.productionMutationAuthorized, false)
assert.equal(contract.retirement.manualProductionProbeRetired, true)
assert.equal(contract.retirement.productionJobPresent, false)
assert.equal(contract.retirement.cloudflareCredentialsReferencedByWorkflow, false)
assert.equal(contract.retirement.rerunAuthorized, false)

assert.equal(evidence.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-post-rollback-readonly-evidence-v1')
assert.equal(evidence.outcome, 'accepted')
assert.equal(evidence.artifact.workflowRunId, contract.evidence.workflowRunId)
assert.equal(evidence.artifact.workflowJobId, contract.evidence.workflowJobId)
assert.equal(evidence.artifact.artifactId, contract.evidence.artifactId)
assert.equal(evidence.artifact.artifactDigest, contract.evidence.artifactDigest)
assert.equal(evidence.gates.readOnly, true)
assert.equal(evidence.gates.triggerExpired, true)
assert.equal(evidence.gates.canaryBindingsAbsent, true)
assert.equal(evidence.gates.permanentDirectFlagAbsent, true)
assert.equal(evidence.gates.noCategoryPayloadAfterGracePass, true)
assert.equal(evidence.gates.providerLeakagePass, true)
assert.equal(evidence.gates.normalSnapshotAuthenticatedPass, true)
assert.equal(evidence.gates.normalSnapshotNonemptyPass, true)
assert.equal(evidence.gates.twitchStartAuthorized, false)
assert.equal(evidence.gates.productionMutationAuthorized, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.status, '12a4_kick_canary_final_observation_and_rollback_accepted')
assert.equal(gate.currentWorkstream.phase, '12A-4-12')
assert.equal(gate.currentWorkstream.acceptedKickCanaryFinalEvidence, true)
assert.equal(gate.currentWorkstream.kickCanaryExecutionRetired, true)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(gate.currentWorkstream.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(gate.categoryCapture.kickCanaryFinalAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)

assert.equal(trigger.status, 'consumed_and_retired')
assert.equal(trigger.retired, true)
assert.equal(trigger.finalArtifactId, 8399137444)
assert.equal(cleanup.status, 'accepted_and_retired')
assert.equal(cleanup.acceptance.canaryBindingsAbsent, true)

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes('post-rollback-acceptance:'), false)
assert.equal(workflow.includes('run-12a4-kick-category-capture-canary-post-rollback-acceptance.mjs'), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.ok(scope.includes('12A-4-12 accepted and retired'))
assert.ok(doc.includes('Accepted and retired.'))
assert.ok(doc.includes('artifact: `8399137444`'))
assert.ok(doc.includes('A Twitch canary is not started or authorized'))

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  status: contract.status,
  artifactId: contract.evidence.artifactId,
  canaryBindingsAbsent: true,
  productionProbeRetired: true,
  productionMutationAuthorized: false,
  twitchStartAuthorized: false,
}, null, 2))
