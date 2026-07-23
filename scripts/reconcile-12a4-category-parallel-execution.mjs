import assert from 'node:assert/strict'
import fs from 'node:fs'

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'))

if (gate.schemaVersion === 'viewloom-12a2-current-gate-state-v28') {
  console.log('canonical gate already reconciled')
  process.exit(0)
}

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v27')
assert.equal(gate.status, '12a4_twitch_permanent_category_capture_accepted')
assert.equal(gate.currentWorkstream.phase, '12A-4-23')
assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryUiAuthorized, false)

gate.schemaVersion = 'viewloom-12a2-current-gate-state-v28'
gate.status = '12a4_kick_permanent_rollout_and_hidden_twitch_filter_authorized'

gate.categoryCapture.authorizationScope = 'parallel_kick_rollout_and_hidden_twitch_filter'
gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized = true
gate.categoryCapture.kickPermanentRuntimeCaptureActive = false
gate.categoryCapture.categoryUiAuthorized = false
gate.categoryCapture.categoryUiImplementationAuthorized = true
gate.categoryCapture.categoryUiPublicExposureAuthorized = false
gate.categoryCapture.twitchHeatmapCategoryFilterHiddenImplementationAuthorized = true
gate.categoryCapture.twitchHeatmapCategoryFilterPublicExposureAuthorized = false
gate.categoryCapture.twitchStableAccumulationStartAt = '2026-07-20T11:40:00.000Z'
gate.categoryCapture.twitchStableAccumulationEarliestAuditAt = '2026-07-27T11:40:00.000Z'

gate.closedBlockers = [...new Set([
  ...gate.closedBlockers,
  'kick_permanent_category_capture_not_authorized',
])]
gate.openBlockers = [
  'kick_permanent_category_capture_not_implemented',
  'kick_permanent_category_capture_not_deployed',
  'kick_permanent_category_capture_observation_not_accepted',
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_hidden_implementation_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
]

Object.assign(gate.currentWorkstream, {
  phase: '12A-4-24',
  name: 'Kick permanent rollout and hidden Twitch Heatmap category filter in parallel',
  trackingIssue: 623,
  kickTrackingIssue: 634,
  twitchHiddenUiTrackingIssue: 635,
  authorizationScope: 'parallel_kick_rollout_and_hidden_twitch_filter',
  kickPermanentCaptureAuthorized: true,
  kickPermanentCaptureActive: false,
  categoryUiAuthorized: false,
  categoryUiImplementationAuthorized: true,
  categoryUiPublicExposureAuthorized: false,
  twitchHeatmapCategoryFilterHiddenImplementationAuthorized: true,
  twitchHeatmapCategoryFilterPublicExposureAuthorized: false,
  publicCategoryUiEarliestAuditAt: '2026-07-27T11:40:00.000Z',
  observationActive: false,
  observationScheduleCurrent: false,
  exactKickTriggerCurrent: false,
  exactReleaseTriggerCurrent: false,
})

gate.nextWorkstream = 'run Kick preflight and implementation package while building the hidden Twitch Heatmap category filter; public Twitch exposure waits for the seven-day audit and a separate cutover PR'

gate.categoryParallelExecutionDecision = {
  status: 'accepted',
  parentTrackingIssue: 623,
  phase: '12A-4-24',
  activeWip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  tracks: {
    kickPermanentCapture: {
      trackingIssue: 634,
      implementationAuthorized: true,
      runtimeActive: false,
      freshReadOnlyPreflightRequired: true,
      exactReleaseTriggerRequired: true,
      minimumObservationHours: 24,
      warningObservationHours: 48,
      automaticRollbackRequired: true,
    },
    twitchHeatmapCategoryFilter: {
      trackingIssue: 635,
      hiddenImplementationAuthorized: true,
      publicExposureAuthorized: false,
      hiddenFeatureFlagOrNonPublicRouteRequired: true,
      earliestAccumulationAuditAt: '2026-07-27T11:40:00.000Z',
      separatePublicCutoverPrRequired: true,
    },
  },
  boundaries: {
    existingFiveMinuteCronPreserved: true,
    newWorkerCronAuthorized: false,
    backfillAuthorized: false,
    retentionExpansionAuthorized: false,
    crossProviderIdentityAuthorized: false,
    crossProviderTotalsAuthorized: false,
    crossProviderRankingsAuthorized: false,
  },
}

gate.kickPermanentCategoryDecision = {
  status: 'accepted_for_guarded_implementation',
  trackingIssue: 634,
  contract: 'docs/audits/12a4-kick-permanent-category-decision-contract.json',
  implementationAuthorized: true,
  runtimeActive: false,
  productionDeploymentFromImplementationPrAuthorized: false,
  freshReadOnlyPreflightRequired: true,
  separateExactReleaseTriggerRequired: true,
  minimumObservationHours: 24,
  warningObservationHours: 48,
  twitchChangeAuthorized: false,
}

gate.twitchHeatmapCategoryFilterHiddenDecision = {
  status: 'accepted_hidden_implementation_only',
  trackingIssue: 635,
  contract: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  hiddenImplementationAuthorized: true,
  publicExposureAuthorized: false,
  earliestAccumulationAuditAt: '2026-07-27T11:40:00.000Z',
  separatePublicCutoverPrRequired: true,
  collectorChangeAuthorized: false,
  kickChangeAuthorized: false,
}

fs.writeFileSync(gatePath, `${JSON.stringify(gate, null, 2)}\n`)
console.log('advanced canonical gate to v28 / 12A-4-24')