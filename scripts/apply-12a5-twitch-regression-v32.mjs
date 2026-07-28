import fs from 'node:fs'

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const policyPath = 'scripts/verify-category-rollout-policy.mjs'
const deployVerifierPath = 'scripts/verify-12a2-collector-worker-deploy.mjs'

const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'))
if (gate.schemaVersion !== 'viewloom-12a2-current-gate-state-v31') throw new Error(`unexpected_gate_schema:${gate.schemaVersion}`)
if (gate.status !== '12a4_kick_permanent_category_capture_accepted') throw new Error(`unexpected_gate_status:${gate.status}`)

const unique = (values) => [...new Set(values)]
gate.schemaVersion = 'viewloom-12a2-current-gate-state-v32'
gate.status = '12a5_twitch_permanent_category_capture_regressed_recovery_required'
gate.categoryCapture.twitchPermanentRuntimeCaptureActive = false
gate.categoryCapture.twitchStableAccumulationStartAt = null
gate.categoryCapture.twitchStableAccumulationEarliestAuditAt = null
gate.categoryCapture.categoryUiAuthorized = false
gate.categoryCapture.categoryUiPublicExposureAuthorized = false
gate.categoryCapture.twitchHeatmapCategoryFilterPublicExposureAuthorized = false
gate.closedBlockers = gate.closedBlockers.filter((value) => value !== 'twitch_permanent_category_capture_regression_not_recovered')
gate.openBlockers = [
  'twitch_permanent_category_capture_regression_not_recovered',
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
]
gate.currentWorkstream.phase = '12A-5B-R1'
gate.currentWorkstream.name = 'Twitch permanent category capture regressed; guarded recovery required'
gate.currentWorkstream.twitchPermanentCaptureActive = false
gate.currentWorkstream.twitchRecoveryRequired = true
gate.currentWorkstream.twitchRecoveryTrackingIssue = 652
gate.currentWorkstream.twitchStableAccumulationResetRequired = true
gate.currentWorkstream.publicCategoryUiEarliestAuditAt = null
gate.currentWorkstream.observationActive = false
gate.currentWorkstream.observationScheduleCurrent = false
gate.currentWorkstream.warningExtensionRequired = false
gate.currentWorkstream.rollbackRequired = false
gate.nextWorkstream = 'accept the provider-scoped collector deployment fix and dormant Twitch recovery package, then use a separate exact trigger to restore Twitch permanent category capture and restart the seven-day clock'
if (gate.categoryParallelExecutionDecision?.tracks?.twitchHeatmapCategoryFilter) {
  gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.earliestAccumulationAuditAt = null
  gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.publicExposureAuthorized = false
  gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.recoveryRequired = true
}
gate.twitchPermanentCategoryRegression = {
  status: 'confirmed_recovery_required',
  trackingIssue: 652,
  auditIssue: 650,
  auditPr: 651,
  evidence: 'docs/audits/12a5-twitch-seven-day-accumulation-audit-rejection.json',
  auditRunId: 30356480145,
  auditJobId: 90265761664,
  auditArtifactId: 8687010041,
  diagnosticRunId: 30357344189,
  diagnosticJobId: 90268510286,
  diagnosticArtifactId: 8687336938,
  sourcePr: 637,
  sourceCommit: 'b4012ebddb9ec33c50b6298c882f0f1a4ee16be0',
  deploymentWorkflowRunId: 30003576549,
  deploymentJobId: 89194219805,
  cloudflareModifiedAt: '2026-07-23T11:33:53.256999Z',
  lastCategorySnapshotAt: '2026-07-23T11:35:00.000Z',
  firstNormalSnapshotAt: '2026-07-23T11:40:00.000Z',
  originalSevenDayClockValid: false,
  providerLeakageRows: 0,
  publicExposureAuthorized: false,
  kickChanged: false,
}
gate.categoryCapture.closedRegressionCauses = unique([
  ...(gate.categoryCapture.closedRegressionCauses ?? []),
  'provider_unscoped_collector_deployment_planning',
])
fs.writeFileSync(gatePath, `${JSON.stringify(gate, null, 2)}\n`)

