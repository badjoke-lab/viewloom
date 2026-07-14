import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const exists = (file) => fs.existsSync(file)

const contract = json('docs/audits/12a4-category-controlled-schema-apply-execution-contract.json')
const design = json('docs/audits/12a4-category-controlled-schema-apply-contract.json')
const preflight = json('docs/audits/12a4-category-readonly-preflight-evidence.json')
const workflow = read('.github/workflows/analytics-12a4-category-controlled-schema-apply-execution.yml')
const worker = read('workers/category-schema-apply/src/index.ts')
const shared = read('workers/shared/category-schema.ts')
const twitchConfig = read('workers/category-schema-apply/wrangler.twitch.toml')
const kickConfig = read('workers/category-schema-apply/wrangler.kick.toml')
const twitchCollectorConfig = read('workers/collector-twitch/wrangler.toml')
const kickCollectorConfig = read('workers/collector-kick/wrangler.toml')
const collector = read('scripts/collect-12a4-category-controlled-schema-apply-evidence.mjs')
const verifier = read('scripts/verify-12a4-category-controlled-schema-apply-evidence.mjs')
const trigger = exists(contract.triggerFile) ? json(contract.triggerFile) : null

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-execution-contract-v1')
assert.equal(contract.status, 'execution_package_candidate_no_production_trigger')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.design.pr, 528)
assert.equal(contract.design.mergeSha, '21be04c8532d9b20ec22f29af6658a2d926b78a1')
assert.equal(contract.design.accepted, true)
assert.equal(contract.acceptedPreflight.pr, 523)
assert.equal(contract.acceptedPreflight.twitchGatePass, true)
assert.equal(contract.acceptedPreflight.kickGatePass, true)
assert.equal(contract.acceptedPreflight.productionCategorySchemaAbsent, true)
assert.equal(contract.migration.statementCount, 9)
assert.equal(contract.migration.secondPassStatementCountMax, 0)
assert.equal(contract.migration.partialSchemaPolicy, 'stop_without_applying')
assert.deepEqual(contract.providers.order, ['twitch', 'kick'])
assert.equal(contract.providers.stopAfterFirstProviderFailure, true)
assert.equal(contract.providers.twitch.healthSource, 'collector_status')
assert.equal(contract.providers.kick.healthSource, 'latest_snapshot')
assert.equal(contract.acceptanceThresholds.schemaApplyStatementsPerProvider, 9)
assert.equal(contract.acceptanceThresholds.secondPassStatementCountMax, 0)
assert.equal(contract.acceptanceThresholds.schemaApplyWorkerWallMsPerProviderMax, 15000)
assert.equal(contract.acceptanceThresholds.schemaSizeIncreaseBytesPerProviderMax, 5242880)
assert.equal(contract.acceptanceThresholds.collectorLatencyDeltaMsPerProviderMax, 2000)
assert.equal(contract.acceptanceThresholds.categoryDictionaryRowsMax, 0)
assert.equal(contract.acceptanceThresholds.reservedProbeRowsMax, 0)
assert.equal(contract.acceptanceThresholds.providerLeakageRowsMax, 0)
assert.equal(contract.acceptanceThresholds.temporaryWorkersRetained, false)
assert.equal(contract.acceptanceThresholds.postDeleteHttpStatus, 404)
assert.equal(Object.values(contract.evidencePrivacy).every((value) => value === false), true)
assert.equal(Object.values(contract.packagePrBoundary).every((value) => value === false), true)

assert.equal(design.status, 'design_package_ready_no_production_execution')
assert.equal(design.acceptedPreflight.acceptancePr, 523)
assert.equal(design.migration.expectedStatementCount, 9)
assert.deepEqual(design.providers.order, ['twitch', 'kick'])
assert.equal(design.execution.categoryCaptureEnablementIncluded, false)
assert.equal(design.execution.categoryRowsIncluded, false)

assert.equal(preflight.status, 'accepted')
assert.equal(preflight.gate.readOnlyPreflightPass, true)
assert.equal(preflight.providers.twitch.providerGatePass, true)
assert.equal(preflight.providers.kick.providerGatePass, true)
assert.equal(preflight.providers.twitch.schema.categorySchemaComplete, false)
assert.equal(preflight.providers.kick.schema.categorySchemaComplete, false)
assert.equal(preflight.gate.remoteMigrationApplyAuthorized, false)
assert.equal(preflight.gate.runtimeCaptureEnablementAuthorized, false)

