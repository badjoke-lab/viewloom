import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-contract.json'))
const workflow = read('.github/workflows/analytics-12a4-category-readonly-preflight.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const twitchConfig = read('workers/category-cost-probe/wrangler.twitch.toml')
const kickConfig = read('workers/category-cost-probe/wrangler.kick.toml')
const triggerPath = 'docs/audits/12a4-category-readonly-preflight-trigger.json'
const trigger = fs.existsSync(triggerPath) ? JSON.parse(read(triggerPath)) : null

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-readonly-preflight-contract-v1')
assert.equal(contract.parentPlanningPr, 520)
assert.equal(contract.execution.event, 'workflow_dispatch')
assert.equal(contract.execution.requiredRef, 'main')
assert.equal(contract.execution.requiredConfirmation, 'READ_ONLY_PREFLIGHT_ONLY')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.acceptance.rowsWrittenMax, 0)
assert.equal(contract.acceptance.changesMax, 0)
for (const value of Object.values(contract.boundaries)) assert.equal(value, false)

assert.ok(workflow.includes('workflow_dispatch:'))
assert.ok(workflow.includes('Type READ_ONLY_PREFLIGHT_ONLY'))
assert.ok(workflow.includes("github.ref == 'refs/heads/main'"))
assert.ok(workflow.includes("inputs.confirm == 'READ_ONLY_PREFLIGHT_ONLY'"))
assert.ok(workflow.includes("github.event_name == 'workflow_dispatch'"))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
assert.ok(workflow.includes('/inspect'))
assert.ok(workflow.includes('$provider-codes.txt'))
assert.ok(workflow.includes('delete_http_status'))
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('/collect'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(workflow), false)
assert.equal(workflow.includes('--var CATEGORY_CAPTURE_ENABLED'), false)

if (trigger) {
  assert.equal(trigger.schemaVersion, 'viewloom-12a4-category-readonly-preflight-trigger-v1')
  assert.equal(trigger.status, 'armed_for_one_time_main_push')
  assert.equal(trigger.planningPr, 520)
  assert.equal(trigger.packagePr, 521)
  assert.equal(trigger.confirmation, 'READ_ONLY_PREFLIGHT_ONLY')
  assert.equal(trigger.oneTime, true)
  for (const value of Object.values(trigger.boundaries)) assert.equal(value, false)
  assert.ok(workflow.includes('push:'))
  assert.ok(workflow.includes("github.event_name == 'push'"))
  assert.ok(workflow.includes(triggerPath))
  assert.ok(workflow.includes('package=$(gh api'))
  assert.ok(workflow.includes('expectedPackageHeadSha'))
}

assert.ok(worker.includes("mode: 'read_only_preflight'"))
assert.ok(worker.includes('productionRowsWrittenByWorker: false'))
assert.equal(worker.includes('scheduled('), false)
assert.equal(twitchConfig.includes('CATEGORY_CAPTURE_ENABLED'), false)
assert.equal(kickConfig.includes('CATEGORY_CAPTURE_ENABLED'), false)

console.log(JSON.stringify({ ok: true, mode: 'read_only_preflight', parentPlanningPr: 520, oneTimeTrigger: Boolean(trigger) }, null, 2))
