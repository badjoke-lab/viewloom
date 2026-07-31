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
  'docs/audits/12a5-twitch-category-source-v2-observation-execution-package-contract.json',
  'docs/audits/12a5-twitch-category-source-v2-observation-execution-package-acceptance.json',
  'docs/audits/12a5-twitch-category-source-v2-observation-trigger-contract.json',
  '.github/pull_request_template.md',
]
for (const path of required) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
  'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
]) assert.equal(existsSync(path), false, `${path}: retired or not-yet-authorized path present`)

const gate = json('docs/audits/12a2-current-gate-state.json')
const decision = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json')
const packageContract = json('docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json')
const packageAcceptance = json('docs/audits/12a5-twitch-category-source-v2-completeness-package-acceptance.json')
const observationContract = json('docs/audits/12a5-twitch-category-source-v2-observation-execution-package-contract.json')
const observationAcceptance = json('docs/audits/12a5-twitch-category-source-v2-observation-execution-package-acceptance.json')
const triggerContract = json('docs/audits/12a5-twitch-category-source-v2-observation-trigger-contract.json')

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Mandatory authorities', 'Observation execution package accepted: PR #685 / #686'],
  'CONTRIBUTING.md': ['Required reading and freshness rule', 'Current-main SHA', 'Observation execution package accepted PR #685 / #686'],
  'docs/README.md': ['Observation execution package accepted PR #685 / #686', 'Current-main documents and accepted contracts'],
  'docs/operations/development-and-deployment-policy.md': ['Mandatory freshness protocol', 'Cached chat summaries', '`main` is production'],
  'docs/product/current-roadmap.md': ['### Current gate: exact immediate Twitch category-source-v2 observation trigger', 'work-659-twitch-category-source-v2-observation-trigger'],
  'docs/product/current-schedule.md': ['Current gate exact immediate Twitch category-source-v2 observation trigger', 'No production observation before the accepted exact one-file trigger is merged'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: exact immediate Twitch category-source-v2 observation trigger', 'No new stability start'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['exact Twitch category-source-v2 observation trigger', 'No public category UI'],
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
assert.equal(packageAcceptance.status, 'accepted')
assert.equal(packageAcceptance.acceptedCapabilities.productionActivationAccepted, false)

assert.equal(observationContract.status, 'accepted')
assert.equal(observationContract.packageIdentity.packagePr, 685)
assert.equal(observationContract.packageIdentity.packageMergeSha, '0a8f2931524d08dae42dee302df24a30da544949')
assert.equal(observationContract.packageIdentity.acceptancePr, 686)
assert.equal(observationContract.packageIdentity.productionExecutionPerformed, false)
assert.equal(observationContract.startBoundary.startAtFieldAllowed, false)
assert.equal(observationContract.startBoundary.preStartSleepAllowed, false)
assert.equal(observationContract.timeoutEnvelopeMinutes.requiredMaximum, 44)
assert.equal(observationContract.timeoutEnvelopeMinutes.jobTimeout, 50)
assert.equal(observationAcceptance.status, 'accepted')
assert.equal(observationAcceptance.validation.conclusion, 'success')
assert.equal(observationAcceptance.acceptedCapabilities.separateExactTriggerRequired, true)
assert.equal(observationAcceptance.acceptedCapabilities.semanticMappingAccepted, false)
for (const value of Object.values(observationAcceptance.boundaries)) assert.equal(value, false)
assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.executionPackageIdentity.acceptancePr, 686)
assert.equal(triggerContract.trigger.executeImmediately, true)
assert.equal(triggerContract.trigger.startAtAllowed, false)
assert.equal(triggerContract.trigger.exactOneFilePrRequired, true)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  observationPackageStatus: observationContract.status,
  nextBranch: 'work-659-twitch-category-source-v2-observation-trigger',
  publicCategoryFilterAuthorized: false,
}, null, 2))
