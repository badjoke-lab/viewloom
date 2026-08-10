import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const decisionPath = 'docs/audits/12a9-kick-day-flow-category-feasibility-decision.json'
const kickDayFlowPath = 'apps/web/functions/api/kick-day-flow.ts'
const currentShellPath = 'apps/web/src/live/day-flow-current-shell-entry.ts'
const twitchDayFlowPath = 'apps/web/functions/api/day-flow.ts'
const projectionPath = 'apps/web/functions/api/day-flow-category-core.mjs'
const categoryClientPath = 'apps/web/src/live/day-flow-category-preview-entry.ts'
const kickCollectorPath = 'workers/collector-kick/src/index-category.ts'
const kickOfficialPath = 'workers/collector-kick/src/official-livestreams.ts'
const sharedCategoryPath = 'workers/shared/category-capture.ts'
const kickWranglerPath = 'workers/collector-kick/wrangler.toml'
const publicKickAcceptancePath = 'docs/audits/12a8-kick-heatmap-category-public-production-acceptance.json'

for (const path of [
  decisionPath,
  kickDayFlowPath,
  currentShellPath,
  twitchDayFlowPath,
  projectionPath,
  categoryClientPath,
  kickCollectorPath,
  kickOfficialPath,
  sharedCategoryPath,
  kickWranglerPath,
  publicKickAcceptancePath,
]) assert.equal(existsSync(path), true, `${path}: missing`)

const decision = json(decisionPath)
const kickDayFlow = read(kickDayFlowPath)
const currentShell = read(currentShellPath)
const twitchDayFlow = read(twitchDayFlowPath)
const projection = read(projectionPath)
const categoryClient = read(categoryClientPath)
const kickCollector = read(kickCollectorPath)
const kickOfficial = read(kickOfficialPath)
const sharedCategory = read(sharedCategoryPath)
const kickWrangler = read(kickWranglerPath)
const publicKickAcceptance = json(publicKickAcceptancePath)

assert.equal(decision.schemaVersion, 'viewloom-12a9-kick-day-flow-category-feasibility-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-9')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 793)
assert.equal(decision.provider, 'kick')
assert.equal(decision.surface, 'day_flow')
assert.equal(decision.decision, 'authorize_hidden_kick_day_flow_category_candidate')

const basis = decision.evidenceBasis
assert.equal(basis.sourceMainSha, 'ce5619d108732b681aff87e328041880ae66b1fa')
assert.equal(basis.categoryContractVersion, 'category-source-v1')
assert.equal(basis.snapshotStorage, 'DB_KICK_HOT.minute_snapshots.payload_json')
assert.equal(basis.dictionaryStorage, 'DB_KICK_HOT.provider_category_dictionary')
assert.equal(basis.scheduledCadence, '*/5 * * * *')
assert.equal(basis.rawSnapshotRetentionDays, 60)
assert.equal(basis.dayFlowMaximumWindowHours, 24)
assert.equal(basis.scheduledSnapshotsPer24h, 288)
assert.equal(basis.kickDayFlowRowLimit, 1600)
assert.equal(basis.newCollectionRequired, false)
assert.equal(basis.newExternalApiRequestRequired, false)
assert.equal(basis.newStorageRequired, false)
assert.equal(basis.backfillRequired, false)

const source = decision.acceptedKickCategorySource
assert.equal(source.primarySource, 'official-livestreams')
assert.equal(source.identityScope, 'provider_scoped')
assert.equal(source.identityFormat, '(kick, categoryProviderId)')
assert.equal(source.membershipEncoding, 'categoryIds_plus_categoryRefs_aligned_to_observed_snapshot_items')
assert.equal(source.membershipEvaluation, 'per_observed_snapshot')
assert.equal(source.dictionaryProvider, 'kick')
assert.equal(source.dictionaryContractVersion, 'category-source-v1')
assert.equal(source.categoryNameRole, 'presentation_only')
assert.equal(source.fallbackRowsWithNoAcceptedCategorySource, 'partial_or_unavailable_not_zero')
for (const key of ['latestCategoryBackProjectionAllowed', 'syntheticMappingAllowed', 'nameOnlyIdentityAllowed', 'crossProviderIdentityAllowed']) {
  assert.equal(source[key], false, `${key}: must remain false`)
}

const existing = decision.existingKickDayFlowSemantics
assert.equal(existing.bandIdentity, 'streamer')
assert.equal(existing.bandOrdering, 'viewer_minutes_descending_for_selected_window')
assert.deepEqual(existing.bucketSizesMinutes, [5, 10])
assert.equal(existing.bucketAggregation, 'average_observed_stream_viewers_within_bucket')
assert.equal(existing.fullShareDenominator, 'all_observed_kick_viewers_per_bucket')
assert.equal(existing.topFocusShareDenominator, 'displayed_top_n_viewers_per_bucket')
assert.equal(existing.othersRequiredInFull, true)
assert.equal(existing.allCategoriesMustRemainBackwardCompatible, true)

