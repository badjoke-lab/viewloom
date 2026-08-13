import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const normalize = (value) => value.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').replace(/;\s*$/g, '').trim()

const contract = json('docs/audits/12a14-kick-history-category-schema-apply-contract.json')
const decision = json('docs/audits/12a12-kick-history-category-aggregate-capacity-decision.json')
const benchmark = json('docs/audits/12a13-kick-history-category-aggregate-benchmark-evidence.json')
const diagnosis = json('docs/audits/12a14-kick-history-schema-readonly-diagnosis-evidence.json')
const migration = read('db/d1/006_history_category_aggregate.sql')
const runtime = read('workers/shared/history-category-schema.ts')
const worker = read('workers/history-category-schema-apply/src/index.ts')
const wrangler = read('workers/history-category-schema-apply/wrangler.kick.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a14-kick-history-category-schema-apply-contract-v1')
assert.equal(contract.phase, '12A-14')
assert.equal(contract.provider, 'kick')
assert.equal(contract.acceptedAuthority.capacityDecisionPr, 830)
assert.equal(contract.acceptedAuthority.schemaBenchmarkPr, 832)
assert.equal(decision.authorization.repositoryMigrationCandidateAuthorizedNext, true)
assert.equal(benchmark.benchmark.incrementalMiBWithSafety, 49.91)
assert.equal(benchmark.benchmark.designBudgetPass, true)

assert.equal(diagnosis.schemaVersion, 'viewloom-12a14-kick-history-schema-readonly-diagnosis-acceptance-v1')
assert.equal(diagnosis.status, 'accepted_clean_absent_state')
assert.equal(diagnosis.failedApply.workflowRunId, 31670411266)
assert.equal(diagnosis.diagnosis.workflowRunId, 31670727423)
assert.equal(diagnosis.diagnosis.artifactId, 9169595791)
assert.equal(diagnosis.diagnosis.artifactDigest, 'sha256:3c961dc551376791619a5399eb125103ab1c9328b78ad2706399cae83c1c9938')
assert.equal(diagnosis.observedProductionState.schema.absent, true)
assert.equal(diagnosis.observedProductionState.schema.partial, false)
assert.equal(diagnosis.observedProductionState.aggregateRows.total, 0)
assert.equal(diagnosis.observedProductionState.providerLeakageRows, 0)
assert.equal(diagnosis.observedProductionState.queryMetrics.rowsWritten, 0)
assert.equal(diagnosis.observedProductionState.queryMetrics.changes, 0)
assert.equal(diagnosis.observedProductionState.failedRunTemporaryWorkerPreHttpStatus, 404)
assert.equal(diagnosis.observedProductionState.diagnosticTemporaryWorkerPostDeleteHttpStatus, 404)
assert.equal(diagnosis.conclusion.productionD1CleanForControlledRetry, true)
assert.equal(diagnosis.conclusion.directRerunOfFailedWorkflowAuthorized, false)
assert.equal(diagnosis.conclusion.repairPackageRequiredBeforeRetry, true)

assert.equal(contract.migration.statementCount, 5)
assert.equal(contract.migration.tableCount, 3)
assert.equal(contract.migration.indexCount, 2)
assert.equal(contract.migration.secondPassStatementCountMax, 0)
assert.equal(contract.migration.partialSchemaPolicy, 'stop_without_applying')

const migrationStatements = migration.split(';').map(normalize).filter(Boolean)
const runtimeBlock = runtime.match(/HISTORY_CATEGORY_SCHEMA_STATEMENTS\s*=\s*\[([\s\S]*?)\]\s*as const/)
assert.ok(runtimeBlock, 'runtime statement array missing')
const runtimeStatements = [...runtimeBlock[1].matchAll(/`([\s\S]*?)`/g)].map((match) => normalize(match[1]))
assert.equal(migrationStatements.length, 5)
assert.deepEqual(runtimeStatements, migrationStatements, 'runtime DDL must exactly match migration statements after normalization')

const tableStatements = runtimeStatements.filter((statement) => /^CREATE TABLE\b/.test(statement))
const indexStatements = runtimeStatements.filter((statement) => /^CREATE INDEX\b/.test(statement))
assert.equal(tableStatements.length, 3)
assert.equal(indexStatements.length, 2)
for (const fragment of [
  "reason: 'already-complete'",
  "reason: 'partial-schema-stop'",
  'requireCompletelyAbsent',
  "filter((statement) => /^CREATE TABLE\\b/.test(statement.trim()))",
  "filter((statement) => /^CREATE INDEX\\b/.test(statement.trim()))",
  'const tableResults = await db.batch',
  'const afterTables = await inspectHistoryCategorySchema(db)',
  'const indexResults = await db.batch',
  'tableStageStatementCount: tableResults.length',
  'indexStageStatementCount: indexResults.length',
  "throw new Error('history_category_schema_table_stage_incomplete')",
  "throw new Error('history_category_schema_apply_incomplete')",
]) assert.ok(runtime.includes(fragment), `runtime safety/staging fragment missing: ${fragment}`)
assert.ok(runtime.indexOf('const tableResults = await db.batch') < runtime.indexOf('const indexResults = await db.batch'), 'table stage must execute before index stage')

for (const name of [
  'history_category_daily',
  'idx_history_category_daily_category_day',
  'history_category_streamer_daily',
  'idx_history_category_streamer_category_day',
  'history_category_day_status',
]) assert.ok(runtime.includes(`'${name}'`), `runtime object missing: ${name}`)

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

console.log('Kick History category schema package verified: exact five-statement migration parity retained; clean absent production diagnosis frozen; runtime now stages 3 table creates before 2 dependent indexes; provider/runtime boundaries preserved.')
