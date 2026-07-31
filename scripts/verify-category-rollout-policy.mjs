import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const required = {
  gate: 'docs/audits/12a2-current-gate-state.json',
  diagnosisDecision: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json',
  dormantContract: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json',
  recoveryContract: 'docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-contract.json',
  recoveryAcceptance: 'docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-acceptance.json',
  successEvidence: 'docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json',
  evidenceRetirement: 'docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json',
  executionRetirement: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json',
  successVerifier: 'scripts/verify-12a5-twitch-category-source-v2-observation-success-evidence.mjs',
  retirementVerifier: 'scripts/verify-12a5-twitch-category-source-v2-observation-execution-path-retirement.mjs',
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
const diagnosis = json(required.diagnosisDecision)
const dormant = json(required.dormantContract)
const recovery = json(required.recoveryContract)
const acceptance = json(required.recoveryAcceptance)
const evidence = json(required.successEvidence)
const evidenceRetirement = json(required.evidenceRetirement)
const executionRetirement = json(required.executionRetirement)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.equal(diagnosis.status, 'recovery_required')
assert.equal(diagnosis.clockRule.oldWindowRetired, true)
assert.equal(diagnosis.clockRule.newStartAt, null)
assert.equal(dormant.status, 'accepted')
assert.equal(recovery.status, 'accepted')
assert.equal(recovery.packageIdentity.packagePr, 692)
assert.equal(recovery.packageIdentity.acceptancePr, 693)
assert.equal(acceptance.status, 'accepted')
assert.equal(acceptance.validation.conclusion, 'success')
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

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Temporary observation execution path retired: PR #698', 'Current gate: semantic handling and new seven-day stability-clock decision'],
  'CONTRIBUTING.md': ['Temporary execution path retired PR #698', 'Current gate semantic handling and new seven-day stability-clock decision'],
  'docs/README.md': ['Temporary execution path retired PR #698', 'Current gate semantic handling and new seven-day stability-clock decision'],
  'docs/product/current-roadmap.md': ['### Current gate: semantic handling and new seven-day stability-clock decision', 'work-659-twitch-category-source-v2-semantic-clock-decision'],
  'docs/product/current-schedule.md': ['Current gate semantic handling and new seven-day stability-clock decision', 'Successful Twitch v2 observation run 30620512044'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: semantic handling and new stability-clock decision', 'Temporary execution path retirement: PR #698'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Semantic handling and new seven-day Twitch stability-clock decision', 'temporary production execution path are retired in PR #698'],
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
  observationStatus: evidence.status,
  executionPathStatus: executionRetirement.status,
  nextBranch: 'work-659-twitch-category-source-v2-semantic-clock-decision',
  semanticMappingAuthorized: false,
  stabilityClockStartAuthorized: false,
  publicTwitchFilterAuthorized: false,
}, null, 2))
