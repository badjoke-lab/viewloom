import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const decisionPath = 'docs/audits/12a7-twitch-history-category-feasibility-decision.json'
const decision = json(decisionPath)
const historyApi = read('apps/web/functions/api/history.ts')
const historyBuilders = read('apps/web/functions/_history/builders.ts')
const historyModel = read('apps/web/functions/_history/model.ts')
const collector = read('workers/collector-twitch/src/index-category.ts')
const collectorEntry = read('workers/collector-twitch/src/entry.ts')
const categoryCapture = read('workers/shared/category-capture.ts')
const dayFlowCategoryCore = read('apps/web/functions/api/day-flow-category-core.mjs')
const categoryIntradayRollup = read('workers/shared/category-intraday-rollup.ts')
const categoryIntradaySql = read('workers/shared/category-intraday-sql.ts')
const categorySchema = read('workers/shared/category-schema.ts')

assert.equal(decision.schemaVersion, 'viewloom-12a7-twitch-history-category-feasibility-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-7')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 765)
assert.equal(decision.provider, 'twitch')
assert.equal(decision.surface, 'history')
assert.equal(decision.decision, 'authorize_hidden_twitch_history_category_candidate_with_raw_coverage_boundary')
assert.equal(decision.evidenceBasis.sourceMainSha, '014f50f650e9de282cec9d94ea60285c87c9bc57')
assert.equal(decision.evidenceBasis.categoryContractVersion, 'category-source-v1')
assert.equal(decision.evidenceBasis.minuteSnapshotRetentionDays, 30)
assert.equal(decision.evidenceBasis.historyMaximumRequestedDays, 90)
assert.equal(decision.evidenceBasis.categoryIntradayRetentionDays, 90)
assert.equal(decision.evidenceBasis.categoryIntradayDailyStreamerCap, 600)
assert.equal(decision.evidenceBasis.newCollectionRequired, false)
assert.equal(decision.evidenceBasis.newStorageRequired, false)

assert.deepEqual(decision.currentHistoryPath.unfilteredReadOrder, ['daily_rollups', 'minute_snapshots'])
assert.equal(decision.currentHistoryPath.dailyRollupsPreserveCategoryMembership, false)
assert.equal(decision.currentHistoryPath.currentRawParserPreservesCategoryMembership, false)
assert.equal(decision.currentHistoryPath.rawSnapshotsPreserveObservedCategoryMembership, true)
assert.equal(decision.currentHistoryPath.historyRuntimeChangeRequiredForCandidate, true)

