import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const decision = json('docs/audits/12a9-kick-day-flow-category-public-cutover-decision.json')
const acceptance = json('docs/audits/12a9-kick-day-flow-category-post-repair-production-revalidation-acceptance.json')
const api = read('apps/web/functions/api/kick-day-flow.ts')
const controls = read('apps/web/src/live/day-flow-category-preview-entry.ts')
const kickPage = read('apps/web/kick/day-flow/index.html')
const twitchApi = read('apps/web/functions/api/day-flow.ts')
const candidateVerifier = read('scripts/verify-12a9-kick-day-flow-category-candidate.mjs')

assert.equal(decision.schemaVersion, 'viewloom-12a9-kick-day-flow-category-public-cutover-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 807)
assert.equal(decision.provider, 'kick')
assert.equal(decision.feature, 'day_flow_category_filter')
assert.equal(decision.decision, 'authorize_public_kick_day_flow_category_filter')
assert.equal(decision.authorization.publicKickDayFlowCategoryUiAuthorized, true)
assert.equal(decision.authorization.defaultRouteExposureAuthorized, true)
assert.equal(decision.productionAcceptanceRequired, true)

const behavior = decision.publicBehavior
assert.equal(behavior.defaultCategory, 'all')
assert.equal(behavior.urlCategoryParameter, 'category')
assert.equal(behavior.legacyCategoryPreviewParameter, 'categoryPreview=1')
assert.equal(behavior.legacyCategoryPreviewParameterAccepted, true)
assert.equal(behavior.legacyCategoryPreviewParameterRequired, false)
assert.equal(behavior.legacyCategoryPreviewParameterRemovedAfterPublicControlInteraction, true)
assert.equal(behavior.existingTopDefault, 20)
assert.deepEqual(behavior.existingAllowedTopValues, [10, 20, 50])
assert.equal(behavior.existingBucketDefaultMinutes, 5)
assert.deepEqual(behavior.existingAllowedBucketMinutes, [5, 10])
assert.equal(behavior.topControlSemanticsChanged, false)
assert.equal(behavior.bucketControlSemanticsChanged, false)
assert.equal(behavior.falseEmptyWhenGlobalObservationsExistForbidden, true)

const semantics = decision.acceptedSemantics
assert.equal(semantics.categoryIdentity, '(kick, categoryProviderId)')
assert.equal(semantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(semantics.filterBeforeTopN, true)
assert.equal(semantics.rankingMetric, 'viewer_minutes')
assert.equal(semantics.bucketAggregation, 'average_observed_stream_viewers')
assert.equal(semantics.missingMetadataZeroFilled, false)
assert.equal(semantics.fullShareDenominator, 'all_observed_kick_viewers_per_bucket')
assert.equal(semantics.topFocusShareDenominator, 'displayed_selected_category_top_n_viewers_per_bucket')
assert.equal(semantics.zeroMatchGlobalContextPreserved, true)
assert.equal(semantics.latestCategoryBackProjectionAllowed, false)
assert.equal(semantics.syntheticMappingAllowed, false)
assert.equal(semantics.nameOnlyIdentityAllowed, false)
assert.equal(semantics.crossProviderIdentityAllowed, false)

assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.acceptanceIssue, 805)
assert.equal(acceptance.acceptancePr, 806)
assert.equal(acceptance.acceptedResult.scenarioCount, 5)
assert.equal(acceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.failureCount, 0)
assert.equal(acceptance.acceptedResult.unknownCategoryState, 'unknown_category')
assert.equal(acceptance.acceptedResult.unknownCategorySelectedBandCount, 0)
assert.equal(acceptance.acceptedResult.unknownCategoryGlobalOthersCount, 1)
assert.equal(acceptance.acceptedResult.unknownCategoryChartRendered, true)
assert.equal(acceptance.acceptedResult.unknownCategoryFalseNoObservedCopyAbsent, true)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)

for (const fragment of [
  "const categoryCandidateRequested = url.searchParams.has('category')",
  "const requestedCategory = normalizeCategory(url.searchParams.get('category'))",
  "if (!categoryCandidateRequested)",
  "provider: 'kick'",
  "bucketAggregation: 'average'",
  "requestedCategory === 'all'",
  "implementationState: 'public'",
  'publicExposureAuthorized: true',
  'all_observed_kick_viewers_per_bucket',
  'displayed_selected_category_top_n_viewers_per_bucket',
  "if (filterState !== 'selected') {",
  'const others = makeGlobalOthers([], labels, totals, bucketSize)',
  'return { bands, streamers: [], totals, observed }',
]) assert.ok(api.includes(fragment), `public Kick API boundary missing: ${fragment}`)
assert.ok(!api.includes("implementationState: 'hidden_candidate'"), 'current Kick API still claims hidden candidate')
assert.ok(!api.includes('category_public_exposure=false'), 'current Kick API still claims public exposure false')
assert.ok(!api.includes('DB_TWITCH_HOT'), 'Kick API crossed into Twitch binding')

for (const fragment of [
  "const publicProvider = provider === 'twitch' || provider === 'kick'",
  'const enabled = publicProvider || legacyPreviewAtLoad',
  "const apiPath = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'",
  "if (legacyPreviewAtLoad && !publicInteractionSeen) next.searchParams.set(PREVIEW_PARAM, '1')",
  'if (publicInteractionSeen) next.searchParams.delete(PREVIEW_PARAM)',
  "return filter.implementationState === 'public' && filter.publicExposureAuthorized === true",
]) assert.ok(controls.includes(fragment), `public controls boundary missing: ${fragment}`)

assert.ok(kickPage.includes('data-dayflow-top="10"'))
assert.ok(kickPage.includes('class="active" data-dayflow-top="20"'))
assert.ok(kickPage.includes('data-dayflow-top="50"'))
assert.ok(kickPage.includes('class="active" data-dayflow-bucket="5"'))
assert.ok(kickPage.includes('data-dayflow-bucket="10"'))
assert.ok(twitchApi.includes("implementationState: 'public'"))
assert.ok(twitchApi.includes('publicExposureAuthorized: true'))
assert.ok(!twitchApi.includes("provider: 'kick'"))
assert.ok(candidateVerifier.includes("const HIDDEN_SHA = '27b3cca084d62d8badd512c068be415c6865965e'"))
assert.ok(candidateVerifier.includes('historicalVerifier: true'))

for (const key of [
  'kickHeatmapSemanticChangeAuthorized',
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
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: 809,
  decisionIssue: 807,
  hiddenAcceptancePr: 806,
  provider: 'kick',
  surface: 'day_flow',
  implementationState: 'public',
  publicExposureAuthorized: true,
  defaultCategory: 'all',
  top: { default: 20, allowed: [10, 20, 50] },
  bucket: { default: 5, allowed: [5, 10] },
  legacyPreviewCompatibility: true,
  productionAcceptanceRequired: true,
}, null, 2))
