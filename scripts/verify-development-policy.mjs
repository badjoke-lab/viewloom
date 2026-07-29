import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

for (const path of [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/twitch-replacement-seven-day-audit-spec.md',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/audits/12a2-current-gate-state.json',
  '.github/pull_request_template.md',
]) assert.equal(existsSync(path), true, `${path}: missing`)

for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-reporter.yml',
]) assert.equal(existsSync(path), false, `${path}: temporary checkpoint path must be retired`)

const gate = json('docs/audits/12a2-current-gate-state.json')
const evidence = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json')
const retirement = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json')

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Mandatory current authorities', 'Checkpoint outcome: failed', 'Do not rerun the checkpoint'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Current-main SHA', 'No checkpoint rerun or threshold relaxation.'],
  'docs/README.md': ['Checkpoint outcome failed', 'Current-main documents, not cached chat summaries'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['### Current gate: checkpoint failure diagnosis', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package'],
  'docs/product/current-schedule.md': ['Current gate checkpoint failure diagnosis package', 'no checkpoint rerun'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: failure diagnosis', 'Prohibited responses to checkpoint failure'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['checkpoint failure diagnosis', 'No automatic recovery or clock reset.'],
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
assert.deepEqual(evidence.failedHardStops, [
  'slotCoveragePass',
  'consecutiveMissingSlotsPass',
  'categoryReferenceCoveragePass',
])
assert.equal(evidence.decision.auditAccepted, false)
assert.equal(evidence.decision.publicCutoverAuthorized, false)
assert.equal(evidence.decision.automaticRecoveryAuthorized, false)
assert.equal(evidence.decision.automaticClockResetAuthorized, false)
assert.equal(retirement.boundaries.rerunAuthorized, false)
assert.equal(retirement.boundaries.workerDeploymentPerformed, false)
assert.equal(retirement.boundaries.d1MutationPerformed, false)
assert.equal(retirement.boundaries.kickChanged, false)
assert.equal(retirement.boundaries.publicCategoryUiAuthorized, false)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  phase: gate.currentWorkstream.phase,
  checkpointOutcome: evidence.status,
  temporaryPathRetired: true,
  currentBranch: 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package',
  publicCategoryFilterAuthorized: false,
}, null, 2))
