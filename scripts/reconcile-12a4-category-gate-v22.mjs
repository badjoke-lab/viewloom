import fs from 'node:fs'

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'))

if (gate.schemaVersion === 'viewloom-12a2-current-gate-state-v22') {
  console.log(JSON.stringify({ ok: true, alreadyReconciled: true }, null, 2))
  process.exit(0)
}

if (gate.schemaVersion !== 'viewloom-12a2-current-gate-state-v21') throw new Error(`unexpected_gate_schema:${gate.schemaVersion}`)
if (gate.status !== '12a4_twitch_canary_attempt3_active_initial_checkpoint_accepted') throw new Error(`unexpected_gate_status:${gate.status}`)

const finalEvidence = JSON.parse(fs.readFileSync('docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json', 'utf8'))
const acceptance = JSON.parse(fs.readFileSync('docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json', 'utf8'))

if (finalEvidence.status !== 'accepted_and_retired' || finalEvidence.outcome !== 'accepted') throw new Error('twitch_final_evidence_not_accepted')
if (finalEvidence.data.categoryPayloadRowsAfterGrace !== 0) throw new Error('post_grace_category_payload_not_zero')
if (finalEvidence.serviceBindings.canaryBindingsAbsent !== true) throw new Error('canary_bindings_not_absent')
if (finalEvidence.serviceBindings.permanentCategoryCaptureEnabledPresent !== false) throw new Error('permanent_category_flag_present')
if (finalEvidence.data.providerLeakageRows !== 0) throw new Error('provider_leakage_nonzero')
if (finalEvidence.gates.freshRealNonemptyNormalSnapshotAfterExpiry !== true) throw new Error('normal_snapshot_gate_failed')
if (finalEvidence.storage.pass !== true) throw new Error('storage_gate_failed')
if (acceptance.status !== 'accepted_and_retired') throw new Error('acceptance_contract_not_retired')

const close = (name) => {
  if (!gate.closedBlockers.includes(name)) gate.closedBlockers.push(name)
  gate.openBlockers = gate.openBlockers.filter((item) => item !== name)
}

close('twitch_category_capture_final_observation_not_accepted')
close('twitch_category_capture_canary_rollback_not_verified')

gate.schemaVersion = 'viewloom-12a2-current-gate-state-v22'
gate.status = '12a4_provider_canaries_accepted_and_retired'

gate.twitchCategoryCaptureCanaryExecutionPackage = {
  ...gate.twitchCategoryCaptureCanaryExecutionPackage,
  status: 'accepted_and_retired',
  triggerPresent: false,
  productionRuntimeCaptureStarted: false,
  productionWorkerDeployed: false,
  remoteD1OperationPerformed: true,
  runtimeObservationCompleted: true,
  productionExecutionPathDormant: undefined,
  scheduledMonitorDormant: undefined,
  productionExecutionPathRetired: true,
  scheduledMonitorRetired: true,
  closeoutPr: 620,
  closeoutMergeSha: '4bc053e451ebfee237080fa024c59443316a27b9',
  automaticPermanentEnablement: false,
}
for (const key of ['productionExecutionPathDormant', 'scheduledMonitorDormant']) delete gate.twitchCategoryCaptureCanaryExecutionPackage[key]

Object.assign(gate.categoryCapture, {
  runtimeCaptureAuthorized: false,
  runtimeCaptureStarted: false,
  categoryCaptureFlagPresent: false,
  boundedCanaryRuntimeCaptureActive: false,
  twitchCanaryObservationActive: false,
  twitchCanaryFinalAcceptanceAccepted: true,
  twitchCanaryRollbackVerified: true,
  twitchCanaryProductionPathRetired: true,
})

gate.currentWorkstream = {
  ...gate.currentWorkstream,
  phase: '12A-4-18',
  name: 'Provider-separated category canaries accepted and retired',
  acceptedTwitchCanaryFinalEvidence: true,
  exactTwitchTriggerCurrent: false,
  twitchCanaryObservationActive: false,
  twitchCanaryExecutionRetired: true,
  productionExecutionIncluded: false,
  runtimeCaptureStarted: false,
  runtimeCaptureAuthorized: false,
  boundedCanaryCaptureActive: false,
  finalRollbackPending: false,
  twitchCanaryRollbackVerified: true,
  crossProviderAnalyticsAllowed: false,
}

