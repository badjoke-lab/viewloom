import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contractPath = 'docs/audits/12a8-kick-heatmap-category-hidden-controls-contract.json'
const decisionPath = 'docs/audits/12a8-kick-heatmap-category-feasibility-decision.json'
const apiPackagePath = 'docs/audits/12a8-kick-heatmap-category-api-package-contract.json'
const twitchHtmlPath = 'apps/web/twitch/heatmap/index.html'
const kickHtmlPath = 'apps/web/kick/heatmap/index.html'

for (const path of [contractPath, decisionPath, apiPackagePath, twitchHtmlPath, kickHtmlPath]) {
  assert.equal(fs.existsSync(path), true, `${path}: missing`)
}

const contract = json(contractPath)
const decision = json(decisionPath)
const apiPackage = json(apiPackagePath)
const model = read(contract.package.model)
const controls = execFileSync('git', ['show', 'b921f15b127f13d7ad8a7f52976e4715d08919c1:apps/web/src/features/twitch-heatmap/category-preview-controls.ts'], { encoding: 'utf8' })
const runtime = read(contract.package.runtime)
const tiles = read(contract.package.tiles)
const twitchHtml = read(twitchHtmlPath)
const kickHtml = read(kickHtmlPath)

assert.equal(contract.status, 'candidate')
assert.equal(contract.provider, 'kick')
assert.equal(contract.trackingIssue, 770)
assert.equal(contract.acceptedInputs.decisionPr, 769)
assert.equal(contract.acceptedInputs.apiPackagePr, 771)
assert.equal(contract.acceptedInputs.apiPackageMustMergeBeforeControls, true)
assert.equal(decision.decision, 'authorize_hidden_kick_heatmap_category_candidate')
assert.equal(decision.authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.authorization.publicExposureAuthorized, false)
assert.equal(apiPackage.provider, 'kick')
assert.equal(apiPackage.apiContract.filterBeforeTopN, true)
assert.equal(apiPackage.hiddenBoundary.publicExposureAuthorized, false)

for (const fragment of [
  'HeatmapCategoryOption',
  'HeatmapCategoryFilterState',
  'HeatmapCategoryCoverageState',
  'HeatmapCategoryFilter',
  'momentumAvailable?: boolean',
  'momentumUnavailableReason?: string',
  'categoryId?: string | null',
  'categoryName?: string | null',
]) assert.ok(model.includes(fragment), `model missing: ${fragment}`)

for (const fragment of [
  "const PREVIEW_PARAM = 'categoryPreview'",
  "const CATEGORY_PARAM = 'category'",
  "const TOP_PARAM = 'top'",
  'const TOP_VALUES = [20, 50, 100] as const',
  'const DEFAULT_TOP = 50',
  "provider === 'twitch' || (provider === 'kick' && url.searchParams.get(PREVIEW_PARAM) === '1')",
  "root.dataset.categoryFilter = options.provider === 'kick' ? 'hidden' : 'public'",
  'aria-live="polite"',
  ':focus-visible',
  '@media (max-width: 760px)',
  "if (provider === 'kick') url.searchParams.set(PREVIEW_PARAM, '1')",
  'else url.searchParams.delete(PREVIEW_PARAM)',
  "title: `Unknown ${providerLabel} category`",
  'window.history.replaceState',
]) assert.ok(controls.includes(fragment), `controls missing: ${fragment}`)

for (const fragment of [
  'readCategoryPreviewState(provider.key)',
  'buildCategoryPreviewEndpoint(provider.endpoint, provider.key, categoryPreview)',
  'installCategoryPreviewControls',
  'syncCategoryPreviewControls',
  'categoryPreviewMessage(data.categoryFilter, provider.key)',
  'Array.isArray(record.availableCategories)',
  'isRecord(record.categoryFilter)',
  'availableCategories,',
  'categoryFilter,',
  'momentumAvailable: optionalBoolean(raw.momentumAvailable)',
  'momentumUnavailableReason: stringValue(raw.momentumUnavailableReason) || undefined',
  "item.momentumAvailable === false ? 'Unavailable' : formatSignedPercent(item.momentum)",
  'latest real ${provider.label} snapshot',
  'categoryId: stringValue(raw.categoryId) || null',
  'categoryName: stringValue(raw.categoryName) || null',
]) assert.ok(runtime.includes(fragment), `runtime missing: ${fragment}`)

