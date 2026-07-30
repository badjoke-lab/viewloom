import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-contract.json',
  acceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-acceptance.json',
  triggerContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract.json',
  trigger: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  diagnosisContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json',
  diagnosisAcceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json',
  checkpointEvidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  checkpointRetirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  runner: 'scripts/run-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis.mjs',
  workflow: '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
}
for (const [name, path] of Object.entries(files)) {
  if (name === 'trigger') continue
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(files.trigger), false, `${files.trigger}: acceptance PR must not arm production diagnosis`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contract = json(files.contract)
const acceptance = json(files.acceptance)
const triggerContract = json(files.triggerContract)
const diagnosisContract = json(files.diagnosisContract)
const diagnosisAcceptance = json(files.diagnosisAcceptance)
const checkpointEvidence = json(files.checkpointEvidence)
const checkpointRetirement = json(files.checkpointRetirement)
const runner = read(files.runner)
const workflow = read(files.workflow)

assert.equal(contract.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-v1')
assert.equal(contract.status, 'accepted')
assert.equal(contract.phase, '12A-5B-R2')
assert.equal(contract.trackingIssue, 659)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.mode, 'checkpoint_failure_diagnosis')
assert.equal(contract.governingMainSha, '2e6600a17dbb5f4a3729fe2f8d340e77eca49c23')
assert.equal(contract.acceptedDiagnosisPackage.packagePr, 670)
assert.equal(contract.acceptedDiagnosisPackage.packageMergeSha, '7f8e2d5adeec187a194aefc8fb2b239d05c5318a')
assert.equal(contract.acceptedDiagnosisPackage.acceptancePr, 671)
assert.equal(contract.acceptedDiagnosisPackage.acceptanceMergeSha, '2e6600a17dbb5f4a3729fe2f8d340e77eca49c23')
assert.equal(contract.sourceCheckpoint.workflowRunId, 30478338654)
assert.equal(contract.sourceCheckpoint.checkpointJobId, 90665697236)
assert.equal(contract.sourceCheckpoint.artifactId, 8734980337)
assert.equal(contract.sourceCheckpoint.artifactDigest, 'sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b')
assert.equal(contract.execution.workflow, files.workflow)
assert.equal(contract.execution.runner, files.runner)
assert.equal(contract.execution.triggerContract, files.triggerContract)
assert.equal(contract.execution.triggerPath, files.trigger)
assert.equal(contract.execution.event, 'push_to_main_with_exact_trigger_path')
assert.equal(contract.execution.oneTime, true)
assert.equal(contract.execution.productionExecutionIncludedOnPackagePr, false)
assert.equal(contract.execution.productionCredentialsUsedOnPackagePr, false)
assert.equal(contract.execution.separateAcceptanceRequired, true)
assert.equal(contract.execution.separateExactTriggerRequired, true)
assert.equal(contract.execution.workflowDispatchAuthorized, false)
assert.equal(contract.execution.scheduleAuthorized, false)
assert.equal(contract.execution.newWorkerCronAuthorized, false)
assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, [])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
for (const key of [
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'bindingMutationAuthorized',
  'schemaMutationAuthorized',
  'cadenceMutationAuthorized',
  'retentionMutationAuthorized',
  'kickChangeAuthorized',
  'crossProviderBehaviorAuthorized',
  'finalModeAuthorized',
  'publicExposureAuthorized',
]) assert.equal(contract.readOnlyBoundary[key], false, `contract readOnlyBoundary.${key} must be false`)
assert.equal(contract.acceptanceRecord, files.acceptance)
assert.equal(contract.acceptance.packagePr, 672)
assert.equal(contract.acceptance.packageCandidateHeadSha, 'c496963f03611be4e9b957e6bf99d15f0d97bad4')
assert.equal(contract.acceptance.packageMergeSha, '02ece37cc70de4faa5251600a465d4e68d058f29')
assert.equal(contract.acceptance.acceptancePr, 673)
assert.equal(contract.acceptance.validationRunId, 30539504888)
assert.equal(contract.acceptance.validationJobId, 90860798797)
assert.equal(contract.acceptance.productionExecutionPerformed, false)
assert.equal(contract.afterExecution.evidenceFreezeRequired, true)
assert.equal(contract.afterExecution.triggerRetirementRequired, true)
assert.equal(contract.afterExecution.workflowRetirementRequired, true)
assert.equal(contract.afterExecution.diagnosisIsNonAuthorizing, true)
for (const key of ['checkpointRerunAuthorized', 'automaticRecoveryAuthorized', 'automaticClockResetAuthorized', 'auditAcceptanceAuthorized', 'publicCutoverAuthorized']) {
  assert.equal(contract.afterExecution[key], false, `contract afterExecution.${key} must be false`)
}

