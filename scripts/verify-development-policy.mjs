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
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/audits/12a2-current-gate-state.json', '.github/pull_request_template.md',
]
for (const path of required) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-reporter.yml',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
]) assert.equal(existsSync(path), false, `${path}: must be absent before exact trigger PR`)

const gate = json('docs/audits/12a2-current-gate-state.json')
const evidence = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json')
const retirement = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json')
const queryContract = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json')
const queryAcceptance = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json')
const executionContract = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-contract.json')
const executionAcceptance = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-acceptance.json')
const triggerContract = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract.json')

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Mandatory current authorities', 'Failure diagnosis execution package: accepted PR #672 / #673', 'Do not rerun the checkpoint'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Current-main SHA', 'Diagnosis execution package accepted PR #672 / #673'],
  'docs/README.md': ['Failure diagnosis execution package accepted PR #672 / #673', 'Current-main documents, not cached chat summaries'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['### Current gate: exact diagnosis trigger', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger'],
  'docs/product/current-schedule.md': ['Current gate exact one-file diagnosis trigger', 'no checkpoint rerun'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: exact failure-diagnosis trigger', 'Prohibited responses to checkpoint failure'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['replacement Twitch checkpoint-failure diagnosis trigger', 'No automatic recovery or clock reset.'],
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
assert.equal(evidence.status, 'checkpoint_failed')
assert.equal(evidence.execution.workflowRunId, 30478338654)
assert.deepEqual(evidence.failedHardStops, ['slotCoveragePass', 'consecutiveMissingSlotsPass', 'categoryReferenceCoveragePass'])
assert.equal(evidence.decision.auditAccepted, false)
assert.equal(evidence.decision.publicCutoverAuthorized, false)
assert.equal(evidence.decision.automaticRecoveryAuthorized, false)
assert.equal(evidence.decision.automaticClockResetAuthorized, false)
assert.equal(retirement.boundaries.rerunAuthorized, false)
assert.equal(retirement.boundaries.workerDeploymentPerformed, false)
assert.equal(retirement.boundaries.d1MutationPerformed, false)
assert.equal(retirement.boundaries.kickChanged, false)
assert.equal(retirement.boundaries.publicCategoryUiAuthorized, false)

assert.equal(queryContract.status, 'accepted')
assert.equal(queryContract.acceptance.packagePr, 670)
assert.equal(queryContract.acceptance.acceptancePr, 671)
assert.deepEqual(queryContract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(queryAcceptance.status, 'accepted')
for (const key of ['productionExecutionPerformed', 'productionCredentialsUsedOnPackagePr', 'checkpointRerunAuthorized', 'workerDeploymentPerformed', 'd1MutationPerformed', 'thresholdRelaxationAuthorized', 'clockResetAuthorized', 'kickChanged', 'publicCategoryUiAuthorized']) assert.equal(queryAcceptance.boundaries[key], false)

assert.equal(executionContract.status, 'accepted')
assert.equal(executionContract.acceptance.packagePr, 672)
assert.equal(executionContract.acceptance.packageMergeSha, '02ece37cc70de4faa5251600a465d4e68d058f29')
assert.equal(executionContract.acceptance.acceptancePr, 673)
assert.equal(executionContract.acceptance.productionExecutionPerformed, false)
assert.deepEqual(executionContract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(executionAcceptance.status, 'accepted')
assert.equal(executionAcceptance.validation.conclusion, 'success')
for (const value of Object.values(executionAcceptance.boundaries)) assert.equal(value, false)
assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, 672)
assert.equal(triggerContract.acceptedPackageIdentity.packageMergeSha, '02ece37cc70de4faa5251600a465d4e68d058f29')
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, 673)
assert.deepEqual(triggerContract.executionBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(triggerContract.executionBoundary.publicExposureAuthorized, false)

console.log(JSON.stringify({ ok: true, policy: 'current-main-source-of-truth-freshness', phase: gate.currentWorkstream.phase, checkpointOutcome: evidence.status, checkpointPathRetired: true, queryPackageAccepted: true, executionPackageAccepted: true, triggerPresent: false, currentBranch: 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger', publicCategoryFilterAuthorized: false }, null, 2))
