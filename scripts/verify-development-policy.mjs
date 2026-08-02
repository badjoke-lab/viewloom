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
  'docs/audits/12a5-twitch-category-source-v2-semantic-clock-decision.json',
  'docs/audits/12a5-twitch-category-source-v2-stability-clock-acceptance.json',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
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
  'AGENTS.md': ['Mandatory authorities', 'Revised stability clock accepted: PR #700', 'Current gate: accumulate with the existing Twitch collector until the end boundary'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Revised stability clock accepted PR #700', 'Current gate active accumulation on the unchanged five-minute Twitch collector'],
  'docs/README.md': ['Revised stability clock accepted PR #700', 'Current gate active accumulation on the unchanged Twitch collector', 'Current-main documents and accepted contracts'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['### Current gate: active seven-day Twitch stability accumulation', 'expected slots: 2016'],
  'docs/product/current-schedule.md': ['Current gate active accumulation on existing Twitch collector', 'Expected slots 2016'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: active stability accumulation', 'Final read-only mode is prohibited before `2026-08-07T17:00:00.000Z`'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Active seven-day Twitch stability accumulation', 'The unfiltered Heatmap remains the fallback'],
  '.github/pull_request_template.md': ['Current-main SHA read:', 'No newer source-of-truth change supersedes this candidate'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

const gate = json('docs/audits/12a2-current-gate-state.json')
const semantic = json('docs/audits/12a5-twitch-category-source-v2-semantic-clock-decision.json')
const clock = json('docs/audits/12a5-twitch-category-source-v2-stability-clock-acceptance.json')
const audit = json('docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json')
const evidence = json('docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json')
const evidenceRetirement = json('docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json')
const executionRetirement = json('docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json')

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.status, '12a5_twitch_permanent_category_capture_recovered_seven_day_accumulation_active')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)

assert.equal(semantic.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-semantic-clock-decision-v1')
assert.equal(semantic.decisionPr, 699)
assert.equal(semantic.semanticDecision.status, 'accepted_on_decision_merge')
assert.equal(semantic.semanticDecision.identityScope, 'provider_scoped')
assert.equal(semantic.semanticDecision.syntheticMappingAllowed, false)
assert.equal(semantic.semanticDecision.nameOnlyIdentityAllowed, false)
assert.equal(semantic.semanticDecision.crossProviderIdentityAllowed, false)
assert.equal(semantic.semanticDecision.combinedProviderRankingAllowed, false)

assert.equal(clock.status, 'accepted_on_merge')
assert.equal(clock.acceptancePr, 700)
assert.equal(clock.semanticDecisionPr, 699)
assert.equal(clock.window.semantics, 'half_open')
assert.equal(clock.window.startAt, '2026-07-31T17:00:00.000Z')
assert.equal(clock.window.endExclusiveAt, '2026-08-07T17:00:00.000Z')
assert.equal(clock.window.cadenceMinutes, 5)
assert.equal(clock.window.expectedFinalSlots, 2016)
assert.equal(clock.activation.clockStartsAutomaticallyAtBoundary, true)
assert.equal(clock.activation.manualOperatorActionAtStartRequired, false)
assert.equal(clock.activation.existingTwitchCollectorContinues, true)
assert.equal(clock.activation.newWorkflowAtStartRequired, false)
assert.equal(clock.activation.checkpointExecutionRequiredAtStart, false)
assert.equal(clock.boundaries.workerDeploymentPerformed, false)
assert.equal(clock.boundaries.d1MutationPerformed, false)
assert.equal(clock.boundaries.cadenceChanged, false)
assert.equal(clock.boundaries.kickChanged, false)
assert.equal(clock.boundaries.publicCategoryUiAuthorized, false)
assert.equal(clock.boundaries.finalModeAuthorizedBeforeEnd, false)

assert.equal(audit.status, 'accepted_active')
assert.equal(audit.window.startAt, clock.window.startAt)
assert.equal(audit.window.endExclusiveAt, clock.window.endExclusiveAt)
assert.equal(audit.window.expectedFinalSlots, 2016)
assert.equal(audit.stabilityClock.acceptancePr, 700)
assert.equal(audit.stabilityClock.startsAutomaticallyAtBoundary, true)
assert.equal(audit.publicSurface.publicExposureEnabled, false)

assert.equal(evidence.status, 'observation_accepted')
assert.equal(evidence.execution.workflowRunId, 30620512044)
assert.equal(evidence.execution.observeJobId, 91123756273)
assert.equal(evidence.artifact.id, 8789385200)
assert.equal(evidence.observation.snapshots.length, 2)
for (const gateName of ['consecutiveSnapshotPass', 'stateIntegrityPass', 'dictionaryResolutionPass', 'providerSeparationPass', 'freshnessPass']) {
  assert.equal(evidence.observation[gateName], true, `${gateName}: must pass`)
}
assert.equal(evidence.rollback.success, true)
assert.equal(evidenceRetirement.status, 'evidence_frozen_execution_path_retired')
assert.equal(evidenceRetirement.retirement.temporaryExecutionPathRetirementPending, false)
assert.equal(executionRetirement.status, 'retired_on_merge')
assert.equal(executionRetirement.retirementPr, 698)
for (const value of Object.values(executionRetirement.authorization)) assert.equal(value, false)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  gateStatus: gate.status,
  semanticStatus: semantic.semanticDecision.status,
  stabilityClockStatus: clock.status,
  windowStart: clock.window.startAt,
  windowEndExclusive: clock.window.endExclusiveAt,
  expectedFinalSlots: clock.window.expectedFinalSlots,
  finalModeAuthorizedBeforeEnd: clock.boundaries.finalModeAuthorizedBeforeEnd,
  publicCategoryFilterAuthorized: clock.boundaries.publicCategoryUiAuthorized,
}, null, 2))