let policy = fs.readFileSync(policyPath, 'utf8')
const replace = (before, after) => {
  if (!policy.includes(before)) throw new Error(`policy_fragment_missing:${before.slice(0, 80)}`)
  policy = policy.replace(before, after)
}
replace("  gate: 'docs/audits/12a2-current-gate-state.json',", "  gate: 'docs/audits/12a2-current-gate-state.json',\n  deployContract: 'docs/audits/12a2-collector-worker-deploy-contract.json',\n  twitchAuditRejection: 'docs/audits/12a5-twitch-seven-day-accumulation-audit-rejection.json',\n  twitchRecovery: 'docs/audits/12a5-twitch-permanent-category-recovery-contract.json',")
replace('const gate = json(files.gate)', "const gate = json(files.gate)\nconst deployContract = json(files.deployContract)\nconst twitchAuditRejection = json(files.twitchAuditRejection)\nconst twitchRecovery = json(files.twitchRecovery)")
replace("  'The earliest Twitch seven-day audit boundary is `2026-07-27T11:40:00Z`',", "  'The first Twitch seven-day audit was executed read-only in PR #651',\n  'Twitch permanent category capture is **not currently active**',")
replace("  'Canonical target 12A-4-24 Kick accepted; Twitch seven-day audit next',", "  'Canonical target 12A-5B-R1 Twitch permanent-category recovery',\n  'Twitch permanent category capture active no',\n  'Original Twitch seven-day clock valid no',")
replace("  'The seven-day boundary blocks public exposure only',", "  'Deploy only `workers/collector-twitch/wrangler.category-permanent.toml`.',")
replace("  '# 12A-4-24 category parallel execution',", "  '# 12A-5B-R1 Twitch permanent-category recovery',")
replace("  'Dormant release package PR: #641.',", "  '## Confirmed root cause',")
replace("  'Run the seven-day accumulation audit at or after `2026-07-27T11:40:00.000Z`',", "  'The original seven-day stability clock is invalid',")
replace("assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v31')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v32')")
replace("assert.equal(gate.status, '12a4_kick_permanent_category_capture_accepted')", "assert.equal(gate.status, '12a5_twitch_permanent_category_capture_regressed_recovery_required')")
replace("assert.equal(gate.currentWorkstream.phase, '12A-4-24')", "assert.equal(gate.currentWorkstream.phase, '12A-5B-R1')")
replace('assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)', 'assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)')
replace("assert.equal(gate.currentWorkstream.publicCategoryUiEarliestAuditAt, '2026-07-27T11:40:00.000Z')", 'assert.equal(gate.currentWorkstream.publicCategoryUiEarliestAuditAt, null)')
replace('assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)', 'assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, false)')
replace("assert.deepEqual(gate.openBlockers, [\n  'twitch_category_ui_seven_day_accumulation_not_accepted',\n  'twitch_heatmap_category_filter_public_exposure_not_authorized',\n])", "assert.deepEqual(gate.openBlockers, [\n  'twitch_permanent_category_capture_regression_not_recovered',\n  'twitch_category_ui_seven_day_accumulation_not_accepted',\n  'twitch_heatmap_category_filter_public_exposure_not_authorized',\n])\nassert.equal(gate.currentWorkstream.twitchRecoveryRequired, true)\nassert.equal(gate.currentWorkstream.twitchRecoveryTrackingIssue, 652)\nassert.equal(gate.currentWorkstream.twitchStableAccumulationResetRequired, true)\nassert.equal(gate.twitchPermanentCategoryRegression.status, 'confirmed_recovery_required')\nassert.equal(gate.twitchPermanentCategoryRegression.deploymentWorkflowRunId, 30003576549)\nassert.equal(gate.twitchPermanentCategoryRegression.deploymentJobId, 89194219805)\nassert.equal(gate.twitchPermanentCategoryRegression.originalSevenDayClockValid, false)\nassert.equal(gate.twitchPermanentCategoryRegression.publicExposureAuthorized, false)\nassert.equal(deployContract.schemaVersion, 'viewloom-12a2-collector-worker-deploy-contract-v3')\nassert.equal(deployContract.planning.kickChangeDeploysTwitch, false)\nassert.equal(twitchAuditRejection.status, 'rejected_production_regression')\nassert.equal(twitchAuditRejection.decision.publicCutoverAuthorized, false)\nassert.ok(['ready_for_dormant_package_validation', 'accepted'].includes(twitchRecovery.status))\nassert.equal(twitchRecovery.trackingIssue, 652)")
replace("for (const path of [files.kickDecision, files.kickPackage, files.kickRelease, files.kickObservation, files.kickFinalAcceptance, files.hiddenTwitchDecision, files.hiddenTwitchPackage, files.hiddenTwitchControls, files.activeWip])", "for (const path of [files.deployContract, files.twitchAuditRejection, files.twitchRecovery, files.kickDecision, files.kickPackage, files.kickRelease, files.kickObservation, files.kickFinalAcceptance, files.hiddenTwitchDecision, files.hiddenTwitchPackage, files.hiddenTwitchControls, files.activeWip])")
replace('  twitchRuntimeActive: true,', '  twitchRuntimeActive: false,\n  twitchRecoveryRequired: true,')
replace("  earliestPublicAuditAt: '2026-07-27T11:40:00.000Z',", '  earliestPublicAuditAt: null,')
replace("  nextAction: 'twitch-seven-day-audit',", "  nextAction: 'twitch-permanent-category-recovery',")
fs.writeFileSync(policyPath, policy)

let deployVerifier = fs.readFileSync(deployVerifierPath, 'utf8')
const deployReplace = (before, after) => {
  if (!deployVerifier.includes(before)) throw new Error(`deploy_verifier_fragment_missing:${before}`)
  deployVerifier = deployVerifier.replace(before, after)
}
deployReplace('assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)', 'assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, false)')
deployReplace("assert.ok(manualValues.includes('twitch_config=workers/collector-twitch/wrangler.category-permanent.toml'))", "assert.ok(manualValues.includes('twitch_config=workers/collector-twitch/wrangler.toml'))")
deployReplace("  twitchActiveConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',", "  twitchCanonicalConfig: 'workers/collector-twitch/wrangler.toml',")
fs.writeFileSync(deployVerifierPath, deployVerifier)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: gate.schemaVersion,
  status: gate.status,
  phase: gate.currentWorkstream.phase,
  twitchRuntimeActive: gate.categoryCapture.twitchPermanentRuntimeCaptureActive,
  recoveryIssue: gate.currentWorkstream.twitchRecoveryTrackingIssue,
  publicExposureAuthorized: gate.categoryCapture.twitchHeatmapCategoryFilterPublicExposureAuthorized,
}, null, 2))
