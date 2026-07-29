import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  packageAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json',
  specification: 'docs/product/twitch-replacement-seven-day-audit-spec.md',
  runner: 'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs',
  test: 'scripts/test-12a5-twitch-replacement-seven-day-audit.mjs',
  workflow: '.github/workflows/analytics-12a5-twitch-replacement-seven-day-audit-package.yml',
  gate: 'docs/audits/12a2-current-gate-state.json',
  recoveryAcceptance: 'docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json',
  hiddenDecision: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  hiddenApi: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json',
  hiddenControls: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json',
  currentRoadmap: 'docs/product/current-roadmap.md',
  currentSchedule: 'docs/product/current-schedule.md',
  activeWip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  twitchPermanent: 'workers/collector-twitch/wrangler.category-permanent.toml',
  twitchRollback: 'workers/collector-twitch/wrangler.toml',
  kickPermanent: 'workers/collector-kick/wrangler.category-permanent.toml',
  kickRollback: 'workers/collector-kick/wrangler.toml',
}

for (const file of Object.values(files)) {
  assert.equal(existsSync(file), true, `${file}: missing`)
}

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const contract = json(files.contract)
const packageAcceptance = json(files.packageAcceptance)
const gate = json(files.gate)
const recoveryAcceptance = json(files.recoveryAcceptance)
const hiddenDecision = json(files.hiddenDecision)
const hiddenApi = json(files.hiddenApi)
const hiddenControls = json(files.hiddenControls)
const specification = read(files.specification)
const runner = read(files.runner)
const test = read(files.test)
const workflow = read(files.workflow)
const roadmap = read(files.currentRoadmap)
const schedule = read(files.currentSchedule)
const activeWip = read(files.activeWip)
const twitchPermanent = read(files.twitchPermanent)
const twitchRollback = read(files.twitchRollback)
const kickPermanent = read(files.kickPermanent)
const kickRollback = read(files.kickRollback)

assert.equal(contract.schemaVersion, 'viewloom-12a5-twitch-replacement-seven-day-audit-package-v1')
assert.equal(contract.status, 'accepted_dormant')
assert.equal(contract.phase, '12A-5B-R2')
assert.equal(contract.parentTrackingIssue, 623)
assert.equal(contract.hiddenUiTrackingIssue, 635)
assert.equal(contract.trackingIssue, 659)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.governingMainSha, '0f692d122b5320ffbad8eea413b6c8b945f47dc2')
assert.equal(contract.packageAcceptance, files.packageAcceptance)
assert.equal(contract.window.semantics, 'half_open')
assert.equal(contract.window.startAt, '2026-07-29T05:30:00.000Z')
assert.equal(contract.window.endExclusiveAt, '2026-08-05T05:30:00.000Z')
assert.equal(contract.window.minimumStableDays, 7)
assert.equal(contract.window.cadenceMinutes, 5)
assert.equal(contract.window.expectedFinalSlots, 2016)
assert.equal(contract.window.originalWindowValid, false)
assert.equal(
  (Date.parse(contract.window.endExclusiveAt) - Date.parse(contract.window.startAt)) / (5 * 60 * 1000),
  contract.window.expectedFinalSlots,
)
assert.equal(contract.runtime.collectorCron, '*/5 * * * *')
assert.equal(contract.runtime.categoryContractVersion, 'category-source-v1')
assert.equal(contract.thresholds.minimumCategoryCoverageRatio, 0.995)
assert.equal(contract.thresholds.maximumMissingSlots, 10)
assert.equal(contract.thresholds.maximumConsecutiveMissingSlots, 2)
assert.equal(contract.thresholds.minimumCategoryReferenceCoverageRatio, 0.995)
assert.equal(contract.modes.checkpoint.authorizesAuditAcceptance, false)
assert.equal(contract.modes.checkpoint.authorizesPublicCutover, false)
assert.equal(contract.modes.final.allowedBeforeFinalBoundary, false)
assert.equal(contract.modes.final.authorizesPublicCutover, false)
assert.equal(contract.package.productionExecutionIncluded, false)
assert.equal(contract.package.productionCredentialsUsedOnPullRequest, false)
assert.equal(contract.package.separateExecutionTriggerRequired, true)
assert.equal(contract.acceptanceBoundary.passingFinalAuditExposesUi, false)
assert.equal(contract.acceptanceBoundary.separateEvidenceAcceptancePrRequired, true)
assert.equal(contract.acceptanceBoundary.separatePublicCutoverPrRequired, true)
assert.equal(Object.values(contract.readOnlyBoundary).every((value) => Array.isArray(value) || value === false), true)

