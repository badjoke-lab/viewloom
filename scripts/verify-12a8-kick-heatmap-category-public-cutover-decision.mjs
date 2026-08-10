import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const decision = json('docs/audits/12a8-kick-heatmap-category-public-cutover-decision.json')
const evidence = json('docs/audits/12a8-kick-heatmap-category-hidden-production-evidence.json')
const acceptance = json('docs/audits/12a8-kick-heatmap-category-hidden-production-acceptance.json')
const controlsContract = json('docs/audits/12a8-kick-heatmap-category-hidden-controls-contract.json')
const apiPackage = json('docs/audits/12a8-kick-heatmap-category-api-package-contract.json')
const controls = read('apps/web/src/features/twitch-heatmap/category-preview-controls.ts')
const api = read('apps/web/functions/api/kick-heatmap.ts')
const kickHtml = read('apps/web/kick/heatmap/index.html')

assert.equal(decision.schemaVersion, 'viewloom-12a8-kick-heatmap-category-public-cutover-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.trackingIssue, 779)
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.provider, 'kick')
assert.equal(decision.surface, 'heatmap')
assert.equal(decision.decision, 'authorize_bounded_public_kick_heatmap_category_cutover')

assert.equal(acceptance.acceptancePr, 778)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, true)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(acceptance.authorization.publicKickCategoryUiAuthorized, false)
assert.equal(acceptance.acceptedResult.scenarioCount, 5)
assert.equal(acceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.failureCount, 0)
assert.equal(acceptance.acceptedResult.providerSeparationPass, true)
assert.equal(acceptance.acceptedResult.selectedCategoryMomentumHonestyPass, true)
assert.equal(acceptance.acceptedResult.mobileOverflow, false)
assert.equal(evidence.status, 'pass')
assert.equal(evidence.expectedSha, '555e30a754f4dee74e8ebe21fb59f85ef2b5a4b0')
assert.equal(evidence.deployment.commit_sha, evidence.expectedSha)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.scenarios.length, 5)
assert.deepEqual(evidence.failures, [])

assert.equal(decision.acceptedBasis.productionEvidenceAcceptancePr, 778)
assert.equal(decision.acceptedBasis.productionRunId, 31368780619)
assert.equal(decision.acceptedBasis.productionJobId, 93393053863)
assert.equal(decision.acceptedBasis.artifactId, 9055232142)
assert.equal(decision.acceptedBasis.passedScenarioCount, 5)
assert.equal(decision.acceptedBasis.failureCount, 0)
assert.equal(decision.acceptedBasis.mobileViewportWidth, 390)
assert.equal(decision.acceptedBasis.mobileScrollWidth, 390)
assert.equal(decision.acceptedBasis.providerSeparationPass, true)
assert.equal(decision.acceptedBasis.unknownCategoryPass, true)
assert.equal(decision.acceptedBasis.selectedCategoryMomentumHonestyPass, true)

