import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const round = (value, digits = 2) => {
  const scale = 10 ** digits
  return Math.round(value * scale) / scale
}

const decision = json('docs/audits/12a12-kick-history-category-aggregate-capacity-decision.json')
const previousDecision = json('docs/audits/12a11-kick-history-category-feasibility-decision.json')
const storageBenchmark = json('docs/audits/12a4-category-storage-budget-evidence.json')
const permanentAcceptance = json('docs/audits/12a4-kick-permanent-category-final-acceptance.json')
const observationContract = json('docs/audits/12a4-kick-permanent-category-observation-contract.json')
const historyApi = read('apps/web/functions/api/kick-history.ts')
const historyBuilder = read('apps/web/functions/_history/builders.ts')
const collector = read('workers/collector-kick/src/index-category.ts')
const categoryCore = read('workers/shared/category-capture.ts')
const categorySchema = read('db/d1/005_category_capture.sql')
const dailyRollupSchema = read('db/d1/001_daily_rollups.sql')

assert.equal(decision.schemaVersion, 'viewloom-12a12-kick-history-category-aggregate-capacity-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-12')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 829)
assert.equal(decision.provider, 'kick')
assert.equal(decision.surface, 'history')
assert.equal(decision.decision, 'accept_bounded_forward_only_history_category_aggregate_design')
assert.equal(decision.evidenceBasis.sourceMainSha, '3441ebe59975007ec773db6c0709f36a84342650')
assert.equal(decision.evidenceBasis.categoryContractVersion, 'category-source-v1')

assert.equal(previousDecision.decision, 'reject_kick_history_category_surface_on_current_data')
assert.equal(previousDecision.currentCategoryData.snapshotRetentionDays, 60)
assert.equal(previousDecision.currentCategoryData.dailyRollupRetentionDays, 180)
assert.equal(previousDecision.currentHistorySemantics.maximumCustomRangeDays, 90)
assert.equal(previousDecision.currentHistorySemantics.previousPeriodComparisonIsPartOfExistingDerivedHistory, true)

assert.equal(decision.currentAcceptedConstraints.snapshotItemCap, 100)
assert.equal(decision.currentAcceptedConstraints.snapshotsPerDay, 288)
assert.equal(decision.currentAcceptedConstraints.rawRetentionDays, 60)
assert.equal(decision.currentAcceptedConstraints.historyRangeDaysMax, 90)
assert.equal(decision.currentAcceptedConstraints.historyGradeRetentionDaysRequired, 180)
assert.equal(decision.currentAcceptedConstraints.kickProjectedNinetyDaySizeMb, permanentAcceptance.storage.projectedNinetyDaySizeMb)
assert.equal(decision.currentAcceptedConstraints.kickProjectedProviderHeadroomMb, permanentAcceptance.storage.projectedProviderHeadroomMb)
assert.equal(decision.currentAcceptedConstraints.kickProjectedAccountWideHeadroomMb, permanentAcceptance.storage.projectedAccountWideHeadroomMb)
assert.equal(decision.currentAcceptedConstraints.projectedProviderSizeMbMax, observationContract.healthyGates.projectedNinetyDaySizeMbMax)
assert.equal(decision.currentAcceptedConstraints.projectedProviderHeadroomMbMin, observationContract.healthyGates.projectedProviderHeadroomMbMin)
assert.equal(decision.currentAcceptedConstraints.projectedAccountWideHeadroomMbMin, observationContract.healthyGates.projectedAccountWideHeadroomMbMin)

for (const key of [
  'categoryFilterBeforeStreamerRankingAndCaps',
  'dailyCategoryViewerMinutesRequired',
  'dailyCategoryConcurrentPeakViewersRequired',
  'dailyStreamerCategoryViewerMinutesRequired',
  'dailyStreamerCategoryPeakViewersRequired',
  'periodStreamerRankingAfterCategorySelectionRequired',
  'coverageMustDistinguishObservedPartialUnavailable',
]) assert.equal(decision.requiredHistorySemantics[key], true, `${key}: required`)

for (const key of [
  'missingCategoryMetadataMeansZeroViewers',
  'latestCategoryBackProjectionAllowed',
  'syntheticOrNameOnlyMappingAllowed',
  'crossProviderIdentityAllowed',
  'combinedProviderRankingAllowed',
]) assert.equal(decision.requiredHistorySemantics[key], false, `${key}: prohibited`)

assert.equal(decision.rejectedDesigns.rawSnapshotsOnly.decision, 'rejected')
assert.equal(decision.rejectedDesigns.existingDailyRollups.decision, 'rejected')
assert.equal(decision.rejectedDesigns.existingEmbeddedHourlyCategory.decision, 'rejected_for_history_authority')
assert.equal(decision.rejectedDesigns.unboundedStreamerCategoryRows.decision, 'rejected')
assert.equal(decision.rejectedDesigns.preRankedOrTopKPerCategory.decision, 'rejected')