assert.equal(acceptance.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-acceptance-v1')
assert.equal(acceptance.status, 'accepted')
assert.equal(acceptance.packagePr, 672)
assert.equal(acceptance.packageCandidateHeadSha, contract.acceptance.packageCandidateHeadSha)
assert.equal(acceptance.packageMergeSha, contract.acceptance.packageMergeSha)
assert.equal(acceptance.acceptancePr, 673)
assert.equal(acceptance.validation.workflowRunId, contract.acceptance.validationRunId)
assert.equal(acceptance.validation.workflowJobId, contract.acceptance.validationJobId)
assert.equal(acceptance.validation.conclusion, 'success')
for (const key of ['triggerAbsent', 'productionDiagnosisSkipped', 'executionPackageVerifierPassed', 'acceptedDiagnosisPackageVerifierPassed', 'checkpointRetirementVerifierPassed', 'categoryPolicyPassed', 'developmentPolicyPassed', 'typecheckPassed', 'buildPassed', 'publicCategoryControlsAbsent']) {
  assert.equal(acceptance.validation[key], true, `acceptance validation.${key} must be true`)
}
for (const key of ['oneTimeReadOnlyDiagnosisWorkflow', 'exactTriggerContract', 'sanitizedEvidenceArtifact', 'd1SelectWithOnly', 'separateExactTriggerRequired']) {
  assert.equal(acceptance.acceptedCapabilities[key], true, `acceptance acceptedCapabilities.${key} must be true`)
}
for (const value of Object.values(acceptance.boundaries)) assert.equal(value, false, 'all acceptance boundaries must remain false')

assert.equal(triggerContract.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract-v1')
assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.packageContract, files.contract)
assert.equal(triggerContract.packageAcceptance, files.acceptance)
assert.equal(triggerContract.trigger.path, files.trigger)
assert.equal(triggerContract.trigger.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-v1')
assert.equal(triggerContract.trigger.status, 'armed')
assert.equal(triggerContract.trigger.provider, 'twitch')
assert.equal(triggerContract.trigger.mode, 'checkpoint_failure_diagnosis')
assert.equal(triggerContract.trigger.oneTime, true)
assert.equal(triggerContract.trigger.confirmation, 'RUN_TWITCH_CHECKPOINT_FAILURE_DIAGNOSIS')
assert.equal(triggerContract.acceptedPackageIdentity.required, true)
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, 672)
assert.equal(triggerContract.acceptedPackageIdentity.packageMergeSha, '02ece37cc70de4faa5251600a465d4e68d058f29')
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, 673)
assert.equal(triggerContract.executionBoundary.event, contract.execution.event)
assert.deepEqual(triggerContract.executionBoundary.cloudflareApiMethods, [])
assert.deepEqual(triggerContract.executionBoundary.d1Statements, ['SELECT', 'WITH'])
for (const key of [
  'workflowDispatchAuthorized',
  'scheduleAuthorized',
  'newWorkerCronAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'bindingMutationAuthorized',
  'schemaMutationAuthorized',
  'cadenceMutationAuthorized',
  'retentionMutationAuthorized',
  'kickChangeAuthorized',
  'crossProviderBehaviorAuthorized',
  'finalModeAuthorized',
  'publicExposureAuthorized',
]) assert.equal(triggerContract.executionBoundary[key], false, `trigger executionBoundary.${key} must be false`)
for (const key of ['checkpointRerunAuthorized', 'automaticRecoveryAuthorized', 'automaticClockResetAuthorized', 'auditAcceptanceAuthorized', 'publicCutoverAuthorized']) {
  assert.equal(triggerContract.afterExecution[key], false, `trigger afterExecution.${key} must be false`)
}
assert.equal(triggerContract.afterExecution.sanitizedArtifactRequired, true)
assert.equal(triggerContract.afterExecution.workflowJobArtifactDigestFreezeRequired, true)
assert.equal(triggerContract.afterExecution.diagnosisEvidenceOnly, true)
assert.equal(triggerContract.afterExecution.triggerRetirementRequired, true)
assert.equal(triggerContract.afterExecution.workflowRetirementRequired, true)

assert.equal(diagnosisContract.status, 'accepted')
assert.equal(diagnosisAcceptance.status, 'accepted')
assert.equal(diagnosisAcceptance.acceptancePr, 671)
assert.equal(checkpointEvidence.status, 'checkpoint_failed')
assert.equal(checkpointEvidence.categoryIntegrity.missingCategoryRefs, 248)
assert.equal(checkpointRetirement.boundaries.rerunAuthorized, false)
assert.equal(checkpointRetirement.boundaries.automaticClockResetAuthorized, false)
assert.equal(checkpointRetirement.boundaries.publicCategoryUiAuthorized, false)

for (const fragment of [
  "if (statements.some((part) => !/^(SELECT|WITH)\\b/i.test(part)))",
  "throw new Error('non_select_statement_rejected')",
  "'--remote'",
  'exactMissingBucketPresence',
  'collectorRunsGapContext',
  'snapshotsGapContext',
  'nullRefsByBucket',
  'nullRefsTopChannels',
  'checkpointNullRefSummary',
  'postCheckpointNullRefSummary',
  'currentCollectorStatus',
]) assert.ok(runner.includes(fragment), `runner missing: ${fragment}`)
for (const forbidden of ['wrangler@4 deploy', 'INSERT INTO', 'UPDATE ', 'DELETE FROM', 'ALTER TABLE', 'AUDIT_MODE=final']) {
  assert.equal(runner.includes(forbidden), false, `runner forbidden fragment: ${forbidden}`)
}
for (const fragment of [
  'name: Analytics 12A5 Twitch Checkpoint Failure Diagnosis Execution',
  "github.event_name == 'pull_request' && needs.classify.outputs.trigger_present != 'true'",
  "github.event_name == 'push' && needs.classify.outputs.trigger_present == 'true'",
  'Validate accepted diagnosis execution package identity and exact trigger',
  'Run one-time read-only Twitch checkpoint-failure diagnosis',
  'Upload sanitized Twitch checkpoint-failure diagnosis evidence',
]) assert.ok(workflow.includes(fragment), `workflow missing: ${fragment}`)
assert.equal(workflow.includes('workflow_dispatch:'), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('contents: write'), false)
assert.equal(workflow.includes('wrangler deploy'), false)
assert.equal(workflow.includes('AUDIT_MODE=final'), false)
assert.equal(workflow.includes(`run: node ${files.runner}`), true)

console.log(JSON.stringify({
  ok: true,
  phase: contract.phase,
  mode: contract.mode,
  executionPackageAccepted: true,
  triggerPresent: false,
  nextGate: contract.nextGate,
  publicCategoryUiAuthorized: false,
}, null, 2))
