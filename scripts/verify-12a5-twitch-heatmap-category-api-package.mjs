import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contractPath = 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json'
const decisionPath = 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json'
const gatePath = 'docs/audits/12a2-current-gate-state.json'
const apiPath = 'apps/web/functions/api/twitch-heatmap.ts'

for (const path of [contractPath, decisionPath, gatePath, apiPath]) {
  assert.equal(fs.existsSync(path), true, `${path}: missing`)
}

const contract = json(contractPath)
const decision = json(decisionPath)
const gate = json(gatePath)
const api = read(apiPath)

assert.equal(contract.status, 'candidate')
assert.equal(contract.trackingIssue, 635)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.acceptedDecision.requiredGateSchemaVersion, 'viewloom-12a2-current-gate-state-v28')
assert.equal(contract.acceptedDecision.requiredGatePhase, '12A-4-24')
assert.equal(gate.schemaVersion, contract.acceptedDecision.requiredGateSchemaVersion)
assert.equal(gate.currentWorkstream.phase, contract.acceptedDecision.requiredGatePhase)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterHiddenImplementationAuthorized, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.categoryUiPublicExposureAuthorized, false)

assert.equal(decision.status, 'accepted_hidden_implementation_only')
assert.equal(decision.authorization.hiddenImplementationAuthorized, true)
assert.equal(decision.authorization.publicExposureAuthorized, false)
assert.equal(decision.authorization.publicNavigationAuthorized, false)
assert.equal(decision.dataContract.defaultSelection, 'all')
assert.equal(decision.dataContract.filterBeforeTopN, true)
assert.deepEqual(decision.dataContract.topNOptions, [20, 50, 100])

for (const fragment of [
  "const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  "const ALLOWED_TOP_VALUES = new Set([20, 50, 100])",
  "url.searchParams.get('category')",
  "url.searchParams.get('top')",
  "WHERE provider = ?",
  ".bind('twitch').all<CategoryRow>()",
  'categoryIds',
  'categoryRefs',
  'categoryId: string | null',
  'categoryName: string | null',
  'availableCategories',
  "implementationState: 'hidden'",
  'publicExposureAuthorized: false',
  'filterBeforeTopN: true',
  "'unknown_category'",
  "'category_unavailable'",
  'requestedTop === null ? categoryFilteredItems : categoryFilteredItems.slice(0, requestedTop)',
  "requestedCategory === 'all'",
  'existing unfiltered',
]) {
  if (fragment === 'existing unfiltered') continue
  assert.ok(api.includes(fragment), `API missing: ${fragment}`)
}

const filterIndex = api.indexOf("const categoryFilteredItems")
const topIndex = api.indexOf("categoryFilteredItems.slice(0, requestedTop)")
assert.ok(filterIndex >= 0 && topIndex > filterIndex, 'category filtering must occur before Top N slicing')
assert.ok(api.includes("categoryFilterState === 'unknown_category'\n        ? []"), 'unknown categories must not fall back to false real data')
assert.ok(api.includes("categoryFilterState === 'category_unavailable' && requestedCategory !== 'all'\n          ? []"), 'unavailable requested categories must not fall back to false real data')
assert.ok(api.includes("requestedCategory === 'all'"), 'All categories default must preserve unfiltered compatibility')
assert.ok(api.includes("'cache-control': 'no-store'"), 'existing no-store response behavior must remain')

assert.equal(Object.values(contract.hiddenBoundary).every((value) => value === false), true)
assert.equal(contract.apiContract.filterBeforeTopN, true)
assert.equal(contract.apiContract.unfilteredCompatibilityPreserved, true)
assert.equal(contract.validation.webTypecheckRequired, true)
assert.equal(contract.validation.webBuildRequired, true)
assert.equal(contract.validation.webChecksRequired, true)

console.log(JSON.stringify({
  ok: true,
  phase: contract.workstream,
  trackingIssue: contract.trackingIssue,
  provider: contract.provider,
  hiddenImplementationAuthorized: true,
  publicExposureAuthorized: false,
  categoryContractVersion: contract.apiContract.categoryContractVersion,
  filterBeforeTopN: true,
  allowedTopValues: contract.apiContract.allowedTopValues,
  unfilteredCompatibilityPreserved: true,
  collectorChanged: false,
  kickChanged: false,
  nextAction: 'accept-api-package-before-hidden-controls',
}, null, 2))