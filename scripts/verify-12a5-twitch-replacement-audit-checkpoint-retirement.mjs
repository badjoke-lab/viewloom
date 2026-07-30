import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json'
const retirementPath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json'
const retiredPaths = [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-reporter.yml',
]
for (const path of [evidencePath, retirementPath]) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of retiredPaths) assert.equal(existsSync(path), false, `${path}: must be retired`)
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const evidence = json(evidencePath)
const retirement = json(retirementPath)

assert.equal(evidence.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-evidence-v1')
assert.equal(evidence.status, 'checkpoint_failed')
assert.equal(evidence.mode, 'checkpoint')
assert.equal(evidence.trigger.pr, 667)
assert.equal(evidence.trigger.mergeSha, 'ee8125ecd12f7ec620af13fd78d9a3c3c7e18f98')
assert.equal(evidence.execution.workflowRunId, 30478338654)
assert.equal(evidence.execution.checkpointJobId, 90665697236)
assert.equal(evidence.execution.artifactId, 8734980337)
assert.equal(evidence.execution.artifactDigest, 'sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b')
assert.equal(evidence.execution.evidenceJsonSha256, '041f942501f1740f2ea0f3c7a77b04aeea0d084906af0faf625f370c01178f6f')
assert.equal(evidence.window.expectedSlots, 154)
assert.equal(evidence.slotContinuity.observedDistinctSlots, 151)
assert.equal(evidence.slotContinuity.coverageRatio, 0.980519)
assert.deepEqual(evidence.slotContinuity.missingSlots, ['2026-07-29T07:20:00.000Z', '2026-07-29T07:25:00.000Z', '2026-07-29T07:30:00.000Z'])
assert.equal(evidence.slotContinuity.maximumConsecutiveMissingSlots, 3)
assert.equal(evidence.categoryIntegrity.totalCategoryRefs, 45287)
assert.equal(evidence.categoryIntegrity.presentCategoryRefs, 45039)
assert.equal(evidence.categoryIntegrity.missingCategoryRefs, 248)
assert.equal(evidence.categoryIntegrity.invalidCategoryRefs, 0)
assert.equal(evidence.categoryIntegrity.unresolvedCategoryIds, 0)
assert.equal(evidence.categoryIntegrity.categoryReferenceCoverageRatio, 0.994524)
assert.deepEqual(evidence.failedHardStops, ['slotCoveragePass', 'consecutiveMissingSlotsPass', 'categoryReferenceCoveragePass'])
assert.equal(evidence.runtimeIntegrity.readOnly, true)
assert.equal(evidence.runtimeIntegrity.cadencePass, true)
assert.equal(evidence.runtimeIntegrity.twitchPermanentBindingPass, true)
assert.equal(evidence.runtimeIntegrity.kickPermanentBaselinePass, true)
assert.equal(evidence.runtimeIntegrity.twitchProviderLeakageRows, 0)
assert.equal(evidence.runtimeIntegrity.kickProviderLeakageRows, 0)
assert.equal(evidence.runtimeIntegrity.publicExposureStillUnauthorized, true)
assert.equal(evidence.storage.providerPass, true)
assert.equal(evidence.storage.accountPass, true)
assert.equal(evidence.decision.auditAccepted, false)
assert.equal(evidence.decision.publicCutoverAuthorized, false)
assert.equal(evidence.decision.productionMutationPerformed, false)
assert.equal(evidence.decision.kickMutationPerformed, false)
assert.equal(evidence.decision.automaticClockResetAuthorized, false)

assert.equal(retirement.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-retirement-v1')
assert.equal(retirement.checkpointOutcome, 'checkpoint_failed')
assert.equal(retirement.execution.workflowRunId, evidence.execution.workflowRunId)
assert.equal(retirement.execution.checkpointJobId, evidence.execution.checkpointJobId)
assert.equal(retirement.execution.artifactId, evidence.execution.artifactId)
assert.deepEqual(retirement.retiredPaths, retiredPaths)
assert.equal(retirement.boundaries.rerunAuthorized, false)
assert.equal(retirement.boundaries.automaticRecoveryAuthorized, false)
assert.equal(retirement.boundaries.automaticClockResetAuthorized, false)
assert.equal(retirement.boundaries.kickChanged, false)
assert.equal(retirement.boundaries.publicCategoryUiAuthorized, false)

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Checkpoint run: 30478338654 failed', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
  'CONTRIBUTING.md': ['Checkpoint run 30478338654 failed', 'Diagnosis evidence frozen and temporary path retired'],
  'docs/README.md': ['Checkpoint run 30478338654 failed', 'Diagnosis evidence frozen'],
  'docs/product/current-roadmap.md': ['### Current gate: checkpoint-failure diagnosis decision', '0.994524'],
  'docs/product/current-schedule.md': ['Checkpoint run 30478338654 failed', 'Current gate separate diagnosis decision'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Checkpoint execution and result', '248 null references'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Checkpoint run `30478338654` completed read-only and failed.', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
})) {
  const source = readFileSync(path, 'utf8')
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

console.log(JSON.stringify({
  ok: true,
  outcome: evidence.status,
  failedHardStops: evidence.failedHardStops,
  checkpointPathRetired: true,
  diagnosisEvidenceFrozen: true,
  nextBranch: 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision',
  publicCutoverAuthorized: false,
}, null, 2))