assert.equal(decision.publicSemantics.normalKickRouteControlsVisible, true)
assert.equal(decision.publicSemantics.defaultCategory, 'all')
assert.equal(decision.publicSemantics.defaultTop, 50)
assert.deepEqual(decision.publicSemantics.allowedTopValues, [20, 50, 100])
assert.equal(decision.publicSemantics.categoryFilterBeforeTopN, true)
assert.equal(decision.publicSemantics.directApiNoQueryCompatibilityPreserved, true)
assert.equal(decision.publicSemantics.normalPageMayRequestCategoryAllAndTop50, true)
assert.equal(decision.publicSemantics.providerIdentity, '(kick, categoryProviderId)')
assert.equal(decision.publicSemantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(decision.publicSemantics.unknownCategoryState, 'unknown_category')
assert.equal(decision.publicSemantics.unavailableCategoryState, 'category_unavailable')
assert.equal(decision.publicSemantics.partialCoverageVisible, true)
assert.equal(decision.publicSemantics.selectedCategoryMomentumRequiresSameCategoryPreviousObservation, true)
assert.equal(decision.publicSemantics.selectedCategoryMomentumUnavailablePresentation, 'neutral_na_and_unavailable')
assert.equal(decision.publicSemantics.automaticFallbackFromSelectedCategoryToAll, false)

assert.equal(decision.legacyCompatibility.categoryPreviewParameterAcceptedOnLoad, true)
assert.equal(decision.legacyCompatibility.categoryPreviewRequiredForPublicControls, false)
assert.equal(decision.legacyCompatibility.categoryPreviewRemovedAfterActualPublicControlInteraction, true)
assert.equal(decision.legacyCompatibility.legacyPreviewLinkMustRemainFunctional, true)
assert.equal(decision.legacyCompatibility.categoryAndTopUrlStateRemainShareable, true)

assert.equal(decision.apiCutover.implementationState, 'public')
assert.equal(decision.apiCutover.publicExposureAuthorized, true)
assert.equal(decision.apiCutover.normalNoQueryApiBehaviorMustRemainBackwardCompatible, true)
assert.equal(decision.apiCutover.normalPageCanUseExplicitCategoryAllTop50, true)
assert.equal(decision.apiCutover.providerDictionaryMustBind, 'kick')
assert.equal(decision.apiCutover.twitchEndpointFallbackAllowed, false)
assert.equal(decision.apiCutover.twitchDictionaryRowsAllowed, false)
assert.equal(decision.uiCutover.sharedControlsMayRenderForKickWithoutPreviewGate, true)
assert.equal(decision.uiCutover.twitchPublicBehaviorMustRemainUnchanged, true)
assert.equal(decision.uiCutover.normalKickStaticHtmlMayRemainControlFree, true)
assert.equal(decision.uiCutover.controlsMayRemainRuntimeInserted, true)
assert.equal(decision.uiCutover.mobileNoHorizontalOverflowRequired, true)
assert.equal(decision.uiCutover.keyboardAndAccessibleLabelsRequired, true)

for (const [key, value] of Object.entries(decision.validation)) assert.equal(value, true, `${key}: must remain true`)
assert.equal(decision.authorization.publicCutoverImplementationAuthorized, true)
assert.equal(decision.authorization.publicKickHeatmapCategoryUiAuthorizedOnAcceptedCutover, true)
for (const key of [
  'kickDayFlowCategoryUiAuthorized',
  'kickBattleLinesCategoryUiAuthorized',
  'kickHistoryCategoryUiAuthorized',
  'twitchRuntimeChangeAuthorized',
  'collectorChangeAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'd1SchemaChangeAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'credentialChangeAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

// The decision itself must not perform the public cutover. Current runtime must
// remain at the accepted hidden state until a separate bounded implementation PR.
assert.ok(controls.includes("provider === 'twitch' || (provider === 'kick' && url.searchParams.get(PREVIEW_PARAM) === '1')"), 'pre-cutover Kick controls are no longer hidden')
assert.ok(controls.includes("if (provider === 'kick') url.searchParams.set(PREVIEW_PARAM, '1')"), 'pre-cutover Kick preview compatibility boundary changed before implementation')
assert.ok(api.includes("implementationState: 'hidden'"), 'pre-cutover Kick API is no longer hidden')
assert.ok(api.includes('publicExposureAuthorized: false'), 'pre-cutover Kick API public exposure changed before implementation')
assert.equal(kickHtml.includes('data-category-preview-select'), false, 'decision PR must not add public static Kick controls')
assert.equal(controlsContract.hiddenEntry.publicKickExposureAuthorized, false)
assert.equal(apiPackage.hiddenBoundary.publicExposureAuthorized, false)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  decision: decision.decision,
  productionEvidencePr: decision.acceptedBasis.productionEvidenceAcceptancePr,
  productionScenarios: decision.acceptedBasis.passedScenarioCount,
  mobileWidth: decision.acceptedBasis.mobileViewportWidth,
  publicCutoverImplementationAuthorized: true,
  publicKickCategoryUiAuthorizedByDecisionAlone: false,
  nextGate: 'bounded-public-cutover-implementation',
}, null, 2))