const semantics = decision.categorySemantics
assert.equal(semantics.identityScope, 'provider_scoped')
assert.equal(semantics.identityFormat, '(kick, categoryProviderId)')
assert.equal(semantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(semantics.latestCategoryBackProjectionAllowed, false)
assert.equal(semantics.filterBeforeTopN, true)
assert.equal(semantics.topNRankingBasis, 'viewer_minutes_accumulated_only_from_selected_category_observations')
assert.equal(semantics.bucketAggregation, 'preserve_existing_kick_day_flow_average_observed_viewers_within_bucket_after_snapshot_level_category_matching')
assert.equal(semantics.unknownCategoryReturnsItems, false)
assert.equal(semantics.selectedCategoryUnavailableReturnsItems, false)
assert.equal(semantics.allCategoriesUsesCurrentUnfilteredFallback, true)
for (const key of ['historicalCategoryViewsAdditiveTaxonomy', 'syntheticMappingAllowed', 'nameOnlyIdentityAllowed', 'crossProviderIdentityAllowed', 'crossProviderTotalsAllowed', 'combinedProviderRankingAllowed']) {
  assert.equal(semantics[key], false, `${key}: must remain false`)
}

const share = decision.shareAndContextSemantics
assert.equal(share.fullShareDenominatorWhenCategorySelected, 'all_observed_kick_viewers_per_bucket')
assert.equal(share.topFocusShareDenominatorWhenCategorySelected, 'displayed_selected_category_top_n_viewers_per_bucket')
assert.equal(share.fullOthersMeaningWhenCategorySelected, 'all other observed Kick viewers not represented by the displayed selected-category Top N bands')
assert.equal(share.selectedCategoryTopBandsOnly, true)
assert.equal(share.silentCategoryOnlyRenormalizationAllowed, false)
assert.equal(share.topFocusNonGlobalShareDisclosureRequired, true)
assert.equal(share.globalTotalContextMustRemainUnfiltered, true)

const coverage = decision.coverageContract
assert.equal(coverage.required, true)
assert.equal(coverage.granularity, 'bucket')
assert.deepEqual(coverage.states, ['observed', 'partial', 'unavailable'])
assert.equal(coverage.missingCategoryMetadataMeansZeroViewers, false)
assert.equal(coverage.selectedCategoryUnavailableStateRequired, true)
assert.equal(coverage.unknownCategoryStateRequired, true)
assert.equal(coverage.allCategoriesFallbackAvailable, true)

const implementation = decision.implementationRequirements
assert.equal(implementation.reuseExistingMinuteSnapshots, true)
assert.equal(implementation.reuseProviderCategoryDictionary, true)
assert.equal(implementation.sharedProjectionMayBeGeneralizedForProvider, true)
assert.equal(implementation.sharedProjectionMustNotHardcodeTwitchLabelsForKick, true)
assert.equal(implementation.kickDictionaryQueryMustBindKick, true)
assert.equal(implementation.kickApiMustNotReadTwitchD1, true)
assert.equal(implementation.kickClientFetchInterceptionMustTargetOnlyKickDayFlowApi, true)
assert.equal(implementation.normalKickRouteMustRemainUnchangedWithoutPreview, true)
assert.equal(implementation.existingUnfilteredResponseSemanticsMustRemainCompatible, true)
assert.equal(implementation.additionalExternalApiRequestsAllowed, false)
assert.equal(implementation.additionalCollectorRequestsAllowed, false)

assert.equal(decision.candidateContract.implementationState, 'hidden_candidate')
assert.equal(decision.candidateContract.provider, 'kick')
assert.equal(decision.candidateContract.previewParameter, 'categoryPreview=1')
assert.equal(decision.candidateContract.categoryParameter, 'category')
assert.equal(decision.candidateContract.normalRouteDefault, 'all')
assert.equal(decision.candidateContract.publicDefaultRouteControlsVisible, false)
assert.equal(decision.candidateContract.existingUnfilteredResponseSemanticsMustRemainCompatible, true)
assert.equal(decision.candidateContract.productionHiddenBrowserRevalidationRequired, true)

const authorization = decision.authorization
assert.equal(authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(authorization.kickDayFlowApiCategoryContractAuthorized, true)
assert.equal(authorization.hiddenKickDayFlowCategoryControlsAuthorized, true)
for (const key of [
  'defaultRoutePublicExposureAuthorized',
  'kickBattleLinesCategoryUiAuthorized',
  'kickHistoryCategoryUiAuthorized',
  'twitchRuntimeSemanticChangeAuthorized',
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
]) assert.equal(authorization[key], false, `${key}: must remain false`)

// Current Kick Day Flow already reads the exact raw storage grain needed for a
// one-day category projection. It does not need long-range rollups.
for (const fragment of [
  'DB_KICK_HOT.prepare',
  'FROM minute_snapshots',
  'WHERE provider = ?',
  ".bind('kick', range.start.toISOString(), range.end.toISOString()).all<Row>()",
  'payload_json',
  'total_viewers',
  'const MAX_ROWS = 1600',
  'const bucketLabels = buckets(range.start, range.end, bucketSize)',
  'totalViewerMinutes: viewers.reduce((sum, value) => sum + value * bucketSize, 0)',
  'const viewers = acc.sums.map((sum, index) => acc.counts[index] > 0 ? Math.round(sum / acc.counts[index]) : 0)',
]) assert.ok(kickDayFlow.includes(fragment), `Kick Day Flow feasibility basis missing: ${fragment}`)

// The accepted collector writes observation-time category refs into the same
// Kick minute snapshot payload. Non-primary/fallback rows are deliberately
// encoded as partial/unavailable rather than being assigned a fake category.
for (const fragment of [
  "const acceptedPrimarySource = collectorMeta.sourceMode === 'official-livestreams'",
  'encodeCategorySnapshot(items, !acceptedPrimarySource)',
  '{ items: storedItems, collectorMeta, ...encoded.payloadFields }',
  "writeCategoryDictionary(\n        env.DB_KICK_HOT,\n        'kick'",
  "DELETE FROM minute_snapshots",
  "unixepoch('now', '-60 days')",
]) assert.ok(kickCollector.includes(fragment), `Kick collector category/retention basis missing: ${fragment}`)
for (const fragment of [
  'categoryProviderId?: string | null',
  'categoryName?: string | null',
  'const categoryProviderId = asIdentifier(category?.id)',
  'const categoryName = asText(category?.name)',
  'categoryProviderId: categoryProviderId || null',
  'categoryName: categoryName || null',
]) assert.ok(kickOfficial.includes(fragment), `Kick official category source missing: ${fragment}`)
for (const fragment of [
  "export const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryIds: string[]',
  'categoryRefs: Array<number | null>',
  "export type CategoryProvider = 'twitch' | 'kick'",
  'ON CONFLICT(provider, category_id)',
]) assert.ok(sharedCategory.includes(fragment), `Shared category contract missing: ${fragment}`)
assert.ok(kickWrangler.includes('crons = ["*/5 * * * *"]'), 'Kick collector cadence changed from accepted 5m schedule')

// The current public Kick Heatmap acceptance independently proves accepted
// Kick category data is present in production, but it does not authorize Day Flow.
assert.equal(publicKickAcceptance.status, 'accepted')
assert.equal(publicKickAcceptance.provider, 'kick')
assert.equal(publicKickAcceptance.authorization.publicKickCategoryUiAccepted, true)
assert.equal(publicKickAcceptance.authorization.kickDayFlowCategoryUiAuthorized, false)
assert.equal(publicKickAcceptance.acceptedProductionEvidence.passedScenarioCount, 5)
assert.equal(publicKickAcceptance.acceptedProductionEvidence.failureCount, 0)

// Existing Twitch Day Flow category implementation supplies a semantics
// reference only. Kick implementation must parameterize provider labels/storage
// instead of copying Twitch hard-coding or crossing providers.
for (const fragment of [
  "const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'projectDayFlowCategory',
  'filterBeforeTopN: true',
  "membershipEvaluation: 'per_observed_snapshot'",
  "latestCategoryBackProjectionAllowed: false",
]) assert.ok(twitchDayFlow.includes(fragment) || projection.includes(fragment), `Day Flow category reference missing: ${fragment}`)
assert.ok(projection.includes("fullShareDenominator: 'all_observed_twitch_viewers_per_bucket'"), 'reference projection no longer exposes provider hard-coding that must be generalized')
assert.ok(projection.includes('`https://www.twitch.tv/${id}`'), 'reference projection no longer exposes Twitch URL hard-coding that must be generalized')

// This PR is decision-only: normal Kick Day Flow remains unfiltered and the
// existing category entry remains Twitch-only until a later candidate PR.
assert.equal(kickDayFlow.includes('categoryFilter'), false)
assert.equal(kickDayFlow.includes("searchParams.get('category')"), false)
assert.ok(currentShell.includes("const endpoint = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'"))
assert.ok(categoryClient.includes("const enabled = provider === 'twitch'"))
assert.ok(categoryClient.includes("requestUrl.pathname !== '/api/day-flow'"))
assert.equal(categoryClient.includes("requestUrl.pathname !== '/api/kick-day-flow'"), false)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  decision: decision.decision,
  provider: decision.provider,
  rawRetentionDays: basis.rawSnapshotRetentionDays,
  scheduledSnapshotsPer24h: basis.scheduledSnapshotsPer24h,
  dayFlowRowLimit: basis.kickDayFlowRowLimit,
  categoryMembership: semantics.membershipEvaluation,
  fullShareDenominator: share.fullShareDenominatorWhenCategorySelected,
  coverageGranularity: coverage.granularity,
  hiddenCandidateAuthorized: authorization.hiddenCandidateImplementationAuthorized,
  publicExposureAuthorized: authorization.defaultRoutePublicExposureAuthorized,
}, null, 2))