const maximumPairObservationsPerDay = decision.currentAcceptedConstraints.snapshotItemCap * decision.currentAcceptedConstraints.snapshotsPerDay
assert.equal(decision.rejectedDesigns.unboundedStreamerCategoryRows.maximumPairObservationsPerDay, maximumPairObservationsPerDay)
assert.equal(
  decision.rejectedDesigns.unboundedStreamerCategoryRows.maximumPairDayRowsAt180Days,
  maximumPairObservationsPerDay * decision.currentAcceptedConstraints.historyGradeRetentionDaysRequired,
)

const design = decision.selectedDesign
assert.equal(design.name, 'bounded_exact_category_daily_sparse')
assert.equal(design.storageLocation, 'existing_provider_specific_kick_d1')
assert.equal(design.forwardOnly, true)
assert.equal(design.retentionDays, 180)
assert.equal(design.newCron, false)
assert.equal(design.rawRetentionChanged, false)
assert.equal(design.backfill, false)
for (const table of ['history_category_daily', 'history_category_streamer_daily', 'history_category_day_status']) {
  assert.ok(design.tables[table], `missing selected table: ${table}`)
}
assert.ok(design.tables.history_category_daily.requiredFields.includes('peak_viewers'))
assert.ok(design.tables.history_category_streamer_daily.requiredFields.includes('viewer_minutes'))
assert.ok(design.tables.history_category_streamer_daily.requiredFields.includes('peak_viewers'))
assert.ok(design.tables.history_category_day_status.requiredFields.includes('coverage_state'))
assert.equal(design.hardDailyCaps.categoryRows, 300)
assert.equal(design.hardDailyCaps.streamerCategoryRows, 1000)
assert.equal(design.hardDailyCaps.capIsRankingOrSampling, false)
assert.equal(design.hardDailyCaps.overflowPolicy, 'reject_entire_day_as_unavailable_no_partial_rows')
assert.equal(design.hardDailyCaps.overflowCoverageState, 'unavailable_overflow')
assert.equal(design.hardDailyCaps.partialRowsMayBeExposed, false)
assert.match(design.tables.history_category_daily.purpose, /maximum sum of viewers in that category at one observed snapshot/)
assert.match(design.generationSemantics.ranking, /query category first.*aggregate all complete retained contributor rows.*then rank\/cap/)
assert.match(design.generationSemantics.coverage, /fail closed rather than inventing zero-valued contributions/)
assert.match(design.generationSemantics.rerun, /removed before status becomes unavailable_overflow/)

const proxy = storageBenchmark.candidateModels.separate_hourly_table
assert.equal(proxy.projectedRows90d.kick, decision.capacityProof.proxySourceRows90dKick)
assert.equal(proxy.kickLongTermIncrementalMb90dWithSafety, decision.capacityProof.proxySourceIncrementalMb90dWithSafety)
assert.equal(storageBenchmark.benchmark.safetyMarginPct, 20)
const maxRows = design.retentionDays * (
  design.hardDailyCaps.streamerCategoryRows
  + design.hardDailyCaps.categoryRows
  + 1
)
assert.equal(decision.capacityProof.maximumStreamerCategoryRows, design.retentionDays * design.hardDailyCaps.streamerCategoryRows)
assert.equal(decision.capacityProof.maximumCategoryRows, design.retentionDays * design.hardDailyCaps.categoryRows)
assert.equal(decision.capacityProof.maximumStatusRows, design.retentionDays)
assert.equal(decision.capacityProof.maximumIncrementalRows, maxRows)
const projectedIncrementalMb = proxy.kickLongTermIncrementalMb90dWithSafety * maxRows / proxy.projectedRows90d.kick
assert.ok(Math.abs(projectedIncrementalMb - decision.capacityProof.projectedIncrementalMbWithSafetyApprox) <= 0.02)
assert.ok(decision.capacityProof.authorizedDesignBudgetMbMax >= projectedIncrementalMb)
assert.equal(
  decision.capacityProof.projectedKickSizeAtDesignBudgetMbMax,
  round(permanentAcceptance.storage.projectedNinetyDaySizeMb + decision.capacityProof.authorizedDesignBudgetMbMax),
)
assert.equal(
  decision.capacityProof.projectedKickHeadroomAtDesignBudgetMbMin,
  round(observationContract.healthyGates.projectedNinetyDaySizeMbMax - decision.capacityProof.projectedKickSizeAtDesignBudgetMbMax),
)
assert.equal(
  decision.capacityProof.projectedAccountWideHeadroomAtDesignBudgetMbMin,
  round(permanentAcceptance.storage.projectedAccountWideHeadroomMb - decision.capacityProof.authorizedDesignBudgetMbMax),
)
assert.ok(decision.capacityProof.projectedKickSizeAtDesignBudgetMbMax <= observationContract.healthyGates.projectedNinetyDaySizeMbMax)
assert.ok(decision.capacityProof.projectedKickHeadroomAtDesignBudgetMbMin >= observationContract.healthyGates.projectedProviderHeadroomMbMin)
assert.ok(decision.capacityProof.projectedAccountWideHeadroomAtDesignBudgetMbMin >= observationContract.healthyGates.projectedAccountWideHeadroomMbMin)
assert.equal(decision.capacityProof.providerSizeGatePass, true)
assert.equal(decision.capacityProof.providerHeadroomGatePass, true)
assert.equal(decision.capacityProof.accountHeadroomGatePass, true)

