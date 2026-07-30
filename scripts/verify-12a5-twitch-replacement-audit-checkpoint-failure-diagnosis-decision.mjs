import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const decisionPath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json'
const evidencePath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json'
const retirementPath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json'
for (const path of [decisionPath, evidencePath, retirementPath]) assert.equal(existsSync(path), true, `${path}: missing`)
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const decision = json(decisionPath)
const evidence = json(evidencePath)
const retirement = json(retirementPath)

assert.equal(decision.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision-v1')
assert.equal(decision.status, 'recovery_required')
assert.equal(decision.phase, '12A-5B-R2')
assert.equal(decision.trackingIssue, 659)
assert.equal(decision.provider, 'twitch')
assert.equal(decision.governingMainSha, 'ab478ecabf487ce75ab66b6ea0df5494e85551be')
assert.equal(decision.evidence.workflowRunId, 30541697022)
assert.equal(decision.evidence.runAttempt, 2)
assert.equal(decision.evidence.diagnoseJobId, 90942773349)
assert.equal(decision.evidence.artifactId, 8767937513)
assert.equal(decision.evidence.artifactDigest, evidence.sourceArtifact.artifactDigest)
assert.equal(decision.evidence.sourceEvidenceJsonSha256, evidence.sourceArtifact.sourceEvidenceJsonSha256)
assert.equal(retirement.status, 'retired_on_merge')

assert.equal(decision.findings.missingRowsPermanentlyAbsent, true)
assert.equal(decision.findings.maximumConsecutiveMissingSlotsObserved, 3)
assert.equal(decision.findings.maximumConsecutiveMissingSlotsAllowed, 2)
assert.equal(decision.findings.checkpointCategoryReferenceCoverage, 0.994524)
assert.equal(decision.findings.postCheckpointCategoryReferenceCoverage, 0.994236)
assert.equal(decision.findings.minimumCategoryReferenceCoverageRequired, 0.995)
assert.equal(decision.findings.postCheckpointCoverageRecovered, false)
assert.equal(decision.findings.persistedSourceCauseDistinguishable, false)
assert.equal(decision.decision.checkpointAccepted, false)
assert.equal(decision.decision.originalReplacementWindowValid, false)
assert.equal(decision.decision.originalStabilityClockMayContinue, false)
assert.equal(decision.decision.finalAuditAuthorized, false)
assert.equal(decision.decision.publicCutoverAuthorized, false)
assert.equal(decision.decision.recoveryRequired, true)
assert.equal(decision.decision.historicalBackfillRequired, false)
assert.equal(decision.decision.historicalBackfillAuthorized, false)
assert.equal(decision.decision.thresholdRelaxationAuthorized, false)
assert.equal(decision.decision.automaticClockResetAuthorized, false)
assert.equal(decision.decision.clockRestartPendingAcceptedRecovery, true)

assert.equal(decision.requiredRecovery.name, 'twitch_category_source_completeness_v2_observation')
assert.equal(decision.requiredRecovery.contractVersion, 'category-source-v2-candidate')
assert.deepEqual(decision.requiredRecovery.requiredPerItemStates, ['both_present', 'both_empty', 'provider_id_only', 'category_name_only'])
for (const value of Object.values(decision.requiredRecovery.semanticConstraints)) assert.equal(value, false)
assert.equal(decision.clockRule.oldStartAt, '2026-07-29T05:30:00.000Z')
assert.equal(decision.clockRule.oldEarliestAuditAt, '2026-08-05T05:30:00.000Z')
assert.equal(decision.clockRule.oldWindowRetired, true)
assert.equal(decision.clockRule.newStartAt, null)
assert.equal(decision.clockRule.newEarliestAuditAt, null)
assert.equal(decision.clockRule.minimumStableDaysAfterNewStart, 7)
assert.equal(decision.boundaries.decisionOnly, true)
for (const [key, value] of Object.entries(decision.boundaries)) {
  if (key === 'decisionOnly') continue
  assert.equal(value, false, `decision boundary ${key} must be false`)
}

console.log(JSON.stringify({
  ok: true,
  status: decision.status,
  recoveryRequired: decision.decision.recoveryRequired,
  oldWindowRetired: decision.clockRule.oldWindowRetired,
  recoveryContract: decision.requiredRecovery.contractVersion,
  publicCategoryUiAuthorized: false,
}, null, 2))
