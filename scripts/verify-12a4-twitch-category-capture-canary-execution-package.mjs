import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-twitch-category-capture-canary-package-contract.json')
const storageContract = json('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const kickEvidence = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json')
const trigger = json(contract.workflow.triggerPath)
const startEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json')
const checkpointEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json')
const workflow = read(contract.workflow.path)
const runner = read(contract.evidence.runner)
const waitRunner = read(contract.evidence.startWaitRunner)
const storageRunner = read(contract.evidence.freshPreflightRunner)
const inspector = read(contract.evidence.triggerInspector)
const fixture = read('scripts/test-12a4-twitch-category-capture-canary-execution.mjs')
const note = read('docs/work-in-progress/phase12a4-twitch-category-capture-canary-execution.md')
const normalConfig = read('workers/collector-twitch/wrangler.toml')
const canaryConfig = read('workers/collector-twitch/wrangler.category-canary.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-execution-v1')
assert.equal(contract.status, 'accepted')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedPackage.pr, 590)
assert.equal(contract.acceptedPackage.mergeSha, 'e798df275b2fad0601b2e9ef89c76a6a30f1d038')
assert.equal(contract.acceptedPackage.provider, 'twitch')
assert.equal(contract.acceptedPackage.committedDisabled, true)
assert.equal(contract.acceptedPackage.minimumObservationHours, 24)

assert.equal(contract.workflow.triggerMayBePresentButUnchangedInFixPr, true)
assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.productionExecutionFromPackagePr, false)
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.equal(contract.workflow.automaticPermanentEnablement, false)
assert.equal(contract.workflow.automaticKickStart, false)

assert.equal(contract.trigger.statusRequired, 'armed')
assert.equal(contract.trigger.providerRequired, 'twitch')
assert.equal(contract.trigger.exactPackagePr, 590)
assert.equal(contract.trigger.exactPackageMergeSha, 'e798df275b2fad0601b2e9ef89c76a6a30f1d038')
assert.equal(contract.trigger.exactExecutionPackagePr, 591)
assert.equal(contract.trigger.exactExecutionPackageMergeSha, '5c302c8b674edd1d13ab5a467465ed60d0fb96c5')
assert.equal(contract.trigger.storagePreflightContract, 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json')
assert.equal(contract.trigger.storagePreflightStatusRequired, 'accepted')
assert.equal(contract.trigger.acceptedBaselinePreflightIdentityRequired, true)
assert.equal(contract.trigger.startBoundaryWaitBeforeFreshPreflightRequired, true)
assert.equal(contract.trigger.startBoundaryWaitMaximumHours, 3)
assert.equal(contract.trigger.freshReadOnlyPreflightInStartJobRequired, true)
assert.deepEqual(contract.trigger.freshReadOnlyPreflightMethods.cloudflareApi, ['GET'])
assert.deepEqual(contract.trigger.freshReadOnlyPreflightMethods.d1, ['SELECT'])
assert.equal(contract.trigger.freshReadOnlyPreflightMustCompleteAfterStartBoundary, true)
assert.equal(contract.trigger.freshReadOnlyPreflightMustCompleteBeforeDeploy, true)
assert.equal(contract.trigger.oneFileTriggerPrRequired, true)
assert.equal(Object.hasOwn(contract.trigger, 'maximumPreflightAgeMinutesAtStart'), false)

assert.deepEqual(contract.start.mandatoryOrder, [
  'inspect exact trigger',
  'wait for exact start boundary',
  'create ephemeral read-only request',
  'run fresh read-only production preflight',
  'copy fresh evidence into start artifact',
  'deploy bounded Twitch canary',
])
assert.equal(contract.start.waitRunner, 'scripts/wait-12a4-twitch-category-capture-canary-start.mjs')
assert.equal(contract.start.waitBeforeEphemeralRequest, true)
assert.equal(contract.start.waitBeforeFreshPreflight, true)
assert.equal(contract.start.waitBeforeDeploy, true)
assert.equal(contract.start.ephemeralRequestOnly, true)
assert.equal(contract.start.ephemeralRequestCommitted, false)
assert.equal(contract.start.freshPreflightEvidenceIncludedInStartArtifact, true)
assert.equal(contract.start.generatedConfigOnly, true)
assert.equal(contract.start.committedCanaryConfigMutated, false)
assert.equal(contract.start.postDeployVerificationFailureRollsBack, true)
assert.equal(contract.evidence.startWaitRunner, 'scripts/wait-12a4-twitch-category-capture-canary-start.mjs')
assert.equal(contract.evidence.freshPreflightRunner, 'scripts/run-12a4-twitch-category-capture-canary-storage-preflight.mjs')
assert.equal(contract.evidence.freshPreflightArtifactFile, 'fresh-storage-preflight.json')
assert.equal(contract.evidence.acceptedBaselineEvidenceStillPinned, true)

assert.equal(contract.monitor.frequency, 'every two hours')
assert.equal(contract.monitor.exactExpiryEnforcedByWrapper, true)
assert.equal(contract.monitor.maximumRollbackBindingLagHours, 2)
assert.equal(contract.hardStops.projectedNinetyDaySizeMbMax, 440)
assert.equal(contract.hardStops.projectedProviderHeadroomMbMin, 10)
assert.equal(contract.hardStops.projectedAccountWideHeadroomMbMin, 500)
assert.equal(contract.hardStops.providerLeakageRowsMax, 0)
assert.equal(contract.hardStops.categoryGeneratorQueriesMax, 12)
assert.equal(contract.rollback.normalConfig, 'workers/collector-twitch/wrangler.toml')
assert.equal(contract.rollback.schemaRollback, false)
assert.equal(contract.rollback.categoryDataDeletion, false)
assert.equal(contract.rollback.canaryBindingsAbsentAfterRollbackRequired, true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 590)
assert.equal(storageContract.status, 'accepted')
assert.equal(storageContract.acceptance.pr, 599)
assert.equal(storageContract.acceptance.mergeSha, '785a271a7b95808e01478b9fb3846028229faa24')
assert.equal(storageContract.acceptance.allReadOnlyGatesPass, true)
assert.equal(storageContract.acceptance.productionMutationPerformed, false)
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v21')
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryPackage, true)
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryExecutionPackage, true)
assert.equal(gate.currentWorkstream.acceptedTwitchStoragePreflight, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, true)
assert.equal(gate.categoryCapture.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(kickEvidence.outcome, 'accepted')
assert.equal(kickEvidence.gates.canaryBindingsAbsent, true)

assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'twitch')
assert.equal(trigger.attempt, 3)
assert.equal(trigger.packagePr, 590)
assert.equal(trigger.executionPackagePr, 591)
assert.equal(trigger.storagePreflightPr, 599)
assert.equal(trigger.storagePreflightMergeSha, storageContract.acceptance.mergeSha)
assert.equal(trigger.storagePreflightObservedAt, storageContract.observedAt)
assert.equal(trigger.storagePreflightEvidenceDigest, storageContract.evidence.digest)

