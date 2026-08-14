import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contract = json('docs/audits/12a17-kick-history-category-probe-read-path-contract.json')
const failure = json('docs/audits/12a15-kick-history-category-cost-probe-production-failure.json')
const range = json('docs/audits/12a16-kick-history-category-read-cost-optimization-contract.json')
const probe = read('workers/history-category-aggregate-cost-probe/src/index.ts')
const generator = read('workers/shared/history-category-aggregate.ts')
const entry = read('workers/collector-kick/src/entry.ts')
const config = read('workers/collector-kick/wrangler.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a17-kick-history-category-probe-read-path-v1')
assert.equal(contract.status, 'repository_cost_model_candidate_no_production_execution')
assert.equal(contract.phase, '12A-17')
assert.equal(contract.trackingIssue, 860)
assert.equal(contract.parentOptimizationIssue, 858)
assert.equal(contract.parentIssue, 623)
assert.equal(contract.provider, 'kick')
assert.equal(contract.authority.failedProductionRun, 31769000044)
assert.equal(contract.authority.failedRowsRead, 843288)
assert.equal(contract.authority.rowsReadMaximum, 250000)
assert.equal(failure.status, 'performance_failed_cleanup_safe')
assert.equal(range.status, 'repository_optimization_candidate_no_production_execution')
assert.equal(range.acceptance.rowsReadMaximum, 250000)
assert.equal(range.acceptance.newProductionProbeAuthorized, false)

assert.equal(contract.historicalProbeModel.rawCategoryQueryPaths, 8)
assert.equal(contract.candidateProbeModel.rawCategoryQueryPaths, 3)
assert.equal(contract.candidateProbeModel.rawCategoryPathReductionCount, 5)
assert.equal(contract.candidateProbeModel.rawCategoryPathReductionPct, 62.5)
assert.equal(contract.candidateProbeModel.generatorRawPrecheck, 1)
assert.equal(contract.candidateProbeModel.categoryDailyInsertRawScan, 1)
assert.equal(contract.candidateProbeModel.streamerCategoryInsertRawScan, 1)
assert.equal(contract.candidateProbeModel.externalInspectRawPrecheck, 0)
assert.equal(contract.candidateProbeModel.probeDuringInspectRawPrecheck, 0)
assert.equal(contract.candidateProbeModel.probePostInspectRawPrecheck, 0)
assert.equal(contract.candidateProbeModel.generatorReturnedPrecheckUsedForValidation, true)
assert.equal(contract.candidateProbeModel.duringInspectParsesRawCategoryPayload, false)
assert.equal(contract.candidateProbeModel.postInspectParsesRawCategoryPayload, false)

assert.equal(probe.includes('precheckKickHistoryCategoryDay'), false)
assert.ok(probe.includes('inspectPreconditions(env.DB, day)'))
assert.ok(probe.includes('const pre = await inspectPreconditions(db, day)'))
assert.ok(probe.includes('refreshKickHistoryCategoryAggregateDay(db, day, { startDay: day })'))
assert.ok(probe.includes('operation?.precheck.categoryMissingItems'))
assert.ok(probe.includes('operation?.precheck.categoryObservedItems'))
assert.ok(probe.includes('operation?.precheck.candidateCategoryRows'))
assert.ok(probe.includes('operation?.precheck.candidateStreamerCategoryRows'))
assert.ok(probe.includes('rawCategoryQueryPaths: 3'))
assert.ok(probe.includes('generatorPrecheck: 1'))
assert.ok(probe.includes('categoryDailyInsert: 1'))
assert.ok(probe.includes('streamerCategoryDailyInsert: 1'))
assert.ok(probe.includes('duringInspect: 0'))
assert.ok(probe.includes('postInspect: 0'))

const aggregateInspectStart = probe.indexOf('async function inspectAggregateState(')
const aggregateInspectEnd = probe.indexOf('function authorized(', aggregateInspectStart)
assert.ok(aggregateInspectStart >= 0 && aggregateInspectEnd > aggregateInspectStart)
const aggregateInspect = probe.slice(aggregateInspectStart, aggregateInspectEnd)
assert.equal(aggregateInspect.includes('minute_snapshots'), false)
assert.equal(aggregateInspect.includes('json_each'), false)
assert.equal(aggregateInspect.includes('payload_json'), false)

assert.ok(generator.includes('const precheck = await precheckKickHistoryCategoryDay(db, day)'))
assert.ok(
  generator.indexOf('const precheck = await precheckKickHistoryCategoryDay(db, day)')
    < generator.indexOf('const pendingResult = await upsertStatus('),
)
assert.equal(contract.semantics.permanentGeneratorChanged, false)
assert.equal(contract.semantics.generatorOwnPrecheckPreserved, true)
assert.equal(contract.semantics.precheckBeforeRefreshPendingWritePreserved, true)
assert.equal(contract.semantics.categoryRowCap, 300)
assert.equal(contract.semantics.streamerCategoryRowCap, 1000)
assert.equal(contract.semantics.cleanupToZeroRequired, true)
assert.equal(contract.semantics.providerSeparated, true)

for (const key of [
  'rowsReadThresholdRelaxed',
  'repositoryCostModelAcceptedByThisPr',
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
assert.equal(config.includes('crons = ["*/5 * * * *"]'), true)

console.log('12A-17 probe read-path verified: dormant probe direct raw prechecks are removed, generator retains one authoritative precheck before writes, only two aggregate insert scans remain, cheap during/post inspections avoid minute_snapshots payload parsing, and production/permanent runtime remains closed.')
