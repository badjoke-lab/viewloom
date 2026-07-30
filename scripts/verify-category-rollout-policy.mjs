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
}
for (const path of [...Object.values(paths),
  'scripts/verify-12a5-twitch-category-source-v2-completeness-package.mjs',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-permanent.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-permanent.toml',
]) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
]) assert.equal(existsSync(path), false, `${path}: retired path returned`)

const gate = json(paths.gate)
const evidence = json(paths.evidence)
const retirement = json(paths.retirement)
const decision = json(paths.decision)
const packageContract = json(paths.packageContract)
const packageAcceptance = json(paths.packageAcceptance)

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
assert.equal(packageContract.packageIdentity.packageMergeSha, '2ae91cbf6b07616dcadc60894a832ace089c39fa')
assert.equal(packageContract.packageIdentity.acceptancePr, 684)
assert.equal(packageContract.packageIdentity.validationRunId, 30567807300)
assert.equal(packageContract.packageIdentity.validationJobId, 90956596848)
assert.equal(packageContract.candidate.contractVersion, 'category-source-v2-candidate')
assert.equal(packageContract.candidate.semanticMappingPerformed, false)
for (const value of Object.values(packageContract.dormantBoundary)) assert.equal(value, false)
assert.equal(packageAcceptance.status, 'accepted')
assert.equal(packageAcceptance.packagePr, 682)
assert.equal(packageAcceptance.acceptancePr, 684)
assert.equal(packageAcceptance.validation.conclusion, 'success')
assert.equal(packageAcceptance.capacityEvidence.overheadBytes, 348)
assert.equal(packageAcceptance.acceptedCapabilities.dormantCandidate, true)
assert.equal(packageAcceptance.acceptedCapabilities.productionActivationAccepted, false)
for (const value of Object.values(packageAcceptance.boundaries)) assert.equal(value, false)

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Package accepted: PR #682 / #684', 'work-659-twitch-category-source-v2-completeness-execution-package'],
  'CONTRIBUTING.md': ['Package accepted PR #682 / #684', 'No production execution before a separately accepted execution package'],
  'docs/README.md': ['Dormant v2 package accepted PR #682 / #684', 'Current gate Twitch-only category-source-v2 execution package'],
  'docs/product/current-roadmap.md': ['### Current gate: Twitch-only category-source-v2 execution package', 'package accepted PR #682 / #684'],
  'docs/product/current-schedule.md': ['Current gate Twitch-only category-source-v2 execution package', 'Package accepted PR #682 / #684'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: Twitch-only category-source-v2 execution package', 'package acceptance PR #684'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['Twitch-only category-source-v2 execution package', 'package accepted'],
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
  packageStatus: packageContract.status,
  packagePr: packageContract.packageIdentity.packagePr,
  acceptancePr: packageContract.packageIdentity.acceptancePr,
  nextBranch: 'work-659-twitch-category-source-v2-completeness-execution-package',
  publicTwitchFilterAuthorized: false,
}, null, 2))
