import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a9-kick-day-flow-category-public-production-evidence.json'
const acceptancePath = 'docs/audits/12a9-kick-day-flow-category-public-production-acceptance.json'
const oneShotWorkflow = '.github/workflows/analytics-12a9-kick-day-flow-category-public-cutover.yml'
const publicApiPath = 'apps/web/functions/api/kick-day-flow.ts'
const controlsPath = 'apps/web/src/live/day-flow-category-preview-entry.ts'
const hiddenVerifierPath = 'scripts/verify-12a9-kick-day-flow-category-candidate.mjs'
const decisionPath = 'docs/audits/12a9-kick-day-flow-category-public-cutover-decision.json'

for (const path of [evidencePath, acceptancePath, publicApiPath, controlsPath, hiddenVerifierPath, decisionPath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(oneShotWorkflow), false, `${oneShotWorkflow}: consumed one-shot workflow must be retired`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const decision = json(decisionPath)
const api = read(publicApiPath)
const controls = read(controlsPath)
const hiddenVerifier = read(hiddenVerifierPath)

assert.equal(sha256(evidencePath), '6a53bc704769ae0d4c5efeef601555cac1b50ca8494308be9558d8f4f7bbc15e')
assert.equal(evidence.schemaVersion, 'viewloom-12a9-kick-day-flow-category-public-production-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.equal(evidence.expectedProductionSha, '851f7a56ea24a5375feb091ec16399e0406f1638')
assert.equal(evidence.validationDate, '2026-08-10')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicKickDayFlowCategoryUiActive, true)
assert.equal(evidence.twitchPublicBoundaryPreserved, true)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.deployment.schema, 'viewloom-deployment-v1')
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.deployment.commit_sha, evidence.expectedProductionSha)
assert.equal(evidence.deployment.pages_url, 'https://e86c0c11.viewloom.pages.dev')
assert.equal(evidence.deployment.primary_origin, 'https://www.viewloom.net')
assert.equal(evidence.deployment.canonical_host, 'www.viewloom.net')
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: production scenario must pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const desktop = byName.get('kick-public-fixed-day-desktop')
const mobile = byName.get('kick-public-fixed-day-mobile')
const legacy = byName.get('kick-public-legacy-preview-compatibility')
const unknown = byName.get('kick-public-unknown-category')
const twitch = byName.get('twitch-public-isolation')
for (const scenario of [desktop, mobile, legacy, unknown, twitch]) assert.ok(scenario)

assert.equal(desktop.viewport.width, 1440)
assert.equal(desktop.checks.categoryOptions, 127)
assert.equal(desktop.checks.selectedCategory, '15')
assert.equal(desktop.checks.selectedBandCount, 21)
assert.equal(desktop.checks.globalTotalsPreserved, true)
assert.equal(desktop.checks.toolbarOverlapCount, 0)
assert.equal(desktop.checks.pageGeometry.width, 1440)
assert.equal(desktop.checks.pageGeometry.scrollWidth, 1440)
assert.equal(desktop.checks.pageGeometry.overflow, false)
assert.equal(desktop.checks.topDefault, 20)
assert.equal(desktop.checks.bucketDefault, 5)
assert.equal(desktop.requests.length, 2)
assert.equal(new URL(desktop.requests[0]).pathname, '/api/kick-day-flow')
assert.equal(new URL(desktop.requests[0]).searchParams.get('category'), 'all')
assert.equal(new URL(desktop.requests[1]).searchParams.get('category'), '15')

assert.equal(mobile.viewport.width, 390)
assert.equal(mobile.checks.box.width, 362)
assert.equal(mobile.checks.pageGeometry.width, 390)
assert.equal(mobile.checks.pageGeometry.scrollWidth, 390)
assert.equal(mobile.checks.pageGeometry.overflow, false)
assert.equal(mobile.requests.length, 1)
assert.equal(new URL(mobile.requests[0]).pathname, '/api/kick-day-flow')
assert.equal(new URL(mobile.requests[0]).searchParams.get('category'), 'all')

assert.equal(legacy.checks.legacyParameterRemoved, true)
assert.equal(legacy.checks.selectedCategory, '15')
assert.equal(legacy.requests.length, 2)

assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.overallState, 'live')
assert.equal(unknown.checks.selectedBandCount, 0)
assert.equal(unknown.checks.globalOthersCount, 1)
assert.equal(unknown.checks.chartRendered, true)
assert.equal(unknown.checks.falseNoObservedCopyAbsent, true)
assert.match(unknown.checks.statusText, /^Unknown Kick category/)
assert.equal(unknown.requests.length, 1)
assert.equal(new URL(unknown.requests[0]).pathname, '/api/kick-day-flow')

