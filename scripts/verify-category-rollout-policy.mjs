import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const files = {
  spec: 'docs/product/category-capture-permanent-rollout-spec.md',
  plan: 'docs/product/category-capture-permanent-rollout-plan.md',
  roadmap: 'docs/product/current-roadmap.md',
  schedule: 'docs/product/current-schedule.md',
  gate: 'docs/audits/12a2-current-gate-state.json',
  activeWip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  historicalTwitchWip: 'docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md',
  twitchAcceptance: 'docs/audits/12a4-twitch-permanent-category-final-acceptance.json',
  kickDecision: 'docs/audits/12a4-kick-permanent-category-decision-contract.json',
  hiddenTwitchDecision: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  policyWorkflow: '.github/workflows/category-rollout-policy.yml',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
  permanentTwitch: 'workers/collector-twitch/wrangler.category-permanent.toml',
  normalKick: 'workers/collector-kick/wrangler.toml',
}

for (const path of Object.values(files)) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const spec = read(files.spec)
const plan = read(files.plan)
const roadmap = read(files.roadmap)
const schedule = read(files.schedule)
const activeWip = read(files.activeWip)
const historicalWip = read(files.historicalTwitchWip)
const workflow = read(files.policyWorkflow)
const gate = json(files.gate)
const twitchAcceptance = json(files.twitchAcceptance)
const kickDecision = json(files.kickDecision)
const hiddenTwitchDecision = json(files.hiddenTwitchDecision)

for (const fragment of [
  'Twitch permanent category capture is active and accepted',
  'Kick permanent category capture: implementation and guarded rollout authorized',
  'Twitch Heatmap category filter: hidden implementation and testing authorized',
  'The seven-day gate blocks public exposure, not hidden implementation work',
  'Twitch and Kick remain separate data products',
  'preserve the existing `*/5 * * * *` Worker cron',
]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)

for (const fragment of [
  'Current phase 12A-4-24 — parallel Kick rollout and hidden Twitch filter',
  'Track A — Kick permanent category capture',
  'Track B — hidden Twitch Heatmap category filter',
  '12A-5B — seven-day Twitch accumulation audit',
  '12A-5C — public Twitch filter cutover',
]) assert.ok(plan.includes(fragment), `plan missing: ${fragment}`)

for (const fragment of [
  'Current gate: 12A-4-24 parallel execution',
  'Kick permanent category capture: implementation, fresh preflight, exact release, 24–48 hour observation',
  'Twitch Heatmap category filter: hidden implementation and testing',
  'The earliest Twitch seven-day audit boundary is `2026-07-27T11:40:00Z`',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)

for (const fragment of [
  'Canonical target 12A-4-24 parallel execution',
  'Kick permanent implementation authorized yes',
  'Twitch Heatmap hidden category-filter implementation authorized yes',
  'Twitch Heatmap public category-filter exposure authorized no',
  'The seven-day boundary blocks public exposure only',
]) assert.ok(schedule.includes(fragment), `schedule missing: ${fragment}`)

for (const fragment of [
  '# 12A-4-24 category parallel execution',
  'Track A: Kick permanent category capture rollout under Issue #634',
  'Track B: hidden Twitch Heatmap category-filter implementation under Issue #635',
  'Earliest audit: `2026-07-27T11:40:00.000Z`',
]) assert.ok(activeWip.includes(fragment), `active WIP missing: ${fragment}`)
assert.ok(historicalWip.includes('Status: completed historical work record'))
assert.ok(historicalWip.includes('Superseded as active WIP by'))

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v28')
assert.equal(gate.status, '12a4_kick_permanent_rollout_and_hidden_twitch_filter_authorized')
assert.equal(gate.currentWorkstream.phase, '12A-4-24')
assert.equal(gate.currentWorkstream.trackingIssue, 623)
assert.equal(gate.currentWorkstream.kickTrackingIssue, 634)
assert.equal(gate.currentWorkstream.twitchHiddenUiTrackingIssue, 635)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.categoryUiImplementationAuthorized, true)
assert.equal(gate.currentWorkstream.categoryUiPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterHiddenImplementationAuthorized, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.publicCategoryUiEarliestAuditAt, '2026-07-27T11:40:00.000Z')
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.observationActive, false)
assert.equal(gate.currentWorkstream.observationScheduleCurrent, false)

assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, false)
assert.equal(gate.categoryCapture.categoryUiAuthorized, false)
assert.equal(gate.categoryCapture.categoryUiImplementationAuthorized, true)
assert.equal(gate.categoryCapture.categoryUiPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.twitchHeatmapCategoryFilterHiddenImplementationAuthorized, true)
assert.equal(gate.categoryCapture.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.ok(gate.closedBlockers.includes('kick_permanent_category_capture_not_authorized'))
assert.deepEqual(gate.openBlockers, [
  'kick_permanent_category_capture_not_implemented',
  'kick_permanent_category_capture_not_deployed',
  'kick_permanent_category_capture_observation_not_accepted',
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_hidden_implementation_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
])

assert.equal(gate.categoryParallelExecutionDecision.status, 'accepted')
assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.trackingIssue, 634)
assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.implementationAuthorized, true)
assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.runtimeActive, false)
assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.trackingIssue, 635)
assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.hiddenImplementationAuthorized, true)
assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.publicExposureAuthorized, false)
assert.equal(gate.categoryParallelExecutionDecision.boundaries.newWorkerCronAuthorized, false)
assert.equal(gate.categoryParallelExecutionDecision.boundaries.backfillAuthorized, false)
assert.equal(gate.categoryParallelExecutionDecision.boundaries.retentionExpansionAuthorized, false)

assert.equal(kickDecision.status, 'accepted_for_guarded_implementation')
assert.equal(kickDecision.trackingIssue, 634)
assert.equal(kickDecision.provider, 'kick')
assert.equal(kickDecision.decision.implementationAuthorized, true)
assert.equal(kickDecision.decision.runtimeActive, false)
assert.equal(kickDecision.decision.freshReadOnlyPreflightRequired, true)
assert.equal(kickDecision.decision.separateExactReleaseTriggerRequired, true)
assert.equal(kickDecision.runtime.existingCron, '*/5 * * * *')
assert.equal(kickDecision.boundaries.twitchChangeAuthorized, false)
assert.equal(Object.values(kickDecision.boundaries).every((value) => value === false), true)

assert.equal(hiddenTwitchDecision.status, 'accepted_hidden_implementation_only')
assert.equal(hiddenTwitchDecision.trackingIssue, 635)
assert.equal(hiddenTwitchDecision.provider, 'twitch')
assert.equal(hiddenTwitchDecision.authorization.hiddenImplementationAuthorized, true)
assert.equal(hiddenTwitchDecision.authorization.publicExposureAuthorized, false)
assert.equal(hiddenTwitchDecision.authorization.publicNavigationAuthorized, false)
assert.equal(hiddenTwitchDecision.dataContract.defaultSelection, 'all')
assert.equal(hiddenTwitchDecision.dataContract.filterBeforeTopN, true)
assert.deepEqual(hiddenTwitchDecision.dataContract.topNOptions, [20, 50, 100])
assert.equal(hiddenTwitchDecision.publicGate.earliestAuditAt, '2026-07-27T11:40:00.000Z')
assert.equal(Object.values(hiddenTwitchDecision.boundaries).every((value) => value === false), true)

assert.equal(twitchAcceptance.status, 'accepted')
assert.equal(twitchAcceptance.data.observedCategoryRows, 291)
assert.equal(twitchAcceptance.data.providerLeakageRows, 0)
assert.equal(twitchAcceptance.data.collectorErrorRunsSinceStart, 0)
assert.equal(twitchAcceptance.warningExtensionRequired, false)
assert.equal(twitchAcceptance.rollbackRequired, false)

for (const path of [files.kickDecision, files.hiddenTwitchDecision, files.activeWip]) {
  assert.ok(workflow.includes(`'${path}'`), `policy workflow missing path: ${path}`)
}

const normalTwitch = read(files.normalTwitch)
const permanentTwitch = read(files.permanentTwitch)
const normalKick = read(files.normalKick)
const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null

assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalTwitch), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanentTwitch), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalKick), false)
assert.equal(cron(normalTwitch), '*/5 * * * *')
assert.equal(cron(permanentTwitch), cron(normalTwitch))
assert.equal(cron(normalKick), '*/5 * * * *')
assert.equal(toml(permanentTwitch, 'database_id'), toml(normalTwitch, 'database_id'))
assert.notEqual(toml(normalTwitch, 'database_id'), toml(normalKick, 'database_id'))

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  parentTrackingIssue: 623,
  kickTrackingIssue: 634,
  twitchHiddenUiTrackingIssue: 635,
  twitchRuntimeActive: true,
  kickImplementationAuthorized: true,
  kickRuntimeActive: false,
  hiddenTwitchFilterAuthorized: true,
  publicTwitchFilterAuthorized: false,
  earliestPublicAuditAt: '2026-07-27T11:40:00.000Z',
  newWorkerCronAdded: false,
  nextAction: 'kick-preflight-and-hidden-twitch-filter-package',
}, null, 2))