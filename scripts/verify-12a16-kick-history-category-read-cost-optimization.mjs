import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contract = json('docs/audits/12a16-kick-history-category-read-cost-optimization-contract.json')
const failure = json('docs/audits/12a15-kick-history-category-cost-probe-production-failure.json')
const sql = read('workers/shared/history-category-aggregate-sql.ts')
const schema = read('db/kick/migrations/0001_kick_hot_schema.sql')
const collector = read('workers/collector-kick/src/index-category.ts')
const entry = read('workers/collector-kick/src/entry.ts')
const config = read('workers/collector-kick/wrangler.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a16-kick-history-category-read-cost-optimization-v1')
assert.equal(contract.status, 'repository_optimization_candidate_no_production_execution')
assert.equal(contract.phase, '12A-16')
assert.equal(contract.trackingIssue, 858)
assert.equal(contract.parentIssue, 623)
assert.equal(contract.provider, 'kick')
assert.equal(contract.authority.productionRun, 31769000044)
assert.equal(contract.authority.measuredRowsRead, 843288)
assert.equal(contract.authority.acceptedRowsReadMaximum, 250000)
assert.equal(failure.status, 'performance_failed_cleanup_safe')
assert.equal(failure.measured.totalProbeRowsRead, 843288)
assert.equal(failure.thresholds.totalProbeRowsReadMax, 250000)

assert.equal(contract.baseSchemaAuthority.path, 'db/kick/migrations/0001_kick_hot_schema.sql')
assert.deepEqual(contract.baseSchemaAuthority.primaryKey, ['provider', 'bucket_minute'])
assert.equal(contract.baseSchemaAuthority.rangeIndex, 'idx_minute_snapshots_provider_bucket')
assert.deepEqual(contract.baseSchemaAuthority.rangeIndexColumns, ['provider', 'bucket_minute'])
assert.equal(contract.baseSchemaAuthority.additionalIndexRequired, false)
assert.equal(contract.baseSchemaAuthority.rawRetentionDays, 60)
assert.equal(contract.baseSchemaAuthority.collectorCadenceMinutes, 5)
assert.ok(schema.includes('PRIMARY KEY (provider, bucket_minute)'))
assert.ok(schema.includes('idx_minute_snapshots_provider_bucket'))
assert.ok(schema.includes('ON minute_snapshots (provider, bucket_minute DESC)'))
assert.ok(collector.includes('return copy.toISOString()'))
assert.ok(collector.includes("unixepoch('now', '-60 days')"))

assert.equal(sql.includes('substr(bucket_minute, 1, 10)'), false)
assert.equal(sql.includes('substr(m.bucket_minute, 1, 10)'), false)
assert.equal((sql.match(/bucket_minute >= \(\?2 \|\| 'T00:00:00\.000Z'\)/g) ?? []).length, 3)
assert.equal((sql.match(/bucket_minute < \(date\(\?2, '\+1 day'\) \|\| 'T00:00:00\.000Z'\)/g) ?? []).length, 3)
assert.ok(sql.includes('provider = ?1'))
assert.equal(contract.candidate.bindCountChanged, false)
assert.equal(contract.candidate.schemaChange, false)
assert.equal(contract.candidate.semanticChangeAuthorized, false)
assert.equal(contract.deterministicBenchmark.retainedKickSnapshots, 17280)
assert.equal(contract.deterministicBenchmark.targetFullDaySnapshots, 288)
assert.equal(contract.deterministicBenchmark.baseCandidateReductionFactorFullDay, 60)
assert.equal(contract.deterministicBenchmark.productionObservedTargetSnapshots, 51)

for (const key of [
  'rowsReadThresholdRelaxed',
  'permanentGeneratorEnablementAuthorized',
  'newProductionProbeAuthorized',
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

console.log('12A-16 Kick History category read-cost optimization verified: existing provider/bucket key/index is authoritative, three raw History category paths use UTC day range predicates without a schema/bind change, the 250k gate is unchanged, and production/permanent runtime remains closed.')
