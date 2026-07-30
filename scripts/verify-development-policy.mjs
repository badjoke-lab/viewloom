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
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json',
  'docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json',
  'docs/audits/12a5-twitch-category-source-v2-completeness-package-acceptance.json',
  '.github/pull_request_template.md',
]
for (const path of required) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
]) assert.equal(existsSync(path), false, `${path}: retired path returned`)

const gate = json('docs/audits/12a2-current-gate-state.json')
const decision = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json')
const packageContract = json('docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json')
const packageAcceptance = json('docs/audits/12a5-twitch-category-source-v2-completeness-package-acceptance.json')

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Mandatory authorities', 'Package accepted: PR #682 / #684'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Current-main SHA', 'Package accepted PR #682 / #684'],
  'docs/README.md': ['Dormant v2 package accepted PR #682 / #684', 'Current-main documents and accepted contracts'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['### Current gate: Twitch-only category-source-v2 execution package', 'work-659-twitch-category-source-v2-completeness-execution-package'],
  'docs/product/current-schedule.md': ['Current gate Twitch-only category-source-v2 execution package', 'No production execution before a separately accepted execution package'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: Twitch-only category-source-v2 execution package', 'No new stability start'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Twitch-only category-source-v2 execution package', 'No public category UI'],
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

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.packageIdentity.packagePr, 682)
assert.equal(packageContract.packageIdentity.acceptancePr, 684)
assert.equal(packageContract.packageIdentity.packageMergeSha, '2ae91cbf6b07616dcadc60894a832ace089c39fa')
assert.equal(packageContract.packageIdentity.productionExecutionPerformed, false)
assert.equal(packageContract.candidate.semanticMappingPerformed, false)
for (const value of Object.values(packageContract.dormantBoundary)) assert.equal(value, false)
assert.equal(packageAcceptance.status, 'accepted')
assert.equal(packageAcceptance.validation.conclusion, 'success')
assert.equal(packageAcceptance.capacityEvidence.overheadBytes, 348)
assert.equal(packageAcceptance.acceptedCapabilities.dormantCandidate, true)
assert.equal(packageAcceptance.acceptedCapabilities.productionActivationAccepted, false)
assert.equal(packageAcceptance.acceptedCapabilities.semanticMappingAccepted, false)
for (const value of Object.values(packageAcceptance.boundaries)) assert.equal(value, false)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  packageStatus: packageContract.status,
  nextBranch: 'work-659-twitch-category-source-v2-completeness-execution-package',
  publicCategoryFilterAuthorized: false,
}, null, 2))