assert.ok(shared.includes('CATEGORY_SCHEMA_STATEMENTS'))
assert.ok(shared.includes('applyCategorySchemaControlled'))
assert.ok(shared.includes("reason: 'partial-schema-stop'"))
assert.ok(shared.includes("reason: 'already-complete'"))
assert.equal((shared.match(/ALTER TABLE/g) ?? []).length, 8)

for (const text of [
  "const CONFIRMATION = 'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED'",
  "url.pathname === '/inspect'",
  "url.pathname === '/apply'",
  'inspectExecutionState',
  'LIMIT 2',
  'categoryDictionaryRows',
  'reservedProbeRows',
  'providerLeakageRows',
  'databaseSizeBytes',
  'productionCategoryRowsWrittenByWorker: false',
]) assert.ok(worker.includes(text), `worker missing: ${text}`)
assert.equal(worker.includes('payload_json'), false)
assert.equal(worker.includes('/collect'), false)
assert.equal(worker.includes('scheduled('), false)
assert.equal(worker.includes('CATEGORY_CAPTURE_ENABLED'), false)

for (const [provider, config, databaseName, workerName] of [
  ['twitch', twitchConfig, 'vl_twitch_hot', 'viewloom-category-schema-apply-twitch'],
  ['kick', kickConfig, 'vl_kick_hot', 'viewloom-category-schema-apply-kick'],
]) {
  assert.ok(config.includes(`name = "${workerName}"`))
  assert.ok(config.includes(`PROVIDER = "${provider}"`))
  assert.ok(config.includes(`database_name = "${databaseName}"`))
  assert.ok(config.includes('binding = "DB"'))
  assert.equal(config.includes('CATEGORY_CAPTURE_ENABLED'), false)
  assert.equal(config.includes('[triggers]'), false)
}
assert.notEqual(twitchConfig.match(/database_id = "([^"]+)"/)?.[1], kickConfig.match(/database_id = "([^"]+)"/)?.[1])
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchCollectorConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickCollectorConfig), false)

for (const text of [
  'viewloom-12a4-category-controlled-schema-apply-evidence-v1',
  'collectorLatencyDeltaMs',
  'schemaSizeIncreaseBytes',
  'secondApplyNoop',
  'temporaryWorkerDeleted',
]) assert.ok(collector.includes(text), `collector missing: ${text}`)
assert.ok(verifier.includes("mode === '--require-pass'"))
assert.ok(verifier.includes('controlledSchemaApplyPass'))
assert.ok(verifier.includes('only Kick may be skipped after a Twitch failure'))

for (const text of [
  'pull_request:',
  'push:',
  contract.triggerFile,
  "github.event_name == 'push'",
  "github.ref == 'refs/heads/main'",
  'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED',
  'expectedPackageHeadSha',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'wrangler@4 deploy --dry-run',
  'wrangler@4 deploy --config',
  'secret put APPLY_TOKEN',
  '"$url/inspect"',
  '"$url/apply"',
  'x-viewloom-confirm',
  'stop_after_twitch_failure',
  'collect-12a4-category-controlled-schema-apply-evidence.mjs',
  'verify-12a4-category-controlled-schema-apply-evidence.mjs',
  'workers/services/$service',
  'deleteHttpStatus',
  'rm -rf "$RAW_DIR"',
]) assert.ok(workflow.includes(text), `workflow missing: ${text}`)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(workflow.includes('/collect'), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(workflow), false)
assert.equal(workflow.includes('--var CATEGORY_CAPTURE_ENABLED'), false)

if (trigger) {
  assert.equal(trigger.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-trigger-v1')
  assert.equal(trigger.status, 'armed_for_one_time_main_push')
  assert.equal(trigger.trackingIssue, 519)
  assert.equal(trigger.designPr, 528)
  assert.ok(Number.isInteger(trigger.packagePr) && trigger.packagePr > 528)
  assert.match(trigger.expectedPackageHeadSha, /^[0-9a-f]{40}$/)
  assert.equal(trigger.confirmation, 'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED')
  assert.deepEqual(trigger.providerOrder, ['twitch', 'kick'])
  assert.equal(trigger.oneTime, true)
  assert.equal(Object.values(trigger.boundaries).every((value) => value === false), true)
}

console.log(JSON.stringify({
  ok: true,
  mode: trigger ? 'armed_one_time_trigger' : 'execution_package_candidate',
  designPr: contract.design.pr,
  triggerPresent: Boolean(trigger),
  productionExecutionByPackagePr: false,
}, null, 2))
