import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-contract.json',
  triggerContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract.json',
  trigger: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  diagnosisContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json',
  diagnosisAcceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json',
  checkpointEvidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  checkpointRetirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  runner: 'scripts/run-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis.mjs',
  workflow: '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  packageVerifier: 'scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs',
  retirementVerifier: 'scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs',
}

for (const [name, path] of Object.entries(files)) {
  if (name === 'trigger') continue
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(files.trigger), false, `${files.trigger}: package PR must not arm production diagnosis`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contract = json(files.contract)
const triggerContract = json(files.triggerContract)
const diagnosisContract = json(files.diagnosisContract)
const diagnosisAcceptance = json(files.diagnosisAcceptance)
const checkpointEvidence = json(files.checkpointEvidence)
const checkpointRetirement = json(files.checkpointRetirement)
const runner = read(files.runner)
const workflow = read(files.workflow)

assert.equal(contract.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-v1')
assert.equal(contract.status, 'ready_for_validation')
assert.equal(contract.phase, '12A-5B-R2')
assert.equal(contract.trackingIssue, 659)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.mode, 'checkpoint_failure_diagnosis')
assert.equal(contract.governingMainSha, '2e6600a17dbb5f4a3729fe2f8d340e77eca49c23')
assert.equal(contract.acceptedDiagnosisPackage.packagePr, 670)
assert.equal(contract.acceptedDiagnosisPackage.packageCandidateHeadSha, '4cb52b9cb11eb5b27a7f93eaa0e14838ab686039')
assert.equal(contract.acceptedDiagnosisPackage.packageMergeSha, '7f8e2d5adeec187a194aefc8fb2b239d05c5318a')
assert.equal(contract.acceptedDiagnosisPackage.acceptancePr, 671)
assert.equal(contract.acceptedDiagnosisPackage.acceptanceMergeSha, '2e6600a17dbb5f4a3729fe2f8d340e77eca49c23')
assert.equal(contract.acceptedDiagnosisPackage.validationRunId, 30481973791)
assert.equal(contract.acceptedDiagnosisPackage.validationJobId, 90678071929)
assert.equal(contract.sourceCheckpoint.workflowRunId, 30478338654)
assert.equal(contract.sourceCheckpoint.checkpointJobId, 90665697236)
assert.equal(contract.sourceCheckpoint.artifactId, 8734980337)
assert.equal(contract.sourceCheckpoint.artifactDigest, 'sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b')
assert.equal(contract.sourceCheckpoint.evidenceJsonSha256, '041f942501f1740f2ea0f3c7a77b04aeea0d084906af0faf625f370c01178f6f')
assert.equal(contract.execution.workflow, files.workflow)
assert.equal(contract.execution.runner, files.runner)
assert.equal(contract.execution.verifier, files.packageVerifier.replace('diagnosis-package', 'diagnosis-execution-package'))
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
assert.deepEqual(contract.requiredOutputs, [
  'exact_missing_bucket_presence',
  'collector_runs_gap_context',
  'snapshots_gap_context',
  'null_refs_by_bucket',
  'null_refs_top_channels',
  'null_ref_checkpoint_summary',
  'null_ref_post_checkpoint_summary',
  'current_collector_status',
  'static_code_attribution',
  'diagnostic_limitations',
])
assert.equal(contract.artifact.name, 'analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis')
assert.equal(contract.artifact.path, 'artifacts/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis/run/evidence.json')
assert.equal(contract.artifact.sanitized, true)
assert.equal(contract.artifact.retentionDays, 30)
assert.equal(contract.artifact.digestFreezeRequired, true)
assert.equal(Object.values(contract.acceptance).every((value) => value === null || value === false), true)
assert.equal(contract.afterExecution.evidenceFreezeRequired, true)
assert.equal(contract.afterExecution.triggerRetirementRequired, true)
assert.equal(contract.afterExecution.workflowRetirementRequired, true)
assert.equal(contract.afterExecution.diagnosisIsNonAuthorizing, true)
for (const key of [
  'checkpointRerunAuthorized',
  'automaticRecoveryAuthorized',
  'automaticClockResetAuthorized',
  'auditAcceptanceAuthorized',
  'publicCutoverAuthorized',
]) assert.equal(contract.afterExecution[key], false, `contract afterExecution.${key} must be false`)

assert.equal(triggerContract.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract-v1')
assert.equal(triggerContract.status, 'ready_for_validation')
assert.equal(triggerContract.phase, contract.phase)
assert.equal(triggerContract.trackingIssue, contract.trackingIssue)
assert.equal(triggerContract.provider, contract.provider)
assert.equal(triggerContract.mode, contract.mode)
assert.equal(triggerContract.packageContract, files.contract)
assert.equal(triggerContract.trigger.path, files.trigger)
assert.equal(triggerContract.trigger.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-v1')
assert.equal(triggerContract.trigger.status, 'armed')
assert.equal(triggerContract.trigger.provider, 'twitch')
assert.equal(triggerContract.trigger.mode, contract.mode)
assert.equal(triggerContract.trigger.oneTime, true)
assert.equal(triggerContract.trigger.confirmation, 'RUN_TWITCH_CHECKPOINT_FAILURE_DIAGNOSIS')
assert.equal(triggerContract.trigger.maximumStartDelayHours, 3)
assert.equal(triggerContract.trigger.allowedPastSkewMinutes, 10)
assert.deepEqual(triggerContract.trigger.requiredFields, [
  'schemaVersion',
  'status',
  'provider',
  'mode',
  'oneTime',
  'confirmation',
  'packagePr',
  'packageMergeSha',
  'acceptancePr',
  'startAt',
])
assert.equal(triggerContract.acceptedPackageIdentity.required, true)
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, null)
assert.equal(triggerContract.acceptedPackageIdentity.packageMergeSha, null)
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, null)
assert.equal(triggerContract.executionBoundary.event, contract.execution.event)
assert.equal(triggerContract.executionBoundary.workflowDispatchAuthorized, false)
assert.equal(triggerContract.executionBoundary.scheduleAuthorized, false)
assert.equal(triggerContract.executionBoundary.newWorkerCronAuthorized, false)
assert.equal(triggerContract.executionBoundary.diagnosisRunner, files.runner)
assert.deepEqual(triggerContract.executionBoundary.cloudflareApiMethods, [])
assert.deepEqual(triggerContract.executionBoundary.d1Statements, ['SELECT', 'WITH'])
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
]) assert.equal(triggerContract.executionBoundary[key], false, `trigger executionBoundary.${key} must be false`)
assert.equal(triggerContract.afterExecution.sanitizedArtifactRequired, true)
assert.equal(triggerContract.afterExecution.workflowJobArtifactDigestFreezeRequired, true)
assert.equal(triggerContract.afterExecution.diagnosisEvidenceOnly, true)
assert.equal(triggerContract.afterExecution.triggerRetirementRequired, true)
assert.equal(triggerContract.afterExecution.workflowRetirementRequired, true)
for (const key of [
  'checkpointRerunAuthorized',
  'automaticRecoveryAuthorized',
  'automaticClockResetAuthorized',
  'auditAcceptanceAuthorized',
  'publicCutoverAuthorized',
]) assert.equal(triggerContract.afterExecution[key], false, `trigger afterExecution.${key} must be false`)