for (const fragment of [
  "const MOMENTUM_UNAVAILABLE_COLOR = 'rgba(203,213,225,0.62)'",
  "const momentumAvailable = node.momentumAvailable !== false",
  "const momentum = momentumAvailable ? formatSignedPercent(node.momentum) : 'N/A'",
  'const momentumFill = momentumAvailable ? momentumColor(node.momentum) : MOMENTUM_UNAVAILABLE_COLOR',
  'if (node.momentumAvailable === false)',
  'return `hsl(220 10% ${lightness.toFixed(1)}%)`',
]) assert.ok(tiles.includes(fragment), `tiles missing: ${fragment}`)

assert.equal(contract.hiddenEntry.queryParameter, 'categoryPreview')
assert.equal(contract.hiddenEntry.queryValue, '1')
assert.equal(contract.hiddenEntry.kickOnlyHiddenGate, true)
assert.equal(contract.hiddenEntry.twitchPublicBehaviorPreserved, true)
assert.equal(contract.hiddenEntry.publicKickExposureAuthorized, false)
assert.deepEqual(contract.controls.topValues, [20, 50, 100])
assert.equal(contract.controls.defaultTop, 50)
assert.equal(contract.controls.defaultCategory, 'all')
assert.equal(contract.controls.kickPreviewParameterPersistedOnInteraction, true)
assert.equal(contract.controls.twitchLegacyPreviewParameterRemovedOnInteraction, true)
assert.equal(contract.dataTruth.availableCategoriesPreservedThroughSharedResponseAdapter, true)
assert.equal(contract.dataTruth.categoryFilterPreservedThroughSharedResponseAdapter, true)
assert.equal(contract.dataTruth.selectedCategoryMomentumUnavailableStatePreserved, true)
assert.equal(contract.dataTruth.selectedCategoryMomentumUnavailableTilePresentation, 'neutral_na_not_flat_zero')
assert.equal(contract.providerBoundary.normalKickRouteControlAbsenceRequired, true)
assert.equal(contract.providerBoundary.twitchPublicCategoryControlsRemainEnabled, true)
assert.equal(contract.providerBoundary.crossProviderRequestsAllowed, false)
assert.equal(contract.validation.unavailableMomentumTileRenderingRequired, true)

for (const html of [twitchHtml, kickHtml]) {
  assert.equal(html.includes('categoryPreview'), false, 'public HTML must not expose hidden preview query')
  assert.equal(html.includes('heatmap-category-preview-controls'), false, 'public HTML must not contain runtime category controls')
  assert.equal(html.includes('data-category-preview-select'), false, 'public HTML must not contain category select')
}
assert.equal(kickHtml.includes('All categories'), false, 'normal Kick HTML must remain category-control free')

const kickPreviewGateIndex = controls.indexOf("provider === 'kick' && url.searchParams.get(PREVIEW_PARAM) === '1'")
const insertIndex = controls.indexOf('root.id = ROOT_ID')
assert.ok(kickPreviewGateIndex >= 0 && insertIndex > kickPreviewGateIndex, 'Kick hidden preview gate must exist before control insertion')

for (const [key, value] of Object.entries(contract.pullRequestBoundary)) {
  assert.equal(value, false, `${key}: must remain false`)
}

console.log(JSON.stringify({
  ok: true,
  workstream: contract.workstream,
  trackingIssue: contract.trackingIssue,
  provider: contract.provider,
  hiddenEntry: 'categoryPreview=1',
  publicKickExposureAuthorized: false,
  normalKickRouteControls: false,
  twitchPublicBehaviorPreserved: true,
  allCategoriesDefault: true,
  topValues: contract.controls.topValues,
  momentumUnavailableStatePreserved: true,
  momentumUnavailableTilePresentation: contract.dataTruth.selectedCategoryMomentumUnavailableTilePresentation,
  mobileResponsive: true,
  keyboardAccessible: true,
  nextAction: 'merge-api-then-retarget-controls-and-run-hidden-production-revalidation',
}, null, 2))
