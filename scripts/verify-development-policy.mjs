import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const required = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/twitch-replacement-seven-day-audit-spec.md',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json',
  'docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json',
  'docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json',
  'docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json',
  '.github/pull_request_template.md',
]
for (const path of required) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  '.github/workflows/analytics-12a5-twitch-category-source-v2-observation-execution.yml',
  'scripts/run-12a5-twitch-category-source-v2-observation.mjs',
  'scripts/build-12a5-twitch-category-source-v2-observation-worker.mjs',
  'scripts/verify-12a5-twitch-category-source-v2-observation-trigger.mjs',
  'execution-packages/twitch-category-source-v2-observation/wrangler.toml',
]) assert.equal(existsSync(path), false, `${path}: retired execution path present`)

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Mandatory authorities', 'Temporary observation execution path retired: PR #698', 'work-659-twitch-category-source-v2-semantic-clock-decision'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Temporary execution path retired PR #698', 'Current gate semantic handling and new seven-day stability-clock decision'],
  'docs/README.md': ['Temporary execution path retired PR #698', 'Current-main documents and accepted contracts'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['### Current gate: semantic handling and new seven-day stability-clock decision', 'work-659-twitch-category-source-v2-semantic-clock-decision'],
  'docs/product/current-schedule.md': ['Current gate semantic handling and new seven-day stability-clock decision', 'No observation rerun'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: semantic handling and new stability-clock decision', 'No new stability start'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Semantic handling and new seven-day Twitch stability-clock decision', 'No public category UI'],
  '.github/pull_request_template.md': ['Current-main SHA read:', 'No newer source-of-truth change supersedes this candidate'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

const gate = json('docs/audits/12a2-current-gate-state.json')
const decision = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json')
const evidence = json('docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json')
const evidenceRetirement = json('docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json')
const executionRetirement = json('docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json')

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(decision.status, 'recovery_required')
assert.equal(decision.clockRule.oldWindowRetired, true)
assert.equal(decision.clockRule.newStartAt, null)
assert.equal(decision.decision.automaticClockResetAuthorized, false)
assert.equal(decision.decision.finalAuditAuthorized, false)
assert.equal(decision.decision.publicCutoverAuthorized, false)

assert.equal(evidence.status, 'observation_accepted')
assert.equal(evidence.execution.workflowRunId, 30620512044)
assert.equal(evidence.execution.observeJobId, 91123756273)
assert.equal(evidence.artifact.id, 8789385200)
assert.equal(evidence.observation.snapshots.length, 2)
for (const gateName of ['consecutiveSnapshotPass', 'stateIntegrityPass', 'dictionaryResolutionPass', 'providerSeparationPass', 'freshnessPass']) {
  assert.equal(evidence.observation[gateName], true, `${gateName}: must pass`)
}
assert.equal(evidence.rollback.success, true)
for (const key of ['semanticMappingAuthorized', 'stabilityClockStartAuthorized', 'finalModeAuthorized', 'publicCategoryUiAuthorized']) {
  assert.equal(evidence.decision[key], false, `${key}: must remain false`)
}
assert.equal(evidenceRetirement.status, 'evidence_frozen_execution_path_retired')
assert.equal(evidenceRetirement.retirement.temporaryExecutionPathRetirementPending, false)
assert.equal(executionRetirement.status, 'retired_on_merge')
assert.equal(executionRetirement.retirementPr, 698)
for (const value of Object.values(executionRetirement.authorization)) assert.equal(value, false)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  observationStatus: evidence.status,
  executionPathStatus: executionRetirement.status,
  nextBranch: 'work-659-twitch-category-source-v2-semantic-clock-decision',
  semanticMappingAuthorized: false,
  stabilityClockStartAuthorized: false,
  publicCategoryFilterAuthorized: false,
}, null, 2))