for (const [name, expected] of Object.entries({
  acceptancePr: 662,
  packagePr: 661,
  packageCandidateHeadSha: '9d593116e2cccc40dc27bc42b3be55d647e3d3ae',
  packageMergeSha: '1cab151ce243e1ec58091bfd309f65671e1f41c7',
  workflowRunId: 30455002204,
  workflowJobId: 90586212618,
  packageVerifierPass: true,
  windowAndSlotTestsPass: true,
  categoryPolicyPass: true,
  developmentPolicyPass: true,
  webTypecheckPass: true,
  webBuildPass: true,
  publicCategoryControlsAbsentPass: true,
  productionExecutionPerformed: false,
  publicExposureEnabled: false,
  kickChanged: false,
})) {
  assert.equal(contract.acceptance[name], expected, `contract acceptance mismatch: ${name}`)
}

assert.equal(packageAcceptance.schemaVersion, 'viewloom-12a5-twitch-replacement-seven-day-audit-package-acceptance-v1')
assert.equal(packageAcceptance.status, 'accepted')
assert.equal(packageAcceptance.phase, contract.phase)
assert.equal(packageAcceptance.acceptancePr, contract.acceptance.acceptancePr)
assert.equal(packageAcceptance.packagePr, contract.acceptance.packagePr)
assert.equal(packageAcceptance.packageCandidateHeadSha, contract.acceptance.packageCandidateHeadSha)
assert.equal(packageAcceptance.packageMergeSha, contract.acceptance.packageMergeSha)
assert.equal(packageAcceptance.validation.workflowRunId, contract.acceptance.workflowRunId)
assert.equal(packageAcceptance.validation.workflowJobId, contract.acceptance.workflowJobId)
assert.equal(packageAcceptance.validation.conclusion, 'success')
assert.equal(Object.values(packageAcceptance.validation).every((value) => value === true || value === 'success' || Number.isInteger(value)), true)
assert.equal(packageAcceptance.window.semantics, contract.window.semantics)
assert.equal(packageAcceptance.window.startAt, contract.window.startAt)
assert.equal(packageAcceptance.window.endExclusiveAt, contract.window.endExclusiveAt)
assert.equal(packageAcceptance.window.expectedFinalSlots, contract.window.expectedFinalSlots)
assert.equal(packageAcceptance.acceptedCapabilities.checkpointModeImplemented, true)
assert.equal(packageAcceptance.acceptedCapabilities.checkpointModeAuthorizing, false)
assert.equal(packageAcceptance.acceptedCapabilities.finalModeImplemented, true)
assert.equal(packageAcceptance.acceptedCapabilities.finalBeforeBoundaryRejected, true)
assert.equal(Object.values(packageAcceptance.boundaries).every((value) => value === false), true)
assert.ok(packageAcceptance.nextGate.includes('bounded read-only checkpoint execution package'))

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.twitchStableAccumulationStartAt, contract.window.startAt)
assert.equal(gate.currentWorkstream.twitchStableAccumulationEarliestAuditAt, contract.window.endExclusiveAt)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.equal(recoveryAcceptance.status, 'accepted')
assert.equal(recoveryAcceptance.startAt, contract.window.startAt)
assert.equal(recoveryAcceptance.earliestSevenDayAuditAt, contract.window.endExclusiveAt)
assert.equal(recoveryAcceptance.gates.permanentBindingPass, true)
assert.equal(recoveryAcceptance.gates.cadencePass, true)
assert.equal(recoveryAcceptance.gates.providerLeakagePass, true)
assert.equal(recoveryAcceptance.gates.storagePass, true)
assert.equal(recoveryAcceptance.gates.rollbackRequired, false)
assert.equal(recoveryAcceptance.boundaries.kickChanged, false)
assert.equal(recoveryAcceptance.boundaries.publicCategoryUiAuthorized, false)
assert.equal(hiddenDecision.authorization.publicExposureAuthorized, false)
assert.equal(hiddenDecision.publicGate.earliestAuditAt, contract.window.endExclusiveAt)
assert.equal(hiddenApi.acceptance.publicExposureEnabled, false)
assert.equal(hiddenControls.acceptance.publicExposureEnabled, false)

