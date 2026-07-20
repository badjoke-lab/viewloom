import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const write = (file, value) => fs.writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`)
const json = (file) => JSON.parse(read(file))

const evidencePath = 'docs/audits/12a4-twitch-permanent-category-release-package-acceptance.json'
const contractPath = 'docs/audits/12a4-twitch-permanent-category-release-contract.json'
const gatePath = 'docs/audits/12a2-current-gate-state.json'
const evidence = json(evidencePath)
const contract = json(contractPath)
const gate = json(gatePath)

assert.equal(evidence.status, 'accepted')
assert.equal(evidence.acceptancePr, 628)
assert.equal(contract.status, 'prepared')
assert.equal(contract.packagePr, 627)
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v24')
assert.equal(gate.currentWorkstream.phase, '12A-4-20')

contract.status = 'accepted'
contract.acceptance = {
  pr: 628,
  releasePackagePr: evidence.releasePackagePr,
  releasePackageCandidateHeadSha: evidence.releasePackageCandidateHeadSha,
  mergeSha: evidence.releasePackageMergeSha,
  workflowRunId: evidence.validationWorkflowRunId,
  workflowJobId: evidence.validationWorkflowJobId,
  dormantPackageScopePass: true,
  releaseFixturePass: true,
  releaseContractPass: true,
  categoryRolloutPolicyPass: true,
  collectorTypecheckPass: true,
  normalTwitchDryRunBundlePass: true,
  permanentTwitchDryRunBundlePass: true,
  triggerPresent: false,
  productionRuntimeCaptureStarted: false,
  productionWorkerPublished: false,
  remoteD1OperationPerformed: false,
  kickChanged: false
}
contract.nextGate = 'create a separate exact one-file Twitch release trigger with the accepted release-package merge SHA and a start boundary inside three hours'
write(contractPath, JSON.stringify(contract, null, 2))

gate.schemaVersion = 'viewloom-12a2-current-gate-state-v25'
gate.status = '12a4_twitch_permanent_category_release_package_accepted_trigger_pending'
gate.twitchPermanentCategoryReleasePackage = {
  status: 'accepted',
  trackingIssue: 623,
  packagePr: evidence.releasePackagePr,
  packageCandidateHeadSha: evidence.releasePackageCandidateHeadSha,
  packageMergeSha: evidence.releasePackageMergeSha,
  acceptancePr: 628,
  workflowRunId: evidence.validationWorkflowRunId,
  workflowJobId: evidence.validationWorkflowJobId,
  contract: contractPath,
  evidence: evidencePath,
  exactTriggerPresent: false,
  productionRuntimeCaptureStarted: false,
  productionWorkerPublished: false,
  remoteD1OperationPerformed: false,
  kickChanged: false
}
Object.assign(gate.categoryCapture, {
  twitchPermanentReleasePackageAccepted: true,
  twitchPermanentExactReleaseTriggerAccepted: false,
  twitchPermanentRuntimeCaptureActive: false,
  runtimeCaptureStarted: false,
  categoryCaptureFlagPresent: false,
  kickPermanentRuntimeCaptureAuthorized: false
})
gate.currentWorkstream = {
  ...gate.currentWorkstream,
  phase: '12A-4-21',
  name: 'Twitch permanent category release package accepted; exact trigger pending',
  trackingIssue: 623,
  releasePackagePr: evidence.releasePackagePr,
  releasePackageAcceptancePr: 628,
  releasePackageAccepted: true,
  productionExecutionIncluded: false,
  runtimeCaptureStarted: false,
  runtimeCaptureAuthorized: true,
  authorizationScope: 'twitch_only',
  twitchPermanentCaptureAuthorized: true,
  twitchPermanentCaptureActive: false,
  kickPermanentCaptureAuthorized: false,
  exactReleaseTriggerCurrent: false,
  freshReadOnlyPreflightRequired: true,
  initialConsecutiveCategorySnapshotsRequired: 2,
  automaticRollbackRequired: true,
  minimumObservationHours: 24,
  warningObservationHours: 48,
  categoryUiAuthorized: false,
  crossProviderAnalyticsAllowed: false
}
gate.nextWorkstream = 'create the separate exact one-file Twitch permanent category release trigger with a start boundary inside three hours; the main workflow must run fresh read-only preflight before release, verify two category-bearing snapshots, and restore normal config on failure'
write(gatePath, JSON.stringify(gate, null, 2))

console.log(JSON.stringify({ ok: true, schemaVersion: gate.schemaVersion, phase: gate.currentWorkstream.phase, acceptancePr: 628 }, null, 2))
