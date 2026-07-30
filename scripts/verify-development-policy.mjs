import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const required = [
  'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/twitch-replacement-seven-day-audit-spec.md',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-contract.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-acceptance.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/audits/12a2-current-gate-state.json', '.github/pull_request_template.md',
]
for (const path of required) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-reporter.yml',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
]) assert.equal(existsSync(path), false, `${path}: temporary execution path must be retired`)

const gate = json('docs/audits/12a2-current-gate-state.json')
const checkpointEvidence = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json')
const checkpointRetirement = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json')
const queryContract = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json')
const queryAcceptance = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json')
const executionContract = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-contract.json')
const executionAcceptance = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-acceptance.json')
const triggerContract = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract.json')
const diagnosisEvidence = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json')
const diagnosisRetirement = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json')

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Mandatory current authorities', 'Diagnosis evidence: frozen', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Current-main SHA', 'Diagnosis evidence frozen and temporary path retired'],
  'docs/README.md': ['Diagnosis evidence frozen', 'Current-main documents, not cached chat summaries'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['### Current gate: checkpoint-failure diagnosis decision', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
  'docs/product/current-schedule.md': ['Current gate separate diagnosis decision', 'no automatic clock reset'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: separate diagnosis decision', 'Diagnosis evidence does not decide recovery'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['checkpoint-failure diagnosis decision', 'No automatic recovery or clock reset.'],
  '.github/pull_request_template.md': ['Current-main SHA read:', 'No newer source-of-truth change supersedes this candidate'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(checkpointEvidence.status, 'checkpoint_failed')
assert.equal(checkpointEvidence.execution.workflowRunId, 30478338654)
assert.deepEqual(checkpointEvidence.failedHardStops, ['slotCoveragePass', 'consecutiveMissingSlotsPass', 'categoryReferenceCoveragePass'])
assert.equal(checkpointEvidence.decision.auditAccepted, false)
assert.equal(checkpointEvidence.decision.publicCutoverAuthorized, false)
assert.equal(checkpointEvidence.decision.automaticRecoveryAuthorized, false)
assert.equal(checkpointEvidence.decision.automaticClockResetAuthorized, false)
assert.equal(checkpointRetirement.boundaries.rerunAuthorized, false)
assert.equal(checkpointRetirement.boundaries.workerDeploymentPerformed, false)
assert.equal(checkpointRetirement.boundaries.d1MutationPerformed, false)
assert.equal(checkpointRetirement.boundaries.kickChanged, false)
assert.equal(checkpointRetirement.boundaries.publicCategoryUiAuthorized, false)
assert.equal(queryContract.status, 'accepted')
assert.equal(queryContract.acceptance.packagePr, 670)
assert.equal(queryAcceptance.status, 'accepted')
assert.equal(queryAcceptance.acceptancePr, 671)
assert.deepEqual(queryContract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(executionContract.status, 'accepted')
assert.equal(executionContract.acceptance.packagePr, 672)
assert.equal(executionContract.acceptance.acceptancePr, 673)
assert.equal(executionAcceptance.status, 'accepted')
assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, 672)
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, 673)
assert.deepEqual(triggerContract.executionBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(diagnosisEvidence.status, 'diagnosis_complete')
assert.equal(diagnosisEvidence.error, null)
assert.equal(diagnosisRetirement.status, 'retired_on_merge')
assert.equal(diagnosisRetirement.boundaries.diagnosisEvidenceOnly, true)
for (const [key, value] of Object.entries(diagnosisRetirement.boundaries)) {
  if (key === 'diagnosisEvidenceOnly') continue
  assert.equal(value, false, `diagnosis retirement boundary ${key} must remain false`)
}

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  phase: gate.currentWorkstream.phase,
  checkpointOutcome: checkpointEvidence.status,
  diagnosisStatus: diagnosisEvidence.status,
  diagnosisPathRetired: true,
  currentBranch: 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision',
  publicCategoryFilterAuthorized: false,
}, null, 2))
