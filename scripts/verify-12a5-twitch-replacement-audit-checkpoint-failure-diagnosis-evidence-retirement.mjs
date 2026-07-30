import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json'
const retirementPath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json'
const retiredPaths = [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
]
for (const path of [evidencePath, retirementPath]) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of retiredPaths) assert.equal(existsSync(path), false, `${path}: temporary diagnosis path must be retired`)

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const evidence = json(evidencePath)
const retirement = json(retirementPath)

assert.equal(evidence.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-summary-v1')
assert.equal(evidence.status, 'diagnosis_complete')
assert.equal(evidence.phase, '12A-5B-R2')
assert.equal(evidence.trackingIssue, 659)
assert.equal(evidence.provider, 'twitch')
assert.equal(evidence.sourceArtifact.workflowRunId, 30541697022)
assert.equal(evidence.sourceArtifact.runAttempt, 2)
assert.equal(evidence.sourceArtifact.diagnoseJobId, 90942773349)
assert.equal(evidence.sourceArtifact.artifactId, 8767937513)
assert.equal(evidence.sourceArtifact.artifactDigest, 'sha256:02cedcb6c23c6792b55c96bb4326bc24ba8d7a79880df634d8a1f98e29d02ac5')
assert.equal(evidence.sourceArtifact.sourceEvidenceJsonSha256, '372dc6c434830ec1ce3630b4146b29510010f0602c1a49b1b0d2fc038842236c')
assert.equal(evidence.sourceArtifact.normalization, 'decision_summary_derived_from_sanitized_artifact')
assert.equal(evidence.sourceCheckpoint.workflowRunId, 30478338654)
assert.equal(evidence.sourceCheckpoint.checkpointJobId, 90665697236)
assert.equal(evidence.sourceCheckpoint.artifactId, 8734980337)
assert.deepEqual(evidence.window.missingBuckets, [
  '2026-07-29T07:20:00.000Z',
  '2026-07-29T07:25:00.000Z',
  '2026-07-29T07:30:00.000Z',
])

assert.deepEqual(evidence.missingBucketDiagnosis.exactRowsPresent, [])
assert.equal(evidence.missingBucketDiagnosis.previousRecordedRun.bucket_minute, '2026-07-29T07:15:00.000Z')
assert.equal(evidence.missingBucketDiagnosis.previousRecordedRun.status, 'ok')
assert.equal(evidence.missingBucketDiagnosis.nextRecordedRun.bucket_minute, '2026-07-29T07:35:00.000Z')
assert.equal(evidence.missingBucketDiagnosis.nextRecordedRun.status, 'ok')
assert.equal(evidence.missingBucketDiagnosis.contextRunCount, 11)
assert.equal(evidence.missingBucketDiagnosis.contextRunsAllOk, true)
assert.equal(evidence.missingBucketDiagnosis.explicitFailureRowsForMissingBuckets, 0)

const checkpoint = evidence.categoryReferenceDiagnosis.checkpoint
const post = evidence.categoryReferenceDiagnosis.postCheckpoint
assert.equal(checkpoint.snapshot_rows, 151)
assert.equal(checkpoint.total_category_refs, 45287)
assert.equal(checkpoint.present_category_refs, 45039)
assert.equal(checkpoint.null_category_refs, 248)
assert.equal(checkpoint.coverageRatio, 0.994524)
assert.equal(post.snapshot_rows, 269)
assert.equal(post.total_category_refs, 80675)
assert.equal(post.present_category_refs, 80210)
assert.equal(post.null_category_refs, 465)
assert.equal(post.coverageRatio, 0.994236)
assert.equal(evidence.categoryReferenceDiagnosis.coverageDeltaPostMinusCheckpoint, -0.000288)
assert.equal(evidence.categoryReferenceDiagnosis.concentration.top3Occurrences, 113)
assert.equal(evidence.categoryReferenceDiagnosis.concentration.top10Occurrences, 188)
assert.equal(evidence.categoryReferenceDiagnosis.concentration.allCheckpointNullOccurrencesAccountedFor, true)
assert.equal(evidence.categoryReferenceDiagnosis.topChannels[0].channel_login, 'gronkhtv')
assert.equal(evidence.categoryReferenceDiagnosis.topChannels[0].null_ref_occurrences, 44)
assert.equal(evidence.currentCollectorStatus.status, 'ok')
assert.equal(evidence.currentCollectorStatus.latest_bucket_minute, '2026-07-30T16:55:00.000Z')
assert.equal(evidence.staticCodeAttribution.nullReferenceCondition, 'categoryProviderId or categoryName is empty after trim')
assert.equal(evidence.staticCodeAttribution.sourceFieldsStrippedBeforePersistence, true)
assert.equal(evidence.staticCodeAttribution.postPersistenceIdVsNameDistinctionPossible, false)
for (const [key, value] of Object.entries(evidence.decisionBoundary)) {
  if (key === 'diagnosisEvidenceOnly') assert.equal(value, true)
  else assert.equal(value, false, `decision boundary ${key} must be false`)
}

assert.equal(retirement.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement-v1')
assert.equal(retirement.status, 'retired_on_merge')
assert.equal(retirement.sourceTrigger.pr, 678)
assert.equal(retirement.sourceTrigger.mergeSha, 'ccb05bce0622a23e211c2c1eadc23052377d302e')
assert.equal(retirement.execution.workflowRunId, 30541697022)
assert.equal(retirement.execution.runAttempt, 2)
assert.equal(retirement.execution.diagnoseJobId, 90942773349)
assert.equal(retirement.execution.workflowConclusion, 'success')
assert.equal(retirement.execution.diagnoseConclusion, 'success')
assert.equal(retirement.execution.artifactId, 8767937513)
assert.equal(retirement.execution.artifactDigest, evidence.sourceArtifact.artifactDigest)
assert.equal(retirement.execution.sourceEvidenceJsonSha256, evidence.sourceArtifact.sourceEvidenceJsonSha256)
assert.equal(retirement.cancelledAttempt.runAttempt, 1)
assert.equal(retirement.cancelledAttempt.diagnoseJobId, 90867816146)
assert.equal(retirement.cancelledAttempt.diagnosisRunnerExecuted, false)
assert.equal(retirement.cancelledAttempt.artifactProduced, false)
assert.equal(retirement.evidencePath, evidencePath)
assert.equal(retirement.evidenceSchemaVersion, evidence.schemaVersion)
assert.deepEqual(retirement.retiredPaths, retiredPaths)
assert.equal(retirement.boundaries.diagnosisEvidenceOnly, true)
for (const [key, value] of Object.entries(retirement.boundaries)) {
  if (key === 'diagnosisEvidenceOnly') continue
  assert.equal(value, false, `retirement boundary ${key} must be false`)
}

console.log(JSON.stringify({
  ok: true,
  workflowRunId: retirement.execution.workflowRunId,
  runAttempt: retirement.execution.runAttempt,
  diagnoseJobId: retirement.execution.diagnoseJobId,
  artifactId: retirement.execution.artifactId,
  artifactDigest: retirement.execution.artifactDigest,
  sourceEvidenceJsonSha256: retirement.execution.sourceEvidenceJsonSha256,
  missingRowsPresent: evidence.missingBucketDiagnosis.exactRowsPresent.length,
  checkpointCoverage: checkpoint.coverageRatio,
  postCheckpointCoverage: post.coverageRatio,
  temporaryPathRetired: true,
  publicCategoryUiAuthorized: false,
}, null, 2))
