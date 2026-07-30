import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const evidencePath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json'
const retirementPath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json'
const retiredPaths = [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
]
for (const path of [evidencePath, retirementPath]) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of retiredPaths) assert.equal(existsSync(path), false, `${path}: temporary diagnosis path must be retired`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const evidenceSource = read(evidencePath)
const evidence = JSON.parse(evidenceSource)
const retirement = json(retirementPath)
const evidenceSha256 = createHash('sha256').update(evidenceSource).digest('hex')

assert.equal(evidence.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-v1')
assert.equal(evidence.status, 'diagnosis_complete')
assert.equal(evidence.phase, '12A-5B-R2')
assert.equal(evidence.trackingIssue, 659)
assert.equal(evidence.provider, 'twitch')
assert.equal(Number.isNaN(Date.parse(evidence.observedAt)), false)
assert.equal(evidence.sourceCheckpoint.workflowRunId, 30478338654)
assert.equal(evidence.sourceCheckpoint.checkpointJobId, 90665697236)
assert.equal(evidence.sourceCheckpoint.artifactId, 8734980337)
assert.equal(evidence.sourceCheckpoint.artifactDigest, 'sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b')
assert.equal(evidence.windows.gapContextStartAt, '2026-07-29T06:50:00.000Z')
assert.equal(evidence.windows.gapContextEndExclusiveAt, '2026-07-29T08:00:00.000Z')
assert.equal(evidence.windows.checkpointStartAt, '2026-07-29T05:30:00.000Z')
assert.equal(evidence.windows.checkpointEndExclusiveAt, '2026-07-29T18:20:00.000Z')
assert.deepEqual(evidence.windows.missingBuckets, [
  '2026-07-29T07:20:00.000Z',
  '2026-07-29T07:25:00.000Z',
  '2026-07-29T07:30:00.000Z',
])
assert.equal(Number.isNaN(Date.parse(evidence.windows.postCheckpointEndExclusiveAt)), false)

for (const key of ['exactMissingBucketPresence', 'collectorRunsGapContext', 'snapshotsGapContext', 'nullRefsByBucket', 'nullRefsTopChannels', 'currentCollectorStatus']) {
  assert.equal(Array.isArray(evidence[key]), true, `evidence.${key} must be an array`)
}
assert.notEqual(evidence.checkpointNullRefSummary, null)
assert.notEqual(evidence.postCheckpointNullRefSummary, null)
assert.equal(evidence.error, null)
assert.equal(evidence.staticCodeAttribution.collectorPath, 'workers/collector-twitch/src/index-category.ts')
assert.equal(evidence.staticCodeAttribution.encoderPath, 'workers/shared/category-capture.ts')
assert.deepEqual(evidence.staticCodeAttribution.helixFields, ['game_id', 'game_name'])
assert.equal(evidence.staticCodeAttribution.nullReferenceCondition, 'categoryProviderId or categoryName is empty after trim')
assert.equal(evidence.staticCodeAttribution.sourceFieldsStrippedBeforePersistence, true)
assert.equal(evidence.staticCodeAttribution.persistenceReindexingAfterEncoding, false)
assert.equal(evidence.staticCodeAttribution.postPersistenceIdVsNameDistinctionPossible, false)
assert.equal(evidence.diagnosticLimitations.some((line) => line.includes('cannot distinguish empty game_id from empty game_name')), true)
assert.equal(evidence.diagnosticLimitations.some((line) => line.includes('does not accept Issue #659')), true)

assert.equal(retirement.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement-v1')
assert.equal(retirement.status, 'retired_on_merge')
assert.equal(retirement.phase, evidence.phase)
assert.equal(retirement.trackingIssue, evidence.trackingIssue)
assert.equal(retirement.provider, evidence.provider)
assert.equal(retirement.mode, 'checkpoint_failure_diagnosis')
assert.equal(retirement.sourceTrigger.pr, 678)
assert.equal(retirement.sourceTrigger.mergeSha, 'ccb05bce0622a23e211c2c1eadc23052377d302e')
assert.equal(retirement.sourceTrigger.startAt, '2026-07-30T13:15:00.000Z')
assert.equal(Number.isInteger(retirement.execution.workflowRunId), true)
assert.equal(Number.isInteger(retirement.execution.diagnoseJobId), true)
assert.equal(retirement.execution.workflowConclusion, 'success')
assert.equal(retirement.execution.diagnoseConclusion, 'success')
assert.equal(Number.isInteger(retirement.execution.artifactId), true)
assert.match(retirement.execution.artifactDigest, /^sha256:[0-9a-f]{64}$/)
assert.equal(retirement.execution.evidenceJsonSha256, evidenceSha256)
assert.equal(retirement.evidencePath, evidencePath)
assert.deepEqual(retirement.retiredPaths, retiredPaths)
assert.equal(retirement.boundaries.diagnosisEvidenceOnly, true)
for (const [key, value] of Object.entries(retirement.boundaries)) {
  if (key === 'diagnosisEvidenceOnly') continue
  assert.equal(value, false, `retirement boundary ${key} must be false`)
}

console.log(JSON.stringify({
  ok: true,
  status: evidence.status,
  workflowRunId: retirement.execution.workflowRunId,
  diagnoseJobId: retirement.execution.diagnoseJobId,
  artifactId: retirement.execution.artifactId,
  artifactDigest: retirement.execution.artifactDigest,
  evidenceJsonSha256: evidenceSha256,
  temporaryPathRetired: true,
  diagnosisEvidenceOnly: true,
  publicCategoryUiAuthorized: false,
}, null, 2))