assert.equal(contract.attempt1Cancellation.triggerPr, 604)
assert.equal(contract.attempt1Cancellation.triggerMergeSha, '62d24460d4250aca89c72916d9fade42c09f9503')
assert.equal(contract.attempt1Cancellation.workflowRunId, 29624622275)
assert.equal(contract.attempt1Cancellation.workflowJobId, 88026455393)
assert.equal(contract.attempt1Cancellation.artifactId, 8423630417)
assert.equal(contract.attempt1Cancellation.artifactDigest, 'sha256:13891b14e96a9efcfc13298e7579c653d271c27269e397389dcacf60f2787777')
assert.equal(contract.attempt1Cancellation.freshPreflightPassed, true)
assert.equal(contract.attempt1Cancellation.startStepCancelledBeforeBoundary, true)
assert.equal(contract.attempt1Cancellation.startEvidencePresent, false)
assert.equal(contract.attempt1Cancellation.workerDeploymentPerformed, false)
assert.equal(contract.attempt1Cancellation.runtimeCaptureStarted, false)
assert.equal(contract.attempt1Cancellation.cancellationPr, 608)
assert.equal(contract.acceptance.inlineFreshPreflightAmendmentPr, 602)
assert.equal(contract.acceptance.inlineFreshPreflightAmendmentMergeSha, '7d47357409cd9d181e408a30b842e713f4e20880')
assert.equal(contract.acceptance.startOrderFixPendingPrAcceptance, false)
assert.equal(contract.acceptance.startOrderFixPr, 609)
assert.equal(contract.acceptance.startOrderFixMergeSha, '759b752c78b8a1a60e1132814429ca49c024da3b')
assert.equal(contract.acceptance.monitorParserFixPendingPrAcceptance, false)
assert.equal(contract.acceptance.monitorParserFixPr, 613)
assert.equal(contract.acceptance.monitorParserFixMergeSha, '0091b0613be716f36ae7b89a2b363109eb67c107')
assert.equal(contract.runtimeState, 'active_initial_checkpoint_accepted')
assert.equal(contract.attempt3ActiveCheckpoint.startWorkflowRunId, 29631153598)
assert.equal(contract.attempt3ActiveCheckpoint.startWorkflowJobId, 88044862377)
assert.equal(contract.attempt3ActiveCheckpoint.startArtifactId, 8425765411)
assert.equal(contract.attempt3ActiveCheckpoint.checkpointWorkflowRunId, 29634222309)
assert.equal(contract.attempt3ActiveCheckpoint.checkpointWorkflowJobId, 88053537252)
assert.equal(contract.attempt3ActiveCheckpoint.checkpointArtifactId, 8426512098)
assert.equal(contract.attempt3ActiveCheckpoint.boundedRuntimeCaptureActive, true)
assert.equal(contract.attempt3ActiveCheckpoint.permanentRuntimeCaptureAuthorized, false)
assert.equal(contract.attempt3ActiveCheckpoint.kickChanged, false)
assert.equal(startEvidence.outcome, 'started')
assert.equal(startEvidence.attempt, 3)
assert.equal(checkpointEvidence.outcome, 'checkpoint_pass')
assert.equal(checkpointEvidence.queryEvidence.providerLeakageRows, 0)
assert.equal(checkpointEvidence.queryEvidence.categoryPayloadRows, 30)

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.match(workflow, /^\s*push:/m)
assert.match(workflow, /^\s*schedule:/m)
assert.ok(workflow.includes("cron: '47 */2 * * *'"))
assert.ok(workflow.includes('Wait for exact start boundary'))
assert.ok(workflow.includes('wait-12a4-twitch-category-capture-canary-start.mjs'))
assert.ok(workflow.includes('Create ephemeral read-only preflight request'))
assert.ok(workflow.includes('Run fresh read-only production preflight after start boundary'))
assert.ok(workflow.includes('Start bounded Twitch category canary'))
const waitIndex = workflow.indexOf('Wait for exact start boundary')
const requestIndex = workflow.indexOf('Create ephemeral read-only preflight request')
const freshIndex = workflow.indexOf('Run fresh read-only production preflight after start boundary')
const startIndex = workflow.indexOf('Start bounded Twitch category canary')
assert.ok(waitIndex >= 0 && waitIndex < requestIndex)
assert.ok(requestIndex < freshIndex)
assert.ok(freshIndex < startIndex)
assert.ok(workflow.includes('fresh-storage-preflight.json'))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
assert.equal(workflow.includes('workers/collector-kick/wrangler.toml'), false)

