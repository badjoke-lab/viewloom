import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const decision = json('docs/audits/12a10-kick-battle-lines-category-feasibility-decision.json')
const dayFlowAcceptance = json('docs/audits/12a9-kick-day-flow-category-public-production-acceptance.json')
const dayFlowEvidence = json('docs/audits/12a9-kick-day-flow-category-public-production-evidence.json')
const kickBattle = read('apps/web/functions/api/kick-battle-lines.ts')
const battleCore = read('apps/web/functions/_lib/battle-lines-core.ts')
const battleRequest = read('apps/web/functions/_lib/battle-lines-request.ts')
const categoryCore = read('apps/web/functions/api/day-flow-category-core.mjs')

assert.equal(decision.schemaVersion, 'viewloom-12a10-kick-battle-lines-category-feasibility-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-10-D1')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 813)
assert.equal(decision.provider, 'kick')
assert.equal(decision.feature, 'battle_lines_category_filter')
assert.equal(decision.decision, 'authorize_hidden_kick_battle_lines_category_candidate')
assert.equal(decision.sourceMainSha, 'cf029307eff9431307a868e912c504efc6951626')

const basis = decision.evidenceBasis
assert.equal(basis.kickDayFlowPublicAcceptanceIssue, 811)
assert.equal(basis.kickDayFlowPublicAcceptancePr, 812)
assert.equal(basis.kickDayFlowPublicAcceptanceMergeSha, decision.sourceMainSha)
assert.equal(basis.kickDayFlowPublicProductionSha, '851f7a56ea24a5375feb091ec16399e0406f1638')
assert.equal(basis.kickDayFlowProductionRun, 31515011810)
assert.equal(basis.kickDayFlowProductionArtifact, 9110734867)
assert.equal(basis.kickDayFlowProductionScenarioCount, 5)
assert.equal(basis.kickDayFlowProductionPassedScenarioCount, 5)
assert.equal(basis.kickDayFlowProductionFailureCount, 0)
assert.equal(basis.kickDayFlowCategoryContractVersion, 'category-source-v1')
assert.equal(basis.kickDayFlowObservedCategoryBucketsOnAcceptedFixedDay, 288)
assert.equal(basis.kickDayFlowPartialCategoryBucketsOnAcceptedFixedDay, 0)
assert.equal(basis.kickDayFlowUnavailableCategoryBucketsOnAcceptedFixedDay, 0)

