import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const required = {
  gate: 'docs/audits/12a2-current-gate-state.json',
  dormantContract: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json',
  recoveryContract: 'docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-contract.json',
  recoveryAcceptance: 'docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-acceptance.json',
  successEvidence: 'docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json',
  evidenceRetirement: 'docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json',
  executionRetirement: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json',
  semanticDecision: 'docs/audits/12a5-twitch-category-source-v2-semantic-clock-decision.json',
  clockAcceptance: 'docs/audits/12a5-twitch-category-source-v2-stability-clock-acceptance.json',
  auditContract: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  successVerifier: 'scripts/verify-12a5-twitch-category-source-v2-observation-success-evidence.mjs',
  retirementVerifier: 'scripts/verify-12a5-twitch-category-source-v2-observation-execution-path-retirement.mjs',
  clockVerifier: 'scripts/verify-12a5-twitch-category-source-v2-stability-clock-acceptance.mjs',
}
for (const path of Object.values(required)) assert.equal(existsSync(path), true, `${path}: missing`)

const forbidden = [
  'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  '.github/workflows/analytics-12a5-twitch-category-source-v2-observation-execution.yml',
  'scripts/run-12a5-twitch-category-source-v2-observation.mjs',
  'scripts/build-12a5-twitch-category-source-v2-observation-worker.mjs',
  'scripts/verify-12a5-twitch-category-source-v2-observation-trigger.mjs',
  'execution-packages/twitch-category-source-v2-observation/wrangler.toml',
]
for (const path of forbidden) assert.equal(existsSync(path), false, `${path}: retired execution path present`)

const gate = json(required.gate)
const dormant = json(required.dormantContract)
const recovery = json(required.recoveryContract)
const recoveryAcceptance = json(required.recoveryAcceptance)
const evidence = json(required.successEvidence)
const evidenceRetirement = json(required.evidenceRetirement)
const executionRetirement = json(required.executionRetirement)
const semantic = json(required.semanticDecision)
const clock = json(required.clockAcceptance)
const audit = json(required.auditContract)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.status, '12a5_twitch_permanent_category_capture_recovered_seven_day_accumulation_active')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.equal(dormant.status, 'accepted')
assert.equal(recovery.status, 'accepted')
assert.equal(recovery.packageIdentity.packagePr, 692)
assert.equal(recovery.packageIdentity.acceptancePr, 693)
assert.equal(recoveryAcceptance.status, 'accepted')
assert.equal(recoveryAcceptance.validation.conclusion, 'success')
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

assert.equal(semantic.decisionPr, 699)
assert.equal(semantic.semanticDecision.status, 'accepted_on_decision_merge')
assert.equal(semantic.semanticDecision.identityScope, 'provider_scoped')
assert.equal(semantic.semanticDecision.stateHandling.both_present.eligibleForCategoryReference, true)
assert.equal(semantic.semanticDecision.stateHandling.both_empty.eligibleForCategoryReference, false)
assert.equal(semantic.semanticDecision.stateHandling.provider_id_only.eligibleForCategoryReference, false)
assert.equal(semantic.semanticDecision.stateHandling.category_name_only.eligibleForCategoryReference, false)
assert.equal(semantic.semanticDecision.syntheticMappingAllowed, false)
assert.equal(semantic.semanticDecision.crossProviderIdentityAllowed, false)
assert.equal(semantic.semanticDecision.combinedProviderRankingAllowed, false)

assert.equal(clock.status, 'accepted_on_merge')
assert.equal(clock.acceptancePr, 700)
assert.equal(clock.window.startAt, '2026-07-31T17:00:00.000Z')
assert.equal(clock.window.endExclusiveAt, '2026-08-07T17:00:00.000Z')
assert.equal(clock.window.cadenceMinutes, 5)
assert.equal(clock.window.expectedFinalSlots, 2016)
assert.equal(clock.activation.clockStartsAutomaticallyAtBoundary, true)
assert.equal(clock.activation.manualOperatorActionAtStartRequired, false)
assert.equal(clock.activation.existingTwitchCollectorContinues, true)
assert.equal(clock.activation.newWorkflowAtStartRequired, false)
assert.equal(clock.activation.newCronRequired, false)
assert.equal(clock.activation.checkpointExecutionRequiredAtStart, false)
assert.equal(clock.boundaries.cadenceChanged, false)
assert.equal(clock.boundaries.retentionChanged, false)
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

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Revised stability clock accepted: PR #700', 'Current gate: accumulate with the existing Twitch collector until the end boundary'],
  'CONTRIBUTING.md': ['Revised stability clock accepted PR #700', 'Current gate active accumulation on the unchanged five-minute Twitch collector'],
  'docs/README.md': ['Revised stability clock accepted PR #700', 'Expected five-minute slots 2016'],
  'docs/product/current-roadmap.md': ['### Current gate: active seven-day Twitch stability accumulation', 'expected slots: 2016'],
  'docs/product/current-schedule.md': ['Current gate active accumulation on existing Twitch collector', 'Expected slots 2016'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: active stability accumulation', 'Final read-only mode is prohibited before `2026-08-07T17:00:00.000Z`'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Active seven-day Twitch stability accumulation', 'No final audit before the end boundary'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
const dbId = (source) => source.match(/^database_id\s*=\s*"([^"]+)"$/m)?.[1] ?? null
const twNormal = read('workers/collector-twitch/wrangler.toml')
const twPermanent = read('workers/collector-twitch/wrangler.category-permanent.toml')
const kickNormal = read('workers/collector-kick/wrangler.toml')
const kickPermanent = read('workers/collector-kick/wrangler.category-permanent.toml')
assert.equal(cron(twNormal), '*/5 * * * *')
assert.equal(cron(twPermanent), cron(twNormal))
assert.equal(cron(kickNormal), '*/5 * * * *')
assert.equal(cron(kickPermanent), cron(kickNormal))
assert.equal(dbId(twPermanent), dbId(twNormal))
assert.equal(dbId(kickPermanent), dbId(kickNormal))
assert.notEqual(dbId(twPermanent), dbId(kickPermanent))
assert.equal(twPermanent.includes('CATEGORY_SOURCE_V2'), false)
assert.equal(kickPermanent.includes('CATEGORY_SOURCE_V2'), false)

console.log(JSON.stringify({
  ok: true,
  gateStatus: gate.status,
  observationStatus: evidence.status,
  executionPathStatus: executionRetirement.status,
  semanticStatus: semantic.semanticDecision.status,
  stabilityClockStatus: clock.status,
  windowStart: clock.window.startAt,
  windowEndExclusive: clock.window.endExclusiveAt,
  expectedFinalSlots: clock.window.expectedFinalSlots,
  publicTwitchFilterAuthorized: clock.boundaries.publicCategoryUiAuthorized,
}, null, 2))