assert.equal(decision.categorySemantics.identityScope, 'provider_scoped')
assert.equal(decision.categorySemantics.identityFormat, '(twitch, categoryProviderId)')
assert.equal(decision.categorySemantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(decision.categorySemantics.filterBeforeHistoryAggregation, true)
assert.equal(decision.categorySemantics.filterBeforeRanking, true)
for (const key of [
  'latestCategoryBackProjectionAllowed',
  'historicalNameBackProjectionAllowed',
  'syntheticMappingAllowed',
  'nameOnlyIdentityAllowed',
  'crossProviderIdentityAllowed',
  'crossProviderTotalsAllowed',
  'combinedProviderRankingAllowed',
]) assert.equal(decision.categorySemantics[key], false, `${key}: must remain false`)
assert.equal(decision.categorySemantics.dictionaryNameIsPresentationOnly, true)

assert.equal(decision.aggregationSemantics.unavailableDaysCountAsZero, false)
assert.equal(decision.aggregationSemantics.missingCategoryMetadataCountsAsZero, false)
assert.equal(decision.aggregationSemantics.silentRenormalizationAllowed, false)

assert.equal(decision.sourceBoundary.selectedCategoryPrimarySource, 'minute_snapshots_only')
assert.equal(decision.sourceBoundary.selectedCategoryMayUseDailyRollups, false)
assert.equal(decision.sourceBoundary.selectedCategoryMayUseCategoryIntradayRollupsAsPrimaryTotals, false)
assert.equal(decision.sourceBoundary.rawRetentionBoundaryMustBeVisible, true)
assert.equal(decision.sourceBoundary.unsupportedOlderDaysMustRemainUnavailable, true)
assert.equal(decision.sourceBoundary.automaticFallbackToUnfilteredForSelectedCategory, false)
assert.equal(decision.sourceBoundary.allCategoriesKeepsExistingUnfilteredReadOrder, true)

assert.equal(decision.coverageContract.required, true)
assert.equal(decision.coverageContract.primaryGranularity, 'day')
assert.equal(decision.coverageContract.underlyingGranularity, 'snapshot')
assert.deepEqual(decision.coverageContract.dayStates, ['observed', 'partial', 'unavailable'])
for (const key of [
  'unknownCategoryStateRequired',
  'selectedCategoryUnavailableStateRequired',
  'supportedFromRequired',
  'supportedToRequired',
  'observedDayCountRequired',
  'partialDayCountRequired',
  'unavailableDayCountRequired',
  'unavailableDatesRequired',
]) assert.equal(decision.coverageContract[key], true, `${key}: must remain true`)

assert.equal(decision.comparisonContract.categoryScoped, true)
assert.equal(decision.comparisonContract.alignedScopesRequired, true)
assert.equal(decision.comparisonContract.percentageChangesRequireSufficientCoverageOnBothSides, true)
assert.equal(decision.comparisonContract.previousScopeOutsideRetainedCategoryData, 'comparison_unavailable')

assert.equal(decision.candidateContract.implementationState, 'hidden_candidate')
assert.equal(decision.candidateContract.previewParameter, 'categoryPreview=1')
assert.equal(decision.candidateContract.categoryParameter, 'category')
assert.equal(decision.candidateContract.normalRouteDefault, 'all')
assert.equal(decision.candidateContract.publicDefaultRouteControlsVisible, false)
assert.equal(decision.candidateContract.existingUnfilteredResponseSemanticsMustRemainCompatible, true)
assert.equal(decision.candidateContract.selectedCategoryRequestMustBypassCategoryBlindDailyRollups, true)
assert.equal(decision.candidateContract.selectedCategoryResponseMustExposeCoverageBoundary, true)
assert.equal(decision.candidateContract.additionalExternalApiRequestsAllowed, false)
assert.equal(decision.candidateContract.additionalCollectorRequestsAllowed, false)

assert.equal(decision.authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.authorization.historyApiCategoryContractAuthorized, true)
assert.equal(decision.authorization.hiddenTwitchHistoryCategoryControlsAuthorized, true)
for (const key of [
  'defaultRoutePublicExposureAuthorized',
  'kickCategoryUiAuthorized',
  'collectorChangeAuthorized',
  'workerCollectorDeploymentAuthorized',
  'd1MutationAuthorized',
  'd1SchemaChangeAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'thresholdRelaxationAuthorized',
  'categoryIntradaySemanticsExpansionAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

// Current History is rollup-first and category-blind. A selected-category request
// therefore must not reuse the existing daily_rollups branch as category truth.
for (const fragment of [
  'const rollups = await tryRollups',
  'FROM daily_rollups',
  'FROM minute_snapshots',
  "dayCount(period.from, period.to) > 90",
]) assert.ok(historyApi.includes(fragment), `History API basis missing: ${fragment}`)
assert.equal(historyApi.includes("searchParams.get('category')"), false)
assert.ok(historyBuilders.includes('export type ParsedStream = { id: string; displayName: string; viewers: number }'))
assert.equal(historyBuilders.includes('categoryRefs'), false)
assert.ok(historyModel.includes("coverageState: string"))

// Accepted collector/category contract: category identity is captured from the
// Twitch observation and encoded alongside the same snapshot items.
for (const fragment of [
  "const categoryProviderId = String(stream.game_id ?? '').trim()",
  "const categoryName = String(stream.game_name ?? '').trim()",
  'encodeCategorySnapshot(input.items, input.hasMore)',
  '...encoded.payloadFields',
  'DELETE FROM minute_snapshots',
  "'-30 days'",
]) assert.ok(collector.includes(fragment), `Collector category/retention basis missing: ${fragment}`)
for (const fragment of [
  "export const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryIds: string[]',
  'categoryRefs: Array<number | null>',
  'provider_category_dictionary',
  'stripCategorySourceFields',
]) assert.ok(categoryCapture.includes(fragment), `Category contract basis missing: ${fragment}`)
for (const fragment of [
  'parsed.categoryRefs[item.rawIndex]',
  'parsed.categoryIds[ref]',
  "membershipEvaluation: 'per_observed_snapshot'",
  'latestCategoryBackProjectionAllowed: false',
]) assert.ok(dayFlowCategoryCore.includes(fragment), `Accepted per-snapshot projection basis missing: ${fragment}`)

// Existing 90-day intraday category data is intentionally not accepted as the
// exact History source: it is capped and keeps only a dominant category per hour.
assert.ok(categoryIntradayRollup.includes('const INTRADAY_RETENTION_DAYS = 90'))
assert.ok(collectorEntry.includes('streamerCap: 600'))
for (const fragment of [
  'WHERE daily_rank <= ?',
  'category_rank = 1',
  'dominant AS',
  'category_hourly_json',
]) assert.ok(categoryIntradaySql.includes(fragment), `Intraday lossiness basis missing: ${fragment}`)
assert.ok(categorySchema.includes("'category_hourly_json'"))

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  decisionPr: decision.decisionPr,
  decision: decision.decision,
  provider: decision.provider,
  selectedCategorySource: decision.sourceBoundary.selectedCategoryPrimarySource,
  rawRetentionDays: decision.evidenceBasis.minuteSnapshotRetentionDays,
  historyMaximumRequestedDays: decision.evidenceBasis.historyMaximumRequestedDays,
  categoryIntradayPrimaryTotalsAuthorized: decision.sourceBoundary.selectedCategoryMayUseCategoryIntradayRollupsAsPrimaryTotals,
  hiddenCandidateAuthorized: decision.authorization.hiddenCandidateImplementationAuthorized,
  publicExposureAuthorized: decision.authorization.defaultRoutePublicExposureAuthorized,
}, null, 2))