assert.equal(dayFlowAcceptance.status, 'accepted_on_merge')
assert.equal(dayFlowAcceptance.acceptanceIssue, 811)
assert.equal(dayFlowAcceptance.acceptancePr, 812)
assert.equal(dayFlowAcceptance.package.publicImplementationMergeSha, basis.kickDayFlowPublicProductionSha)
assert.equal(dayFlowAcceptance.acceptedResult.scenarioCount, 5)
assert.equal(dayFlowAcceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(dayFlowAcceptance.acceptedResult.failureCount, 0)
assert.equal(dayFlowAcceptance.acceptedResult.providerSeparationPass, true)
assert.equal(dayFlowEvidence.status, 'pass')
assert.equal(dayFlowEvidence.expectedProductionSha, basis.kickDayFlowPublicProductionSha)
assert.deepEqual(dayFlowEvidence.failures, [])
const acceptedUnknown = dayFlowEvidence.scenarios.find((scenario) => scenario.name === 'kick-public-unknown-category')
assert.ok(acceptedUnknown)
assert.match(acceptedUnknown.checks.statusText, /288 observed \/ 0 partial \/ 0 unavailable buckets/)

const path = decision.currentBattleLinesPath
assert.equal(path.storageBinding, 'DB_KICK_HOT')
assert.equal(path.storageTable, 'minute_snapshots')
assert.equal(path.providerPredicate, 'provider=kick')
assert.equal(path.maxSnapshotRows, 360)
assert.equal(path.sampleIntervalMinutes, 5)
assert.equal(path.fullFiveMinuteDayRows, 288)
assert.equal(path.categoryMembershipCurrentlyParsed, false)
assert.equal(path.candidateCompactionCurrentlyOccursBeforeCategoryFilter, true)
assert.deepEqual(path.currentUnfilteredPointStates, ['observed', 'offline', 'not_observed', 'missing'])

for (const fragment of [
  'env.DB_KICK_HOT.prepare',
  'FROM minute_snapshots',
  'WHERE provider = ?',
  ".bind('kick', period.from, period.to)",
  'LIMIT ${BATTLE_MAX_SNAPSHOT_ROWS}',
  'const compacted = compactBattleRows(parsedRows, top)',
  'const payload = buildBattleLinesPayload(compacted.rows, options)',
  'items: readItems(row.payload_json)',
]) assert.ok(kickBattle.includes(fragment), `Kick Battle Lines source path missing: ${fragment}`)
assert.ok(!kickBattle.includes('categoryContractVersion'), 'current Kick Battle Lines unexpectedly already parses category contract')
assert.ok(!kickBattle.includes('categoryRefs'), 'current Kick Battle Lines unexpectedly already parses category refs')
assert.ok(!kickBattle.includes('provider_category_dictionary'), 'current Kick Battle Lines unexpectedly already reads category dictionary')
assert.ok(!kickBattle.includes('DB_TWITCH_HOT'), 'Kick Battle Lines crosses Twitch storage')

assert.ok(battleRequest.includes('export const BATTLE_MAX_SNAPSHOT_ROWS = 360'))
assert.ok(battleRequest.includes('viewerTotals.set(item.id'))
assert.ok(battleRequest.includes('.slice(0, Math.max(2, top))'))
assert.ok(battleRequest.includes('row.items.filter((item) => selectedIds.has(item.id))'))

for (const fragment of [
  "export type BattlePointState = 'observed' | 'offline' | 'not_observed' | 'missing'",
  "if (!observedBuckets.has(index)) return 'not_observed'",
  "if (present.has(index)) return raw !== null && raw > 0 ? 'observed' : 'offline'",
  "if (first !== null && last !== null && index >= first && index <= last) return 'missing'",
  "return 'offline'",
]) assert.ok(battleCore.includes(fragment), `current Battle Lines point-state evidence missing: ${fragment}`)
assert.ok(battleCore.includes('const allLines = [...streams.values()]'))
assert.ok(battleCore.includes('.sort((a, b) => b.viewerMinutes - a.viewerMinutes)'))
assert.ok(battleCore.includes('const lines = allLines.slice(0, options.top)'))
assert.ok(battleCore.includes('const battles = scoreBattles(lines, options.metric)'))
assert.ok(battleCore.includes("return value === 'indexed' ? 'indexed' : 'viewers'"))
assert.ok(battleCore.includes('if (parsed === 3 || parsed === 10) return parsed'))
assert.ok(battleCore.includes('return 5'))

for (const fragment of [
  "const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryContractVersion: string(record.categoryContractVersion) || null',
  'categoryIds: Array.isArray(record.categoryIds)',
  'categoryRefs: Array.isArray(record.categoryRefs)',
  "identity = provider === 'kick'",
  'const ref = parsed.categoryRefs[item.rawIndex]',
  'const categoryId = Number.isInteger(ref)',
  'membershipEvaluation: \'per_observed_snapshot\'',
  'latestCategoryBackProjectionAllowed: false',
  'coverageCounts:',
]) assert.ok(categoryCore.includes(fragment), `accepted category source evidence missing: ${fragment}`)

const feasibility = decision.acceptedDataFeasibility
for (const key of [
  'observationTimeCategoryIdentityAvailable',
  'categoryRefsParallelRawItems',
  'providerCategoryDictionaryAvailable',
]) assert.equal(feasibility[key], true, `${key}: current accepted data must support it`)
for (const key of [
  'collectorChangeRequired',
  'workerChangeRequired',
  'd1MutationRequired',
  'd1SchemaChangeRequired',
  'bindingChangeRequired',
  'cadenceChangeRequired',
  'retentionChangeRequired',
  'backfillRequired',
  'thresholdRelaxationRequired',
  'latestCategoryBackProjectionRequired',
  'syntheticMappingRequired',
  'nameOnlyIdentityRequired',
  'crossProviderDataRequired',
]) assert.equal(feasibility[key], false, `${key}: hidden data expansion is forbidden`)

const semantics = decision.requiredHiddenCandidateSemantics
assert.equal(semantics.previewParameter, 'categoryPreview=1')
assert.equal(semantics.defaultCategory, 'all')
assert.equal(semantics.categoryParameter, 'category')
assert.equal(semantics.categoryIdentity, '(kick, categoryProviderId)')
assert.equal(semantics.categoryNamePresentationOnly, true)
assert.equal(semantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(semantics.latestCategoryBackProjectionAllowed, false)
assert.equal(semantics.syntheticMappingAllowed, false)
assert.equal(semantics.nameOnlyIdentityAllowed, false)
assert.equal(semantics.crossProviderIdentityAllowed, false)
assert.equal(semantics.allCategoryUsesExactUnfilteredFallback, true)
assert.equal(semantics.missingCategoryMetadataZeroFilled, false)
assert.equal(semantics.categoryContractValidationBeforeCompaction, true)
assert.equal(semantics.categoryFilterBeforeCandidateCompaction, true)
assert.equal(semantics.categoryFilterBeforeTopN, true)
assert.equal(semantics.categoryFilterBeforeRecommendedBattleScoring, true)
assert.equal(semantics.candidateRankingMetric, 'category_qualified_viewer_minutes')
assert.deepEqual(semantics.existingTopValues, [3, 5, 10])
assert.equal(semantics.existingTopDefault, 5)
assert.deepEqual(semantics.existingMetrics, ['viewers', 'indexed'])
assert.deepEqual(semantics.existingDisplayBuckets, ['5m', '10m'])
assert.equal(semantics.oneMinuteStillUnavailableFromFiveMinuteSnapshots, true)
assert.equal(semantics.viewersMode, 'category_qualified_observed_viewers_only')
assert.equal(semantics.indexedModePeakBasis, 'category_qualified_observed_points_only')
assert.deepEqual(semantics.selectedCategoryPointStates, ['observed','outside_category','category_unavailable','offline','not_observed','missing'])
for (const key of [
  'outsideCategoryNeverRenderedAsZero',
  'outsideCategoryNeverClassifiedOffline',
  'outsideCategoryNeverClassifiedMissing',
  'categoryUnavailableNeverRenderedAsZero',
  'categoryUnavailableNeverClassifiedOffline',
  'categoryUnavailableNeverClassifiedMissing',
  'notObservedMeaningUnchanged',
  'missingMeaningUnchanged',
  'offlineMeaningUnchanged',
  'battleOverlapRequiresBothCategoryQualifiedObserved',
  'reversalRequiresBothCategoryQualifiedObserved',
  'momentumConflictRequiresCategoryQualifiedObserved',
  'gapEventRequiresBothCategoryQualifiedObserved',
  'outsideCategoryExcludedFromMissingPenalty',
  'categoryUnavailableExcludedFromMissingPenalty',
  'rankRelevanceUsesCategoryScopedViewerMinutes',
  'unknownCategoryReturnsCategoryLines',
  'unknownCategoryReturnsBattles',
  'unknownCategoryMaySubstituteGlobalLines',
  'unavailableMetadataNeverInferredAsZero',
]) {
  if (['unknownCategoryReturnsCategoryLines','unknownCategoryReturnsBattles','unknownCategoryMaySubstituteGlobalLines'].includes(key)) assert.equal(semantics[key], false, `${key}: must remain false`)
  else assert.equal(semantics[key], true, `${key}: required honesty semantic missing`)
}
assert.equal(semantics.unknownCategoryState, 'unknown_category')
assert.deepEqual(semantics.coverageStates, ['observed', 'partial', 'unavailable'])

const boundary = decision.implementationBoundary
assert.equal(boundary.hiddenCandidateImplementationAuthorized, true)
assert.equal(boundary.publicExposureAuthorized, false)
assert.equal(boundary.normalKickBattleLinesCategoryControlsAuthorized, false)
for (const key of [
  'kickHeatmapSemanticChangeAuthorized',
  'kickDayFlowSemanticChangeAuthorized',
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
]) assert.equal(boundary[key], false, `${key}: must remain false`)

const validation = decision.requiredHiddenValidation
for (const key of Object.keys(validation)) assert.equal(validation[key], true, `${key}: hidden validation requirement must remain enabled`)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  decision: decision.decision,
  sourceMainSha: decision.sourceMainSha,
  currentBattleRowsMax: path.maxSnapshotRows,
  fullDayRows: path.fullFiveMinuteDayRows,
  acceptedCategoryCoverage: `${basis.kickDayFlowObservedCategoryBucketsOnAcceptedFixedDay}/288`,
  categoryFilterBeforeTopN: semantics.categoryFilterBeforeTopN,
  categoryFilterBeforeRecommendedBattleScoring: semantics.categoryFilterBeforeRecommendedBattleScoring,
  selectedCategoryPointStates: semantics.selectedCategoryPointStates,
  hiddenCandidateImplementationAuthorized: boundary.hiddenCandidateImplementationAuthorized,
  publicExposureAuthorized: boundary.publicExposureAuthorized,
}, null, 2))
