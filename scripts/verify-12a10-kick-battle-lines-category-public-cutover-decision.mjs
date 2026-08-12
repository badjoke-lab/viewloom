import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const decisionPath = 'docs/audits/12a10-kick-battle-lines-category-public-cutover-decision.json'
const acceptancePath = 'docs/audits/12a10-kick-battle-lines-category-hidden-production-acceptance.json'
const evidencePath = 'docs/audits/12a10-kick-battle-lines-category-hidden-production-evidence.json'
const apiPath = 'apps/web/functions/api/kick-battle-lines.ts'
const controllerPath = 'apps/web/src/live/battle-lines-current-shell-entry.ts'

for (const path of [decisionPath, acceptancePath, evidencePath, apiPath, controllerPath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const read = (path) => readFileSync(path, 'utf8')
const decision = json(decisionPath)
const acceptance = json(acceptancePath)
const evidence = json(evidencePath)
const api = read(apiPath)
const controller = read(controllerPath)

assert.equal(decision.schemaVersion, 'viewloom-12a10-kick-battle-lines-category-public-cutover-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-10-P3')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 821)
assert.equal(decision.provider, 'kick')
assert.equal(decision.feature, 'battle_lines_category_filter')
assert.equal(decision.decision, 'authorize_public_kick_battle_lines_category_filter')

assert.equal(acceptance.schemaVersion, 'viewloom-12a10-kick-battle-lines-category-hidden-production-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.acceptanceIssue, 819)
assert.equal(acceptance.acceptancePr, 820)
assert.equal(acceptance.authorization.hiddenKickBattleLinesCategoryCandidateAccepted, true)
assert.equal(acceptance.authorization.publicKickBattleLinesCategoryUiAuthorized, false)
assert.equal(evidence.status, 'pass')
assert.equal(evidence.productAuthoritySha, decision.evidenceBasis.hiddenProductAuthoritySha)
assert.equal(evidence.expectedDeploymentSha, decision.evidenceBasis.acceptedValidationDeploymentSha)
assert.equal(evidence.scenarios.length, 6)
assert.deepEqual(evidence.failures, [])

assert.equal(decision.evidenceBasis.hiddenAcceptanceIssue, 819)
assert.equal(decision.evidenceBasis.hiddenAcceptancePr, 820)
assert.equal(decision.evidenceBasis.hiddenAcceptanceMergeSha, '11b35b6fbb9b3f37f2dec08977c98ed16656b027')
assert.equal(decision.evidenceBasis.workflowRunId, 31519986415)
assert.equal(decision.evidenceBasis.productionJobId, 93874522742)
assert.equal(decision.evidenceBasis.artifactId, 9112660165)
assert.equal(decision.evidenceBasis.scenarioCount, 6)
assert.equal(decision.evidenceBasis.passedScenarioCount, 6)
assert.equal(decision.evidenceBasis.failureCount, 0)
assert.equal(decision.evidenceBasis.humanVisualAcceptancePassed, true)
assert.equal(decision.evidenceBasis.normalKickControlsVisible, false)
assert.equal(decision.evidenceBasis.hiddenDesktopCategoryOptions, 127)
assert.equal(decision.evidenceBasis.selectedCategory, '15')
assert.equal(decision.evidenceBasis.selectedCategoryLines, 5)
assert.equal(decision.evidenceBasis.selectedCategoryBattles, 6)
assert.equal(decision.evidenceBasis.productionOutsideCategoryPoints, 121)
assert.equal(decision.evidenceBasis.mobileWidth, 390)
assert.equal(decision.evidenceBasis.mobileScrollWidth, 390)
assert.equal(decision.evidenceBasis.mobileCategoryTouchTargetPx, 44)
assert.equal(decision.evidenceBasis.unknownCategoryState, 'unknown_category')
assert.equal(decision.evidenceBasis.unknownCategoryLines, 0)
assert.equal(decision.evidenceBasis.unknownCategoryBattles, 0)
assert.equal(decision.evidenceBasis.unknownObservedBuckets, 288)
assert.equal(decision.evidenceBasis.providerIsolationPassed, true)

const semantics = decision.acceptedSemantics
assert.equal(semantics.categoryIdentity, '(kick, categoryProviderId)')
assert.equal(semantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(semantics.latestCategoryBackProjectionAllowed, false)
assert.equal(semantics.syntheticMappingAllowed, false)
assert.equal(semantics.nameOnlyIdentityAllowed, false)
assert.equal(semantics.crossProviderIdentityAllowed, false)
assert.equal(semantics.allCategoriesUsesExactUnfilteredFallback, true)
assert.equal(semantics.categoryFilterBeforeCandidateCompaction, true)
assert.equal(semantics.categoryFilterBeforeTopN, true)
assert.equal(semantics.categoryFilterBeforeRecommendedBattleScoring, true)
assert.equal(semantics.candidateRankingMetric, 'category_qualified_viewer_minutes')
assert.deepEqual(semantics.existingTopValues, [3, 5, 10])
assert.equal(semantics.existingTopDefault, 5)
assert.deepEqual(semantics.existingMetrics, ['viewers', 'indexed'])
assert.deepEqual(semantics.existingDisplayBuckets, ['5m', '10m'])
assert.equal(semantics.existingBucketDefault, '5m')
assert.deepEqual(semantics.selectedCategoryPointStates, ['observed', 'outside_category', 'category_unavailable', 'offline', 'not_observed', 'missing'])
assert.equal(semantics.outsideCategoryNeverRenderedAsZero, true)
assert.equal(semantics.categoryUnavailableNeverRenderedAsZero, true)
assert.equal(semantics.outsideCategoryExcludedFromMissingPenalty, true)
assert.equal(semantics.categoryUnavailableExcludedFromMissingPenalty, true)
assert.equal(semantics.unknownCategoryState, 'unknown_category')
assert.equal(semantics.unknownCategoryReturnsCategoryLines, false)
assert.equal(semantics.unknownCategoryReturnsBattles, false)
assert.equal(semantics.unknownCategoryMaySubstituteGlobalLines, false)

const behavior = decision.publicBehavior
assert.equal(behavior.normalKickRouteEnabled, true)
assert.equal(behavior.controlsVisibleOnNormalRoute, true)
assert.equal(behavior.defaultCategory, 'all')
assert.equal(behavior.urlCategoryParameter, 'category')
assert.equal(behavior.legacyCategoryPreviewParameter, 'categoryPreview=1')
assert.equal(behavior.legacyCategoryPreviewParameterAccepted, true)
assert.equal(behavior.legacyCategoryPreviewParameterRequired, false)
assert.equal(behavior.legacyCategoryPreviewParameterRemovedAfterPublicControlInteraction, true)
assert.equal(behavior.unfilteredFallbackWhenAllSelected, true)
assert.equal(behavior.filterBeforeCandidateCompaction, true)
assert.equal(behavior.filterBeforeTopN, true)
assert.equal(behavior.filterBeforeRecommendedBattleScoring, true)
assert.equal(behavior.pointStateHonestyRequired, true)
assert.equal(behavior.unknownCategoryMustRemainExplicit, true)
assert.equal(behavior.unknownCategoryMayRenderGlobalLines, false)
assert.equal(behavior.mobile390NoHorizontalOverflowRequired, true)
assert.equal(behavior.mobileCategoryTouchTargetMinPx, 44)
assert.equal(behavior.desktopControlNonOverlapRequired, true)
assert.equal(behavior.twitchCategoryControlsForbidden, true)

const authorization = decision.authorization
assert.equal(authorization.publicKickBattleLinesCategoryUiAuthorized, true)
assert.equal(authorization.defaultRouteExposureAuthorized, true)
assert.equal(authorization.legacyPreviewCompatibilityAuthorized, true)
for (const key of [
  'publicNavigationAuthorized',
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
assert.equal(decision.productionAcceptanceRequired, true)

// Decision-only gate: runtime must still be hidden until the next implementation PR.
for (const fragment of [
  "implementationState: 'hidden_candidate'",
  'publicExposureAuthorized: false',
  "const categoryPreviewEnabled = provider === 'kick' && params.get('categoryPreview') === '1'",
  'if (categoryPreviewEnabled) installCategoryPreviewControl()',
  "if (categoryPreviewEnabled) query.set('category', state.category)",
]) assert.ok((fragment.includes('categoryPreviewEnabled') || fragment.includes('installCategoryPreviewControl') || fragment.includes('query.set')) ? controller.includes(fragment) : api.includes(fragment), `pre-cutover hidden boundary missing: ${fragment}`)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  decision: decision.decision,
  hiddenAcceptancePr: decision.evidenceBasis.hiddenAcceptancePr,
  productionScenarios: `${decision.evidenceBasis.passedScenarioCount}/${decision.evidenceBasis.scenarioCount}`,
  categoryOptions: decision.evidenceBasis.hiddenDesktopCategoryOptions,
  outsideCategoryPoints: decision.evidenceBasis.productionOutsideCategoryPoints,
  publicKickBattleLinesCategoryUiAuthorized: authorization.publicKickBattleLinesCategoryUiAuthorized,
  productionAcceptanceRequired: decision.productionAcceptanceRequired,
}, null, 2))
