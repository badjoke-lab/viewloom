import assert from 'node:assert/strict'
import fs from 'node:fs'

const path = 'docs/audits/12a2-current-gate-state.json'
const gate = JSON.parse(fs.readFileSync(path, 'utf8'))
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v22')
assert.equal(gate.status, '12a4_provider_canaries_accepted_and_retired')

gate.schemaVersion = 'viewloom-12a2-current-gate-state-v23'
gate.status = '12a4_twitch_permanent_category_capture_authorized_pending_implementation'
gate.permanentCategoryCaptureRolloutDecision = {
  status: 'accepted',
  trackingIssue: 623,
  decisionPr: 624,
  specification: 'docs/product/category-capture-permanent-rollout-spec.md',
  implementationPlan: 'docs/product/category-capture-permanent-rollout-plan.md',
  activeWip: 'docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md',
  authorizationScope: 'twitch_only',
  twitchPermanentCaptureAuthorized: true,
  twitchRuntimeCaptureActive: false,
  kickPermanentCaptureAuthorized: false,
  kickAutomaticStartAuthorized: false,
  existingCollectorCronRequired: '*/5 * * * *',
  newWorkerCronAuthorized: false,
  backfillAuthorized: false,
  retentionExpansionAuthorized: false,
  categoryUiAuthorized: false,
  crossProviderIdentityAllowed: false,
  combinedProviderRankingAllowed: false,
  freshReadOnlyPreflightRequired: true,
  twitchMinimumObservationHours: 24,
  twitchWarningObservationHours: 48,
  stableAccumulationDaysBeforeUi: 7,
  rollbackRequiredOnHardStop: true
}
Object.assign(gate.categoryCapture, {
  runtimeCaptureAuthorized: true,
  runtimeCaptureStarted: false,
  categoryCaptureFlagPresent: false,
  authorizationScope: 'twitch_only',
  twitchPermanentRuntimeCaptureAuthorized: true,
  twitchPermanentRuntimeCaptureActive: false,
  kickPermanentRuntimeCaptureAuthorized: false,
  kickPermanentRuntimeCaptureActive: false,
  newCronAuthorized: false,
  backfillAuthorized: false,
  retentionExpansionAuthorized: false,
  categoryUiAuthorized: false
})
gate.closedBlockers = [...new Set([...gate.closedBlockers, 'runtime_category_capture_not_authorized'])]
gate.openBlockers = [
  'twitch_permanent_category_capture_not_implemented',
  'twitch_permanent_category_capture_not_deployed',
  'twitch_permanent_category_capture_observation_not_accepted',
  'kick_permanent_category_capture_not_authorized'
]
gate.currentWorkstream = {
  ...gate.currentWorkstream,
  phase: '12A-4-19',
  name: 'Twitch permanent category capture authorized; implementation pending',
  trackingIssue: 623,
  decisionPr: 624,
  implementationSpecAccepted: true,
  implementationPlanAccepted: true,
  productionExecutionIncluded: false,
  runtimeCaptureStarted: false,
  runtimeCaptureAuthorized: true,
  authorizationScope: 'twitch_only',
  twitchPermanentCaptureAuthorized: true,
  twitchPermanentCaptureActive: false,
  kickPermanentCaptureAuthorized: false,
  existingFiveMinuteCronPreserved: true,
  freshReadOnlyPreflightRequired: true,
  minimumObservationHours: 24,
  warningObservationHours: 48,
  stableAccumulationDaysBeforeUi: 7,
  categoryUiAuthorized: false,
  finalRollbackPending: false,
  crossProviderAnalyticsAllowed: false
}
gate.nextWorkstream = 'prepare the Twitch-only permanent category capture implementation package with tests, rollback configuration, fresh read-only preflight, and temporary observation tooling; do not deploy from the implementation PR and do not change Kick'
fs.writeFileSync(path, `${JSON.stringify(gate, null, 2)}\n`)