for (const fragment of [
  'export function evaluateStartWait',
  'start_wait_exceeds_limit',
  'trigger_expired_before_wait',
  'trigger_expired_while_waiting',
  'Math.min(remaining, 60_000)',
]) assert.ok(waitRunner.includes(fragment), `wait runner missing ${fragment}`)

for (const fragment of [
  'export function projectTwitchStorage',
  'PROJECTED_SIZE_MAX_MB = 440',
  'PROJECTED_PROVIDER_HEADROOM_MIN_MB = 10',
  'PROJECTED_ACCOUNT_HEADROOM_MIN_MB = 500',
  'export function renderActiveCanaryConfig',
  'export function canaryBindingsFromSettings',
  'export function bindingsMatchTrigger',
  'export function canaryBindingsAbsent',
  'productionRuntimeCaptureAuthorizedBeyondCanary: false',
  'permanentEnablementAuthorized: false',
  'kickStartAuthorized: false',
]) assert.ok(runner.includes(fragment), `runner missing ${fragment}`)

for (const fragment of [
  'export function inspectRequest',
  'export function assertReadOnlySql',
  'export function evaluateLatestSnapshot',
  'export function parseLastJson',
  "method: 'GET'",
  "'--remote'",
  'd1RowsWritten: 0',
  'runtimeCaptureStarted: false',
]) assert.ok(storageRunner.includes(fragment), `storage runner missing ${fragment}`)

for (const fragment of [
  'start boundary wait required before fresh preflight',
  'fresh read-only preflight after start boundary',
  'acceptedBaselinePreflightPinned: true',
  'startBoundaryWaitRequiredBeforeFreshPreflight: true',
  'freshReadOnlyPreflightRequiredAfterStartBoundary: true',
]) assert.ok(inspector.includes(fragment), `inspector missing ${fragment}`)

for (const fragment of [
  'evaluateStartWait',
  'waitBeforeStart',
  'waitAtStart',
  'waitAfterStart',
  'waitTooLong',
  "waitTooLong.failure.name, 'start_wait_exceeds_limit'",
  "waitExpired.failure.name, 'trigger_expired_before_wait'",
  "invalidStart.failure.name, 'invalid_start_at'",
  "invalidWindow.failure.name, 'invalid_window'",
  'startBoundaryWaitRequired: true',
  'inlineFreshPreflightRequiredAfterStartBoundary: true',
]) assert.ok(fixture.includes(fragment), `fixture missing ${fragment}`)

assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.ok(canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "false"'))
assert.equal(/\nCATEGORY_CAPTURE_ENABLED\s*=/.test(canaryConfig), false)
assert.ok(note.includes('Attempt 3 is active inside the bounded window'))
assert.ok(note.includes('Workflow run: `29634222309`'))
assert.ok(note.includes('Final acceptance requires normal-config rollback'))

assert.ok(runner.includes('export function parseLastJson'))
assert.ok(runner.includes("const stdout = String(result.stdout ?? '').trim()"))
assert.ok(runner.includes('parseLastJson(result.stdout || result.output)'))
assert.ok(fixture.includes('const noisyWranglerOutput ='))
assert.ok(fixture.includes('wrangler_json_output_missing'))

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  provider: 'twitch',
  armedAttempt: trigger.attempt,
  attempt1CancelledBeforeDeploy: true,
  startBoundaryWaitRequired: true,
  freshPreflightAfterStartBoundaryRequired: true,
  workflowOrderVerified: true,
  providerStorageLimitMb: contract.hardStops.projectedNinetyDaySizeMbMax,
  accountHeadroomMinMb: contract.hardStops.projectedAccountWideHeadroomMbMin,
  productionExecutionFromPullRequest: false,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))