for (const fragment of [
  'The only valid start is `2026-07-29T05:30:00.000Z`',
  'replacement of missing slots with interpolated data',
  'Accepted dormant package',
  'Package acceptance PR: #662.',
  'A checkpoint cannot accept #659 or authorize public UI.',
  'A passing audit does not itself expose the feature.',
]) {
  assert.ok(specification.includes(fragment), `specification missing: ${fragment}`)
}

for (const fragment of [
  'resolveAuditWindow',
  'analyzeSlots',
  'determineOutcome',
  'half_open',
  'observed_bucket_minute',
  'missingSlots',
  'maximumConsecutiveMissingSlots',
  "provider = 'twitch'",
  "provider != 'twitch'",
  "provider != 'kick'",
  'category-source-v1',
  'provider_category_dictionary',
  'collector_runs',
  'non_select_statement_rejected',
  'publicCutoverAuthorized: false',
  'productionMutationPerformed: false',
  'kickMutationPerformed: false',
]) {
  assert.ok(runner.includes(fragment), `runner missing: ${fragment}`)
}
for (const forbidden of ['wrangler@4 deploy', 'git push', 'INSERT INTO', 'UPDATE ', 'DELETE FROM', 'ALTER TABLE']) {
  assert.equal(runner.includes(forbidden), false, `runner forbidden fragment: ${forbidden}`)
}

for (const fragment of [
  'expectedFinalSlots, 2016',
  'final_audit_boundary_not_reached',
  'missingSlotCount, 2',
  'checkpoint_healthy',
  'accepted_for_separate_evidence_pr',
]) {
  assert.ok(test.includes(fragment), `test missing: ${fragment}`)
}

for (const fragment of [
  'Verify dormant replacement audit package',
  'Test exact replacement audit window and slot accounting',
  'Verify production build still contains no public category controls',
  'contents: read',
  'cancel-in-progress: true',
]) {
  assert.ok(workflow.includes(fragment), `workflow missing: ${fragment}`)
}
for (const forbidden of [
  'workflow_dispatch:',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'wrangler@4 deploy',
  'git push',
  'contents: write',
]) {
  assert.equal(workflow.includes(forbidden), false, `workflow forbidden fragment: ${forbidden}`)
}

for (const source of [roadmap, schedule, activeWip]) {
  assert.ok(source.includes('#659'))
  assert.ok(source.includes('2026-08-05T05:30:00.000Z'))
  assert.ok(source.includes('#661'))
  assert.ok(source.includes('#662'))
  assert.ok(source.includes('work-659-twitch-replacement-audit-checkpoint-package'))
}

const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(twitchPermanent), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchRollback), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(kickPermanent), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickRollback), false)
assert.equal(cron(twitchPermanent), contract.runtime.collectorCron)
assert.equal(cron(twitchRollback), contract.runtime.collectorCron)
assert.equal(cron(kickPermanent), contract.runtime.collectorCron)
assert.equal(cron(kickRollback), contract.runtime.collectorCron)
assert.equal(toml(twitchPermanent, 'database_id'), toml(twitchRollback, 'database_id'))
assert.equal(toml(kickPermanent, 'database_id'), toml(kickRollback, 'database_id'))
assert.notEqual(toml(twitchPermanent, 'database_id'), toml(kickPermanent, 'database_id'))

console.log(JSON.stringify({
  ok: true,
  phase: contract.phase,
  trackingIssue: contract.trackingIssue,
  packagePr: contract.acceptance.packagePr,
  acceptancePr: contract.acceptance.acceptancePr,
  packageMergeSha: contract.acceptance.packageMergeSha,
  window: contract.window,
  packageAcceptedDormant: true,
  readOnly: true,
  checkpointNonAuthorizing: true,
  publicExposureAuthorized: false,
  productionExecutionIncluded: false,
  nextBranch: 'work-659-twitch-replacement-audit-checkpoint-package',
}, null, 2))
