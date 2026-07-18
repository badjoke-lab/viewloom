import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)

const request = json('docs/audits/12a4-twitch-attempt3-checkpoint-reconcile-request.json')
assert.equal(request.status, 'requested')
assert.equal(request.provider, 'twitch')
assert.equal(request.attempt, 3)
assert.equal(request.startRun, 29631153598)
assert.equal(request.startJob, 88044862377)
assert.equal(request.startArtifact, 8425765411)
assert.equal(request.checkpointRun, 29634222309)
assert.equal(request.checkpointJob, 88053537252)
assert.equal(request.checkpointArtifact, 8426512098)
assert.equal(request.repositoryRecordsOnly, true)
assert.equal(request.cloudflareAccess, false)
assert.equal(request.permanentEnablement, false)
assert.equal(request.kickChange, false)

const startPath = 'docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json'
const checkpointPath = 'docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json'
const start = json(startPath)
const checkpoint = json(checkpointPath)
assert.equal(start.attempt, 3)
assert.equal(start.outcome, 'started')
assert.equal(start.observedAt, '2026-07-18T05:15:12.865Z')
assert.equal(start.deployment.canaryExitCode, 0)
assert.equal(start.serviceBindingsAfter.enabled, 'true')
assert.equal(start.serviceBindingsAfter.provider, 'twitch')
assert.equal(start.serviceBindingsAfter.attempt, '3')
assert.equal(start.serviceBindingsAfter.categoryCaptureDirectFlagPresent, false)
assert.equal(start.storage.pass, true)
assert.equal(start.gates.hardStop, false)
assert.equal(start.gates.permanentEnablementAuthorized, false)
assert.equal(start.gates.kickStartAuthorized, false)
assert.equal(checkpoint.attempt, 3)
assert.equal(checkpoint.outcome, 'checkpoint_pass')
assert.equal(checkpoint.observedAt, '2026-07-18T06:34:50.959Z')
assert.equal(checkpoint.storage.pass, true)
assert.equal(checkpoint.serviceBindingsBefore.enabled, 'true')
assert.equal(checkpoint.serviceBindingsBefore.provider, 'twitch')
assert.equal(checkpoint.serviceBindingsBefore.attempt, '3')
assert.equal(checkpoint.serviceBindingsBefore.categoryCaptureDirectFlagPresent, false)
assert.equal(checkpoint.queryEvidence.twitchDictionaryRows, 163)
assert.equal(checkpoint.queryEvidence.categoryPayloadRows, 30)
assert.equal(checkpoint.queryEvidence.providerLeakageRows, 0)
assert.equal(checkpoint.gates.hardStop, false)
assert.equal(checkpoint.gates.rollbackRequired, false)
assert.equal(checkpoint.gates.permanentEnablementAuthorized, false)
assert.equal(checkpoint.gates.kickStartAuthorized, false)

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const gate = json(gatePath)
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v20')
gate.schemaVersion = 'viewloom-12a2-current-gate-state-v21'
gate.status = '12a4_twitch_canary_attempt3_active_initial_checkpoint_accepted'
Object.assign(gate.twitchCategoryCaptureCanaryExecutionPackage, {
  status: 'accepted_active_bounded_canary',
  triggerPresent: true,
  productionRuntimeCaptureStarted: true,
  productionWorkerDeployed: true,
  remoteD1OperationPerformed: true,
  productionExecutionPathDormant: false,
  scheduledMonitorDormant: false,
})
gate.twitchCategoryCaptureCanaryInitialAcceptance = {
  status: 'accepted_active_initial_checkpoint',
  trackingIssue: 519,
  provider: 'twitch',
  startOrderFixPr: 609,
  startOrderFixMergeSha: '759b752c78b8a1a60e1132814429ca49c024da3b',
  monitorParserFixPr: 613,
  monitorParserFixMergeSha: '0091b0613be716f36ae7b89a2b363109eb67c107',
  triggerPr: 614,
  triggerMergeSha: '7726934cb8dc39f2e6706f8a6250989f897a831f',
  triggerAttempt: 3,
  startAt: '2026-07-18T05:15:00.000Z',
  until: '2026-07-19T05:15:00.000Z',
  startWorkflowRunId: 29631153598,
  startWorkflowJobId: 88044862377,
  startArtifactId: 8425765411,
  startArtifactDigest: 'sha256:e8e0292e5fabb25dc539ddaa43e1b6f077a91709d7544be766290325044fdc22',
  startEvidence: startPath,
  freshPreflightObservedAt: '2026-07-18T05:15:01.099Z',
  freshPreflightEvidenceDigest: 'sha256:e73ded06b819933e9c4965b33e0be5920ff4f5777bef4860dff6055f67ad29ce',
  checkpointWorkflowRunId: 29634222309,
  checkpointWorkflowJobId: 88053537252,
  checkpointArtifactId: 8426512098,
  checkpointArtifactDigest: 'sha256:b7bb41deef96896167a2db013933cee21b6f0eb2fc19fdfd857abb4121f7e3ef',
  checkpointEvidence: checkpointPath,
  observedAt: checkpoint.observedAt,
  twitchDictionaryRows: 163,
  categoryPayloadRowsAtCheckpoint: 30,
  providerLeakageRows: 0,
  providerCurrentMb: 321.71,
  projectedNinetyDaySizeMb: 370.03,
  projectedProviderHeadroomMb: 79.97,
  projectedAccountWideHeadroomMb: 864.75,
  hardStop: false,
  rollbackRequired: false,
  permanentCategoryCaptureFlagPresent: false,
  boundedCanaryActive: true,
  finalRollbackPending: true,
  kickChanged: false,
  permanentRuntimeCaptureAuthorized: false
}
Object.assign(gate.categoryCapture, {
  twitchStoragePreflightFreshForStart: true,
  twitchExactTriggerAccepted: true,
  twitchCanaryExecuted: true,
  twitchCanaryObservationActive: true,
  runtimeCaptureStarted: true,
  boundedCanaryRuntimeCaptureActive: true
})
gate.closedBlockers = [...new Set([...gate.closedBlockers,
  'twitch_category_capture_storage_preflight_not_fresh_for_start',
  'twitch_category_capture_exact_trigger_not_accepted',
  'twitch_category_capture_canary_not_executed'
])]
gate.openBlockers = [
  'twitch_category_capture_final_observation_not_accepted',
  'twitch_category_capture_canary_rollback_not_verified',
  'runtime_category_capture_not_authorized'
]
Object.assign(gate.currentWorkstream, {
  phase: '12A-4-17',
  name: 'Twitch attempt 3 bounded canary active; first monitor checkpoint passed',
  exactTwitchTriggerCurrent: true,
  twitchCanaryObservationActive: true,
  twitchStoragePreflightFreshForStart: true,
  productionExecutionIncluded: true,
  runtimeCaptureStarted: true,
  boundedCanaryCaptureActive: true,
  finalRollbackPending: true
})
gate.nextWorkstream = 'continue bounded Twitch attempt 3 checkpoints through exact expiry, then verify normal-config rollback, absent canary bindings, zero provider leakage, no post-grace category payload, and fresh authenticated normal Twitch collection; permanent category capture remains unauthorized'
writeJson(gatePath, gate)

