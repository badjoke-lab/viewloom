import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const exists = (file) => fs.existsSync(file)

const contract = json('docs/audits/12a4-kick-category-schema-recovery-contract.json')
const accepted = json(contract.acceptedAudit.evidenceFile)
const worker = read('workers/kick-category-schema-recovery/src/index.ts')
const config = read('workers/kick-category-schema-recovery/wrangler.toml')
const shared = read('workers/shared/category-schema.ts')
const runner = read('scripts/run-12a4-kick-category-schema-recovery.mjs')
const collector = read('scripts/collect-12a4-kick-category-schema-recovery-evidence.mjs')
const verifier = read('scripts/verify-12a4-kick-category-schema-recovery-evidence.mjs')
const workflow = read('.github/workflows/analytics-12a4-kick-category-schema-recovery.yml')
const trigger = exists(contract.triggerFile) ? json(contract.triggerFile) : null

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-category-schema-recovery-contract-v1')
assert.equal(contract.status, 'recovery_package_candidate_no_production_trigger')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedAudit.acceptancePr, 537)
assert.equal(contract.acceptedAudit.mergeSha, '56891f4d0441da2122fa130c7e7d8a3491ee2740')
assert.equal(contract.target.provider, 'kick')
assert.equal(contract.target.databaseName, 'vl_kick_hot')
assert.equal(contract.migration.statementCount, 9)
assert.equal(contract.migration.secondPassStatementCountMax, 0)
assert.equal(contract.boundaries.twitchSchemaApply, false)
assert.equal(contract.boundaries.categoryRuntimeEnablement, false)
assert.equal(accepted.status, 'accepted')
assert.equal(accepted.gate.recoveryAuditPass, true)
assert.equal(accepted.providers.twitch.schemaState, 'complete')
assert.equal(accepted.providers.kick.schemaState, 'absent')

assert.equal((shared.match(/ALTER TABLE/g) ?? []).length, 8)
assert.ok(shared.includes('CATEGORY_DICTIONARY_CREATE_STATEMENT'))
assert.ok(shared.includes('applyCategorySchemaControlled'))
assert.ok(shared.includes("reason: 'partial-schema-stop'"))

for (const text of [
  "const PROVIDER = 'kick'",
  "const CONFIRMATION = 'APPLY_KICK_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED'",
  "url.pathname === '/inspect'",
  "url.pathname === '/apply'",
  'requireCompletelyAbsent: true',
  'twitchSchemaTouched: false',
  'productionCategoryRowsWrittenByWorker: false',
]) assert.ok(worker.includes(text), `worker missing: ${text}`)
assert.equal(worker.includes('payload_json'), false)
assert.equal(worker.includes('/collect'), false)
assert.equal(worker.includes('scheduled('), false)
assert.equal(worker.includes('CATEGORY_CAPTURE_ENABLED'), false)

assert.ok(config.includes('name = "viewloom-kick-category-schema-recovery"'))
assert.ok(config.includes('database_name = "vl_kick_hot"'))
assert.equal(config.includes('vl_twitch_hot'), false)
assert.equal(config.includes('CATEGORY_CAPTURE_ENABLED'), false)
assert.equal(config.includes('[triggers]'), false)

for (const text of [
  'viewloom-kick-category-schema-recovery',
  'workers/kick-category-schema-recovery/wrangler.toml',
  "['deploy', '--config', config]",
  "['secret', 'put', 'APPLY_TOKEN'",
  '`${baseUrl}/inspect`',
  '`${baseUrl}/apply`',
  'postDeleteHttpStatus',
]) assert.ok(runner.includes(text), `runner missing: ${text}`)
assert.equal(runner.includes('vl_twitch_hot'), false)

for (const text of [
  'acceptedAuditPass',
  'twitchAlreadyComplete',
  'kickPreviouslyAbsent',
  'firstApplyStatementsExact',
  'secondApplyNoop',
  'twitchUntouchedByWorker',
  'temporaryWorkerDeleted',
]) assert.ok(collector.includes(text), `collector missing: ${text}`)
assert.ok(verifier.includes("mode === '--require-pass'"))
assert.ok(verifier.includes('kickRecoveryPass'))

for (const text of [
  'pull_request:',
  'push:',
  contract.triggerFile,
  "github.event_name == 'push'",
  "github.ref == 'refs/heads/main'",
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'wrangler@4 deploy --dry-run',
  'run-12a4-kick-category-schema-recovery.mjs',
  'collect-12a4-kick-category-schema-recovery-evidence.mjs',
  'verify-12a4-kick-category-schema-recovery-evidence.mjs',
]) assert.ok(workflow.includes(text), `workflow missing: ${text}`)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED'), false)

if (trigger) {
  assert.equal(trigger.schemaVersion, 'viewloom-12a4-kick-category-schema-recovery-trigger-v1')
  assert.equal(trigger.status, 'armed_for_one_time_main_push')
  assert.equal(trigger.trackingIssue, 519)
  assert.ok(Number.isInteger(trigger.packagePr) && trigger.packagePr > 537)
  assert.match(trigger.expectedPackageHeadSha, /^[0-9a-f]{40}$/)
  assert.equal(trigger.targetProvider, 'kick')
  assert.equal(trigger.confirmation, contract.target.confirmation)
  assert.equal(trigger.oneTime, true)
  assert.equal(Object.values(trigger.boundaries).every((value) => value === false), true)
}

console.log(JSON.stringify({
  ok: true,
  mode: trigger ? 'armed_kick_only_recovery' : 'kick_recovery_package_candidate',
  twitchExecutionIncluded: false,
  productionExecutionByPackagePr: false,
}, null, 2))
