import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
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

for (const path of Object.values(files)) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contract = json(files.contract)
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
assert.equal(contract.status, 'ready_for_dormant_package_validation')
assert.equal(contract.phase, '12A-5B-R2')
assert.equal(contract.parentTrackingIssue, 623)
assert.equal(contract.hiddenUiTrackingIssue, 635)
assert.equal(contract.trackingIssue, 659)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.governingMainSha, '0f692d122b5320ffbad8eea413b6c8b945f47dc2')
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
assert.equal(Object.values(contract.readOnlyBoundary).every((value) => {
  if (Array.isArray(value)) return true
  return value === false
}), true)

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
  'A checkpoint may run before the final boundary.',
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
assert.equal(runner.includes('wrangler@4 deploy'), false)
assert.equal(runner.includes('git push'), false)
assert.equal(runner.includes('INSERT INTO'), false)
assert.equal(runner.includes('UPDATE '), false)
assert.equal(runner.includes('DELETE FROM'), false)
assert.equal(runner.includes('ALTER TABLE'), false)

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
assert.equal(workflow.includes('workflow_dispatch:'), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('wrangler@4 deploy'), false)
assert.equal(workflow.includes('git push'), false)
assert.equal(workflow.includes('contents: write'), false)

for (const source of [roadmap, schedule, activeWip]) {
  assert.ok(source.includes('#659'))
  assert.ok(source.includes('2026-08-05T05:30:00.000Z'))
}
assert.ok(schedule.includes('Create `work-659-twitch-replacement-audit-package`.'))
assert.ok(schedule.includes('Prepare a bounded read-only checkpoint path; do not add a Worker cron.'))

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
  governingMainSha: contract.governingMainSha,
  window: contract.window,
  packageDormant: true,
  readOnly: true,
  pullRequestCredentials: false,
  publicExposureAuthorized: false,
  productionExecutionIncluded: false,
  separateExecutionTriggerRequired: true,
}, null, 2))
