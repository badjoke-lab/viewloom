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
  kickPackage: 'docs/audits/12a4-kick-permanent-category-capture-package-contract.json',
  hiddenTwitchDecision: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  hiddenTwitchPackage: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json',
  policyWorkflow: '.github/workflows/category-rollout-policy.yml',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
  permanentTwitch: 'workers/collector-twitch/wrangler.category-permanent.toml',
  normalKick: 'workers/collector-kick/wrangler.toml',
  permanentKick: 'workers/collector-kick/wrangler.category-permanent.toml',
}

for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)

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
const kickPackage = json(files.kickPackage)
const hiddenTwitchDecision = json(files.hiddenTwitchDecision)
const hiddenTwitchPackage = json(files.hiddenTwitchPackage)

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
  '12A-4-24A Kick permanent-category implementation package accepted in PR #637.',
  '12A-5A hidden Twitch Heatmap category API package accepted in PR #638.',
  'Prepare and accept a dormant release package',
  'Implement hidden or feature-flagged category controls',
  'The earliest Twitch seven-day audit boundary is `2026-07-27T11:40:00Z`',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)

for (const fragment of [
  'Canonical target 12A-4-24 parallel execution',
  'Kick permanent implementation package accepted yes',
  'Kick permanent release package accepted no',
  'Twitch Heatmap hidden category API package accepted yes',
  'Twitch Heatmap hidden control package accepted no',
  'Twitch Heatmap public category-filter exposure authorized no',
  'The seven-day boundary blocks public exposure only',
]) assert.ok(schedule.includes(fragment), `schedule missing: ${fragment}`)

for (const fragment of [
  '# 12A-4-24 category parallel execution',
  'Implementation package PR: #637.',
  'Hidden API package PR: #638.',
  'Earliest audit: `2026-07-27T11:40:00.000Z`',
]) assert.ok(activeWip.includes(fragment), `active WIP missing: ${fragment}`)
assert.ok(historicalWip.includes('Status: completed historical work record'))
assert.ok(historicalWip.includes('Superseded as active WIP by'))

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v29')
assert.equal(gate.status, '12a4_parallel_implementation_packages_accepted')
assert.equal(gate.currentWorkstream.phase, '12A-4-24')
assert.equal(gate.currentWorkstream.trackingIssue, 623)
assert.equal(gate.currentWorkstream.kickTrackingIssue, 634)
assert.equal(gate.currentWorkstream.twitchHiddenUiTrackingIssue, 635)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.kickPermanentPackageAccepted, true)
assert.equal(gate.currentWorkstream.kickReleasePackageAccepted, false)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterHiddenImplementationAuthorized, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryApiPackageAccepted, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryHiddenControlsAccepted, false)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.publicCategoryUiEarliestAuditAt, '2026-07-27T11:40:00.000Z')
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.observationActive, false)
assert.equal(gate.currentWorkstream.observationScheduleCurrent, false)

assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, false)
assert.equal(gate.categoryCapture.kickPermanentPackageAccepted, true)
assert.equal(gate.categoryCapture.twitchHeatmapCategoryApiPackageAccepted, true)
assert.equal(gate.categoryCapture.twitchHeatmapCategoryHiddenControlsAccepted, false)
assert.equal(gate.categoryCapture.categoryUiAuthorized, false)
assert.equal(gate.categoryCapture.categoryUiImplementationAuthorized, true)
assert.equal(gate.categoryCapture.categoryUiPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.ok(gate.closedBlockers.includes('kick_permanent_category_capture_not_authorized'))
assert.ok(gate.closedBlockers.includes('kick_permanent_category_capture_not_implemented'))
assert.deepEqual(gate.openBlockers, [
  'kick_permanent_category_capture_release_package_not_accepted',
  'kick_permanent_category_capture_not_deployed',
  'kick_permanent_category_capture_observation_not_accepted',
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_hidden_controls_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
])

assert.equal(gate.categoryParallelExecutionDecision.status, 'accepted')
assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.packageAccepted, true)
assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.packagePr, 637)
assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.runtimeActive, false)
assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.apiPackageAccepted, true)
assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.apiPackagePr, 638)
assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.hiddenControlsAccepted, false)
assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.publicExposureAuthorized, false)
assert.equal(gate.categoryParallelExecutionDecision.boundaries.newWorkerCronAuthorized, false)
assert.equal(gate.categoryParallelExecutionDecision.boundaries.backfillAuthorized, false)
assert.equal(gate.categoryParallelExecutionDecision.boundaries.retentionExpansionAuthorized, false)