assert.equal(diagnosisContract.status, 'accepted')
assert.equal(diagnosisContract.acceptance.packagePr, 670)
assert.equal(diagnosisContract.acceptance.packageMergeSha, contract.acceptedDiagnosisPackage.packageMergeSha)
assert.equal(diagnosisContract.acceptance.acceptancePr, 671)
assert.equal(diagnosisAcceptance.status, 'accepted')
assert.equal(diagnosisAcceptance.acceptancePr, 671)
assert.equal(diagnosisAcceptance.packagePr, 670)
assert.equal(diagnosisAcceptance.packageMergeSha, contract.acceptedDiagnosisPackage.packageMergeSha)
assert.equal(diagnosisAcceptance.boundaries.productionExecutionPerformed, false)
assert.equal(diagnosisAcceptance.boundaries.productionCredentialsUsedOnPackagePr, false)
assert.equal(diagnosisAcceptance.boundaries.checkpointRerunAuthorized, false)
assert.equal(diagnosisAcceptance.boundaries.d1MutationPerformed, false)
assert.equal(diagnosisAcceptance.boundaries.publicCategoryUiAuthorized, false)
assert.equal(checkpointEvidence.status, 'checkpoint_failed')
assert.equal(checkpointEvidence.execution.workflowRunId, contract.sourceCheckpoint.workflowRunId)
assert.equal(checkpointEvidence.categoryIntegrity.missingCategoryRefs, 248)
assert.equal(checkpointRetirement.boundaries.rerunAuthorized, false)
assert.equal(checkpointRetirement.boundaries.automaticClockResetAuthorized, false)
assert.equal(checkpointRetirement.boundaries.publicCategoryUiAuthorized, false)

for (const fragment of [
  "const PROVIDER = 'twitch'",
  "const DATABASE_NAME = 'vl_twitch_hot'",
  "const CONFIG_PATH = 'workers/collector-twitch/wrangler.category-permanent.toml'",
  "if (statements.some((part) => !/^(SELECT|WITH)\\b/i.test(part)))",
  "throw new Error('non_select_statement_rejected')",
  "'--remote'",
  "'--json'",
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
  'Confirm exact diagnosis trigger is absent',
  'Verify dormant diagnosis execution package',
  'Validate accepted diagnosis execution package identity and exact trigger',
  'Run one-time read-only Twitch checkpoint-failure diagnosis',
  'Upload sanitized Twitch checkpoint-failure diagnosis evidence',
  'Fail after evidence upload when diagnosis is unhealthy',
  'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
  'CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
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
  diagnosisPackageAccepted: true,
  triggerPresent: false,
  packagePrProductionExecution: false,
  readOnlyStatements: contract.readOnlyBoundary.d1Statements,
  publicCategoryUiAuthorized: false,
  nextGate: contract.nextGate,
}, null, 2))
