import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const normalizeSql = (value) => value
  .replace(/--.*$/gm, '')
  .replace(/;/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

const contract = json('docs/audits/12a4-category-controlled-schema-apply-contract.json')
const preflight = json('docs/audits/12a4-category-readonly-preflight-evidence.json')
const migration = read('db/d1/005_category_capture.sql')
const moduleSource = read('workers/shared/category-schema.ts')
const worker = read('workers/category-schema-apply/src/index.ts')
const twitchConfig = read('workers/category-schema-apply/wrangler.twitch.toml')
const kickConfig = read('workers/category-schema-apply/wrangler.kick.toml')
const twitchCollectorConfig = read('workers/collector-twitch/wrangler.toml')
const kickCollectorConfig = read('workers/collector-kick/wrangler.toml')
const workflow = read('.github/workflows/analytics-12a4-category-controlled-schema-apply.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-contract-v1')
assert.equal(contract.status, 'design_package_ready_no_production_execution')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedPreflight.acceptancePr, 523)
assert.equal(contract.acceptedPreflight.acceptanceMergeSha, '428154d16dc5b62c30ac6b7cdeb668f3e442a3b6')
assert.equal(contract.acceptedPreflight.twitchGatePass, true)
assert.equal(contract.acceptedPreflight.kickGatePass, true)
assert.equal(contract.acceptedPreflight.productionCategorySchemaPresent, false)
assert.equal(contract.migration.expectedStatementCount, 9)
assert.equal(contract.migration.secondPassStatementCountMax, 0)
assert.equal(contract.migration.partialSchemaPolicy, 'stop_without_applying')
assert.deepEqual(contract.providers.order, ['twitch', 'kick'])
assert.equal(contract.providers.stopAfterFirstProviderFailure, true)
assert.equal(contract.execution.confirmation, 'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED')
assert.equal(contract.execution.sequential, true)
assert.equal(contract.execution.collectorDeploymentIncluded, false)
assert.equal(contract.execution.categoryCaptureEnablementIncluded, false)
assert.equal(contract.execution.categoryRowsIncluded, false)
assert.equal(contract.failurePolicy.doNotDropAppliedSchema, true)
assert.equal(contract.failurePolicy.leaveCategoryCaptureDisabled, true)
assert.equal(contract.failurePolicy.stopBeforeNextProviderOnFailure, true)
assert.equal(contract.acceptanceThresholds.schemaSizeIncreaseMbPerProviderMax, 5)
assert.equal(contract.acceptanceThresholds.collectorLatencyDeltaMsPerProviderMax, 2000)
assert.equal(contract.acceptanceThresholds.secondPassStatementCountMax, 0)
assert.equal(Object.values(contract.planningPrBoundary).every((value) => value === false), true)

assert.equal(preflight.status, 'accepted')
assert.equal(preflight.gate.readOnlyPreflightPass, true)
assert.equal(preflight.providers.twitch.providerGatePass, true)
assert.equal(preflight.providers.kick.providerGatePass, true)
assert.equal(preflight.providers.twitch.schema.categorySchemaComplete, false)
assert.equal(preflight.providers.kick.schema.categorySchemaComplete, false)
assert.equal(preflight.providers.twitch.providerLeakageRows, 0)
assert.equal(preflight.providers.kick.providerLeakageRows, 0)
assert.equal(preflight.gate.remoteMigrationApplyAuthorized, false)
assert.equal(preflight.gate.runtimeCaptureEnablementAuthorized, false)

const migrationStatements = migration
  .split(';')
  .map(normalizeSql)
  .filter(Boolean)
assert.equal(migrationStatements.length, 9)
const normalizedModule = normalizeSql(moduleSource)
for (const statement of migrationStatements) {
  assert.ok(normalizedModule.includes(statement), `category schema module missing migration statement: ${statement}`)
}
assert.equal((moduleSource.match(/ALTER TABLE/g) ?? []).length, 8)
assert.ok(moduleSource.includes('CATEGORY_SCHEMA_STATEMENTS'))
assert.ok(moduleSource.includes('applyCategorySchemaControlled'))
assert.ok(moduleSource.includes("reason: 'partial-schema-stop'"))
assert.ok(moduleSource.includes('requireCompletelyAbsent'))
assert.ok(moduleSource.includes('await db.batch'))
assert.ok(moduleSource.includes("throw new Error('category_schema_apply_incomplete')"))

assert.ok(worker.includes("const CONFIRMATION = 'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED'"))
assert.ok(worker.includes("url.pathname === '/inspect'"))
assert.ok(worker.includes("url.pathname === '/apply'"))
assert.ok(worker.includes('applyCategorySchemaControlled'))
assert.ok(worker.includes("error: 'partial_schema_stop'"))
assert.ok(worker.includes('productionCategoryRowsWrittenByWorker: false'))
assert.ok(worker.includes('collectorRouteAvailable: false'))
assert.ok(worker.includes('scheduledHandlerAvailable: false'))
assert.equal(worker.includes('/collect'), false)
assert.equal(worker.includes('scheduled('), false)
assert.equal(worker.includes('CATEGORY_CAPTURE_ENABLED'), false)

for (const [provider, config, expectedName] of [
  ['twitch', twitchConfig, 'vl_twitch_hot'],
  ['kick', kickConfig, 'vl_kick_hot'],
]) {
  assert.ok(config.includes(`PROVIDER = "${provider}"`))
  assert.ok(config.includes(`database_name = "${expectedName}"`))
  assert.ok(config.includes('binding = "DB"'))
  assert.equal(config.includes('CATEGORY_CAPTURE_ENABLED'), false)
  assert.equal(config.includes('[triggers]'), false)
}
assert.notEqual(
  twitchConfig.match(/database_id = "([^"]+)"/)?.[1],
  kickConfig.match(/database_id = "([^"]+)"/)?.[1],
)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchCollectorConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickCollectorConfig), false)

assert.ok(workflow.includes('test-12a4-category-controlled-schema-apply.py'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run'))
assert.ok(workflow.includes('wrangler.twitch.toml'))
assert.ok(workflow.includes('wrangler.kick.toml'))
assert.ok(workflow.includes('verify-development-policy.mjs'))
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(workflow.includes('wrangler deploy --config'), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED'), false)

console.log(JSON.stringify({
  ok: true,
  migrationStatements: migrationStatements.length,
  providerOrder: contract.providers.order,
  preflightAcceptancePr: contract.acceptedPreflight.acceptancePr,
  productionExecution: false,
}, null, 2))
