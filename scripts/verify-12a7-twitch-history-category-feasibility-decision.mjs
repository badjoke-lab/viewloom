import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const decisionPath = 'docs/audits/12a7-twitch-history-category-feasibility-decision.json'
const decision = json(decisionPath)
const historyApi = read('apps/web/functions/api/history.ts')
const heatmapApi = read('apps/web/functions/api/twitch-heatmap.ts')
const retentionSql = read('db/d1/005_retention_cleanup.sql')
const twitchEntry = read('workers/collector-twitch/src/entry.ts')
const twitchPermanent = read('workers/collector-twitch/wrangler.category-permanent.toml')
const categoryIntraday = read('workers/shared/category-intraday-rollup.ts')
const categoryIntradaySql = read('workers/shared/category-intraday-sql.ts')

assert.equal(decision.schemaVersion, 'viewloom-12a7-twitch-history-category-feasibility-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-7')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 765)
assert.equal(decision.provider, 'twitch')
assert.equal(decision.surface, 'history')
assert.equal(decision.decision, 'reject_twitch_history_category_surface_on_current_data')
assert.equal(decision.evidenceBasis.sourceMainSha, '014f50f650e9de282cec9d94ea60285c87c9bc57')
assert.equal(decision.evidenceBasis.categoryContractVersion, 'category-source-v1')

assert.equal(decision.currentHistorySemantics.maximumCustomRangeDays, 90)
assert.equal(decision.currentHistorySemantics.primarySourcePreference, 'daily_rollups_then_minute_snapshots')
assert.equal(decision.currentHistorySemantics.dailyRollupsRetainCategoryMembership, false)
assert.equal(decision.currentHistorySemantics.unfilteredHistoryMustRemainBackwardCompatible, true)

assert.equal(decision.currentCategoryData.snapshotMembershipEvaluation, 'per_observed_snapshot')
assert.equal(decision.currentCategoryData.snapshotCategoryIdentity, 'provider_scoped_category_id')
assert.equal(decision.currentCategoryData.snapshotCategoryRefsAlignedToStreamItems, true)
assert.equal(decision.currentCategoryData.snapshotRetentionDays, 30)
assert.equal(decision.currentCategoryData.dailyRollupRetentionDays, 180)
assert.equal(decision.currentCategoryData.intradayCategoryRetentionDays, 90)
assert.equal(decision.currentCategoryData.permanentCategoryCaptureEnabled, true)
assert.equal(decision.currentCategoryData.permanentIntradayGenerationEnabled, true)

assert.equal(decision.intradayCompressionLimits.streamerSelectionBasis, 'unfiltered_daily_viewer_minutes_rank')
assert.equal(decision.intradayCompressionLimits.retainedStreamerCap, 600)
assert.equal(decision.intradayCompressionLimits.categoryRepresentation, 'dominant_category_per_streamer_per_hour')
assert.equal(decision.intradayCompressionLimits.nonDominantCategoryContributionsPreserved, false)
assert.equal(decision.intradayCompressionLimits.categorySpecificFilterBeforeStreamerCapRecoverable, false)
assert.equal(decision.intradayCompressionLimits.exactCategoryViewerMinutesRecoverableForAllCategories, false)
assert.equal(decision.intradayCompressionLimits.exactCategoryPeakViewersRecoverableForAllCategories, false)

for (const key of [
  'latestCategoryBackProjectionAllowed',
  'syntheticMappingAllowed',
  'nameOnlyIdentityAllowed',
  'missingCategoryMetadataMeansZeroViewers',
  'dominantHourlyCategoryMayBePresentedAsExactSnapshotMembership',
  'thresholdRelaxationAllowed',
  'historicalBackfillAuthorized',
  'retentionExpansionAuthorized',
  'crossProviderIdentityAllowed',
  'crossProviderTotalsAllowed',
  'combinedProviderRankingAllowed',
]) assert.equal(decision.prohibitedFallbacks[key], false, `${key}: must remain false`)

for (const key of [
  'hiddenHistoryCategoryCandidateAuthorized',
  'historyApiCategoryParameterAuthorized',
  'historyCategoryControlsAuthorized',
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
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

assert.equal(decision.fallback.existingUnfilteredHistory, 'required_and_unchanged')
assert.equal(decision.fallback.categoryHistoryState, 'not_authorized')
assert.equal(decision.fallback.userFacingApproximationAuthorized, false)
assert.ok(Array.isArray(decision.rejectionReasons) && decision.rejectionReasons.length >= 5)
assert.ok(Array.isArray(decision.futureReconsiderationRequirements) && decision.futureReconsiderationRequirements.length >= 5)

// Current History contract: 90-day public range, daily-rollup preference, raw fallback,
// and no category parameter or category-bearing daily-rollup fields.
for (const fragment of [
  "dayCount(period.from, period.to) > 90",
  'const rollups = await tryRollups(env, period.from, period.to)',
  'if (rollups.length > 0)',
  'FROM daily_rollups',
  'FROM minute_snapshots',
  'top_streamers_json',
  'previousPeriod(period.from, period.to)',
]) assert.ok(historyApi.includes(fragment), `History API missing evidence fragment: ${fragment}`)
assert.equal(historyApi.includes("searchParams.get('category')"), false)
assert.equal(historyApi.includes('category_hourly_json'), false)
assert.equal(historyApi.includes('category_observed_samples'), false)

// Exact observation-time category identity is present in the accepted Twitch
// snapshot contract and dictionary, but this does not make long-range History exact.
for (const fragment of [
  "const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryIds',
  'categoryRefs',
  'provider_category_dictionary',
  "WHERE provider = ?",
  ".bind('twitch')",
]) assert.ok(heatmapApi.includes(fragment), `Accepted category reference missing: ${fragment}`)

// Free Strong retention creates a hard mismatch between exact category snapshots
// and the existing long-range History window.
for (const fragment of [
  "provider = 'twitch'",
  "unixepoch('now', '-30 days')",
  "unixepoch('now', '-180 days')",
]) assert.ok(retentionSql.includes(fragment), `Retention evidence missing: ${fragment}`)

// Permanent Twitch runtime has both category capture and category intraday generation
// enabled on the unchanged five-minute collector.
for (const fragment of [
  'INTRADAY_GENERATION_ENABLED = "true"',
  'CATEGORY_CAPTURE_ENABLED = "true"',
  'crons = ["*/5 * * * *"]',
]) assert.ok(twitchPermanent.includes(fragment), `Permanent Twitch config missing: ${fragment}`)
for (const fragment of [
  'maybeGenerateCategoryIntradayRollups',
  'streamerCap: 600',
  "categoryEnabled ? 'category_intraday_rollup_generation' : 'intraday_rollup_generation'",
]) assert.ok(twitchEntry.includes(fragment), `Twitch entry missing: ${fragment}`)

// The category intraday rollup lasts 90 days but is a lossy analytics summary.
assert.ok(categoryIntraday.includes('const INTRADAY_RETENTION_DAYS = 90'))
for (const fragment of [
  'selected AS (',
  'SELECT * FROM ranked WHERE daily_rank <= ?',
  'category_stats AS (',
  'ORDER BY sample_count DESC, viewer_minutes DESC, category_id ASC',
  'dominant AS (',
  'SELECT * FROM category_ranked WHERE category_rank = 1',
  'LEFT JOIN dominant d',
]) assert.ok(categoryIntradaySql.includes(fragment), `Intraday compression evidence missing: ${fragment}`)

console.log('Twitch History category feasibility decision verified: current accepted data is insufficient for an exact History category surface; unfiltered History remains the required fallback.')
