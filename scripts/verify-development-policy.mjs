import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const required = [
  'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/twitch-replacement-seven-day-audit-spec.md',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json',
  '.github/pull_request_template.md',
]
for (const path of required) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
]) assert.equal(existsSync(path), false, `${path}: retired path returned`)

const gate = json('docs/audits/12a2-current-gate-state.json')
const evidence = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json')
const retirement = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json')
const decision = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json')

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Mandatory authorities', 'Diagnosis decision: recovery required'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Current-main SHA'],
  'docs/README.md': ['Current-main documents and the diagnosis decision', 'Original stability clock valid no'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['### Current gate: Twitch category-source completeness v2 recovery package', 'work-659-twitch-category-source-v2-completeness-recovery-package'],
  'docs/product/current-schedule.md': ['Current gate category-source-v2 completeness recovery package', 'no production execution on the dormant package PR'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: Twitch category-source-v2 completeness recovery package', 'No new stability start'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['category-source-v2 completeness recovery package', 'No checkpoint rerun'],
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

assert.equal(evidence.status, 'diagnosis_complete')
assert.equal(retirement.status, 'retired_on_merge')
assert.equal(decision.status, 'recovery_required')
assert.equal(decision.decision.originalReplacementWindowValid, false)
assert.equal(decision.decision.recoveryRequired, true)
assert.equal(decision.decision.historicalBackfillAuthorized, false)
assert.equal(decision.decision.thresholdRelaxationAuthorized, false)
assert.equal(decision.decision.automaticClockResetAuthorized, false)
assert.equal(decision.decision.finalAuditAuthorized, false)
assert.equal(decision.decision.publicCutoverAuthorized, false)
assert.equal(decision.clockRule.oldWindowRetired, true)
assert.equal(decision.clockRule.newStartAt, null)
assert.equal(decision.requiredRecovery.semanticConstraints.kickMayBeChanged, false)
assert.equal(decision.requiredRecovery.semanticConstraints.publicUiMayBeChanged, false)
assert.equal(decision.boundaries.decisionOnly, true)
for (const [key, value] of Object.entries(decision.boundaries)) {
  if (key === 'decisionOnly') continue
  assert.equal(value, false, `decision boundary ${key} must be false`)
}

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  decision: decision.status,
  nextBranch: 'work-659-twitch-category-source-v2-completeness-recovery-package',
  publicCategoryFilterAuthorized: false,
}, null, 2))
