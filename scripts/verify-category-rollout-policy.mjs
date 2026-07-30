import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

for (const path of [
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json',
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs',
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-permanent.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-permanent.toml',
]) assert.equal(existsSync(path), true, `${path}: missing`)

for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-reporter.yml',
]) assert.equal(existsSync(path), false, `${path}: temporary checkpoint path must be retired`)

const gate = json('docs/audits/12a2-current-gate-state.json')
const evidence = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json')
const retirement = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json')
const diagnosisContract = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json')
const diagnosisAcceptance = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json')

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.equal(evidence.status, 'checkpoint_failed')
assert.deepEqual(evidence.failedHardStops, [
  'slotCoveragePass',
  'consecutiveMissingSlotsPass',
  'categoryReferenceCoveragePass',
])
assert.equal(evidence.runtimeIntegrity.readOnly, true)
assert.equal(evidence.runtimeIntegrity.cadencePass, true)
assert.equal(evidence.runtimeIntegrity.twitchPermanentBindingPass, true)
assert.equal(evidence.runtimeIntegrity.kickPermanentBaselinePass, true)
assert.equal(evidence.runtimeIntegrity.twitchProviderLeakageRows, 0)
assert.equal(evidence.runtimeIntegrity.kickProviderLeakageRows, 0)
assert.equal(evidence.runtimeIntegrity.publicExposureStillUnauthorized, true)
assert.equal(evidence.decision.auditAccepted, false)
assert.equal(evidence.decision.publicCutoverAuthorized, false)
assert.equal(evidence.decision.automaticClockResetAuthorized, false)
assert.equal(retirement.boundaries.rerunAuthorized, false)
assert.equal(retirement.boundaries.kickChanged, false)
assert.equal(retirement.boundaries.publicCategoryUiAuthorized, false)

assert.equal(diagnosisContract.status, 'accepted')
assert.equal(diagnosisContract.acceptance.packagePr, 670)
assert.equal(diagnosisContract.acceptance.acceptancePr, 671)
assert.equal(diagnosisContract.acceptance.productionExecutionPerformed, false)
assert.deepEqual(diagnosisContract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(diagnosisAcceptance.status, 'accepted')
assert.equal(diagnosisAcceptance.acceptancePr, 671)
assert.equal(diagnosisAcceptance.packagePr, 670)
assert.equal(diagnosisAcceptance.boundaries.productionExecutionPerformed, false)
assert.equal(diagnosisAcceptance.boundaries.productionCredentialsUsedOnPackagePr, false)
assert.equal(diagnosisAcceptance.boundaries.checkpointRerunAuthorized, false)
assert.equal(diagnosisAcceptance.boundaries.d1MutationPerformed, false)
assert.equal(diagnosisAcceptance.boundaries.thresholdRelaxationAuthorized, false)
assert.equal(diagnosisAcceptance.boundaries.clockResetAuthorized, false)
assert.equal(diagnosisAcceptance.boundaries.kickChanged, false)
assert.equal(diagnosisAcceptance.boundaries.finalModeAuthorized, false)
assert.equal(diagnosisAcceptance.boundaries.publicCategoryUiAuthorized, false)

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Checkpoint run: 30478338654 failed', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package'],
  'CONTRIBUTING.md': ['Failure diagnosis package accepted PR #670 / #671', 'No checkpoint rerun or threshold relaxation.'],
  'docs/README.md': ['Failure diagnosis package accepted PR #670 / #671', '248 null refs'],
  'docs/product/current-roadmap.md': ['### Current gate: one-time diagnosis execution package', '0.994524'],
  'docs/product/current-schedule.md': ['Current gate one-time diagnosis execution package', 'no threshold relaxation'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Checkpoint execution and result', '## Current gate: one-time failure-diagnosis execution package'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['one-time diagnosis execution package', 'No threshold relaxation'],
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
assert.ok(twPermanent.includes('CATEGORY_CAPTURE_ENABLED = "true"'))
assert.ok(kickPermanent.includes('CATEGORY_CAPTURE_ENABLED = "true"'))

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  checkpointOutcome: evidence.status,
  failedHardStops: evidence.failedHardStops,
  temporaryPathRetired: true,
  diagnosisPackageAccepted: true,
  nextBranch: 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package',
  publicTwitchFilterAuthorized: false,
}, null, 2))
