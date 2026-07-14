import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const normalizeSql = (value) => value.replace(/--.*$/gm, '').replace(/;/g, '').replace(/\s+/g, ' ').trim().toLowerCase()

const contract = json('docs/audits/12a4-category-controlled-schema-apply-contract.json')
const evidence = json('docs/audits/12a4-category-schema-recovery-audit-evidence.json')
const trigger = json('docs/audits/12a4-category-controlled-schema-apply-trigger.json')
const migration = read('db/d1/005_category_capture.sql')
const moduleSource = read('workers/shared/category-schema.ts')
const worker = read('workers/category-schema-apply/src/index.ts')
const twitchConfig = read('workers/category-schema-apply/wrangler.twitch.toml')
const kickConfig = read('workers/category-schema-apply/wrangler.kick.toml')
const twitchCollectorConfig = read('workers/collector-twitch/wrangler.toml')
const kickCollectorConfig = read('workers/collector-kick/wrangler.toml')
const workflow = read('.github/workflows/analytics-12a4-category-controlled-schema-apply.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-contract-v1')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.migration.expectedStatementCount, 9)
assert.equal(contract.migration.secondPassStatementCountMax, 0)
assert.equal(contract.migration.partialSchemaPolicy, 'stop_without_applying')
assert.deepEqual(contract.providers.order, ['twitch', 'kick'])
assert.equal(contract.execution.categoryCaptureEnablementIncluded, false)
assert.equal(contract.execution.categoryRowsIncluded, false)
assert.equal(contract.failurePolicy.doNotDropAppliedSchema, true)
assert.equal(contract.failurePolicy.leaveCategoryCaptureDisabled, true)

assert.equal(evidence.status, 'accepted')
assert.equal(evidence.gate.recoveryAuditPass, true)
assert.equal(evidence.providers.twitch.schemaState, 'complete')
assert.equal(evidence.providers.kick.schemaState, 'complete')
assert.equal(evidence.providers.twitch.query.rowsWritten, 0)
assert.equal(evidence.providers.kick.query.rowsWritten, 0)
assert.equal(evidence.providers.twitch.providerLeakageRows, 0)
assert.equal(evidence.providers.kick.providerLeakageRows, 0)
assert.equal(evidence.gate.categoryRuntimeEnablementAuthorized, false)

assert.equal(trigger.status, 'consumed_and_retired')
assert.equal(trigger.retired, true)
assert.equal(trigger.result.twitchSchemaState, 'complete')
assert.equal(trigger.result.kickSchemaState, 'complete')
assert.equal(trigger.result.categoryCaptureEnabled, false)

const migrationStatements = migration.split(';').map(normalizeSql).filter(Boolean)
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

assert.ok(worker.includes("url.pathname === '/inspect'"))
assert.ok(worker.includes("url.pathname === '/apply'"))
assert.equal(worker.includes('/collect'), false)
assert.equal(worker.includes('scheduled('), false)
assert.equal(worker.includes('CATEGORY_CAPTURE_ENABLED'), false)

for (const [provider, config, expectedName] of [
  ['twitch', twitchConfig, 'vl_twitch_hot'],
  ['kick', kickConfig, 'vl_kick_hot'],
]) {
  assert.ok(config.includes(`PROVIDER = "${provider}"`))
  assert.ok(config.includes(`database_name = "${expectedName}"`))
  assert.equal(config.includes('CATEGORY_CAPTURE_ENABLED'), false)
  assert.equal(config.includes('[triggers]'), false)
}
assert.notEqual(twitchConfig.match(/database_id = "([^"]+)"/)?.[1], kickConfig.match(/database_id = "([^"]+)"/)?.[1])
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchCollectorConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickCollectorConfig), false)

assert.ok(workflow.includes('test-12a4-category-controlled-schema-apply.py'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run'))
assert.ok(workflow.includes('verify-development-policy.mjs'))
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED'), false)

console.log(JSON.stringify({
  ok: true,
  mode: 'accepted_schema_archive_validation',
  migrationStatements: migrationStatements.length,
  providerSchemas: { twitch: 'complete', kick: 'complete' },
  productionExecution: false,
  categoryCaptureEnabled: false,
}, null, 2))
