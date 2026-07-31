import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const paths = {
  gate: 'docs/audits/12a2-current-gate-state.json',
  evidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json',
  retirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json',
  decision: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json',
  packageContract: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json',
  packageAcceptance: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-acceptance.json',
  observationContract: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-package-contract.json',
  observationAcceptance: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-package-acceptance.json',
  triggerContract: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger-contract.json',
}
for (const path of [...Object.values(paths),
  'scripts/verify-12a5-twitch-category-source-v2-completeness-package.mjs',
  'scripts/verify-12a5-twitch-category-source-v2-observation-execution-package.mjs',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-permanent.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-permanent.toml',
]) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
  'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
]) assert.equal(existsSync(path), false, `${path}: retired or not-yet-authorized path present`)

const gate = json(paths.gate)
const evidence = json(paths.evidence)
const retirement = json(paths.retirement)
const decision = json(paths.decision)
const packageContract = json(paths.packageContract)
const packageAcceptance = json(paths.packageAcceptance)
const observationContract = json(paths.observationContract)
const observationAcceptance = json(paths.observationAcceptance)
const triggerContract = json(paths.triggerContract)

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

assert.equal(evidence.status, 'diagnosis_complete')
assert.equal(evidence.categoryReferenceDiagnosis.checkpoint.coverageRatio, 0.994524)
assert.equal(evidence.categoryReferenceDiagnosis.postCheckpoint.coverageRatio, 0.994236)
assert.equal(retirement.status, 'retired_on_merge')
assert.equal(decision.status, 'recovery_required')
assert.equal(decision.decision.originalReplacementWindowValid, false)
assert.equal(decision.decision.recoveryRequired, true)
assert.equal(decision.decision.publicCutoverAuthorized, false)
assert.equal(decision.clockRule.oldWindowRetired, true)
assert.equal(decision.clockRule.newStartAt, null)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.packageIdentity.packagePr, 682)
assert.equal(packageContract.packageIdentity.acceptancePr, 684)
assert.equal(packageContract.packageIdentity.packageMergeSha, '2ae91cbf6b07616dcadc60894a832ace089c39fa')
assert.equal(packageAcceptance.status, 'accepted')
assert.equal(packageAcceptance.validation.conclusion, 'success')
assert.equal(packageAcceptance.acceptedCapabilities.productionActivationAccepted, false)

assert.equal(observationContract.status, 'accepted')
assert.equal(observationContract.packageIdentity.packagePr, 685)
assert.equal(observationContract.packageIdentity.packageMergeSha, '0a8f2931524d08dae42dee302df24a30da544949')
assert.equal(observationContract.packageIdentity.acceptancePr, 686)
assert.equal(observationContract.packageIdentity.validationRunId, 30570462889)
assert.equal(observationContract.packageIdentity.validationJobId, 90965620950)
assert.equal(observationContract.packageIdentity.productionExecutionPerformed, false)
assert.equal(observationContract.startBoundary.startAtFieldAllowed, false)
assert.equal(observationContract.startBoundary.preStartSleepAllowed, false)
assert.equal(observationContract.timeoutEnvelopeMinutes.requiredMaximum, 44)
assert.equal(observationContract.timeoutEnvelopeMinutes.jobTimeout, 50)
assert.ok(observationContract.timeoutEnvelopeMinutes.jobTimeout > observationContract.timeoutEnvelopeMinutes.requiredMaximum)
assert.equal(observationAcceptance.status, 'accepted')
assert.equal(observationAcceptance.packagePr, 685)
assert.equal(observationAcceptance.acceptancePr, 686)
assert.equal(observationAcceptance.validation.conclusion, 'success')
for (const value of Object.values(observationAcceptance.boundaries)) assert.equal(value, false)
assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.executionPackageIdentity.packagePr, 685)
assert.equal(triggerContract.executionPackageIdentity.packageMergeSha, '0a8f2931524d08dae42dee302df24a30da544949')
assert.equal(triggerContract.executionPackageIdentity.acceptancePr, 686)
assert.equal(triggerContract.trigger.executeImmediately, true)
assert.equal(triggerContract.trigger.startAtAllowed, false)
assert.equal(triggerContract.trigger.exactOneFilePrRequired, true)

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Observation execution package accepted: PR #685 / #686', 'work-659-twitch-category-source-v2-observation-trigger'],
  'CONTRIBUTING.md': ['Observation execution package accepted PR #685 / #686', 'Current gate exact immediate Twitch category-source-v2 observation trigger'],
  'docs/README.md': ['Observation execution package accepted PR #685 / #686', 'Current gate exact immediate Twitch category-source-v2 observation trigger'],
  'docs/product/current-roadmap.md': ['### Current gate: exact immediate Twitch category-source-v2 observation trigger', 'work-659-twitch-category-source-v2-observation-trigger'],
  'docs/product/current-schedule.md': ['Current gate exact immediate Twitch category-source-v2 observation trigger', 'Observation execution package accepted PR #685 / #686'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: exact immediate Twitch category-source-v2 observation trigger', 'acceptance PR #686'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['exact Twitch category-source-v2 observation trigger', 'Observation execution package accepted: PR #685 / #686'],
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
  observationPackageStatus: observationContract.status,
  packagePr: observationContract.packageIdentity.packagePr,
  acceptancePr: observationContract.packageIdentity.acceptancePr,
  nextBranch: 'work-659-twitch-category-source-v2-observation-trigger',
  publicTwitchFilterAuthorized: false,
}, null, 2))
