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
assert.equal(contract.governingMainSha, '8e2a18c6644f516989e304c9ba35dcb05d2e9c2b')
assert.equal(contract.sourceEvidence.checkpointRunId, 30478338654)
assert.equal(contract.sourceEvidence.checkpointJobId, 90665697236)
assert.equal(contract.sourceEvidence.artifactId, 8734980337)
assert.equal(contract.sourceEvidence.artifactDigest, 'sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b')
assert.equal(contract.fixedWindows.gapContextStartAt, '2026-07-29T06:50:00.000Z')
assert.equal(contract.fixedWindows.gapContextEndExclusiveAt, '2026-07-29T08:00:00.000Z')
assert.equal(contract.fixedWindows.checkpointStartAt, '2026-07-29T05:30:00.000Z')
assert.equal(contract.fixedWindows.checkpointEndExclusiveAt, '2026-07-29T18:20:00.000Z')
assert.deepEqual(contract.fixedWindows.missingBuckets, ['2026-07-29T07:20:00.000Z', '2026-07-29T07:25:00.000Z', '2026-07-29T07:30:00.000Z'])
assert.equal(contract.staticCodeAttribution.nullReferenceCondition, 'categoryProviderId or categoryName is empty after trim')
assert.equal(contract.staticCodeAttribution.sourceFieldsStrippedBeforePersistence, true)
assert.equal(contract.staticCodeAttribution.postPersistenceIdVsNameDistinctionPossible, false)
assert.equal(contract.staticCodeAttribution.persistenceReindexingAfterEncoding, false)
assert.equal(contract.execution.productionExecutionIncludedOnPackagePr, false)
assert.equal(contract.execution.productionCredentialsUsedOnPackagePr, false)
assert.equal(contract.execution.separateExecutionPathAcceptanceRequired, true)
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(Object.values(contract.readOnlyBoundary).every((value) => Array.isArray(value) || value === false), true)
assert.equal(contract.acceptance.packagePr, 670)
assert.equal(contract.acceptance.packageCandidateHeadSha, '4cb52b9cb11eb5b27a7f93eaa0e14838ab686039')
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
assert.equal(acceptance.acceptedCapabilities.separateExecutionPathRequired, true)
for (const key of ['productionExecutionPerformed', 'productionCredentialsUsedOnPackagePr', 'checkpointRerunAuthorized', 'd1MutationPerformed', 'thresholdRelaxationAuthorized', 'clockResetAuthorized', 'kickChanged', 'finalModeAuthorized', 'publicCategoryUiAuthorized']) assert.equal(acceptance.boundaries[key], false)

assert.equal(checkpointEvidence.status, 'checkpoint_failed')
assert.deepEqual(checkpointEvidence.slotContinuity.missingSlots, contract.fixedWindows.missingBuckets)
assert.equal(checkpointEvidence.categoryIntegrity.missingCategoryRefs, 248)
assert.equal(checkpointEvidence.categoryIntegrity.invalidCategoryRefs, 0)
assert.equal(checkpointEvidence.categoryIntegrity.unresolvedCategoryIds, 0)
assert.equal(checkpointEvidence.decision.publicCutoverAuthorized, false)
assert.equal(checkpointRetirement.boundaries.rerunAuthorized, false)
assert.equal(diagnosisEvidence.status, 'diagnosis_complete')
assert.equal(diagnosisEvidence.error, null)
assert.equal(diagnosisRetirement.status, 'retired_on_merge')
assert.equal(diagnosisRetirement.boundaries.diagnosisEvidenceOnly, true)
assert.equal(diagnosisRetirement.boundaries.automaticRecoveryAuthorized, false)
assert.equal(diagnosisRetirement.boundaries.automaticClockResetAuthorized, false)
assert.equal(diagnosisRetirement.boundaries.publicCategoryUiAuthorized, false)

for (const fragment of [
  "const GAP_START = '2026-07-29T06:50:00.000Z'",
  "const GAP_END = '2026-07-29T08:00:00.000Z'",
  "const CHECKPOINT_START = '2026-07-29T05:30:00.000Z'",
  "const CHECKPOINT_END = '2026-07-29T18:20:00.000Z'",
  'exactMissingBucketPresence', 'collectorRunsGapContext', 'snapshotsGapContext', 'nullRefsByBucket', 'nullRefsTopChannels', 'checkpointNullRefSummary', 'postCheckpointNullRefSummary', 'currentCollectorStatus',
  "ref.type = 'null'", "json_extract(m.payload_json, '$.items[' || ref.key || '].channelLogin')", "if (statements.some((part) => !/^(SELECT|WITH)\\b/i.test(part)))", "throw new Error('non_select_statement_rejected')", "'--remote'", "'--json'",
]) assert.ok(runner.includes(fragment), `runner missing: ${fragment}`)
for (const forbidden of ['wrangler@4 deploy', 'INSERT INTO', 'UPDATE ', 'DELETE FROM', 'ALTER TABLE', 'AUDIT_MODE=final']) assert.equal(runner.includes(forbidden), false, `runner forbidden fragment: ${forbidden}`)
assert.ok(collector.includes("const categoryProviderId = String(stream.game_id ?? '').trim()"))
assert.ok(collector.includes("const categoryName = String(stream.game_name ?? '').trim()"))
assert.ok(collector.includes('const storedItems = stripCategorySourceFields(input.items)'))
assert.ok(encoder.includes('if (!id || !name)'))
assert.ok(encoder.includes('categoryRefs.push(null)'))
assert.ok(encoder.includes('stripCategorySourceFields'))

for (const [path, fragments] of Object.entries({
  'docs/product/current-schedule.md': ['Current gate separate diagnosis decision', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
  'docs/product/current-roadmap.md': ['### Current gate: checkpoint-failure diagnosis decision', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: separate diagnosis decision', 'Diagnosis evidence does not decide recovery'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['checkpoint-failure diagnosis decision', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

console.log(JSON.stringify({
  ok: true,
  phase: contract.phase,
  sourceCheckpointFailed: true,
  diagnosisQueryPackageAccepted: true,
  diagnosisStatus: diagnosisEvidence.status,
  diagnosisPathRetired: true,
  nextGate: 'separate diagnosis decision',
}, null, 2))
