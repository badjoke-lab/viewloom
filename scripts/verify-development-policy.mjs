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
  'docs/audits/12a5-twitch-replacement-audit-final-evidence.json',
  'docs/audits/12a5-twitch-replacement-audit-final-acceptance.json',
  'docs/audits/12a5-twitch-category-final-mode-decision.json',
  'docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-acceptance.json',
  'docs/audits/12a5-twitch-heatmap-category-public-cutover-decision.json',
  'docs/audits/12a5-twitch-heatmap-category-public-production-evidence.json',
  'docs/audits/12a5-twitch-heatmap-category-public-cutover-acceptance.json',
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
  'AGENTS.md': ['Mandatory authorities', 'Twitch category stability + Heatmap public rollout complete', 'Public production acceptance run: 31244148651 success', 'Keep parent category program #623 open'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Twitch category stability + Heatmap public rollout complete', 'Accepted production SHA b006f45d0676c9ff3e05e5d6727458e43802de53', 'Keep parent category program #623 open'],
  'docs/README.md': ['Twitch category stability + Heatmap public rollout complete', 'Public production acceptance run 31244148651 success', '12a5-twitch-heatmap-category-public-cutover-acceptance.json', 'Current-main documents and accepted contracts override cached handoffs'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['## Current gate: post-rollout category program handoff', 'The Twitch Heatmap category-filter rollout is complete', 'close the completed Twitch replacement audit (#659)'],
  'docs/product/current-schedule.md': ['Twitch category stability + Heatmap public rollout complete', 'Public production acceptance run 31244148651 success', 'keep #623 open as the parent category program'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: active stability accumulation', 'Final read-only mode is prohibited before `2026-08-07T17:00:00.000Z`'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Status: completed for Twitch Heatmap public rollout', 'Public browser acceptance run `31244148651` passed', 'Parent program #623 remains open'],
  '.github/pull_request_template.md': ['Current-main SHA read:', 'No newer source-of-truth change supersedes this candidate'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

const gate = json('docs/audits/12a2-current-gate-state.json')
const semantic = json('docs/audits/12a5-twitch-category-source-v2-semantic-clock-decision.json')
const clock = json('docs/audits/12a5-twitch-category-source-v2-stability-clock-acceptance.json')
const audit = json('docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json')
const observationEvidence = json('docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json')
const evidenceRetirement = json('docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json')
const executionRetirement = json('docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json')
const finalEvidence = json('docs/audits/12a5-twitch-replacement-audit-final-evidence.json')
const finalAcceptance = json('docs/audits/12a5-twitch-replacement-audit-final-acceptance.json')
const finalDecision = json('docs/audits/12a5-twitch-category-final-mode-decision.json')
const hiddenAcceptance = json('docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-acceptance.json')
const publicDecision = json('docs/audits/12a5-twitch-heatmap-category-public-cutover-decision.json')
const publicEvidence = json('docs/audits/12a5-twitch-heatmap-category-public-production-evidence.json')
const publicAcceptance = json('docs/audits/12a5-twitch-heatmap-category-public-cutover-acceptance.json')

// v33 is retained as immutable historical accumulation evidence; later accepted records govern the current public state.
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
assert.equal(audit.readOnlyBoundary.publicExposureAuthorized, false)

assert.equal(observationEvidence.status, 'observation_accepted')
assert.equal(observationEvidence.execution.workflowRunId, 30620512044)
assert.equal(observationEvidence.execution.observeJobId, 91123756273)
assert.equal(observationEvidence.artifact.id, 8789385200)
assert.equal(observationEvidence.observation.snapshots.length, 2)
for (const gateName of ['consecutiveSnapshotPass', 'stateIntegrityPass', 'dictionaryResolutionPass', 'providerSeparationPass', 'freshnessPass']) {
  assert.equal(observationEvidence.observation[gateName], true, `${gateName}: must pass`)
}
assert.equal(observationEvidence.rollback.success, true)
assert.equal(evidenceRetirement.status, 'evidence_frozen_execution_path_retired')
assert.equal(evidenceRetirement.retirement.temporaryExecutionPathRetirementPending, false)
assert.equal(executionRetirement.status, 'retired_on_merge')
assert.equal(executionRetirement.retirementPr, 698)
for (const value of Object.values(executionRetirement.authorization)) assert.equal(value, false)

assert.equal(finalEvidence.status, 'accepted')
assert.equal(finalEvidence.mode, 'final')
assert.equal(finalEvidence.data.slotAnalysis.expectedSlots, 2016)
assert.equal(finalEvidence.data.slotAnalysis.observedDistinctSlots, 2016)
assert.equal(finalEvidence.data.slotAnalysis.coverageRatio, 1)
assert.equal(finalEvidence.data.slotAnalysis.missingSlotCount, 0)
assert.equal(finalEvidence.data.slotAnalysis.maximumConsecutiveMissingSlots, 0)
assert.ok(finalEvidence.data.categoryReferenceCoverageRatio >= 0.99)
assert.equal(finalEvidence.data.unresolvedCategoryIds, 0)
assert.equal(finalEvidence.data.twitchProviderLeakageRows, 0)
assert.equal(finalEvidence.data.kickProviderLeakageRows, 0)
assert.deepEqual(finalEvidence.hardStops, [])
assert.equal(finalAcceptance.acceptancePr, 736)
assert.equal(finalDecision.decision, 'authorize_hidden_filter_revalidation')
assert.equal(hiddenAcceptance.authorization.publicCutoverDecisionAuthorized, true)

assert.equal(publicDecision.decision, 'authorize_public_twitch_heatmap_category_filter')
assert.equal(publicDecision.authorization.publicTwitchCategoryUiAuthorized, true)
assert.equal(publicDecision.authorization.kickCategoryUiAuthorized, false)
assert.equal(publicEvidence.status, 'accepted')
assert.equal(publicEvidence.origin, 'https://www.viewloom.net')
assert.equal(publicEvidence.deploymentCommit, 'b006f45d0676c9ff3e05e5d6727458e43802de53')
assert.equal(publicEvidence.acceptedAttempt, 1)
assert.equal(publicEvidence.scenarios.length, 4)
assert.deepEqual(publicEvidence.failures, [])
assert.equal(publicEvidence.publicTwitchCategoryUiActive, true)
assert.equal(publicEvidence.kickCategoryUiEnabled, false)
assert.equal(publicEvidence.productionMutationPerformed, false)
const mobile = publicEvidence.scenarios.find((scenario) => scenario.name === 'twitch-public-mobile')
assert.ok(mobile)
assert.equal(mobile.checks.geometry.width, 390)
assert.equal(mobile.checks.geometry.scrollWidth, 390)
assert.equal(mobile.checks.geometry.overflow, false)

assert.equal(publicAcceptance.status, 'accepted_on_merge')
assert.equal(publicAcceptance.implementation.cutoverPr, 740)
assert.equal(publicAcceptance.implementation.mobileOverflowRepairPr, 741)
assert.equal(publicAcceptance.implementation.acceptedProductionSha, 'b006f45d0676c9ff3e05e5d6727458e43802de53')
assert.equal(publicAcceptance.acceptedDeployment.workflowRunId, 31244148642)
assert.equal(publicAcceptance.acceptedProductionBrowser.workflowRunId, 31244148651)
assert.equal(publicAcceptance.acceptedProductionBrowser.failureCount, 0)
assert.equal(publicAcceptance.authorization.publicTwitchCategoryUiAccepted, true)
assert.equal(publicAcceptance.authorization.twitchHeatmapCategoryRolloutComplete, true)
assert.equal(publicAcceptance.authorization.kickCategoryUiAuthorized, false)
assert.equal(publicAcceptance.authorization.dayFlowCategoryUiAuthorized, false)
assert.equal(publicAcceptance.authorization.historyCategoryUiAuthorized, false)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  historicalGateStatus: gate.status,
  finalSlots: finalEvidence.data.slotAnalysis.observedDistinctSlots,
  publicProductionSha: publicAcceptance.implementation.acceptedProductionSha,
  publicProductionScenarios: publicEvidence.scenarios.length,
  publicTwitchCategoryFilterAccepted: publicAcceptance.authorization.publicTwitchCategoryUiAccepted,
  kickCategoryUiAuthorized: publicAcceptance.authorization.kickCategoryUiAuthorized,
  nextParentProgram: 623,
}, null, 2))