assert.equal(twitch.checks.publicControls, true)
assert.equal(twitch.checks.providerIsolation, true)
assert.equal(twitch.requests.length, 1)
assert.equal(new URL(twitch.requests[0]).pathname, '/api/day-flow')
assert.equal(new URL(twitch.requests[0]).searchParams.get('category'), 'all')

assert.equal(acceptance.schemaVersion, 'viewloom-12a9-kick-day-flow-category-public-production-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.phase, '12A-9-P2')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.implementationIssue, 809)
assert.equal(acceptance.acceptanceIssue, 811)
assert.equal(acceptance.acceptancePr, 812)
assert.equal(acceptance.provider, 'kick')
assert.equal(acceptance.feature, 'day_flow_category_filter')
assert.equal(acceptance.package.publicDecisionIssue, 807)
assert.equal(acceptance.package.publicDecisionPr, 808)
assert.equal(acceptance.package.publicImplementationIssue, 809)
assert.equal(acceptance.package.publicImplementationPr, 810)
assert.equal(acceptance.package.publicImplementationMergeSha, evidence.expectedProductionSha)
assert.equal(acceptance.execution.workflowRunId, 31515011810)
assert.equal(acceptance.execution.verifyJobId, 93857862615)
assert.equal(acceptance.execution.productionJobId, 93858031986)
assert.equal(acceptance.execution.artifactId, 9110734867)
assert.equal(acceptance.execution.artifactDigest, 'sha256:b3be7bfadb6b26649fc878d29cfa288b98321a4e0c664d12e39fc22fc58d6228')
assert.equal(acceptance.execution.sourceEvidenceJsonSha256, sha256(evidencePath))
assert.equal(acceptance.execution.deploymentJsonSha256, '8f04c7928a6f7bab25a12c272dcbf4d8a144f54ff4979b219f76a0b995832362')
assert.equal(acceptance.execution.desktopScreenshotSha256, 'b4fee7d63e9035d01292db9349b4a5f969d949ad8bcfee1e28ec0897bb9f9fc3')
assert.equal(acceptance.execution.mobileScreenshotSha256, '7689d8ddcf874dd45412dbe8cb73fe4f9b79e02fa8f1c76149fbf12e71711394')
assert.equal(acceptance.execution.unknownCategoryScreenshotSha256, '854cc8f50885bbd722f961373adeb53a8ef58b5c1c5099249243864ababe03b0')
assert.equal(acceptance.execution.twitchIsolationScreenshotSha256, '97b0f9fcd073476838136566fb886b1fef9a98890caa0c5fb75cff1d6fb8b307')
assert.equal(acceptance.productionIdentity.commitSha, evidence.expectedProductionSha)
assert.equal(acceptance.productionIdentity.environment, 'production')
assert.equal(acceptance.productionIdentity.branch, 'main')
assert.equal(acceptance.productionIdentity.pagesUrl, evidence.deployment.pages_url)
assert.equal(acceptance.productionIdentity.primaryOrigin, evidence.deployment.primary_origin)
assert.equal(acceptance.productionIdentity.canonicalHost, evidence.deployment.canonical_host)

const result = acceptance.acceptedResult
assert.equal(result.scenarioCount, 5)
assert.equal(result.passedScenarioCount, 5)
assert.equal(result.failureCount, 0)
assert.equal(result.publicDesktopCategoryOptions, desktop.checks.categoryOptions)
assert.equal(result.selectedCategory, desktop.checks.selectedCategory)
assert.equal(result.selectedCategoryBandCount, desktop.checks.selectedBandCount)
assert.equal(result.globalTotalsPreserved, true)
assert.equal(result.toolbarOverlapCount, 0)
assert.equal(result.desktopViewportWidth, 1440)
assert.equal(result.desktopScrollWidth, 1440)
assert.equal(result.desktopOverflow, false)
assert.equal(result.mobileViewportWidth, 390)
assert.equal(result.mobileScrollWidth, 390)
assert.equal(result.mobileCategoryControlWidth, 362)
assert.equal(result.mobileOverflow, false)
assert.equal(result.legacyPreviewCompatibilityPassed, true)
assert.equal(result.legacyPreviewRemovedAfterPublicInteraction, true)
assert.equal(result.unknownCategoryState, 'unknown_category')
assert.equal(result.unknownCategoryOverallState, 'live')
assert.equal(result.unknownSelectedBandCount, 0)
assert.equal(result.unknownGlobalOthersCount, 1)
assert.equal(result.unknownChartRendered, true)
assert.equal(result.unknownFalseNoObservedCopyAbsent, true)
assert.equal(result.twitchPublicBoundaryPreserved, true)
assert.equal(result.providerSeparationPass, true)
assert.equal(result.productionMutationPerformed, false)
for (const key of ['humanVisualDesktopPassed','humanVisualMobilePassed','humanVisualUnknownCategoryPassed','humanVisualTwitchIsolationPassed']) assert.equal(result[key], true, `${key}: human visual acceptance required`)

assert.equal(acceptance.responsiveGate.workflow, 'Quality U10E Responsive Accessibility')
assert.equal(acceptance.responsiveGate.workflowRunId, 31514685056)
assert.equal(acceptance.responsiveGate.jobId, 93856769125)
assert.equal(acceptance.responsiveGate.result, 'pass')
assert.equal(acceptance.responsiveGate.mobileTouchTargetMinPx, 44)
assert.equal(acceptance.responsiveGate.mobileCategorySelectMinPx, 44)

assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.trackingIssue, 807)
assert.equal(decision.decision, 'authorize_public_kick_day_flow_category_filter')
assert.equal(decision.authorization.publicKickDayFlowCategoryUiAuthorized, true)
assert.equal(decision.productionAcceptanceRequired, true)

