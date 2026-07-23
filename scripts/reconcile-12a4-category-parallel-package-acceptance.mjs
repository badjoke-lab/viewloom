import assert from 'node:assert/strict'
import fs from 'node:fs'

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'))

if (gate.schemaVersion === 'viewloom-12a2-current-gate-state-v29') {
  console.log('canonical gate already reconciled')
  process.exit(0)
}

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v28')
assert.equal(gate.status, '12a4_kick_permanent_rollout_and_hidden_twitch_filter_authorized')
assert.equal(gate.currentWorkstream.phase, '12A-4-24')
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterHiddenImplementationAuthorized, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)

gate.schemaVersion = 'viewloom-12a2-current-gate-state-v29'
gate.status = '12a4_parallel_implementation_packages_accepted'

gate.categoryCapture.kickPermanentPackageAccepted = true
gate.categoryCapture.kickPermanentRuntimeCaptureActive = false
gate.categoryCapture.twitchHeatmapCategoryApiPackageAccepted = true
gate.categoryCapture.twitchHeatmapCategoryHiddenControlsAccepted = false
gate.categoryCapture.twitchHeatmapCategoryFilterPublicExposureAuthorized = false

gate.closedBlockers = [...new Set([
  ...gate.closedBlockers,
  'kick_permanent_category_capture_not_implemented',
])]
gate.openBlockers = [
  'kick_permanent_category_capture_release_package_not_accepted',
  'kick_permanent_category_capture_not_deployed',
  'kick_permanent_category_capture_observation_not_accepted',
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_hidden_controls_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
]

Object.assign(gate.currentWorkstream, {
  phase: '12A-4-24',
  name: 'Parallel implementation packages accepted; Kick release and hidden Twitch controls next',
  kickPermanentPackageAccepted: true,
  kickPermanentCaptureActive: false,
  kickReleasePackageAccepted: false,
  twitchHeatmapCategoryApiPackageAccepted: true,
  twitchHeatmapCategoryHiddenControlsAccepted: false,
  twitchHeatmapCategoryFilterPublicExposureAuthorized: false,
  exactKickTriggerCurrent: false,
  exactReleaseTriggerCurrent: false,
})

gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.packageAccepted = true
gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.packagePr = 637
gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.packageMergeSha = 'b4012ebddb9ec33c50b6298c882f0f1a4ee16be0'
gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.runtimeActive = false
gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.apiPackageAccepted = true
gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.apiPackagePr = 638
gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.apiPackageMergeSha = '5b466e3e440324bbd6b19d60aa3acaed0d1d95e8'
gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.hiddenControlsAccepted = false
gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.publicExposureAuthorized = false

gate.categoryParallelPackageAcceptance = {
  status: 'accepted',
  phase: '12A-4-24',
  parentTrackingIssue: 623,
  kick: {
    trackingIssue: 634,
    contract: 'docs/audits/12a4-kick-permanent-category-capture-package-contract.json',
    packagePr: 637,
    packageCandidateHeadSha: 'dc32533a02eca6586202a995d37ea0cddd2a4688',
    packageMergeSha: 'b4012ebddb9ec33c50b6298c882f0f1a4ee16be0',
    workflowRunId: 30003489805,
    workflowJobId: 89193908765,
    packageAccepted: true,
    runtimeActive: false,
    productionWorkerPublished: false,
    remoteD1OperationPerformed: false,
    twitchChanged: false,
  },
  twitchHiddenApi: {
    trackingIssue: 635,
    contract: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json',
    packagePr: 638,
    packageCandidateHeadSha: '1bf0ca4e8c26a26084e574db381606ea11ee9934',
    packageMergeSha: '5b466e3e440324bbd6b19d60aa3acaed0d1d95e8',
    workflowRunId: 30003251337,
    workflowJobId: 89193154092,
    apiPackageAccepted: true,
    hiddenControlsAccepted: false,
    publicExposureAuthorized: false,
    collectorChanged: false,
    kickChanged: false,
  },
}

gate.nextWorkstream = 'prepare the Kick release package and fresh preflight while implementing hidden Twitch Heatmap category controls; public Twitch exposure remains blocked until the seven-day audit and separate cutover PR'

fs.writeFileSync(gatePath, `${JSON.stringify(gate, null, 2)}\n`)
console.log('advanced canonical gate to v29 / parallel package acceptance')