const contractPath = 'docs/audits/12a4-twitch-category-capture-canary-execution-contract.json'
const contract = json(contractPath)
assert.equal(contract.status, 'accepted')
contract.workstream = '12A-4-17 Twitch category capture canary attempt 3 active initial checkpoint'
contract.runtimeState = 'active_initial_checkpoint_accepted'
Object.assign(contract.acceptance, {
  startOrderFixPendingPrAcceptance: false,
  startOrderFixPr: 609,
  startOrderFixMergeSha: '759b752c78b8a1a60e1132814429ca49c024da3b',
  monitorParserFixPendingPrAcceptance: false,
  monitorParserFixPr: 613,
  monitorParserFixMergeSha: '0091b0613be716f36ae7b89a2b363109eb67c107'
})
contract.attempt3ActiveCheckpoint = {
  triggerPr: 614,
  triggerMergeSha: '7726934cb8dc39f2e6706f8a6250989f897a831f',
  attempt: 3,
  startAt: '2026-07-18T05:15:00.000Z',
  until: '2026-07-19T05:15:00.000Z',
  startWorkflowRunId: 29631153598,
  startWorkflowJobId: 88044862377,
  startArtifactId: 8425765411,
  startArtifactDigest: 'sha256:e8e0292e5fabb25dc539ddaa43e1b6f077a91709d7544be766290325044fdc22',
  startEvidence: startPath,
  checkpointWorkflowRunId: 29634222309,
  checkpointWorkflowJobId: 88053537252,
  checkpointArtifactId: 8426512098,
  checkpointArtifactDigest: 'sha256:b7bb41deef96896167a2db013933cee21b6f0eb2fc19fdfd857abb4121f7e3ef',
  checkpointEvidence: checkpointPath,
  checkpointObservedAt: checkpoint.observedAt,
  storagePass: true,
  providerLeakageRows: 0,
  categoryPayloadRows: 30,
  twitchDictionaryRows: 163,
  hardStop: false,
  rollbackRequired: false,
  boundedRuntimeCaptureActive: true,
  finalRollbackPending: true,
  permanentRuntimeCaptureAuthorized: false,
  kickChanged: false
}
contract.nextGate = 'continue scheduled attempt 3 checkpoints through exact expiry and accept final rollback evidence before any permanent enablement decision'
writeJson(contractPath, contract)

console.log(JSON.stringify({ok: true, schemaVersion: gate.schemaVersion, phase: gate.currentWorkstream.phase, attempt: 3}, null, 2))
