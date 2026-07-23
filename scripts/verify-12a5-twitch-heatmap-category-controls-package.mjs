import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contractPath = 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json'
const gatePath = 'docs/audits/12a2-current-gate-state.json'
const decisionPath = 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json'
const apiPackagePath = 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json'
const twitchHtmlPath = 'apps/web/twitch/heatmap/index.html'
const kickHtmlPath = 'apps/web/kick/heatmap/index.html'

for (const path of [contractPath, gatePath, decisionPath, apiPackagePath, twitchHtmlPath, kickHtmlPath]) {
  assert.equal(fs.existsSync(path), true, `${path}: missing`)
}

const contract = json(contractPath)
const gate = json(gatePath)
const decision = json(decisionPath)
const apiPackage = json(apiPackagePath)
const model = read(contract.package.model)
const controls = read(contract.package.controls)
const runtime = read(contract.package.runtime)
const twitchHtml = read(twitchHtmlPath)
const kickHtml = read(kickHtmlPath)

assert.equal(contract.status, 'candidate')
assert.equal(contract.provider, 'twitch')
assert.equal(contract.trackingIssue, 635)
assert.equal(contract.acceptedInputs.requiredGateSchemaVersion, 'viewloom-12a2-current-gate-state-v29')
assert.equal(contract.acceptedInputs.requiredGatePhase, '12A-4-24')
assert.equal(gate.schemaVersion, contract.acceptedInputs.requiredGateSchemaVersion)
assert.equal(gate.currentWorkstream.phase, contract.acceptedInputs.requiredGatePhase)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryApiPackageAccepted, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryHiddenControlsAccepted, false)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(decision.status, 'accepted_hidden_implementation_only')
assert.equal(decision.authorization.hiddenImplementationAuthorized, true)
assert.equal(decision.authorization.publicExposureAuthorized, false)
assert.equal(apiPackage.status, 'accepted')
assert.equal(apiPackage.acceptance.packagePr, 638)
assert.equal(apiPackage.acceptance.packageMergeSha, contract.acceptedInputs.apiPackageMergeSha)

for (const fragment of [
  'HeatmapCategoryOption',
  'HeatmapCategoryFilterState',
  'HeatmapCategoryCoverageState',
  'HeatmapCategoryFilter',
  "implementationState: 'hidden'",
  'publicExposureAuthorized: false',
  'categoryId?: string | null',
  'categoryName?: string | null',
]) assert.ok(model.includes(fragment), `model missing: ${fragment}`)

for (const fragment of [
  "const PREVIEW_PARAM = 'categoryPreview'",
  "const PREVIEW_VALUE = '1'",
  "provider === 'twitch'",
  "url.searchParams.get(PREVIEW_PARAM) === PREVIEW_VALUE",
  "const DEFAULT_TOP = 50",
  'const TOP_VALUES = [20, 50, 100] as const',
  "'<option value=\"all\">All categories</option>'",
  'data-hidden-preview',
  'aria-label="Twitch category preview"',
  'aria-live="polite"',
  ':focus-visible',
  '@media (max-width: 760px)',
  'public exposure disabled',
  'categoryPreviewMessage',
  "filter.state === 'unknown_category'",
  "filter.state === 'category_unavailable'",
  'window.history.replaceState',
]) assert.ok(controls.includes(fragment), `controls missing: ${fragment}`)

for (const fragment of [
  'readCategoryPreviewState(provider.key)',
  'buildCategoryPreviewEndpoint(provider.endpoint, provider.key, categoryPreview)',
  'installCategoryPreviewControls',
  'syncCategoryPreviewControls',
  'categoryPreviewMessage(data.categoryFilter)',
  'Array.isArray(data.items) ? data.items : []',
  'responseItems.length > 0 || categoryPreview.enabled ? responseItems : payload.items',
  "data.categoryFilter?.state === 'selected'",
  'categoryId: stringValue(raw.categoryId) || null',
  'categoryName: stringValue(raw.categoryName) || null',
]) assert.ok(runtime.includes(fragment), `runtime missing: ${fragment}`)

assert.equal(contract.hiddenEntry.queryParameter, 'categoryPreview')
assert.equal(contract.hiddenEntry.queryValue, '1')
assert.equal(contract.hiddenEntry.twitchOnly, true)
assert.equal(contract.controls.defaultCategory, 'all')
assert.deepEqual(contract.controls.topValues, [20, 50, 100])
assert.equal(contract.controls.defaultTop, 50)
assert.equal(contract.dataTruth.filterBeforeTopN, true)
assert.equal(contract.dataTruth.unknownCategoryMustNotFallbackToFalseReal, true)
assert.equal(contract.dataTruth.unavailableSelectedCategoryMustNotFallbackToFalseReal, true)
assert.equal(contract.dataTruth.allCategoriesPreservesUnfilteredCompatibility, true)
assert.equal(contract.publicGate.earliestAuditAt, '2026-07-27T11:40:00.000Z')
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

for (const html of [twitchHtml, kickHtml]) {
  assert.equal(html.includes('categoryPreview'), false, 'public HTML must not expose preview query')
  assert.equal(html.includes('heatmap-category-preview-controls'), false, 'public HTML must not contain category preview controls')
  assert.equal(html.includes('data-category-preview-select'), false, 'public HTML must not contain category select')
}
assert.equal(kickHtml.includes('Category preview'), false)

const previewGateIndex = controls.indexOf("provider === 'twitch'")
const insertIndex = controls.indexOf("root.id = ROOT_ID")
assert.ok(previewGateIndex >= 0 && insertIndex > previewGateIndex, 'Twitch-only preview gate must precede control insertion')

console.log(JSON.stringify({
  ok: true,
  phase: contract.workstream,
  trackingIssue: 635,
  provider: 'twitch',
  hiddenEntry: 'categoryPreview=1',
  publicExposureAuthorized: false,
  publicHtmlChanged: false,
  kickControlsAdded: false,
  allCategoriesDefault: true,
  topValues: [20, 50, 100],
  providerSpecificUrlState: true,
  mobileResponsive: true,
  keyboardAccessible: true,
  existingUnfilteredFallbackPreserved: true,
  nextAction: 'accept-hidden-controls-before-seven-day-audit',
}, null, 2))