import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const paths = {
  gate: 'docs/audits/12a2-current-gate-state.json',
  evidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  retirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  queryContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json',
  queryAcceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json',
  executionContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-contract.json',
  executionAcceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-acceptance.json',
  triggerContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract.json',
}
for (const path of [...Object.values(paths),
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs',
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs',
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package.mjs',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-permanent.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-permanent.toml',
]) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-reporter.yml',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
]) assert.equal(existsSync(path), false, `${path}: must be absent at exact-trigger pre-arm gate`)

const gate = json(paths.gate)
const evidence = json(paths.evidence)
const retirement = json(paths.retirement)
const queryContract = json(paths.queryContract)
const queryAcceptance = json(paths.queryAcceptance)
const executionContract = json(paths.executionContract)
const executionAcceptance = json(paths.executionAcceptance)
const triggerContract = json(paths.triggerContract)

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
assert.deepEqual(evidence.failedHardStops, ['slotCoveragePass', 'consecutiveMissingSlotsPass', 'categoryReferenceCoveragePass'])
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

assert.equal(queryContract.status, 'accepted')
assert.equal(queryContract.acceptance.packagePr, 670)
assert.equal(queryContract.acceptance.acceptancePr, 671)
assert.equal(queryContract.acceptance.productionExecutionPerformed, false)
assert.deepEqual(queryContract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(queryAcceptance.status, 'accepted')
assert.equal(queryAcceptance.acceptancePr, 671)
for (const key of ['productionExecutionPerformed', 'productionCredentialsUsedOnPackagePr', 'checkpointRerunAuthorized', 'd1MutationPerformed', 'thresholdRelaxationAuthorized', 'clockResetAuthorized', 'kickChanged', 'finalModeAuthorized', 'publicCategoryUiAuthorized']) assert.equal(queryAcceptance.boundaries[key], false)

assert.equal(executionContract.status, 'accepted')
assert.equal(executionContract.acceptance.packagePr, 672)
assert.equal(executionContract.acceptance.packageMergeSha, '02ece37cc70de4faa5251600a465d4e68d058f29')
assert.equal(executionContract.acceptance.acceptancePr, 673)
assert.equal(executionContract.acceptance.productionExecutionPerformed, false)
assert.deepEqual(executionContract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(executionAcceptance.status, 'accepted')
assert.equal(executionAcceptance.packagePr, 672)
assert.equal(executionAcceptance.acceptancePr, 673)
for (const value of Object.values(executionAcceptance.boundaries)) assert.equal(value, false)
assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, 672)
assert.equal(triggerContract.acceptedPackageIdentity.packageMergeSha, '02ece37cc70de4faa5251600a465d4e68d058f29')
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, 673)
assert.deepEqual(triggerContract.executionBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(triggerContract.executionBoundary.publicExposureAuthorized, false)

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Failure diagnosis execution package: accepted PR #672 / #673', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger'],
  'CONTRIBUTING.md': ['Diagnosis execution package accepted PR #672 / #673', 'No checkpoint rerun or threshold relaxation.'],
  'docs/README.md': ['Failure diagnosis execution package accepted PR #672 / #673', 'Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger'],
  'docs/product/current-roadmap.md': ['### Current gate: exact diagnosis trigger', '02ece37cc70de4faa5251600a465d4e68d058f29'],
  'docs/product/current-schedule.md': ['Current gate exact one-file diagnosis trigger', 'no threshold relaxation'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: exact failure-diagnosis trigger', 'RUN_TWITCH_CHECKPOINT_FAILURE_DIAGNOSIS'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['replacement Twitch checkpoint-failure diagnosis trigger', 'No threshold relaxation'],
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

console.log(JSON.stringify({ ok: true, phase: gate.currentWorkstream.phase, checkpointOutcome: evidence.status, checkpointPathRetired: true, queryPackageAccepted: true, executionPackageAccepted: true, triggerPresent: false, nextBranch: 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger', publicTwitchFilterAuthorized: false }, null, 2))
