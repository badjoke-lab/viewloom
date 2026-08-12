import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const decisionPath = 'docs/audits/12a10-kick-battle-lines-category-public-cutover-decision.json'
const hiddenAcceptancePath = 'docs/audits/12a10-kick-battle-lines-category-hidden-production-acceptance.json'
const apiPath = 'apps/web/functions/api/kick-battle-lines.ts'
const controllerPath = 'apps/web/src/live/battle-lines-current-shell-entry.ts'
const twitchApiPath = 'apps/web/functions/api/battle-lines.ts'

for (const path of [decisionPath, hiddenAcceptancePath, apiPath, controllerPath, twitchApiPath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const decision = json(decisionPath)
const hiddenAcceptance = json(hiddenAcceptancePath)
const api = read(apiPath)
const controller = read(controllerPath)
const twitchApi = read(twitchApiPath)

assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.trackingIssue, 821)
assert.equal(decision.decision, 'authorize_public_kick_battle_lines_category_filter')
assert.equal(decision.authorization.publicKickBattleLinesCategoryUiAuthorized, true)
assert.equal(decision.authorization.defaultRouteExposureAuthorized, true)
assert.equal(decision.authorization.legacyPreviewCompatibilityAuthorized, true)
assert.equal(decision.productionAcceptanceRequired, true)
assert.equal(hiddenAcceptance.status, 'accepted_on_merge')
assert.equal(hiddenAcceptance.acceptanceIssue, 819)
assert.equal(hiddenAcceptance.acceptancePr, 820)
assert.equal(hiddenAcceptance.authorization.hiddenKickBattleLinesCategoryCandidateAccepted, true)

const noCategoryBranch = api.indexOf('if (!categoryCandidateRequested)')
const dictionaryRead = api.indexOf('FROM provider_category_dictionary')
assert.ok(noCategoryBranch > 0 && dictionaryRead > noCategoryBranch, 'direct no-category API fallback must return before category dictionary path')

for (const fragment of [
  "const categoryCandidateRequested = url.searchParams.has('category')",
  "const requestedCategory = normalizeBattleCategory(url.searchParams.get('category'))",
  "requestedCategory === 'all'",
  "buildBattleLinesPayload(compacted.rows, options)",
  "buildBattleLinesPayload(projection.rows, { ...options, categoryScoped: true })",
  "implementationState: 'public'",
  'publicExposureAuthorized: true',
  'filterBeforeCandidateCompaction: true',
  'filterBeforeTopN: true',
  'filterBeforeRecommendedBattleScoring: true',
  "candidateRankingMetric: 'category_qualified_viewer_minutes'",
  "selectedCategoryPointStates: ['observed', 'outside_category', 'category_unavailable', 'offline', 'not_observed', 'missing']",
  'outsideCategoryNeverZeroFilled: true',
  'categoryUnavailableNeverZeroFilled: true',
  'outsideCategoryExcludedFromMissingPenalty: true',
  'categoryUnavailableExcludedFromMissingPenalty: true',
  'battleOverlapRequiresCategoryQualifiedObserved: true',
  'unknownCategoryMaySubstituteGlobalLines: false',
  "'category_implementation_state=public'",
  "'category_public_exposure=true'",
  'FROM provider_category_dictionary',
  ".bind('kick').all<KickBattleCategoryDictionaryRow>()",
]) assert.ok(api.includes(fragment), `public Kick Battle Lines API missing: ${fragment}`)
assert.equal(api.includes("implementationState: 'hidden_candidate'"), false)
assert.equal(api.includes('publicExposureAuthorized: false'), false)
assert.equal(api.includes('DB_TWITCH_HOT'), false)

for (const fragment of [
  "const legacyCategoryPreviewRequested = provider === 'kick' && params.get('categoryPreview') === '1'",
  "const categoryControlsEnabled = provider === 'kick'",
  'let retainLegacyCategoryPreview = legacyCategoryPreviewRequested',
  'if (categoryControlsEnabled) installCategoryPreviewControl()',
  "if (categoryControlsEnabled) query.set('category', state.category)",
  "if (retainLegacyCategoryPreview) next.set('categoryPreview', '1')",
  "next.set('category', state.category)",
  'retainLegacyCategoryPreview = false',
  "root.dataset.battleCategoryPreview = 'public'",
  "filter.implementationState !== 'public' || filter.publicExposureAuthorized !== true",
  'data-battle-category-preview-select',
  '.battle-category-preview select{min-height:44px}',
]) assert.ok(controller.includes(fragment), `public Battle Lines controller missing: ${fragment}`)
assert.equal(controller.includes("const categoryPreviewEnabled = provider === 'kick'"), false)
assert.equal(controller.includes("root.dataset.battleCategoryPreview = 'hidden'"), false)
for (const forbidden of ['window.fetch =', 'window.history.replaceState =', 'URLSearchParams.prototype.get =']) {
  assert.equal(controller.includes(forbidden), false, `Battle Lines controller must retain native browser global: ${forbidden}`)
}

assert.equal(twitchApi.includes('battle-lines-category'), false, 'Twitch Battle Lines must not import Kick category implementation')
assert.equal(twitchApi.includes('categoryFilter'), false, 'Twitch Battle Lines category surface must remain absent')

const semantics = decision.acceptedSemantics
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
assert.equal(semantics.unknownCategoryMaySubstituteGlobalLines, false)

for (const key of [
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
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

console.log(JSON.stringify({
  status: 'pass',
  implementationIssue: 823,
  decisionIssue: 821,
  provider: 'kick',
  surface: 'battle_lines',
  implementationState: 'public',
  publicExposureAuthorized: true,
  normalRouteCategoryControls: true,
  legacyPreviewCompatibility: true,
  categoryFilterBeforeTopAndScoring: true,
  pointStates: semantics.selectedCategoryPointStates,
  mobileTouchTargetMinPx: decision.publicBehavior.mobileCategoryTouchTargetMinPx,
  productionAcceptanceRequired: true,
}, null, 2))
