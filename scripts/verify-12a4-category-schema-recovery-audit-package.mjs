import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const exists = (file) => fs.existsSync(file)

const contract = json('docs/audits/12a4-category-schema-recovery-audit-contract.json')
const workflow = read('.github/workflows/analytics-12a4-category-schema-recovery-audit.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const runner = read('scripts/run-12a4-category-schema-recovery-audit.mjs')
const collector = read('scripts/collect-12a4-category-schema-recovery-audit-evidence.mjs')
const verifier = read('scripts/verify-12a4-category-schema-recovery-audit-evidence.mjs')
const applyCollector = read('scripts/collect-12a4-category-controlled-schema-apply-evidence.mjs')
const twitchCollectorConfig = read('workers/collector-twitch/wrangler.toml')
const kickCollectorConfig = read('workers/collector-kick/wrangler.toml')
const trigger = exists(contract.triggerFile) ? json(contract.triggerFile) : null

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-schema-recovery-audit-contract-v1')
assert.equal(contract.status, 'audit_package_candidate_no_production_trigger')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.sourceAttempt.triggerPr, 533)
assert.equal(contract.sourceAttempt.triggerMergeSha, 'a83b412e479dccb36ad04541843e3dd9456e7dff')
assert.equal(contract.sourceAttempt.workflowRunId, 29325444378)
assert.deepEqual(contract.providers.order, ['twitch', 'kick'])
assert.equal(contract.acceptance.rowsWrittenMax, 0)
assert.equal(contract.acceptance.changesMax, 0)
assert.equal(contract.acceptance.providerLeakageRowsMax, 0)
assert.equal(contract.acceptance.postDeleteHttpStatus, 404)
assert.equal(contract.boundaries.readOnly, true)
assert.equal(contract.boundaries.remoteSchemaApply, false)
assert.equal(contract.boundaries.categoryRuntimeEnablement, false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchCollectorConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickCollectorConfig), false)

for (const text of [
  "url.pathname === '/inspect'",
  "mode: 'read_only_preflight'",
  'categorySchemaComplete',
  'providerLeakageRows',
  'rowsWritten',
  'changes',
  'remoteMigrationAppliedByWorker: false',
  'categoryCaptureEnabledByWorker: false',
]) assert.ok(worker.includes(text), `worker missing: ${text}`)
assert.equal(worker.includes("url.pathname === '/apply'"), false)
assert.equal(worker.includes("url.pathname === '/collect'"), false)
assert.equal(worker.includes('scheduled('), false)
assert.equal(worker.includes('payload_json'), false)

for (const text of [
  'viewloom-category-cost-preflight-twitch',
  'viewloom-category-cost-preflight-kick',
  "['deploy', '--config', spec.config]",
  "['secret', 'put', 'PROBE_TOKEN'",
  '`${url}/inspect`',
  "method: 'DELETE'",
  'deleteHttpStatus',
  'execution-status.json',
]) assert.ok(runner.includes(text), `runner missing: ${text}`)
assert.equal(runner.includes('`${url}/apply`'), false)
assert.equal(runner.includes('`${url}/collect`'), false)

for (const text of [
  'parseErrors',
  'schemaState: state',
  'rowsWrittenZero',
  'changesZero',
  'temporaryWorkerDeleted',
]) assert.ok(collector.includes(text), `collector missing: ${text}`)
assert.ok(verifier.includes("mode === '--require-pass'"))
assert.ok(verifier.includes('recoveryAuditPass'))
assert.ok(applyCollector.includes('parseErrors'))
assert.ok(applyCollector.includes('preview'))

for (const text of [
  'pull_request:',
  'push:',
  contract.triggerFile,
  "github.event_name == 'push'",
  "github.ref == 'refs/heads/main'",
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'wrangler@4 deploy --dry-run',
  'run-12a4-category-schema-recovery-audit.mjs',
  'collect-12a4-category-schema-recovery-audit-evidence.mjs',
  'verify-12a4-category-schema-recovery-audit-evidence.mjs',
  'rm -rf "$RAW_DIR"',
]) assert.ok(workflow.includes(text), `workflow missing: ${text}`)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(workflow.includes('"$url/apply"') || workflow.includes("'$url/apply'"), false)
assert.equal(workflow.includes('"$url/collect"') || workflow.includes("'$url/collect'"), false)
assert.equal(workflow.includes('APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED'), false)

if (trigger) {
  assert.equal(trigger.schemaVersion, 'viewloom-12a4-category-schema-recovery-audit-trigger-v1')
  assert.equal(trigger.status, 'armed_for_one_time_main_push')
  assert.equal(trigger.trackingIssue, 519)
  assert.ok(Number.isInteger(trigger.packagePr) && trigger.packagePr > 533)
  assert.match(trigger.expectedPackageHeadSha, /^[0-9a-f]{40}$/)
  assert.deepEqual(trigger.providerOrder, ['twitch', 'kick'])
  assert.equal(trigger.oneTime, true)
  assert.equal(Object.values(trigger.boundaries).every((value) => value === false), true)
}

console.log(JSON.stringify({
  ok: true,
  mode: trigger ? 'armed_one_time_recovery_audit' : 'recovery_audit_package_candidate',
  triggerPresent: Boolean(trigger),
  productionExecutionByPackagePr: false,
}, null, 2))
