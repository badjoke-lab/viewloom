import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const HIDDEN_PRODUCT_SHA = 'b921f15b127f13d7ad8a7f52976e4715d08919c1'
const contractPath = 'docs/audits/12a8-kick-heatmap-category-public-cutover-contract.json'
const decisionPath = 'docs/audits/12a8-kick-heatmap-category-public-cutover-decision.json'
const acceptancePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-acceptance.json'
const controlsPath = 'apps/web/src/features/twitch-heatmap/category-preview-controls.ts'
const apiPath = 'apps/web/functions/api/kick-heatmap.ts'
const browserPath = 'apps/web/scripts/kick-category-public-production-acceptance.mjs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
for (const path of [contractPath, decisionPath, acceptancePath, controlsPath, apiPath, browserPath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const contract = json(contractPath)
const decision = json(decisionPath)
const acceptance = json(acceptancePath)
const controls = read(controlsPath)
const api = read(apiPath)
const browser = read(browserPath)
const historicalControls = execFileSync('git', ['show', `${HIDDEN_PRODUCT_SHA}:${controlsPath}`], { encoding: 'utf8' })
const historicalApi = execFileSync('git', ['show', `${HIDDEN_PRODUCT_SHA}:${apiPath}`], { encoding: 'utf8' })

assert.equal(contract.schemaVersion, 'viewloom-12a8-kick-heatmap-category-public-cutover-contract-v1')
assert.equal(contract.status, 'implementation_candidate')
assert.equal(contract.phase, '12A-8-P2')
assert.equal(contract.parentTrackingIssue, 623)
assert.equal(contract.trackingIssue, 790)
assert.equal(contract.provider, 'kick')
assert.equal(contract.feature, 'heatmap_category_filter')
assert.equal(contract.acceptedDecision.issue, 788)
assert.equal(contract.acceptedDecision.pr, 789)
assert.equal(contract.acceptedDecision.mergeSha, '124d486b85a3e7e7a7fb06b4dfc2b5ea22d5e7a7')
assert.equal(contract.acceptedDecision.decision, 'authorize_public_kick_heatmap_category_filter')
assert.equal(contract.acceptedHiddenEvidence.pr, 787)
assert.equal(contract.acceptedHiddenEvidence.repairedHiddenProductSha, HIDDEN_PRODUCT_SHA)
assert.equal(contract.acceptedHiddenEvidence.workflowRun, 31371899291)
assert.equal(contract.acceptedHiddenEvidence.productionJob, 93402574458)
assert.equal(contract.acceptedHiddenEvidence.artifactId, 9056407163)
assert.equal(contract.acceptedHiddenEvidence.desktopHumanVisualPassed, true)
assert.equal(contract.acceptedHiddenEvidence.mobileHumanVisualPassed, true)

assert.equal(decision.schemaVersion, 'viewloom-12a8-kick-heatmap-category-public-cutover-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.trackingIssue, 788)
assert.equal(decision.decision, 'authorize_public_kick_heatmap_category_filter')
assert.equal(decision.authorization.publicKickCategoryUiAuthorized, true)
assert.equal(decision.authorization.defaultRouteExposureAuthorized, true)
assert.equal(decision.authorization.legacyPreviewCompatibilityAuthorized, true)
assert.equal(decision.productionAcceptanceRequired, true)

assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-acceptance-v3')
assert.equal(acceptance.status, 'accepted_corrected_visual_evidence')
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(acceptance.authorization.publicKickCategoryUiAuthorized, false)
assert.equal(acceptance.correctedEvidence.passedScenarioCount, 4)
assert.equal(acceptance.correctedEvidence.failureCount, 0)
assert.equal(acceptance.correctedEvidence.humanVisualDesktopPassed, true)
assert.equal(acceptance.correctedEvidence.humanVisualMobilePassed, true)

const runtime = contract.runtimeChanges
assert.equal(runtime.controls, controlsPath)
assert.equal(runtime.kickApi, apiPath)
assert.equal(runtime.controlsPublicOnNormalKickRoute, true)
assert.equal(runtime.kickApiImplementationState, 'public')
assert.equal(runtime.kickApiPublicExposureAuthorized, true)
assert.equal(runtime.legacyPreviewAccepted, true)
assert.equal(runtime.legacyPreviewRequired, false)
assert.equal(runtime.legacyPreviewRemovedOnInteraction, true)
assert.equal(runtime.dataSemanticsChangeAuthorized, false)
assert.equal(runtime.layoutSemanticsChangeAuthorized, false)
assert.equal(runtime.twitchRuntimeSemanticChangeAuthorized, false)

const behavior = contract.publicBehavior
assert.equal(behavior.defaultCategory, 'all')
assert.equal(behavior.defaultTop, 50)
assert.deepEqual(behavior.allowedTopValues, [20, 50, 100])
assert.equal(behavior.filterBeforeTopN, true)
assert.equal(behavior.categoryUrlParameter, 'category')
assert.equal(behavior.topUrlParameter, 'top')
assert.equal(behavior.legacyPreviewUrlParameter, 'categoryPreview')
assert.equal(behavior.categoryIdentity, '(kick, categoryProviderId)')
assert.equal(behavior.unknownCategoryReturnsItems, false)
assert.equal(behavior.selectedUnavailableCategoryReturnsItems, false)
assert.equal(behavior.allCategoriesUsesUnfilteredFallback, true)
assert.equal(behavior.selectedCategoryMomentumRequiresPreviousSameCategoryMembership, true)
assert.equal(behavior.incompatibleMomentumPresentation, 'neutral_n_a')

for (const fragment of [
  "const PREVIEW_PARAM = 'categoryPreview'",
  "const CATEGORY_PARAM = 'category'",
  "const TOP_PARAM = 'top'",
  'const TOP_VALUES = [20, 50, 100] as const',
  'const DEFAULT_TOP = 50',
  "const enabled = provider === 'twitch' || provider === 'kick'",
  "root.dataset.categoryFilter = 'public'",
  'aria-live="polite"',
  ':focus-visible',
  '@media (max-width: 760px)',
  'url.searchParams.delete(PREVIEW_PARAM)',
  'window.history.replaceState',
]) assert.ok(controls.includes(fragment), `public controls missing: ${fragment}`)
assert.equal(controls.includes("provider === 'kick' && url.searchParams.get(PREVIEW_PARAM) === '1'"), false)
assert.equal(controls.includes("if (provider === 'kick') url.searchParams.set(PREVIEW_PARAM, '1')"), false)
assert.equal(controls.includes("root.dataset.categoryFilter = options.provider === 'kick' ? 'hidden' : 'public'"), false)

for (const fragment of [
  "implementationState: 'public'",
  'publicExposureAuthorized: true',
  "const requestedCategory = normalizeCategory(url.searchParams.get('category'))",
  "const requestedTop = normalizeTop(url.searchParams.get('top'))",
  'FROM provider_category_dictionary',
  "WHERE provider = ?",
  ".bind('kick').all<CategoryRow>()",
  'filterBeforeTopN: true',
  "'unknown_category'",
  "'category_unavailable'",
  "sourceMode === 'official-livestreams'",
  "coverageState: 'unavailable'",
  "momentumScope: 'stream' | 'selected_category_compatible_observations'",
  'prior.categoryId !== selectedCategory',
  "momentumUnavailableReason: 'previous_category_missing_or_different'",
  'requestedTop === null ? categoryFilteredItems : categoryFilteredItems.slice(0, requestedTop)',
  "requestedCategory === 'all'",
  "'category_filter_public_exposure=true'",
]) assert.ok(api.includes(fragment), `public Kick API missing: ${fragment}`)
assert.equal(api.includes('Category candidate remains hidden.'), false)
assert.equal(api.includes('category_filter_public_exposure=false'), false)
assert.equal(api.includes('DB_TWITCH_HOT'), false)
assert.equal(api.includes(".bind('twitch')"), false)
assert.equal(api.includes('/api/twitch'), false)

const filterIndex = api.indexOf('const categoryFilteredItems')
const topIndex = api.indexOf('categoryFilteredItems.slice(0, requestedTop)')
assert.ok(filterIndex >= 0 && topIndex > filterIndex, 'category filtering must remain before Top N')
assert.ok(api.includes("categoryFilterState === 'unknown_category'\n        ? []"), 'unknown category must remain empty')
assert.ok(api.includes("categoryFilterState === 'category_unavailable' && requestedCategory !== 'all'\n          ? []"), 'unavailable selected category must remain empty')
assert.ok(api.includes('prior.categoryId !== selectedCategory'), 'cross-category previous observation must remain rejected')

// Prove that publicization changes only the explicitly authorized exposure boundary.
let normalizedControls = controls
normalizedControls = normalizedControls.replace(
  "const enabled = provider === 'twitch' || provider === 'kick'",
  "const enabled = provider === 'twitch' || (provider === 'kick' && url.searchParams.get(PREVIEW_PARAM) === '1')",
)
normalizedControls = normalizedControls.replaceAll(
  "root.dataset.categoryFilter = 'public'",
  "root.dataset.categoryFilter = options.provider === 'kick' ? 'hidden' : 'public'",
)
normalizedControls = normalizedControls.replace(
  '  url.searchParams.delete(PREVIEW_PARAM)\n',
  "  if (provider === 'kick') url.searchParams.set(PREVIEW_PARAM, '1')\n  else url.searchParams.delete(PREVIEW_PARAM)\n",
)
assert.equal(normalizedControls, historicalControls, 'controls changed beyond authorized public exposure boundary')

let normalizedApi = api
normalizedApi = normalizedApi.replaceAll("implementationState: 'public'", "implementationState: 'hidden'")
normalizedApi = normalizedApi.replaceAll('publicExposureAuthorized: true', 'publicExposureAuthorized: false')
normalizedApi = normalizedApi.replace(
  '? `${items.length} visible of ${allItems.length} normalized Kick streams from latest observed snapshot.`',
  '? `${items.length} visible of ${allItems.length} normalized Kick streams from latest observed snapshot. Category candidate remains hidden.`',
)
normalizedApi = normalizedApi.replace(
  '? `${items.length} visible of ${allItems.length} normalized Kick streams, but latest snapshot is stale.`',
  '? `${items.length} visible of ${allItems.length} normalized Kick streams, but latest snapshot is stale. Category candidate remains hidden.`',
)
normalizedApi = normalizedApi.replace("'category_filter_public_exposure=true'", "'category_filter_public_exposure=false'")
assert.equal(normalizedApi, historicalApi, 'Kick API changed beyond authorized public exposure metadata/copy boundary')

assert.equal(contract.historicalPackageCompatibility.hiddenApiVerifierUsesHistoricalProductSha, true)
assert.equal(contract.historicalPackageCompatibility.hiddenControlsVerifierUsesHistoricalProductSha, true)
assert.equal(contract.historicalPackageCompatibility.historicalProductSha, HIDDEN_PRODUCT_SHA)
assert.equal(contract.historicalPackageCompatibility.twitchPublicVerifierRecognizesKickPublicState, true)
assert.equal(contract.historicalPackageCompatibility.hiddenContractsRemainUnmodified, true)

const production = contract.productionAcceptance
assert.equal(production.required, true)
assert.equal(production.exactMainShaRequired, true)
assert.equal(production.singleSourceDeploymentEvidenceRequired, true)
assert.equal(production.desktopWidth, 1440)
assert.equal(production.mobileWidth, 390)
assert.deepEqual(production.requiredScenarios, [
  'kick-public-desktop',
  'kick-public-mobile',
  'kick-legacy-preview-compatibility',
  'kick-unknown-category-honest-empty',
  'twitch-public-controls-preserved',
])
for (const scenario of production.requiredScenarios) assert.ok(browser.includes(`'${scenario}'`), `browser scenario missing: ${scenario}`)
assert.ok(browser.includes("const sourcePath = path.join(OUT, 'last-deployment.json')"))
assert.ok(browser.includes("fs.readFileSync(sourcePath, 'utf8')"))
assert.equal(browser.includes('fetch(`${ORIGIN}/deployment.json'), false, 'browser must not perform a second deployment identity fetch')

const authorization = contract.authorization
assert.equal(authorization.publicKickCategoryUiImplementationAuthorized, true)
assert.equal(authorization.productionBrowserAcceptanceAuthorized, true)
assert.equal(authorization.publicRolloutAcceptedOnMerge, false)
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

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: contract.trackingIssue,
  decisionPr: contract.acceptedDecision.pr,
  hiddenProductSha: HIDDEN_PRODUCT_SHA,
  publicKickCategoryControls: true,
  defaultCategory: behavior.defaultCategory,
  defaultTop: behavior.defaultTop,
  allowedTopValues: behavior.allowedTopValues,
  apiSemanticDiffBeyondExposure: false,
  controlsSemanticDiffBeyondExposure: false,
  productionAcceptanceRequired: production.required,
  publicRolloutAcceptedOnMerge: authorization.publicRolloutAcceptedOnMerge,
}, null, 2))
