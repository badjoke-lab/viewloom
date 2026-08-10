import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contractPath = 'docs/audits/12a8-kick-heatmap-category-api-package-contract.json'
const decisionPath = 'docs/audits/12a8-kick-heatmap-category-feasibility-decision.json'
const gatePath = 'docs/audits/12a2-current-gate-state.json'
const apiPath = 'apps/web/functions/api/kick-heatmap.ts'

for (const path of [contractPath, decisionPath, gatePath, apiPath]) {
  assert.equal(fs.existsSync(path), true, `${path}: missing`)
}

const contract = json(contractPath)
const decision = json(decisionPath)
const gate = json(gatePath)
const api = execFileSync('git', ['show', 'b921f15b127f13d7ad8a7f52976e4715d08919c1:apps/web/functions/api/kick-heatmap.ts'], { encoding: 'utf8' })

assert.equal(contract.status, 'candidate')
assert.equal(contract.trackingIssue, 770)
assert.equal(contract.parentTrackingIssue, 623)
assert.equal(contract.provider, 'kick')
assert.equal(decision.trackingIssue, 768)
assert.equal(decision.decision, contract.acceptedDecision.requiredDecision)
assert.equal(decision.authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.authorization.publicExposureAuthorized, false)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.currentWorkstream.kickFinalAcceptancePr, 648)
assert.equal(gate.currentWorkstream.kickPermanentObservationAccepted, true)

assert.equal(contract.apiContract.categoryContractVersion, 'category-source-v1')
assert.deepEqual(contract.apiContract.allowedTopValues, [20, 50, 100])
assert.deepEqual(contract.apiContract.coverageStates, ['observed', 'partial', 'unavailable'])
assert.equal(contract.apiContract.filterBeforeTopN, true)
assert.equal(contract.apiContract.providerDictionary, 'kick')
assert.equal(contract.apiContract.unfilteredCompatibilityPreserved, true)
assert.equal(contract.momentumContract.selectedCategoryPreviousMembershipMustMatch, true)
assert.equal(contract.momentumContract.crossCategoryDeltaProhibited, true)
assert.equal(contract.sourceBoundary.primaryCategorySourceMode, 'official-livestreams')
assert.equal(contract.sourceBoundary.fallbackSourceMayNotInventCategory, true)

for (const fragment of [
  "const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'const ALLOWED_TOP_VALUES = new Set([20, 50, 100])',
  "url.searchParams.get('category')",
  "url.searchParams.get('top')",
  'FROM provider_category_dictionary',
  "WHERE provider = ?",
  ".bind('kick').all<CategoryRow>()",
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
  "sourceMode === 'official-livestreams'",
  "coverageState: 'unavailable'",
  "momentumScope: 'stream' | 'selected_category_compatible_observations'",
  'prior.categoryId !== selectedCategory',
  "momentumUnavailableReason: 'previous_category_missing_or_different'",
  'requestedTop === null ? categoryFilteredItems : categoryFilteredItems.slice(0, requestedTop)',
  "requestedCategory === 'all'",
]) {
  assert.ok(api.includes(fragment), `API missing: ${fragment}`)
}

const filterIndex = api.indexOf('const categoryFilteredItems')
const topIndex = api.indexOf('categoryFilteredItems.slice(0, requestedTop)')
assert.ok(filterIndex >= 0 && topIndex > filterIndex, 'category filtering must occur before Top N slicing')
assert.ok(api.includes("categoryFilterState === 'unknown_category'\n        ? []"), 'unknown categories must not return inferred items')
assert.ok(api.includes("categoryFilterState === 'category_unavailable' && requestedCategory !== 'all'\n          ? []"), 'unavailable selected categories must not silently fall back to All')
assert.ok(api.includes("const acceptedPrimarySource = sourceMode === 'official-livestreams'"), 'official livestreams must remain the accepted primary category source')
assert.ok(api.includes("!acceptedPrimarySource || categoryMissingItems > 0 || dictionaryMissingItems > 0"), 'fallback or missing metadata must remain partial')
assert.ok(api.includes('prior.categoryId !== selectedCategory'), 'selected-category momentum must reject cross-category previous observations')
assert.ok(api.includes("'cache-control': 'no-store'"), 'no-store API response behavior must remain')

assert.equal(contract.hiddenBoundary.implementationState, 'hidden')
for (const [key, value] of Object.entries(contract.hiddenBoundary)) {
  if (key === 'implementationState') continue
  assert.equal(value, false, `${key}: must remain false`)
}
assert.equal(contract.validation.decisionVerifierRequired, true)
assert.equal(contract.validation.apiStaticContractRequired, true)
assert.equal(contract.validation.categoryRolloutPolicyRequired, true)
assert.equal(contract.validation.webTypecheckRequired, true)
assert.equal(contract.validation.webBuildRequired, true)

assert.equal(api.includes('DB_TWITCH_HOT'), false, 'Kick API must not read Twitch storage')
assert.equal(api.includes(".bind('twitch')"), false, 'Kick API must not bind Twitch provider')
assert.equal(api.includes('/api/twitch'), false, 'Kick API must not call Twitch endpoints')

console.log(JSON.stringify({
  ok: true,
  workstream: contract.workstream,
  trackingIssue: contract.trackingIssue,
  provider: contract.provider,
  implementationState: contract.hiddenBoundary.implementationState,
  publicExposureAuthorized: contract.hiddenBoundary.publicExposureAuthorized,
  categoryContractVersion: contract.apiContract.categoryContractVersion,
  filterBeforeTopN: contract.apiContract.filterBeforeTopN,
  selectedCategoryMomentumCompatibleOnly: contract.momentumContract.selectedCategoryPreviousMembershipMustMatch,
  primaryCategorySourceMode: contract.sourceBoundary.primaryCategorySourceMode,
  nextAction: 'accept-api-package-before-hidden-controls',
}, null, 2))
