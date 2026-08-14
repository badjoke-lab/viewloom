import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contract = json('docs/audits/12a18-kick-history-category-cost-bound-contract.json')
const failure = json('docs/audits/12a15-kick-history-category-cost-probe-production-failure.json')
const range = json('docs/audits/12a16-kick-history-category-read-cost-optimization-contract.json')
const readPath = json('docs/audits/12a17-kick-history-category-probe-read-path-contract.json')
const sql = read('workers/shared/history-category-aggregate-sql.ts')
const probe = read('workers/history-category-aggregate-cost-probe/src/index.ts')
const entry = read('workers/collector-kick/src/entry.ts')
const config = read('workers/collector-kick/wrangler.toml')
const official = read('workers/collector-kick/src/official-livestreams.ts')

assert.equal(contract.schemaVersion, 'viewloom-12a18-kick-history-category-cost-bound-v1')
assert.equal(contract.status, 'repository_cost_bound_candidate_no_production_execution')
assert.equal(contract.phase, '12A-18')
assert.equal(contract.trackingIssue, 862)
assert.equal(contract.parentOptimizationIssue, 858)
assert.equal(contract.parentIssue, 623)
assert.equal(contract.provider, 'kick')
assert.equal(contract.authority.failedProductionRun, 31769000044)
assert.equal(contract.authority.failedRowsRead, 843288)
assert.equal(contract.authority.rowsReadMaximum, 250000)
assert.equal(failure.status, 'performance_failed_cleanup_safe')
assert.equal(range.acceptance.newProductionProbeAuthorized, false)
assert.equal(readPath.candidateProbeModel.rawCategoryQueryPaths, 3)
assert.equal(readPath.acceptance.newProductionProbeAuthorized, false)

assert.equal(contract.inputBounds.collectorCadenceMinutes, 5)
assert.equal(contract.inputBounds.snapshotsPerFullDayMax, 288)
assert.equal(contract.inputBounds.streamsPerSnapshotMax, 100)
assert.equal(contract.inputBounds.streamItemsPerFullDayMax, 28800)
assert.equal(contract.inputBounds.categoryRowsPerDayMax, 300)
assert.equal(contract.inputBounds.streamerCategoryRowsPerDayMax, 1000)
assert.ok(official.includes('limit = 100'))
assert.ok(official.includes('Math.min(100'))
assert.ok(config.includes('crons = ["*/5 * * * *"]'))

const precheckStart = sql.indexOf('export const HISTORY_CATEGORY_PRECHECK_SQL = `')
const precheckEnd = sql.indexOf('export const HISTORY_CATEGORY_INSERT_DAILY_SQL = `')
assert.ok(precheckStart >= 0 && precheckEnd > precheckStart)
const precheck = sql.slice(precheckStart, precheckEnd)
assert.ok(precheck.includes('item_stats AS ('))
assert.ok(precheck.includes('source_stats AS ('))
assert.equal(precheck.includes('accepted AS ('), false)
assert.equal(precheck.includes('(SELECT COUNT(*) FROM observed)'), false)
assert.equal(precheck.includes('(SELECT COUNT(*) FROM accepted)'), false)
assert.ok(precheck.includes('COUNT(DISTINCT CASE WHEN'))
assert.ok(precheck.includes('json_array(category_id, streamer_id)'))
assert.ok(precheck.includes("m.bucket_minute >= (b.day || 'T00:00:00.000Z')"))
assert.ok(precheck.includes("m.bucket_minute < (date(b.day, '+1 day') || 'T00:00:00.000Z')"))

assert.equal(probe.includes("SELECT COUNT(*) AS count FROM minute_snapshots WHERE provider != 'kick'"), false)
assert.ok(probe.includes("WHERE provider < 'kick'"))
assert.ok(probe.includes("WHERE provider > 'kick'"))
assert.ok(probe.includes("providerLeakageCheck: 'indexed_exists_ranges'"))
assert.ok(probe.includes('rawCategoryQueryPaths: 3'))

assert.equal(contract.logicalCostModel.kind, 'repository_logical_touch_upper_bound_not_d1_rows_read')
assert.equal(contract.logicalCostModel.rawCategoryPaths, 3)
assert.equal(contract.logicalCostModel.rawItemTouches, 86400)
assert.equal(contract.logicalCostModel.rawSnapshotRangeTouches, 864)
assert.equal(contract.logicalCostModel.baseLogicalTouches, 89884)
assert.equal(contract.logicalCostModel.safetyMarginPct, 25)
assert.equal(contract.logicalCostModel.logicalTouchesWithSafety, 112355)
assert.equal(contract.logicalCostModel.repositoryModelCeiling, 125000)
assert.equal(contract.logicalCostModel.acceptedProductionRowsReadMaximum, 250000)
assert.ok(contract.logicalCostModel.logicalTouchesWithSafety <= contract.logicalCostModel.repositoryModelCeiling)
assert.ok(contract.logicalCostModel.repositoryModelCeiling < contract.logicalCostModel.acceptedProductionRowsReadMaximum)
assert.equal(contract.precheck.itemAggregationPasses, 1)
assert.equal(contract.precheck.acceptedPredicateSemanticsChanged, false)
assert.equal(contract.providerLeakage.exactForeignProviderRowCountRequired, false)

for (const key of [
  'rowsReadThresholdRelaxed',
  'repositoryLogicalModelAcceptedByThisPr',
  'newProductionProbeAuthorized',
  'permanentGeneratorEnablementAuthorized',
  'collectorIntegrationAuthorized',
  'collectorDeploymentAuthorized',
  'newCronAuthorized',
  'backfillAuthorized',
  'rawRetentionChangeAuthorized',
  'historyApiCategoryAuthorized',
  'historyCategoryUiAuthorized',
  'twitchRolloutAuthorized',
  'crossProviderBehaviorAuthorized',
]) assert.equal(contract.acceptance[key], false, `${key} must remain false`)
assert.equal(contract.acceptance.rowsReadMaximum, 250000)
assert.equal(entry.includes('maybeGenerateKickHistoryCategoryAggregates'), false)
assert.equal(config.includes('HISTORY_CATEGORY'), false)

console.log('12A-18 cost bound verified: precheck is a single item aggregation pass, provider leakage is zero/nonzero via provider-range EXISTS, conservative logical model with 25% safety is 112,355 below the 125k repository ceiling, and no production/permanent runtime authority is granted.')