for (const fragment of [
  "implementationState: 'public'",
  'publicExposureAuthorized: true',
  "provider: 'kick'",
  "bucketAggregation: 'average'",
  'all_observed_kick_viewers_per_bucket',
  'displayed_selected_category_top_n_viewers_per_bucket',
  "if (filterState !== 'selected') {",
  'const others = makeGlobalOthers([], labels, totals, bucketSize)',
]) assert.ok(api.includes(fragment), `public Kick runtime boundary missing: ${fragment}`)
assert.ok(!api.includes("implementationState: 'hidden_candidate'"))
assert.ok(!api.includes('category_public_exposure=false'))
assert.ok(!api.includes('DB_TWITCH_HOT'))

for (const fragment of [
  "const publicProvider = provider === 'twitch' || provider === 'kick'",
  "const apiPath = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'",
  "root.dataset.dayflowCategoryPreview = publicProvider ? 'public' : 'hidden'",
  "return filter.implementationState === 'public' && filter.publicExposureAuthorized === true",
  '@media(max-width:760px)',
  '.dayflow-category-preview__control select{min-height:44px}',
]) assert.ok(controls.includes(fragment), `public controls/accessibility boundary missing: ${fragment}`)

assert.ok(hiddenVerifier.includes("const HIDDEN_SHA = '27b3cca084d62d8badd512c068be415c6865965e'"))
assert.ok(hiddenVerifier.includes('historicalVerifier: true'))

const authorization = acceptance.authorization
assert.equal(authorization.publicKickDayFlowCategoryUiAccepted, true)
assert.equal(authorization.normalKickDayFlowRouteAccepted, true)
assert.equal(authorization.legacyPreviewCompatibilityAccepted, true)
for (const key of [
  'kickHeatmapSemanticChangeAuthorized',
  'kickBattleLinesCategoryUiAuthorized',
  'kickHistoryCategoryUiAuthorized',
  'twitchRuntimeSemanticChangeAuthorized',
  'collectorChangeAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'd1SchemaChangeAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'thresholdRelaxationAuthorized',
  'credentialChangeAuthorized',
  'syntheticMappingAuthorized',
  'nameOnlyMappingAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(authorization[key], false, `${key}: must remain false`)

console.log(JSON.stringify({
  status: 'pass',
  acceptanceIssue: acceptance.acceptanceIssue,
  acceptancePr: acceptance.acceptancePr,
  productionSha: evidence.expectedProductionSha,
  workflowRunId: acceptance.execution.workflowRunId,
  productionJobId: acceptance.execution.productionJobId,
  artifactId: acceptance.execution.artifactId,
  scenarios: `${result.passedScenarioCount}/${result.scenarioCount}`,
  categoryOptions: result.publicDesktopCategoryOptions,
  selectedCategory: result.selectedCategory,
  mobileWidth: result.mobileViewportWidth,
  mobileTouchTargetMinPx: acceptance.responsiveGate.mobileTouchTargetMinPx,
  unknownCategoryState: result.unknownCategoryState,
  publicKickDayFlowCategoryUiAccepted: authorization.publicKickDayFlowCategoryUiAccepted,
  oneShotProductionWorkflowRetired: true,
}, null, 2))
