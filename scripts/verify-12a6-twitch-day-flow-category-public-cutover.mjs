import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const decisionPath = 'docs/audits/12a6-twitch-day-flow-category-public-cutover-decision.json'
const hiddenAcceptancePath = 'docs/audits/12a6-twitch-day-flow-category-hidden-production-revalidation-acceptance.json'
const twitchEntryPath = 'apps/web/src/live/day-flow-twitch-entry.ts'
const categoryEntryPath = 'apps/web/src/live/day-flow-category-preview-entry.ts'
const apiPath = 'apps/web/functions/api/day-flow.ts'
const twitchPagePath = 'apps/web/twitch/day-flow/index.html'
const kickPagePath = 'apps/web/kick/day-flow/index.html'
const candidateWorkflow = '.github/workflows/analytics-12a6-twitch-day-flow-category-candidate.yml'

for (const path of [decisionPath, hiddenAcceptancePath, twitchEntryPath, categoryEntryPath, apiPath, twitchPagePath, kickPagePath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(candidateWorkflow), false, 'hidden candidate workflow must be retired before public cutover')

const decision = json(decisionPath)
const hiddenAcceptance = json(hiddenAcceptancePath)
const twitchEntry = read(twitchEntryPath)
const categoryEntry = read(categoryEntryPath)
const api = read(apiPath)
const twitchPage = read(twitchPagePath)
const kickPage = read(kickPagePath)

assert.equal(decision.schemaVersion, 'viewloom-12a6-twitch-day-flow-category-public-cutover-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 757)
assert.equal(decision.provider, 'twitch')
assert.equal(decision.feature, 'day_flow_category_filter')
assert.equal(decision.decision, 'authorize_public_twitch_day_flow_category_filter')
assert.equal(decision.semanticsDecision.pr, 744)
assert.equal(decision.hiddenImplementation.pr, 746)
assert.equal(decision.hiddenProductionRevalidation.acceptancePr, 756)
assert.equal(decision.hiddenProductionRevalidation.acceptanceMergeSha, '1eb12993523f4bef1ce197f6c36307234037270d')
assert.equal(decision.hiddenProductionRevalidation.workflowRunId, 31304640405)
assert.equal(decision.hiddenProductionRevalidation.productionJobId, 93222956254)
assert.equal(decision.hiddenProductionRevalidation.artifactId, 9035560024)
assert.equal(decision.hiddenProductionRevalidation.passedScenarioCount, 5)
assert.equal(decision.hiddenProductionRevalidation.failureCount, 0)
assert.equal(decision.hiddenProductionRevalidation.categoryOptionsObserved, 413)
assert.equal(decision.hiddenProductionRevalidation.globalTotalsPreserved, true)
assert.equal(decision.hiddenProductionRevalidation.mobileOverflow, false)
assert.equal(decision.hiddenProductionRevalidation.providerSeparationPass, true)
assert.equal(decision.publicBehavior.normalTwitchRouteEnabled, true)
assert.equal(decision.publicBehavior.defaultCategory, 'all')
assert.equal(decision.publicBehavior.filterBeforeTopN, true)
assert.equal(decision.publicBehavior.selectedCategoryRanking, 'matching_category_viewer_minutes')
assert.equal(decision.publicBehavior.urlCategoryParameter, 'category')
assert.equal(decision.publicBehavior.legacyCategoryPreviewParameterAccepted, true)
assert.equal(decision.publicBehavior.legacyCategoryPreviewParameterRequired, false)
assert.equal(decision.publicBehavior.legacyCategoryPreviewParameterRemovedAfterControlInteraction, true)
assert.equal(decision.publicBehavior.fullShareDenominator, 'all_observed_twitch_viewers_per_bucket')
assert.equal(decision.publicBehavior.topFocusShareDenominator, 'displayed_selected_category_top_n_viewers_per_bucket')
assert.equal(decision.publicBehavior.selectedFullModeRetainsGlobalOthers, true)
assert.equal(decision.publicBehavior.partialCoverageDisclosed, true)
assert.equal(decision.publicBehavior.missingCategoryMetadataInferredAsZero, false)
assert.equal(decision.publicBehavior.unknownCategoryReturnsEmptyHonestState, true)
assert.equal(decision.publicBehavior.unfilteredApiFallbackWithoutCategoryParameterRetained, true)
assert.equal(decision.productionPath.mode, 'cloudflare_pages_git_integration')
assert.equal(decision.productionPath.evidenceIssue, 751)
assert.equal(decision.productionPath.evidencePr, 752)
assert.equal(decision.productionPath.manualWranglerRequired, false)
assert.equal(decision.productionPath.exactPrimaryOriginShaRequired, true)
assert.equal(decision.authorization.publicTwitchDayFlowCategoryUiAuthorized, true)
assert.equal(decision.authorization.defaultRouteExposureAuthorized, true)
assert.equal(decision.authorization.publicNavigationAuthorized, false)
assert.equal(decision.authorization.historyCategoryUiAuthorized, false)
assert.equal(decision.authorization.kickCategoryUiAuthorized, false)
for (const key of [
  'collectorChangeAuthorized', 'workerDeploymentAuthorized', 'd1MutationAuthorized', 'schemaChangeAuthorized',
  'bindingChangeAuthorized', 'cadenceChangeAuthorized', 'retentionChangeAuthorized', 'backfillAuthorized',
  'thresholdRelaxationAuthorized', 'crossProviderBehaviorAuthorized', 'combinedProviderRankingAuthorized',
  'cloudflareCredentialMutationAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)
assert.equal(decision.publicCutoverPr, 758)
assert.equal(decision.productionAcceptanceRequired, true)

assert.equal(hiddenAcceptance.status, 'accepted_on_merge')
assert.equal(hiddenAcceptance.acceptancePr, 756)
assert.equal(hiddenAcceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(hiddenAcceptance.authorization.publicTwitchDayFlowCategoryUiAuthorized, false)

for (const fragment of [
  "const enabled = provider === 'twitch'",
  "root.dataset.dayflowCategoryPreview = 'public'",
  '<label class="toolbar-label" for="dayflow-category-preview-select">Category</label>',
  'aria-label="Twitch Day Flow category"',
  "filter.implementationState !== 'public'",
  'filter.publicExposureAuthorized !== true',
  'url.searchParams.delete(PREVIEW_PARAM)',
  "requestUrl.searchParams.set(CATEGORY_PARAM, selectedCategory)",
  'no zero inferred',
  'Unknown Twitch category',
]) assert.ok(categoryEntry.includes(fragment), `public category entry missing: ${fragment}`)
assert.equal(categoryEntry.includes("initialUrl.searchParams.get(PREVIEW_PARAM) === '1'"), false, 'public UI must not require categoryPreview=1')

for (const fragment of [
  "import './day-flow-category-preview-entry'",
  "void import('./day-flow-current-shell-entry')",
  "categoryRoot.style.flex = '0 0 100%'",
  "categoryRoot.style.width = '100%'",
]) assert.ok(twitchEntry.includes(fragment), `Twitch public bootstrap missing: ${fragment}`)

for (const fragment of [
  "implementationState: 'public'",
  'publicExposureAuthorized: true',
  'ViewLoom public Twitch Day Flow category filter generated from existing observed minute snapshots.',
  'category_implementation_state=public',
  'category_public_exposure=true',
  'category_filter_before_top_n=true',
  'category_full_share_denominator=all_observed_twitch_viewers_per_bucket',
  'category_top_focus_share_denominator=displayed_selected_category_top_n_viewers_per_bucket',
]) assert.ok(api.includes(fragment), `public Day Flow API missing: ${fragment}`)
assert.ok(api.includes('if (!categoryCandidateRequested)'), 'category-agnostic direct API fallback must remain')

assert.ok(twitchPage.includes('/src/live/day-flow-twitch-entry.ts'), 'Twitch Day Flow public bootstrap missing')
assert.equal(twitchPage.includes('dayflow-category-preview-controls'), false, 'public category controls must still be runtime-owned, not duplicated statically')
assert.ok(kickPage.includes('/src/live/day-flow-current-shell-entry.ts'), 'Kick shared Day Flow controller missing')
assert.equal(kickPage.includes('/src/live/day-flow-twitch-entry.ts'), false, 'Kick must not load Twitch category bootstrap')
assert.equal(kickPage.includes('dayflow-category-preview-controls'), false, 'Kick must not contain Twitch category controls')

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  publicCutoverPr: decision.publicCutoverPr,
  hiddenAcceptancePr: decision.hiddenProductionRevalidation.acceptancePr,
  publicTwitchDayFlowCategoryUiAuthorized: decision.authorization.publicTwitchDayFlowCategoryUiAuthorized,
  kickCategoryUiAuthorized: decision.authorization.kickCategoryUiAuthorized,
  productionAcceptanceRequired: decision.productionAcceptanceRequired,
}, null, 2))
