import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const paths = {
  gate: 'docs/audits/12a2-current-gate-state.json',
  checkpointEvidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  checkpointRetirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  queryContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json',
  queryAcceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-acceptance.json',
  executionContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-contract.json',
  executionAcceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution-package-acceptance.json',
  triggerContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger-contract.json',
  diagnosisEvidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json',
  diagnosisRetirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json',
}
for (const path of [...Object.values(paths),
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-retirement.mjs',
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.mjs',
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence-retirement.mjs',
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
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
]) assert.equal(existsSync(path), false, `${path}: temporary path must be retired`)

const gate = json(paths.gate)
const checkpointEvidence = json(paths.checkpointEvidence)
const checkpointRetirement = json(paths.checkpointRetirement)
const queryContract = json(paths.queryContract)
const queryAcceptance = json(paths.queryAcceptance)
const executionContract = json(paths.executionContract)
const executionAcceptance = json(paths.executionAcceptance)
const triggerContract = json(paths.triggerContract)
const diagnosisEvidence = json(paths.diagnosisEvidence)
const diagnosisRetirement = json(paths.diagnosisRetirement)

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
assert.equal(checkpointEvidence.status, 'checkpoint_failed')
assert.deepEqual(checkpointEvidence.failedHardStops, ['slotCoveragePass', 'consecutiveMissingSlotsPass', 'categoryReferenceCoveragePass'])
assert.equal(checkpointEvidence.runtimeIntegrity.readOnly, true)
assert.equal(checkpointEvidence.runtimeIntegrity.cadencePass, true)
assert.equal(checkpointEvidence.runtimeIntegrity.twitchPermanentBindingPass, true)
assert.equal(checkpointEvidence.runtimeIntegrity.kickPermanentBaselinePass, true)
assert.equal(checkpointEvidence.runtimeIntegrity.twitchProviderLeakageRows, 0)
assert.equal(checkpointEvidence.runtimeIntegrity.kickProviderLeakageRows, 0)
assert.equal(checkpointEvidence.decision.auditAccepted, false)
assert.equal(checkpointRetirement.boundaries.rerunAuthorized, false)
assert.equal(checkpointRetirement.boundaries.publicCategoryUiAuthorized, false)
assert.equal(queryContract.status, 'accepted')
assert.equal(queryContract.acceptance.packagePr, 670)
assert.equal(queryAcceptance.status, 'accepted')
assert.equal(queryAcceptance.acceptancePr, 671)
assert.deepEqual(queryContract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(executionContract.status, 'accepted')
assert.equal(executionContract.acceptance.packagePr, 672)
assert.equal(executionContract.acceptance.packageMergeSha, '02ece37cc70de4faa5251600a465d4e68d058f29')
assert.equal(executionContract.acceptance.acceptancePr, 673)
assert.equal(executionAcceptance.status, 'accepted')
assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, 672)
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, 673)
assert.deepEqual(triggerContract.executionBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(diagnosisEvidence.status, 'diagnosis_complete')
assert.equal(diagnosisEvidence.provider, 'twitch')
assert.equal(diagnosisEvidence.error, null)
assert.equal(diagnosisRetirement.status, 'retired_on_merge')
assert.equal(diagnosisRetirement.sourceTrigger.pr, 678)
assert.equal(diagnosisRetirement.sourceTrigger.mergeSha, 'ccb05bce0622a23e211c2c1eadc23052377d302e')
assert.equal(diagnosisRetirement.boundaries.diagnosisEvidenceOnly, true)
for (const [key, value] of Object.entries(diagnosisRetirement.boundaries)) {
  if (key === 'diagnosisEvidenceOnly') continue
  assert.equal(value, false, `diagnosis retirement boundary ${key} must remain false`)
}

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Diagnosis evidence: frozen', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
  'CONTRIBUTING.md': ['Diagnosis evidence frozen and temporary path retired', 'No automatic recovery or stability-clock reset.'],
  'docs/README.md': ['Diagnosis evidence frozen', 'Current branch work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
  'docs/product/current-roadmap.md': ['### Current gate: checkpoint-failure diagnosis decision', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision'],
  'docs/product/current-schedule.md': ['Current gate separate diagnosis decision', 'no automatic clock reset'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: separate diagnosis decision', 'Diagnosis evidence does not decide recovery'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['checkpoint-failure diagnosis decision', 'No public category UI'],
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
  checkpointOutcome: checkpointEvidence.status,
  diagnosisStatus: diagnosisEvidence.status,
  diagnosisPathRetired: true,
  nextBranch: 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-decision',
  publicTwitchFilterAuthorized: false,
}, null, 2))