assert.equal(gate.categoryParallelPackageAcceptance.status, 'accepted')
assert.equal(gate.categoryParallelPackageAcceptance.kick.packagePr, 637)
assert.equal(gate.categoryParallelPackageAcceptance.kick.workflowRunId, 30003489805)
assert.equal(gate.categoryParallelPackageAcceptance.kick.runtimeActive, false)
assert.equal(gate.categoryParallelPackageAcceptance.kick.twitchChanged, false)
assert.equal(gate.categoryParallelPackageAcceptance.twitchHiddenApi.packagePr, 638)
assert.equal(gate.categoryParallelPackageAcceptance.twitchHiddenApi.workflowRunId, 30003251337)
assert.equal(gate.categoryParallelPackageAcceptance.twitchHiddenApi.hiddenControlsAccepted, false)
assert.equal(gate.categoryParallelPackageAcceptance.twitchHiddenApi.publicExposureAuthorized, false)

assert.equal(kickDecision.status, 'accepted_for_guarded_implementation')
assert.equal(kickDecision.decision.implementationAuthorized, true)
assert.equal(kickDecision.decision.runtimeActive, false)
assert.equal(kickDecision.decision.freshReadOnlyPreflightRequired, true)
assert.equal(kickDecision.decision.separateExactReleaseTriggerRequired, true)
assert.equal(kickDecision.runtime.existingCron, '*/5 * * * *')
assert.equal(Object.values(kickDecision.boundaries).every((value) => value === false), true)

assert.equal(kickPackage.status, 'accepted')
assert.equal(kickPackage.acceptance.packagePr, 637)
assert.equal(kickPackage.acceptance.packageMergeSha, 'b4012ebddb9ec33c50b6298c882f0f1a4ee16be0')
assert.equal(kickPackage.acceptance.workflowRunId, 30003489805)
assert.equal(kickPackage.acceptance.workflowJobId, 89193908765)
assert.equal(kickPackage.acceptance.productionRuntimeCaptureStarted, false)
assert.equal(kickPackage.acceptance.twitchChanged, false)

assert.equal(hiddenTwitchDecision.status, 'accepted_hidden_implementation_only')
assert.equal(hiddenTwitchDecision.authorization.hiddenImplementationAuthorized, true)
assert.equal(hiddenTwitchDecision.authorization.publicExposureAuthorized, false)
assert.equal(hiddenTwitchDecision.publicGate.earliestAuditAt, '2026-07-27T11:40:00.000Z')
assert.equal(Object.values(hiddenTwitchDecision.boundaries).every((value) => value === false), true)

assert.equal(hiddenTwitchPackage.status, 'accepted')
assert.equal(hiddenTwitchPackage.acceptance.packagePr, 638)
assert.equal(hiddenTwitchPackage.acceptance.packageMergeSha, '5b466e3e440324bbd6b19d60aa3acaed0d1d95e8')
assert.equal(hiddenTwitchPackage.acceptance.workflowRunId, 30003251337)
assert.equal(hiddenTwitchPackage.acceptance.workflowJobId, 89193154092)
assert.equal(hiddenTwitchPackage.acceptance.publicExposureEnabled, false)
assert.equal(hiddenTwitchPackage.acceptance.collectorChanged, false)
assert.equal(hiddenTwitchPackage.acceptance.kickChanged, false)

assert.equal(twitchAcceptance.status, 'accepted')
assert.equal(twitchAcceptance.data.observedCategoryRows, 291)
assert.equal(twitchAcceptance.data.providerLeakageRows, 0)
assert.equal(twitchAcceptance.data.collectorErrorRunsSinceStart, 0)
assert.equal(twitchAcceptance.warningExtensionRequired, false)
assert.equal(twitchAcceptance.rollbackRequired, false)

for (const path of [files.kickDecision, files.kickPackage, files.hiddenTwitchDecision, files.hiddenTwitchPackage, files.activeWip]) {
  assert.ok(workflow.includes(`'${path}'`), `policy workflow missing path: ${path}`)
}

const normalTwitch = read(files.normalTwitch)
const permanentTwitch = read(files.permanentTwitch)
const normalKick = read(files.normalKick)
const permanentKick = read(files.permanentKick)
const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null

assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalTwitch), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanentTwitch), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalKick), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanentKick), true)
assert.equal(cron(normalTwitch), '*/5 * * * *')
assert.equal(cron(permanentTwitch), cron(normalTwitch))
assert.equal(cron(normalKick), '*/5 * * * *')
assert.equal(cron(permanentKick), cron(normalKick))
assert.equal(toml(permanentTwitch, 'database_id'), toml(normalTwitch, 'database_id'))
assert.equal(toml(permanentKick, 'database_id'), toml(normalKick, 'database_id'))
assert.notEqual(toml(normalTwitch, 'database_id'), toml(normalKick, 'database_id'))

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  parentTrackingIssue: 623,
  kickTrackingIssue: 634,
  twitchHiddenUiTrackingIssue: 635,
  twitchRuntimeActive: true,
  kickPackageAccepted: true,
  kickRuntimeActive: false,
  twitchHiddenApiPackageAccepted: true,
  twitchHiddenControlsAccepted: false,
  publicTwitchFilterAuthorized: false,
  earliestPublicAuditAt: '2026-07-27T11:40:00.000Z',
  newWorkerCronAdded: false,
  nextAction: 'kick-release-preflight-and-hidden-twitch-controls',
}, null, 2))