assert.equal(decision.sharedSchemaAssessment.shapeReusableForTwitchLater, true)
assert.equal(decision.sharedSchemaAssessment.providerSpecificCapsRequired, true)
assert.equal(decision.sharedSchemaAssessment.twitchRolloutAuthorized, false)
assert.equal(decision.sharedSchemaAssessment.twitchSchemaMutationAuthorized, false)
assert.equal(decision.sharedSchemaAssessment.twitchRuntimeChangeAuthorized, false)

assert.equal(decision.authorization.designAccepted, true)
assert.equal(decision.authorization.repositoryMigrationCandidateAuthorizedNext, true)
assert.equal(decision.authorization.localDeterministicBenchmarkRequiredNext, true)
for (const key of [
  'productionSchemaApplyAuthorized',
  'productionD1MutationAuthorized',
  'collectorGenerationAuthorized',
  'workerDeploymentAuthorized',
  'bindingChangeAuthorized',
  'newCronAuthorized',
  'rawRetentionChangeAuthorized',
  'backfillAuthorized',
  'historyApiCategoryParameterAuthorized',
  'hiddenHistoryCategoryCandidateAuthorized',
  'historyCategoryControlsAuthorized',
  'publicCutoverAuthorized',
  'thresholdRelaxationAuthorized',
  'twitchRolloutAuthorized',
  'crossProviderBehaviorAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)
assert.ok(decision.requiredLaterGates.length >= 8)
assert.match(decision.nextGate, /repository-only migration and deterministic benchmark/)

for (const fragment of [
  'dayCount(period.from, period.to) > 90',
  'const previous = previousPeriod(period.from, period.to)',
  'FROM daily_rollups',
  'FROM minute_snapshots',
]) assert.ok(historyApi.includes(fragment), `Kick History API evidence missing: ${fragment}`)
assert.equal(historyApi.includes("searchParams.get('category')"), false)

for (const fragment of [
  'day.peakViewers = Math.max(day.peakViewers, num(row.total_viewers))',
  'current.viewerMinutes += stream.viewerMinutes',
  'current.peakViewers = Math.max(current.peakViewers, stream.peakViewers)',
  'ranked(',
]) assert.ok(historyBuilder.includes(fragment), `History builder evidence missing: ${fragment}`)

for (const fragment of [
  'OFFICIAL_LIVESTREAM_LIMIT = 100',
  "unixepoch('now', '-60 days')",
  "unixepoch('now', '-180 days')",
  'MAX(total_viewers) AS peak_viewers',
  'WHERE viewer_rank <= 30',
]) assert.ok(collector.includes(fragment), `Kick collector evidence missing: ${fragment}`)

for (const fragment of [
  "CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryIds',
  'categoryRefs',
  'missingItems',
  'provider_category_dictionary',
]) assert.ok(categoryCore.includes(fragment), `Category capture evidence missing: ${fragment}`)

for (const fragment of [
  'CREATE TABLE IF NOT EXISTS provider_category_dictionary',
  'PRIMARY KEY (provider, category_id)',
]) assert.ok(categorySchema.includes(fragment), `Current category schema evidence missing: ${fragment}`)
for (const fragment of [
  'CREATE TABLE IF NOT EXISTS daily_rollups',
  'top_streamers_json',
  'PRIMARY KEY (provider, day)',
]) assert.ok(dailyRollupSchema.includes(fragment), `Current daily rollup schema evidence missing: ${fragment}`)
assert.equal(/category_id|category_refs|categoryRefs/.test(dailyRollupSchema), false, 'Current daily_rollups unexpectedly contains category identity; decision must be revisited')

console.log('Kick History category aggregate capacity decision verified: bounded exact forward-only daily category storage fits the accepted Free Strong design budget only with whole-day fail-close overflow semantics; no production/runtime/UI change is authorized.')
