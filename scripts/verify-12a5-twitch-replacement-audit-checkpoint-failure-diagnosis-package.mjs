import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json',
  acceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json',
  checkpointEvidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  checkpointRetirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  diagnosisEvidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json',
  diagnosisRetirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json',
  runner: 'scripts/run-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis.mjs',
  collector: 'workers/collector-twitch/src/index-category.ts',
  encoder: 'workers/shared/category-capture.ts',
}
for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)
const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contract = json(files.contract)
const acceptance = json(files.acceptance)
const checkpointEvidence = json(files.checkpointEvidence)
const checkpointRetirement = json(files.checkpointRetirement)
const diagnosisEvidence = json(files.diagnosisEvidence)
const diagnosisRetirement = json(files.diagnosisRetirement)
const runner = read(files.runner)
const collector = read(files.collector)
const encoder = read(files.encoder)

assert.equal(contract.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-v1')
assert.equal(contract.status, 'accepted')
assert.equal(contract.phase, '12A-5B-R2')
assert.equal(contract.trackingIssue, 659)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.sourceEvidence.checkpointRunId, 30478338654)
assert.equal(contract.sourceEvidence.checkpointJobId, 90665697236)
assert.equal(contract.sourceEvidence.artifactId, 8734980337)
assert.deepEqual(contract.fixedWindows.missingBuckets, ['2026-07-29T07:20:00.000Z', '2026-07-29T07:25:00.000Z', '2026-07-29T07:30:00.000Z'])
assert.equal(contract.staticCodeAttribution.sourceFieldsStrippedBeforePersistence, true)
assert.equal(contract.staticCodeAttribution.postPersistenceIdVsNameDistinctionPossible, false)
assert.equal(contract.execution.productionExecutionIncludedOnPackagePr, false)
assert.equal(contract.execution.productionCredentialsUsedOnPackagePr, false)
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(contract.acceptance.packagePr, 670)
assert.equal(contract.acceptance.packageMergeSha, '7f8e2d5adeec187a194aefc8fb2b239d05c5318a')
assert.equal(contract.acceptance.acceptancePr, 671)
assert.equal(contract.acceptance.validationRunId, 30481973791)
assert.equal(contract.acceptance.validationJobId, 90678071929)
assert.equal(contract.acceptance.productionExecutionPerformed, false)

assert.equal(acceptance.status, 'accepted')
assert.equal(acceptance.acceptancePr, 671)
assert.equal(acceptance.packagePr, 670)
assert.equal(acceptance.validation.conclusion, 'success')
assert.equal(acceptance.acceptedCapabilities.readOnlyDiagnosisRunner, true)
for (const key of ['productionExecutionPerformed', 'productionCredentialsUsedOnPackagePr', 'checkpointRerunAuthorized', 'd1MutationPerformed', 'thresholdRelaxationAuthorized', 'clockResetAuthorized', 'kickChanged', 'finalModeAuthorized', 'publicCategoryUiAuthorized']) assert.equal(acceptance.boundaries[key], false)

assert.equal(checkpointEvidence.status, 'checkpoint_failed')
assert.deepEqual(checkpointEvidence.slotContinuity.missingSlots, contract.fixedWindows.missingBuckets)
assert.equal(checkpointEvidence.categoryIntegrity.missingCategoryRefs, 248)
assert.equal(checkpointEvidence.categoryIntegrity.invalidCategoryRefs, 0)
assert.equal(checkpointEvidence.categoryIntegrity.unresolvedCategoryIds, 0)
assert.equal(checkpointRetirement.boundaries.rerunAuthorized, false)

assert.equal(diagnosisEvidence.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-summary-v1')
assert.equal(diagnosisEvidence.status, 'diagnosis_complete')
assert.equal(diagnosisEvidence.sourceArtifact.workflowRunId, 30541697022)
assert.equal(diagnosisEvidence.sourceArtifact.runAttempt, 2)
assert.equal(diagnosisEvidence.sourceArtifact.diagnoseJobId, 90942773349)
assert.equal(diagnosisEvidence.sourceArtifact.artifactId, 8767937513)
assert.equal(diagnosisEvidence.sourceArtifact.artifactDigest, 'sha256:02cedcb6c23c6792b55c96bb4326bc24ba8d7a79880df634d8a1f98e29d02ac5')
assert.equal(diagnosisEvidence.sourceArtifact.sourceEvidenceJsonSha256, '372dc6c434830ec1ce3630b4146b29510010f0602c1a49b1b0d2fc038842236c')
assert.deepEqual(diagnosisEvidence.missingBucketDiagnosis.exactRowsPresent, [])
assert.equal(diagnosisEvidence.categoryReferenceDiagnosis.checkpoint.coverageRatio, 0.994524)
assert.equal(diagnosisEvidence.categoryReferenceDiagnosis.postCheckpoint.coverageRatio, 0.994236)
assert.equal(diagnosisEvidence.staticCodeAttribution.postPersistenceIdVsNameDistinctionPossible, false)
assert.equal(diagnosisEvidence.decisionBoundary.publicCategoryUiAuthorized, false)

assert.equal(diagnosisRetirement.status, 'retired_on_merge')
assert.equal(diagnosisRetirement.execution.workflowRunId, diagnosisEvidence.sourceArtifact.workflowRunId)
assert.equal(diagnosisRetirement.execution.diagnoseJobId, diagnosisEvidence.sourceArtifact.diagnoseJobId)
assert.equal(diagnosisRetirement.execution.artifactId, diagnosisEvidence.sourceArtifact.artifactId)
assert.equal(diagnosisRetirement.cancelledAttempt.diagnosisRunnerExecuted, false)
assert.equal(diagnosisRetirement.boundaries.automaticRecoveryAuthorized, false)
assert.equal(diagnosisRetirement.boundaries.automaticClockResetAuthorized, false)
assert.equal(diagnosisRetirement.boundaries.publicCategoryUiAuthorized, false)

for (const fragment of [
  "const GAP_START = '2026-07-29T06:50:00.000Z'",
  "const CHECKPOINT_START = '2026-07-29T05:30:00.000Z'",
  'exactMissingBucketPresence', 'collectorRunsGapContext', 'snapshotsGapContext', 'nullRefsByBucket', 'nullRefsTopChannels', 'checkpointNullRefSummary', 'postCheckpointNullRefSummary', 'currentCollectorStatus',
  "if (statements.some((part) => !/^(SELECT|WITH)\\b/i.test(part)))", "throw new Error('non_select_statement_rejected')", "'--remote'", "'--json'",
]) assert.ok(runner.includes(fragment), `runner missing: ${fragment}`)
for (const forbidden of ['wrangler@4 deploy', 'INSERT INTO', 'UPDATE ', 'DELETE FROM', 'ALTER TABLE', 'AUDIT_MODE=final']) assert.equal(runner.includes(forbidden), false, `runner forbidden fragment: ${forbidden}`)
assert.ok(collector.includes("const categoryProviderId = String(stream.game_id ?? '').trim()"))
assert.ok(collector.includes("const categoryName = String(stream.game_name ?? '').trim()"))
assert.ok(collector.includes('const storedItems = stripCategorySourceFields(input.items)'))
assert.ok(encoder.includes('if (!id || !name)'))
assert.ok(encoder.includes('categoryRefs.push(null)'))
assert.ok(encoder.includes('stripCategorySourceFields'))

console.log(JSON.stringify({
  ok: true,
  sourceCheckpointFailed: true,
  diagnosisQueryPackageAccepted: true,
  diagnosisStatus: diagnosisEvidence.status,
  diagnosisPathRetired: true,
}, null, 2))
