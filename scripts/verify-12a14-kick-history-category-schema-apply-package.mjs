import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const normalize = (value) => value.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').replace(/;\s*$/g, '').trim()

const contract = json('docs/audits/12a14-kick-history-category-schema-apply-contract.json')
const decision = json('docs/audits/12a12-kick-history-category-aggregate-capacity-decision.json')
const benchmark = json('docs/audits/12a13-kick-history-category-aggregate-benchmark-evidence.json')
const migration = read('db/d1/006_history_category_aggregate.sql')
const runtime = read('workers/shared/history-category-schema.ts')
const worker = read('workers/history-category-schema-apply/src/index.ts')
const wrangler = read('workers/history-category-schema-apply/wrangler.kick.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a14-kick-history-category-schema-apply-contract-v1')
assert.equal(contract.status, 'design_package_candidate_no_production_trigger')
assert.equal(contract.phase, '12A-14')
assert.equal(contract.trackingIssue, 833)
assert.equal(contract.provider, 'kick')
assert.equal(contract.acceptedAuthority.capacityDecisionPr, 830)
assert.equal(contract.acceptedAuthority.schemaBenchmarkPr, 832)
assert.equal(contract.acceptedAuthority.acceptedMainSha, 'f9ff71e29c2770f3cb11168fe8a331e1a63ee12f')
assert.equal(decision.authorization.repositoryMigrationCandidateAuthorizedNext, true)
assert.equal(benchmark.benchmark.incrementalMiBWithSafety, 49.91)
assert.equal(benchmark.benchmark.designBudgetPass, true)

assert.equal(contract.migration.statementCount, 5)
assert.equal(contract.migration.tableCount, 3)
assert.equal(contract.migration.indexCount, 2)
assert.equal(contract.migration.secondPassStatementCountMax, 0)
assert.equal(contract.migration.partialSchemaPolicy, 'stop_without_applying')

const migrationStatements = migration
  .split(';')
  .map(normalize)
  .filter(Boolean)
const runtimeBlock = runtime.match(/HISTORY_CATEGORY_SCHEMA_STATEMENTS\s*=\s*\[([\s\S]*?)\]\s*as const/)
assert.ok(runtimeBlock, 'runtime statement array missing')
const runtimeStatements = [...runtimeBlock[1].matchAll(/`([\s\S]*?)`/g)].map((match) => normalize(match[1]))
assert.equal(migrationStatements.length, 5)
assert.deepEqual(runtimeStatements, migrationStatements, 'runtime DDL must exactly match migration statements after normalization')

for (const name of [
  'history_category_daily',
  'idx_history_category_daily_category_day',
  'history_category_streamer_daily',
  'idx_history_category_streamer_category_day',
  'history_category_day_status',
]) {
  assert.ok(runtime.includes(`'${name}'`), `runtime object missing: ${name}`)
}
for (const fragment of [
  "reason: 'already-complete'",
  "reason: 'partial-schema-stop'",
  'requireCompletelyAbsent',
  'HISTORY_CATEGORY_SCHEMA_STATEMENTS.map',
  "throw new Error('history_category_schema_apply_incomplete')",
]) assert.ok(runtime.includes(fragment), `runtime safety fragment missing: ${fragment}`)

for (const fragment of [
  "const CONFIRMATION = 'APPLY_KICK_HISTORY_CATEGORY_AGGREGATE_SCHEMA_ONLY'",
  "url.pathname === '/inspect'",
  "url.pathname === '/apply'",
  "error: 'partial_schema_stop'",
  "error: 'preexisting_aggregate_rows_stop'",
  'post.aggregateRows.total === 0',
  "WHERE provider != 'kick'",
  'collectorRouteAvailable: false',
  'scheduledHandlerAvailable: false',
  'aggregateGenerationEnabledByWorker: false',
  'twitchOperationAvailable: false',
]) assert.ok(worker.includes(fragment), `worker safety fragment missing: ${fragment}`)
assert.equal(/scheduled\s*\(/.test(worker), false, 'temporary worker must not expose scheduled handler')
assert.equal(worker.includes('/collect'), false, 'temporary worker must not expose collector route')
assert.equal(/INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM/i.test(worker), false, 'temporary worker must not write data rows')

assert.ok(wrangler.includes('name = "viewloom-history-category-schema-apply-kick"'))
assert.ok(wrangler.includes('database_name = "vl_kick_hot"'))
assert.equal(wrangler.includes('vl_twitch_hot'), false)
assert.equal(wrangler.includes('[triggers]'), false)

for (const key of [
  'aggregateGeneratorAuthorized',
  'collectorChangeAuthorized',
  'newCronAuthorized',
  'rawRetentionChangeAuthorized',
  'backfillAuthorized',
  'historyApiCategoryAuthorized',
  'historyCategoryUiAuthorized',
  'twitchSchemaApplyAuthorized',
  'crossProviderBehaviorAuthorized',
]) assert.equal(contract.authorization[key], false, `${key} must remain false`)
assert.equal(contract.authorization.productionApplyArmedNow, false)
assert.equal(contract.authorization.productionSchemaApplyExecutedNow, false)
assert.equal(contract.authorization.separateOneTimeTriggerAuthorizedAfterPackageAcceptance, true)

console.log('Kick History category controlled schema-apply package verified: exact five-statement migration parity, Kick-only temporary worker, fail-closed partial state, zero-row and no-runtime boundaries preserved.')
