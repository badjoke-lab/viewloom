import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const decision = json('docs/audits/12a11-kick-history-category-feasibility-decision.json')
const historyApi = read('apps/web/functions/api/kick-history.ts')
const categoryCore = read('apps/web/functions/api/day-flow-category-core.mjs')
const collector = read('workers/collector-kick/src/index-category.ts')
const twitchPrecedent = json('docs/audits/12a7-twitch-history-category-feasibility-decision.json')

assert.equal(decision.schemaVersion, 'viewloom-12a11-kick-history-category-feasibility-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-11')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 827)
assert.equal(decision.provider, 'kick')
assert.equal(decision.surface, 'history')
assert.equal(decision.decision, 'reject_kick_history_category_surface_on_current_data')
assert.equal(decision.evidenceBasis.sourceMainSha, '1c98de3065ca3bdc1bd7d99a6ea6502b8513886b')
assert.equal(decision.evidenceBasis.categoryContractVersion, 'category-source-v1')

assert.equal(decision.currentHistorySemantics.maximumCustomRangeDays, 90)
assert.equal(decision.currentHistorySemantics.primarySourcePreference, 'daily_rollups_then_minute_snapshots')
assert.equal(decision.currentHistorySemantics.dailyRollupsRetainCategoryMembership, false)
assert.equal(decision.currentHistorySemantics.unfilteredHistoryMustRemainBackwardCompatible, true)
assert.equal(decision.currentHistorySemantics.previousPeriodComparisonIsPartOfExistingDerivedHistory, true)

assert.equal(decision.currentCategoryData.snapshotMembershipEvaluation, 'per_observed_snapshot')
assert.equal(decision.currentCategoryData.snapshotCategoryIdentity, 'provider_scoped_category_id')
assert.equal(decision.currentCategoryData.snapshotCategoryRefsAlignedToStreamItems, true)
assert.equal(decision.currentCategoryData.snapshotRetentionDays, 60)
assert.equal(decision.currentCategoryData.dailyRollupRetentionDays, 180)
assert.equal(decision.currentCategoryData.permanentCategoryCaptureEnabled, true)

for (const field of ['streamerId', 'displayName', 'viewerMinutes', 'peakViewers', 'observedMinutes', 'rankByViewerMinutes', 'rankByPeak']) {
  assert.ok(decision.dailyRollupLimits.topStreamerFields.includes(field), `missing rollup field authority: ${field}`)
}
for (const key of [
  'categoryIdentityPreserved',
  'categoryContributionPreserved',
  'categorySpecificFilterBeforeRankingRecoverable',
  'exactCategoryViewerMinutesRecoverableForAllAdvertisedHistoryRanges',
  'exactCategoryPeakViewersRecoverableForAllAdvertisedHistoryRanges',
]) assert.equal(decision.dailyRollupLimits[key], false, `${key}: must remain false`)

for (const key of [
  'latestCategoryBackProjectionAllowed',
  'syntheticMappingAllowed',
  'nameOnlyIdentityAllowed',
  'missingCategoryMetadataMeansZeroViewers',
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
  'collectorChangeAuthorized',
  'workerCollectorDeploymentAuthorized',
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
  'twitchRuntimeSemanticChangeAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

assert.equal(decision.fallback.existingUnfilteredHistory, 'required_and_unchanged')
assert.equal(decision.fallback.categoryHistoryState, 'not_authorized')
assert.equal(decision.fallback.userFacingApproximationAuthorized, false)
assert.ok(decision.rejectionReasons.length >= 5)
assert.ok(decision.futureReconsiderationRequirements.length >= 5)

// Existing Kick History advertises 90 days, prefers category-blind daily rollups,
// retains previous-period comparison, and has no category parameter today.
for (const fragment of [
  'dayCount(period.from, period.to) > 90',
  'const previous = previousPeriod(period.from, period.to)',
  'const rollups = await tryRollups(env, period.from, period.to)',
  'if (rollups.length > 0)',
  'FROM daily_rollups',
  'top_streamers_json',
  'FROM minute_snapshots',
]) assert.ok(historyApi.includes(fragment), `Kick History API missing evidence fragment: ${fragment}`)
assert.equal(historyApi.includes("searchParams.get('category')"), false)

// Accepted raw category contract is provider-scoped and evaluated per observation.
for (const fragment of [
  "const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryIds',
  'categoryRefs',
  "membershipEvaluation: 'per_observed_snapshot'",
  'latestCategoryBackProjectionAllowed: false',
]) assert.ok(categoryCore.includes(fragment), `Category core missing evidence fragment: ${fragment}`)

// Kick Free Strong retention: exact raw category snapshots last 60 days, while
// category-blind daily rollups last 180 days.
for (const fragment of [
  "unixepoch('now', '-60 days')",
  "unixepoch('now', '-180 days')",
  'DELETE FROM minute_snapshots',
  'DELETE FROM daily_rollups',
]) assert.ok(collector.includes(fragment), `Kick retention evidence missing: ${fragment}`)

// Long-range daily-rollup top streamer payload does not retain category identity
// or contribution. Capture the top_json CTE window rather than scanning the whole
// collector, which legitimately contains category fields for raw snapshots.
const topJsonStart = collector.indexOf('top_json AS (')
assert.ok(topJsonStart >= 0, 'Kick rollup top_json CTE missing')
const topJsonEnd = collector.indexOf('INSERT INTO daily_rollups', topJsonStart)
assert.ok(topJsonEnd > topJsonStart, 'Kick rollup INSERT boundary missing')
const topJsonWindow = collector.slice(topJsonStart, topJsonEnd)
for (const fragment of [
  "'streamerId'",
  "'displayName'",
  "'viewerMinutes'",
  "'peakViewers'",
  "'observedMinutes'",
  "'rankByViewerMinutes'",
]) assert.ok(topJsonWindow.includes(fragment), `Kick rollup field missing: ${fragment}`)
assert.equal(/categoryProviderId|categoryIds|categoryRefs|category_id|category_name/.test(topJsonWindow), false, 'Kick daily rollup unexpectedly preserves category identity; decision must be revisited')

// Provider precedent remains fail-closed on long-range History category semantics.
assert.equal(twitchPrecedent.decision, 'reject_twitch_history_category_surface_on_current_data')

console.log('Kick History category feasibility decision verified: current accepted data cannot support exact advertised long-range category History; unfiltered Kick History remains required and unchanged.')
