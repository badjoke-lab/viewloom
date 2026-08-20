#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a43-kick-history-v2-schema-apply-package-contract.json'
const evidencePath = 'docs/audits/12a42-kick-history-chunked-v2-candidate-benchmark-evidence.json'
const schemaPath = 'workers/history-category-v2-schema-apply/src/schema.ts'
const workerPath = 'workers/history-category-v2-schema-apply/src/index.ts'
const wranglerPath = 'workers/history-category-v2-schema-apply/wrangler.kick.toml'
const workflowPath = '.github/workflows/analytics-12a43-kick-history-v2-schema-apply-package.yml'
const triggerPath = 'docs/audits/12a43-kick-history-v2-schema-apply-trigger.json'

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
const schema = fs.readFileSync(schemaPath, 'utf8')
const worker = fs.readFileSync(workerPath, 'utf8')
const wrangler = fs.readFileSync(wranglerPath, 'utf8')
const workflow = fs.readFileSync(workflowPath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(contract.schemaVersion === 'viewloom-12a43-kick-history-v2-schema-apply-package-contract-v1', 'contract schema mismatch')
assert(contract.phase === '12A-43', 'phase mismatch')
assert(contract.issue === 928, 'issue mismatch')
assert(contract.provider === 'kick', 'provider mismatch')
assert(contract.status === 'package_ready_production_not_armed', 'package must remain unarmed')
assert(contract.acceptedCandidate.pr === 927, 'accepted candidate PR mismatch')
assert(contract.acceptedCandidate.mergeSha === '102f3ce25d1bc277cc380ff8350a54c55bc0b17a', 'accepted candidate merge mismatch')
assert(contract.acceptedCandidate.benchmarkSignatureSha256 === evidence.stableBenchmarkSignatureSha256, 'benchmark signature mismatch')
assert(evidence.status === 'PASS', '12A42 candidate must remain PASS')
assert(evidence.fixedContract.encodedBytesCap === 47196, 'accepted encoded-byte cap changed')
assert(evidence.measurement.incrementalMiBWithSafety === 30.05, 'accepted storage changed')

assert(contract.schemaPackage.tableStatements === 3, 'table statement count mismatch')
assert(contract.schemaPackage.indexStatements === 2, 'index statement count mismatch')
assert(contract.schemaPackage.firstApplyStatements === 5, 'first apply statement count mismatch')
assert(contract.schemaPackage.secondApplyStatements === 0, 'second apply statement count mismatch')
assert(contract.schemaPackage.confirmation === 'APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY', 'confirmation mismatch')
assert(contract.triggerModel.triggerPresentInPackage === false, 'package must not contain trigger')
assert(contract.triggerModel.packageMergeExecutesProduction === false, 'package merge must not execute production')
assert(!fs.existsSync(triggerPath), 'trigger file must not exist in package')

const expectedObjects = [
  'history_category_daily_v2',
  'history_category_streamer_daily_chunks_v2',
  'history_category_day_status_v2',
  'idx_history_category_daily_v2_category_day',
  'idx_history_category_streamer_chunks_v2_category_day',
]
for (const name of expectedObjects) {
  assert(contract.schemaPackage.objects.includes(name), `contract missing object ${name}`)
  assert(schema.includes(name), `schema module missing object ${name}`)
}
assert(schema.includes('contributor_encoded_bytes_cap INTEGER NOT NULL'), 'encoded byte cap field missing')
assert(schema.includes('HISTORY_CATEGORY_V2_SCHEMA_STATEMENTS.slice(0, 3)'), '3-table stage missing')
assert(schema.includes('HISTORY_CATEGORY_V2_SCHEMA_STATEMENTS.slice(3)'), '2-index stage missing')
assert(schema.includes("reason: 'partial-schema-stop'"), 'partial schema fail-close missing')
assert(schema.includes("reason: 'already-complete'"), 'already-complete second-pass path missing')

for (const fragment of [
  "const CONFIRMATION = 'APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY'",
  "url.pathname === '/health'",
  "url.pathname === '/inspect'",
  "url.pathname === '/apply'",
  "error: 'v1_schema_not_complete_stop'",
  "error: 'partial_v2_schema_stop'",
  "error: 'preexisting_v2_rows_stop'",
  'post.v2AggregateRows.total === 0',
  'post.providerLeakageRows === 0',
  'v2GeneratorAvailable: false',
  'collectorRouteAvailable: false',
  'scheduledHandlerAvailable: false',
  'backfillAvailable: false',
]) assert(worker.includes(fragment), `worker boundary missing: ${fragment}`)
assert(!worker.includes("url.pathname === '/collect'"), 'collect route forbidden')
assert(!worker.includes('async scheduled'), 'scheduled handler forbidden')

assert(wrangler.includes('name = "viewloom-history-category-v2-schema-apply-kick"'), 'service name mismatch')
assert(wrangler.includes('binding = "DB"'), 'D1 binding mismatch')
assert(wrangler.includes('database_name = "vl_kick_hot"'), 'Kick DB mismatch')
assert(!wrangler.includes('vl_twitch'), 'Twitch binding forbidden')

assert(workflow.includes("docs/audits/12a43-kick-history-v2-schema-apply-trigger.json"), 'later trigger path missing')
assert(workflow.includes("github.event_name == 'push'"), 'dormant production job condition missing')
assert(workflow.includes('APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY'), 'workflow confirmation mismatch')
assert(workflow.includes('workers/history-category-v2-schema-apply/wrangler.kick.toml'), 'workflow worker config mismatch')
assert(workflow.includes('if: github.event_name == \'pull_request\''), 'PR package guard missing')

for (const [key, value] of Object.entries(contract.authorizations)) {
  if (key === 'packageMerge') assert(value === true, 'package merge must be the only current authorization')
  else assert(value === false, `${key} must remain unauthorized`)
}

console.log('12A-43 controlled Kick History v2 schema apply package verified')
