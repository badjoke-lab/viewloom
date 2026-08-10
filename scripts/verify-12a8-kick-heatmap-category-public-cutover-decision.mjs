import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const decision = json('docs/audits/12a8-kick-heatmap-category-public-cutover-decision.json')
const hiddenDecision = json('docs/audits/12a8-kick-heatmap-category-feasibility-decision.json')
const acceptance = json('docs/audits/12a8-kick-heatmap-category-hidden-production-acceptance.json')
const corrected = json('docs/audits/12a8-kick-heatmap-category-hidden-corrected-visual-production-evidence.json')
const sourceMainSha = decision.evidenceBasis.sourceMainSha
const controls = execFileSync('git', ['show', `${sourceMainSha}:apps/web/src/features/twitch-heatmap/category-preview-controls.ts`], { encoding: 'utf8' })
const api = execFileSync('git', ['show', `${sourceMainSha}:apps/web/functions/api/kick-heatmap.ts`], { encoding: 'utf8' })

assert.equal(decision.schemaVersion, 'viewloom-12a8-kick-heatmap-category-public-cutover-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-8-P1')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 788)
assert.equal(decision.provider, 'kick')
assert.equal(decision.feature, 'heatmap_category_filter')
assert.equal(decision.decision, 'authorize_public_kick_heatmap_category_filter')

