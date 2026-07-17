import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-kick-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-kick-category-capture-canary-package-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const trigger = json(contract.workflow.triggerPath)
const finalEvidence = json(contract.evidence.finalRepositoryEvidence)
const workflow = read(contract.workflow.path)
const runner = read(contract.evidence.runner)
const fixture = read('scripts/test-12a4-kick-category-capture-canary-execution.mjs')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-execution-v1')
assert.equal(contract.status, 'accepted_and_retired')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedPackage.pr, 562)
assert.equal(contract.acceptedPackage.mergeSha, '8dc53c6041f425f78e82cddb62328cff1128120f')
assert.equal(contract.acceptedPackage.provider, 'kick')
assert.equal(contract.acceptedPackage.committedDisabled, true)
assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.productionStartEvent, 'retired')
assert.equal(contract.workflow.monitorEvent, 'retired')
assert.equal(contract.workflow.productionExecutionFromPackagePr, false)
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.equal(contract.workflow.automaticTwitchStart, false)
assert.equal(contract.trigger.statusRequired, 'consumed_and_retired')
assert.equal(contract.trigger.exactPackagePr, 562)
assert.equal(contract.rollback.canaryBindingsAbsentAfterRollbackRequired, true)
assert.equal(contract.evidence.separateReadOnlyAcceptancePrRequired, true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 562)
assert.equal(packageContract.package.committedDisabled, true)
assert.equal(packageContract.package.automaticTwitchStart, false)

assert.equal(contract.finalAcceptance.status, 'accepted')
assert.equal(contract.finalAcceptance.cleanupPackagePr, 586)
assert.equal(contract.finalAcceptance.cleanupTriggerPr, 587)
assert.equal(contract.finalAcceptance.cleanupRetirementPr, 588)
assert.equal(contract.finalAcceptance.workflowRunId, 29488056134)
assert.equal(contract.finalAcceptance.workflowJobId, 87822408236)
assert.equal(contract.finalAcceptance.artifactId, 8399137444)
assert.equal(contract.finalAcceptance.canaryBindingsAbsent, true)
assert.equal(contract.finalAcceptance.permanentCategoryCaptureFlagPresent, false)
assert.equal(contract.finalAcceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(contract.finalAcceptance.providerLeakageRows, 0)
assert.equal(contract.finalAcceptance.normalKickSnapshotAuthenticated, true)
assert.equal(contract.finalAcceptance.normalKickSnapshotNonempty, true)
assert.equal(contract.finalAcceptance.twitchChanged, false)

assert.equal(contract.retirement.triggerStatus, 'consumed_and_retired')
assert.equal(contract.retirement.productionPushTriggerPresent, false)
assert.equal(contract.retirement.scheduledMonitorPresent, false)
assert.equal(contract.retirement.productionStartJobPresent, false)
assert.equal(contract.retirement.productionFinalizeJobPresent, false)
assert.equal(contract.retirement.cloudflareCredentialsReferencedByWorkflow, false)
assert.equal(contract.retirement.rearmAuthorized, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.status, '12a4_kick_canary_final_observation_and_rollback_accepted')
assert.equal(gate.currentWorkstream.phase, '12A-4-12')
assert.equal(gate.currentWorkstream.acceptedKickCanaryFinalEvidence, true)
assert.equal(gate.currentWorkstream.exactKickTriggerCurrent, false)
assert.equal(gate.currentWorkstream.kickCanaryObservationActive, false)
assert.equal(gate.currentWorkstream.kickCanaryExecutionRetired, true)
assert.equal(gate.currentWorkstream.productionExecutionIncluded, false)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.boundedCanaryCaptureActive, false)
assert.equal(gate.currentWorkstream.finalRollbackPending, false)
assert.equal(gate.currentWorkstream.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(gate.categoryCapture.kickCanaryFinalAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.kickCanaryProductionPathRetired, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)

assert.equal(trigger.status, 'consumed_and_retired')
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.retired, true)
assert.equal(trigger.confirmation, 'RUN_KICK_CATEGORY_CAPTURE_CANARY')
assert.equal(trigger.attempt, 3)
assert.equal(trigger.finalArtifactId, 8399137444)
assert.equal(trigger.finalOutcome, 'accepted')
assert.equal(trigger.productionExecutionPathRetired, true)
assert.equal(trigger.scheduledMonitorRetired, true)
assert.equal(trigger.twitchStartAuthorized, false)
assert.equal(trigger.permanentRuntimeCaptureAuthorized, false)

assert.equal(finalEvidence.outcome, 'accepted')
assert.equal(finalEvidence.artifact.artifactId, contract.finalAcceptance.artifactId)
assert.equal(finalEvidence.gates.canaryBindingsAbsent, true)
assert.equal(finalEvidence.gates.noCategoryPayloadAfterGracePass, true)
assert.equal(finalEvidence.gates.providerLeakagePass, true)

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes('start-canary:'), false)
assert.equal(workflow.includes('monitor-or-finalize:'), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.ok(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.toml'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.category-canary.toml'))

for (const fragment of [
  'export function projectKickStorage',
  'export function renderActiveCanaryConfig',
  'export function canaryBindingsAbsent',
  "evidence.outcome = 'already_rolled_back_noop'",
  'productionRuntimeCaptureAuthorizedBeyondCanary: false',
  'TwitchStartAuthorized: false',
]) assert.ok(runner.includes(fragment), `historical execution runner missing ${fragment}`)

for (const fragment of [
  "assert.equal(absent.action, 'noop')",
  "assert.equal(pushBefore.action, 'start')",
  "assert.equal(active.action, 'monitor')",
  "assert.equal(expired.action, 'finalize')",
  'assert.equal(canaryBindingsAbsent(normalBindings), true)',
]) assert.ok(fixture.includes(fragment), `execution fixture missing ${fragment}`)

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  triggerStatus: trigger.status,
  finalArtifactId: contract.finalAcceptance.artifactId,
  currentPhase: gate.currentWorkstream.phase,
  productionExecutionRetired: true,
  boundedCanaryCaptureActive: false,
  permanentRuntimeCaptureAuthorized: false,
  twitchStartAuthorized: false,
}, null, 2))
