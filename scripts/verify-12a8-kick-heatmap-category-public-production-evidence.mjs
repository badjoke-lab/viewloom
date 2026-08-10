import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a8-kick-heatmap-category-public-production-evidence.json'
const acceptancePath = 'docs/audits/12a8-kick-heatmap-category-public-production-acceptance.json'
const contractPath = 'docs/audits/12a8-kick-heatmap-category-public-cutover-contract.json'
const oneShotWorkflowPath = '.github/workflows/analytics-12a8-kick-heatmap-category-public-cutover.yml'
const browserPath = 'apps/web/scripts/kick-category-public-production-acceptance.mjs'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [evidencePath, acceptancePath, contractPath, oneShotWorkflowPath, browserPath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const contract = json(contractPath)
const workflow = readFileSync(oneShotWorkflowPath, 'utf8')
const browser = readFileSync(browserPath, 'utf8')

assert.equal(evidence.schemaVersion, 'viewloom-12a8-kick-heatmap-category-public-production-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.expectedSha, '14181a570a93ab4091f6a43e6aaf0ec86f60c745')
assert.equal(evidence.deployment?.commit_sha, evidence.expectedSha)
assert.equal(evidence.deployment?.environment, 'production')
assert.equal(evidence.deployment?.branch, 'main')
assert.equal(evidence.deployment?.pages_url, 'https://5a733749.viewloom.pages.dev')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicKickCategoryUiActive, true)
assert.equal(evidence.twitchPublicCategoryUiPreserved, true)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: accepted scenario must pass`)

const desktop = evidence.scenarios.find((scenario) => scenario.name === 'kick-public-desktop')
const mobile = evidence.scenarios.find((scenario) => scenario.name === 'kick-public-mobile')
const legacy = evidence.scenarios.find((scenario) => scenario.name === 'kick-legacy-preview-compatibility')
const unknown = evidence.scenarios.find((scenario) => scenario.name === 'kick-unknown-category-honest-empty')
const twitch = evidence.scenarios.find((scenario) => scenario.name === 'twitch-public-controls-preserved')
for (const scenario of [desktop, mobile, legacy, unknown, twitch]) assert.ok(scenario, 'required accepted scenario missing')

assert.equal(desktop.checks.geometry.width, 1440)
assert.equal(desktop.checks.geometry.scrollWidth, 1440)
assert.equal(desktop.checks.geometry.overflow, false)
assert.equal(desktop.checks.selectedCategory, '8')
assert.equal(desktop.checks.selectedItemCount, 19)
assert.equal(desktop.checks.unavailableMomentumCount, 1)
assert.ok(desktop.checks.rects.status.right <= desktop.checks.rects.map.left + 1, 'desktop status overlaps MAP group')
assert.ok(desktop.checks.rects.fields.right <= desktop.checks.rects.root.right + 1, 'desktop fields escape root')
assert.ok(desktop.checks.rects.status.right <= desktop.checks.rects.root.right + 1, 'desktop status escapes root')

assert.equal(mobile.checks.geometry.width, 390)
assert.equal(mobile.checks.geometry.scrollWidth, 390)
assert.equal(mobile.checks.geometry.overflow, false)
assert.ok(mobile.checks.rects.fields.right <= mobile.checks.rects.root.right + 1, 'mobile fields escape root')
assert.ok(mobile.checks.rects.status.right <= mobile.checks.rects.root.right + 1, 'mobile status escapes root')

assert.equal(legacy.checks.previewBeforeInteraction, true)
assert.equal(legacy.checks.previewAfterInteraction, false)
assert.equal(legacy.checks.selectedTop, 20)
assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.itemCount, 0)
assert.equal(twitch.checks.categoryControls, 1)
assert.equal(twitch.checks.geometry.overflow, false)

assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-public-production-acceptance-v1')
assert.equal(acceptance.status, 'accepted')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.trackingIssue, 790)
assert.equal(acceptance.decision.issue, 788)
assert.equal(acceptance.decision.pr, 789)
assert.equal(acceptance.implementation.issue, 790)
assert.equal(acceptance.implementation.pr, 791)
assert.equal(acceptance.implementation.mergeSha, evidence.expectedSha)
assert.equal(acceptance.implementation.runtimeChangesLimitedToExposureBoundary, true)
assert.equal(acceptance.implementation.normalKickControlsPublic, true)
assert.equal(acceptance.implementation.twitchRuntimeSemanticsChanged, false)

assert.equal(acceptance.firstProductionAttempt.workflowRunId, 31392879989)
assert.equal(acceptance.firstProductionAttempt.productionJobId, 93468692148)
assert.equal(acceptance.firstProductionAttempt.artifactId, 9064635617)
assert.equal(acceptance.firstProductionAttempt.artifactDigest, 'sha256:e105910dfeb97a4f33f2a7506ee416d8f72c8e5dd0fd5914e5cce7398810fef7')
assert.equal(acceptance.firstProductionAttempt.exactProductionShaObserved, true)
assert.equal(acceptance.firstProductionAttempt.accepted, false)
assert.equal(acceptance.firstProductionAttempt.failureClass, 'normal_route_cache_propagation')
assert.equal(acceptance.firstProductionAttempt.productCodeChangedBeforeRetry, false)

const accepted = acceptance.acceptedProductionEvidence
assert.equal(accepted.workflowRunId, 31392879989)
assert.equal(accepted.workflowRunAttempt, 2)
assert.equal(accepted.contractJobId, 93471827934)
assert.equal(accepted.productionJobId, 93471782226)
assert.equal(accepted.artifactId, 9064783287)
assert.equal(accepted.artifactDigest, 'sha256:e382273cadf537526657b48a5ecffb14cb29525721b2226b81431238acc1e111')
assert.equal(accepted.evidenceFile, evidencePath)
assert.equal(accepted.evidenceJsonSha256, '3535955f2ab6f9bb9072dbe6995e5871ef77eb27affea8ab0cc8b16eb1beee44')
assert.equal(accepted.deploymentJsonSha256, '0cded206ad8f3f256b3b4abb79b34b0380c9be04571955d0c9dc3bd99bd59d12')
assert.equal(accepted.desktopScreenshotSha256, 'ee81b74910280a83e84eac0bd7b18c5b7f8984968fbe7e030b42a068372360e8')
assert.equal(accepted.mobileScreenshotSha256, '9a1c3adf3e17eeb602a07ae7a91b85e0355eed12bdae3b636aa672395c7be158')
assert.equal(accepted.expectedSha, evidence.expectedSha)
assert.equal(accepted.observedSha, evidence.expectedSha)
assert.equal(accepted.scenarioCount, 5)
assert.equal(accepted.passedScenarioCount, 5)
assert.equal(accepted.failureCount, 0)
for (const key of [
  'normalKickDesktopPassed',
  'normalKickMobilePassed',
  'legacyPreviewCompatibilityPassed',
  'legacyPreviewRemovedAfterInteraction',
  'unknownCategoryHonestyPassed',
  'selectedCategoryMomentumUnavailableObserved',
  'twitchPublicControlsPreserved',
  'desktopGeometryPassed',
  'mobileGeometryPassed',
  'humanVisualDesktopPassed',
  'humanVisualMobilePassed',
  'singleSourceDeploymentEvidencePassed',
]) assert.equal(accepted[key], true, `${key}: accepted evidence must remain true`)
assert.equal(accepted.selectedCategoryMomentumUnavailableCount, 1)
assert.equal(accepted.desktopWidth, 1440)
assert.equal(accepted.desktopScrollWidth, 1440)
assert.equal(accepted.mobileWidth, 390)
assert.equal(accepted.mobileScrollWidth, 390)
assert.equal(accepted.productionMutationPerformed, false)

assert.equal(acceptance.publicBehaviorAccepted.defaultCategory, 'all')
assert.equal(acceptance.publicBehaviorAccepted.defaultTop, 50)
assert.deepEqual(acceptance.publicBehaviorAccepted.allowedTopValues, [20, 50, 100])
assert.equal(acceptance.publicBehaviorAccepted.filterBeforeTopN, true)
assert.equal(acceptance.publicBehaviorAccepted.categoryAndTopUrlStatePublic, true)
assert.equal(acceptance.publicBehaviorAccepted.legacyCategoryPreviewAccepted, true)
assert.equal(acceptance.publicBehaviorAccepted.legacyCategoryPreviewRequired, false)
assert.equal(acceptance.publicBehaviorAccepted.legacyCategoryPreviewRemovedAfterInteraction, true)
assert.equal(acceptance.publicBehaviorAccepted.unknownSelectedCategoryReturnsItems, false)
assert.equal(acceptance.publicBehaviorAccepted.unavailableSelectedCategoryReturnsInferredItems, false)
assert.equal(acceptance.publicBehaviorAccepted.allCategoriesUsesUnfilteredFallback, true)
assert.equal(acceptance.publicBehaviorAccepted.selectedCategoryMomentumRequiresCompatibleSameCategoryHistory, true)
assert.equal(acceptance.publicBehaviorAccepted.incompatibleMomentumPresentation, 'neutral_n_a')
assert.equal(acceptance.publicBehaviorAccepted.providerIsolationPreserved, true)
assert.equal(acceptance.authorization.publicKickCategoryUiAccepted, true)
assert.equal(acceptance.authorization.publicRolloutAccepted, true)
assert.equal(acceptance.authorization.normalKickRouteExposureAccepted, true)

assert.equal(contract.schemaVersion, 'viewloom-12a8-kick-heatmap-category-public-cutover-contract-v2')
assert.equal(contract.status, 'public_production_evidence_accepted')
assert.equal(contract.trackingIssue, 790)
assert.equal(contract.publicImplementation.pr, 791)
assert.equal(contract.publicImplementation.mergeSha, evidence.expectedSha)
assert.equal(contract.productionAcceptance.accepted, true)
assert.equal(contract.productionAcceptance.workflowRunId, accepted.workflowRunId)
assert.equal(contract.productionAcceptance.productionJobId, accepted.productionJobId)
assert.equal(contract.productionAcceptance.artifactId, accepted.artifactId)
assert.equal(contract.productionAcceptance.artifactDigest, accepted.artifactDigest)
assert.equal(contract.productionAcceptance.exactMainSha, evidence.expectedSha)
assert.equal(contract.productionAcceptance.scenarioCount, 5)
assert.equal(contract.productionAcceptance.passedScenarioCount, 5)
assert.equal(contract.productionAcceptance.failureCount, 0)
assert.equal(contract.productionAcceptance.desktopHumanVisualPassed, true)
assert.equal(contract.productionAcceptance.mobileHumanVisualPassed, true)
assert.equal(contract.productionAttemptHistory.length, 2)
assert.equal(contract.productionAttemptHistory[0].accepted, false)
assert.equal(contract.productionAttemptHistory[1].accepted, true)
assert.equal(contract.retirement.oneShotProductionBrowserAcceptanceConsumed, true)
assert.equal(contract.retirement.oneShotProductionJobRetiredOnAcceptance, true)
assert.equal(contract.retirement.browserScriptRetainedForReproducibility, true)
assert.equal(contract.authorization.publicRolloutAccepted, true)

for (const key of [
  'kickDayFlowCategoryUiAuthorized',
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
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) {
  assert.equal(acceptance.authorization[key], false, `${key}: acceptance boundary must remain false`)
  assert.equal(contract.authorization[key], false, `${key}: contract boundary must remain false`)
}

// The main workflow becomes a permanent static/evidence gate after acceptance.
assert.equal(workflow.includes("name: Analytics 12A8 Kick Heatmap Category Public Cutover"), true)
assert.equal(workflow.includes('  production:\n'), false, 'consumed one-shot production job must be retired')
assert.equal(workflow.includes('verify-12a8-kick-heatmap-category-public-production-evidence.mjs'), true)
assert.equal(workflow.includes('Verify accepted Kick public category production evidence'), true)

// Browser logic remains retained for reproducibility but is not automatically rerun on every accepted-evidence change.
for (const scenario of evidence.scenarios.map((scenario) => scenario.name)) {
  assert.ok(browser.includes(`'${scenario}'`), `retained browser scenario missing: ${scenario}`)
}
assert.ok(browser.includes("const sourcePath = path.join(OUT, 'last-deployment.json')"))
assert.equal(browser.includes('fetch(`${ORIGIN}/deployment.json'), false)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: 790,
  implementationPr: 791,
  publicProductSha: evidence.expectedSha,
  acceptedWorkflowRun: accepted.workflowRunId,
  acceptedProductionJob: accepted.productionJobId,
  acceptedArtifact: accepted.artifactId,
  scenarios: `${accepted.passedScenarioCount}/${accepted.scenarioCount}`,
  desktopHumanVisualPassed: accepted.humanVisualDesktopPassed,
  mobileHumanVisualPassed: accepted.humanVisualMobilePassed,
  publicRolloutAccepted: acceptance.authorization.publicRolloutAccepted,
  oneShotProductionJobRetired: true,
}, null, 2))