const basis = decision.evidenceBasis
assert.equal(basis.sourceMainSha, '40ac536b47b86a14343f7c259ba2b94c3d61c081')
assert.equal(basis.hiddenAcceptancePr, 787)
assert.equal(basis.hiddenAcceptanceMergeSha, basis.sourceMainSha)
assert.equal(basis.repairedProductSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
assert.equal(basis.acceptedValidationDeploymentSha, '67fee8ba326f088422c85a61738f0251e9cd3c8d')
assert.equal(basis.workflowRunId, 31371899291)
assert.equal(basis.contractJobId, 93402501132)
assert.equal(basis.productionJobId, 93402574458)
assert.equal(basis.artifactId, 9056407163)
assert.equal(basis.artifactDigest, 'sha256:8efd05de170ec91c04e0bce5c7a16c3ab323cbb54f217d53f167ceb45cbd33af')
assert.equal(basis.scenarioCount, 4)
assert.equal(basis.passedScenarioCount, 4)
assert.equal(basis.failureCount, 0)
assert.equal(basis.humanVisualDesktopPassed, true)
assert.equal(basis.humanVisualMobilePassed, true)
assert.equal(basis.desktopWidth, 1440)
assert.equal(basis.desktopScrollWidth, 1440)
assert.equal(basis.mobileWidth, 390)
assert.equal(basis.mobileScrollWidth, 390)
assert.equal(basis.normalKickControlsVisible, false)
assert.equal(basis.twitchPublicControlsPreserved, true)

// Require the previously accepted hidden semantics as the public cutover basis.
assert.equal(hiddenDecision.decision, 'authorize_hidden_kick_heatmap_category_candidate')
assert.equal(hiddenDecision.authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(hiddenDecision.authorization.publicExposureAuthorized, false)
assert.equal(hiddenDecision.acceptedKickCategorySource.identityFormat, '(kick, categoryProviderId)')
assert.equal(hiddenDecision.acceptedKickCategorySource.membershipEvaluation, 'per_observed_snapshot')
assert.equal(hiddenDecision.filterSemantics.filterBeforeTopN, true)
assert.equal(hiddenDecision.momentumSemantics.selectedCategoryPreviousComparisonRequiresSameCategoryMembership, true)

assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-acceptance-v3')
assert.equal(acceptance.status, 'accepted_corrected_visual_evidence')
assert.equal(acceptance.trackingIssue, 780)
assert.equal(acceptance.package.acceptedValidationSha, basis.acceptedValidationDeploymentSha)
assert.equal(acceptance.correctedEvidence.workflowRunId, basis.workflowRunId)
assert.equal(acceptance.correctedEvidence.productionJobId, basis.productionJobId)
assert.equal(acceptance.correctedEvidence.artifactId, basis.artifactId)
assert.equal(acceptance.correctedEvidence.artifactDigest, basis.artifactDigest)
assert.equal(acceptance.correctedEvidence.scenarioCount, 4)
assert.equal(acceptance.correctedEvidence.passedScenarioCount, 4)
assert.equal(acceptance.correctedEvidence.failureCount, 0)
assert.equal(acceptance.correctedEvidence.desktopGeometryPassed, true)
assert.equal(acceptance.correctedEvidence.mobile390GeometryPassed, true)
assert.equal(acceptance.correctedEvidence.humanVisualDesktopPassed, true)
assert.equal(acceptance.correctedEvidence.humanVisualMobilePassed, true)
assert.equal(acceptance.correctedEvidence.normalKickRemainedHidden, true)
assert.equal(acceptance.correctedEvidence.twitchPublicControlsPreserved, true)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(acceptance.authorization.publicKickCategoryUiAuthorized, false)

assert.equal(corrected.status, 'pass')
assert.equal(corrected.expectedSha, basis.acceptedValidationDeploymentSha)
assert.equal(corrected.deployment?.commit_sha, corrected.expectedSha)
assert.equal(corrected.deployment?.environment, 'production')
assert.equal(corrected.deployment?.branch, 'main')
assert.deepEqual(corrected.failures, [])
assert.equal(corrected.scenarios.length, 4)
for (const scenario of corrected.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: corrected hidden evidence must pass`)

const semantics = decision.acceptedSemantics
assert.equal(semantics.categoryIdentity, '(kick, categoryProviderId)')
assert.equal(semantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(semantics.dictionaryProvider, 'kick')
assert.equal(semantics.dictionaryNameIsPresentationOnly, true)
assert.equal(semantics.filterBeforeTopN, true)
assert.deepEqual(semantics.coverageStates, ['observed', 'partial', 'unavailable'])
assert.equal(semantics.unknownCategoryState, 'unknown_category')
assert.equal(semantics.selectedCategoryUnavailableState, 'category_unavailable')
assert.equal(semantics.selectedCategoryUnknownReturnsItems, false)
assert.equal(semantics.selectedCategoryUnavailableReturnsItems, false)
assert.equal(semantics.allCategoriesUsesUnfilteredFallback, true)
assert.equal(semantics.latestCategoryBackProjectionAllowed, false)
assert.equal(semantics.syntheticMappingAllowed, false)
assert.equal(semantics.nameOnlyIdentityAllowed, false)
assert.equal(semantics.crossProviderIdentityAllowed, false)
assert.equal(semantics.selectedCategoryMomentumRequiresCurrentMembership, true)
assert.equal(semantics.selectedCategoryMomentumRequiresPreviousSameCategoryMembership, true)
assert.equal(semantics.incompatiblePreviousObservation, 'momentum_unavailable')
assert.equal(semantics.unavailableMomentumPresentation, 'neutral_n_a')

const behavior = decision.publicBehavior
assert.equal(behavior.normalKickRouteEnabled, true)
assert.equal(behavior.controlsVisibleOnNormalRoute, true)
assert.equal(behavior.defaultCategory, 'all')
assert.equal(behavior.defaultTop, 50)
assert.deepEqual(behavior.allowedTopValues, [20, 50, 100])
assert.equal(behavior.urlCategoryParameter, 'category')
assert.equal(behavior.urlTopParameter, 'top')
assert.equal(behavior.legacyCategoryPreviewParameter, 'categoryPreview=1')
assert.equal(behavior.legacyCategoryPreviewParameterAccepted, true)
assert.equal(behavior.legacyCategoryPreviewParameterRequired, false)
assert.equal(behavior.legacyCategoryPreviewParameterRemovedAfterPublicControlInteraction, true)
assert.equal(behavior.filterBeforeTopN, true)
assert.equal(behavior.partialCoverageVisible, true)
assert.equal(behavior.categoryUnavailableVisible, true)
assert.equal(behavior.unknownCategoryReturnsEmptyHonestState, true)
assert.equal(behavior.selectedUnavailableReturnsEmptyHonestState, true)
assert.equal(behavior.unfilteredFallbackWhenAllSelected, true)
assert.equal(behavior.mobile390NoHorizontalOverflowRequired, true)
assert.equal(behavior.desktopControlNonOverlapRequired, true)

const authorization = decision.authorization
assert.equal(authorization.publicKickCategoryUiAuthorized, true)
assert.equal(authorization.defaultRouteExposureAuthorized, true)
assert.equal(authorization.legacyPreviewCompatibilityAuthorized, true)
assert.equal(authorization.publicNavigationAuthorized, false)
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
]) assert.equal(authorization[key], false, `${key}: must remain false`)
assert.equal(decision.productionAcceptanceRequired, true)

// Freeze the exact pre-public runtime boundary at the accepted hidden source SHA.
for (const fragment of [
  "provider === 'twitch' || (provider === 'kick' && url.searchParams.get(PREVIEW_PARAM) === '1')",
  "root.dataset.categoryFilter = options.provider === 'kick' ? 'hidden' : 'public'",
  "if (provider === 'kick') url.searchParams.set(PREVIEW_PARAM, '1')",
  'else url.searchParams.delete(PREVIEW_PARAM)',
  'const TOP_VALUES = [20, 50, 100] as const',
  'const DEFAULT_TOP = 50',
]) assert.ok(controls.includes(fragment), `pre-public controls boundary missing: ${fragment}`)

for (const fragment of [
  "implementationState: 'hidden'",
  'publicExposureAuthorized: false',
  "const requestedCategory = normalizeCategory(url.searchParams.get('category'))",
  "const requestedTop = normalizeTop(url.searchParams.get('top'))",
  'filterBeforeTopN: true',
  "WHERE provider = ?",
  ".bind('kick')",
  "'category_filter_public_exposure=false'",
]) assert.ok(api.includes(fragment), `pre-public Kick API boundary missing: ${fragment}`)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  decision: decision.decision,
  sourceMainSha,
  hiddenEvidenceAccepted: acceptance.status,
  hiddenScenarios: `${basis.passedScenarioCount}/${basis.scenarioCount}`,
  publicKickCategoryUiAuthorized: authorization.publicKickCategoryUiAuthorized,
  defaultCategory: behavior.defaultCategory,
  defaultTop: behavior.defaultTop,
  allowedTopValues: behavior.allowedTopValues,
  legacyPreviewRequired: behavior.legacyCategoryPreviewParameterRequired,
  productionAcceptanceRequired: decision.productionAcceptanceRequired,
}, null, 2))
