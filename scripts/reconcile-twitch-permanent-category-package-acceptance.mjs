import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const write = (file, value) => fs.writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`)
const json = (file) => JSON.parse(read(file))

const evidencePath = 'docs/audits/12a4-twitch-permanent-category-capture-package-acceptance.json'
const contractPath = 'docs/audits/12a4-twitch-permanent-category-capture-package-contract.json'
const gatePath = 'docs/audits/12a2-current-gate-state.json'
const evidence = json(evidencePath)
const contract = json(contractPath)
const gate = json(gatePath)

assert.equal(evidence.status, 'accepted')
assert.equal(evidence.acceptancePr, 626)
assert.equal(contract.status, 'prepared')
assert.equal(contract.packagePr, 625)
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v23')
assert.equal(gate.currentWorkstream.phase, '12A-4-19')

contract.status = 'accepted'
contract.acceptance = {
  pr: 626,
  packagePr: evidence.packagePr,
  packageCandidateHeadSha: evidence.packageCandidateHeadSha,
  packageMergeSha: evidence.packageMergeSha,
  workflowRunId: evidence.packageWorkflowRunId,
  workflowJobId: evidence.packageWorkflowJobId,
  artifactId: evidence.packageArtifactId,
  artifactDigest: evidence.packageArtifactDigest,
  exactScopePass: true,
  fixturePass: true,
  packageContractPass: true,
  categoryRolloutPolicyPass: true,
  collectorTypecheckPass: true,
  normalTwitchDryRunBundlePass: true,
  permanentCategoryTwitchDryRunBundlePass: true,
  productionRuntimeCaptureStarted: false,
  productionWorkerDeployed: false,
  remoteD1OperationPerformed: false,
  kickChanged: false
}
contract.nextGate = 'prepare a separate exact 12A-4-21 Twitch production deployment package with fresh read-only preflight, two consecutive category-bearing snapshot verification, 24-48 hour observation, and rollback'
write(contractPath, JSON.stringify(contract, null, 2))

gate.schemaVersion = 'viewloom-12a2-current-gate-state-v24'
gate.status = '12a4_twitch_permanent_category_package_accepted_deployment_pending'
gate.twitchPermanentCategoryCapturePackage = {
  status: 'accepted',
  trackingIssue: 623,
  packagePr: evidence.packagePr,
  packageCandidateHeadSha: evidence.packageCandidateHeadSha,
  packageMergeSha: evidence.packageMergeSha,
  acceptancePr: 626,
  workflowRunId: evidence.packageWorkflowRunId,
  workflowJobId: evidence.packageWorkflowJobId,
  artifactId: evidence.packageArtifactId,
  artifactDigest: evidence.packageArtifactDigest,
  contract: contractPath,
  evidence: evidencePath,
  permanentConfig: evidence.package.permanentConfig,
  rollbackConfig: evidence.package.rollbackConfig,
  readOnlyObserver: evidence.package.readOnlyObserver,
  packageAccepted: true,
  productionDeploymentIncluded: false,
  runtimeCaptureStarted: false,
  remoteD1OperationPerformed: false,
  kickChanged: false
}
Object.assign(gate.categoryCapture, {
  twitchPermanentPackageAccepted: true,
  twitchPermanentRuntimeCaptureAuthorized: true,
  twitchPermanentRuntimeCaptureActive: false,
  runtimeCaptureStarted: false,
  categoryCaptureFlagPresent: false,
  kickPermanentRuntimeCaptureAuthorized: false
})
gate.closedBlockers = [...new Set([...gate.closedBlockers, 'twitch_permanent_category_capture_not_implemented'])]
gate.openBlockers = [
  'twitch_permanent_category_capture_not_deployed',
  'twitch_permanent_category_capture_observation_not_accepted',
  'kick_permanent_category_capture_not_authorized'
]
gate.currentWorkstream = {
  ...gate.currentWorkstream,
  phase: '12A-4-20',
  name: 'Twitch permanent category capture package accepted; deployment pending',
  trackingIssue: 623,
  packagePr: evidence.packagePr,
  packageAcceptancePr: 626,
  packageAccepted: true,
  productionExecutionIncluded: false,
  runtimeCaptureStarted: false,
  runtimeCaptureAuthorized: true,
  authorizationScope: 'twitch_only',
  twitchPermanentCaptureAuthorized: true,
  twitchPermanentCaptureActive: false,
  kickPermanentCaptureAuthorized: false,
  exactDeploymentTriggerCurrent: false,
  freshReadOnlyPreflightRequired: true,
  rollbackConfigAccepted: true,
  observerAccepted: true,
  minimumObservationHours: 24,
  warningObservationHours: 48,
  categoryUiAuthorized: false,
  crossProviderAnalyticsAllowed: false
}
gate.nextWorkstream = 'prepare the separate exact 12A-4-21 Twitch deployment package; run a fresh read-only production preflight before deployment, verify two consecutive category-bearing real non-empty snapshots, retain rollback to the normal config, and do not change Kick'
write(gatePath, JSON.stringify(gate, null, 2))

console.log(JSON.stringify({ ok: true, schemaVersion: gate.schemaVersion, phase: gate.currentWorkstream.phase, acceptancePr: 626 }, null, 2))