gate.nextWorkstream = 'provider-separated canary evaluation is complete; permanent category capture remains unauthorized and requires a separate explicit product and operational decision'

gate.twitchCategoryCaptureCanaryFinalAcceptance = {
  status: 'accepted_and_retired',
  trackingIssue: 519,
  provider: 'twitch',
  contract: 'docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json',
  evidence: 'docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json',
  finalizerWorkflowRunId: finalEvidence.finalizer.workflowRunId,
  finalizerWorkflowJobId: finalEvidence.finalizer.workflowJobId,
  finalizerArtifactId: finalEvidence.finalizer.artifactId,
  finalizerArtifactDigest: finalEvidence.finalizer.artifactDigest,
  acceptancePr: finalEvidence.acceptancePr,
  acceptanceMergeSha: finalEvidence.acceptanceMergeSha,
  acceptanceWorkflowRunId: finalEvidence.acceptanceWorkflowRunId,
  acceptanceWorkflowJobId: finalEvidence.acceptanceWorkflowJobId,
  acceptanceArtifactId: finalEvidence.acceptanceArtifactId,
  acceptanceArtifactDigest: finalEvidence.acceptanceArtifactDigest,
  closeoutPr: 620,
  closeoutMergeSha: '4bc053e451ebfee237080fa024c59443316a27b9',
  observedAt: finalEvidence.observedAt,
  canaryBindingsAbsent: finalEvidence.serviceBindings.canaryBindingsAbsent,
  permanentCategoryCaptureFlagPresent: finalEvidence.serviceBindings.permanentCategoryCaptureEnabledPresent,
  twitchDictionaryRows: finalEvidence.data.twitchDictionaryRows,
  categoryPayloadRowsInCanaryWindow: finalEvidence.data.categoryPayloadRowsInCanaryWindow,
  categoryPayloadRowsAfterGrace: finalEvidence.data.categoryPayloadRowsAfterGrace,
  providerLeakageRows: finalEvidence.data.providerLeakageRows,
  normalSnapshotAfterExpiryReal: finalEvidence.data.latestNormalSnapshotAfterExpiry.sourceMode === 'real',
  normalSnapshotAfterExpiryNonempty: finalEvidence.data.latestNormalSnapshotAfterExpiry.streamCount > 0,
  normalSnapshotStreamCount: finalEvidence.data.latestNormalSnapshotAfterExpiry.streamCount,
  normalSnapshotTotalViewers: finalEvidence.data.latestNormalSnapshotAfterExpiry.totalViewers,
  projectedNinetyDaySizeMb: finalEvidence.storage.projectedNinetyDaySizeMb,
  projectedProviderHeadroomMb: finalEvidence.storage.projectedProviderHeadroomMb,
  projectedAccountWideHeadroomMb: finalEvidence.storage.projectedAccountWideHeadroomMb,
  productionExecutionPathsRetired: true,
  kickChanged: false,
  permanentRuntimeCaptureAuthorized: false,
}

if (gate.openBlockers.length !== 1 || gate.openBlockers[0] !== 'runtime_category_capture_not_authorized') throw new Error(`unexpected_open_blockers:${JSON.stringify(gate.openBlockers)}`)

fs.writeFileSync(gatePath, `${JSON.stringify(gate, null, 2)}\n`)
console.log(JSON.stringify({
  ok: true,
  schemaVersion: gate.schemaVersion,
  status: gate.status,
  phase: gate.currentWorkstream.phase,
  openBlockers: gate.openBlockers,
  runtimeCaptureStarted: gate.categoryCapture.runtimeCaptureStarted,
  permanentRuntimeCaptureAuthorized: gate.categoryCapture.runtimeCaptureAuthorized,
  categoryPayloadRowsAfterGrace: gate.twitchCategoryCaptureCanaryFinalAcceptance.categoryPayloadRowsAfterGrace,
}, null, 2))
