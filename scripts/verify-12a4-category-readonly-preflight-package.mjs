import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-contract.json'))
const workflow = read('.github/workflows/analytics-12a4-category-readonly-preflight.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const twitchConfig = read('workers/category-cost-probe/wrangler.twitch.toml')
const kickConfig = read('workers/category-cost-probe/wrangler.kick.toml')

const failures = []
const check = (condition, label) => {
  if (!condition) failures.push(label)
}

check(contract.schemaVersion === 'viewloom-12a4-category-readonly-preflight-contract-v1', 'contract schemaVersion')
check(contract.parentPlanningPr === 520, 'parent planning PR')
check(contract.execution.event === 'workflow_dispatch', 'manual dispatch contract')
check(contract.execution.requiredRef === 'main', 'main-only contract')
check(contract.execution.requiredConfirmation === 'READ_ONLY_PREFLIGHT_ONLY', 'confirmation contract')
check(contract.providerSeparated === true, 'provider separation contract')
check(contract.acceptance.rowsWrittenMax === 0, 'zero rows-written threshold')
check(contract.acceptance.changesMax === 0, 'zero changes threshold')
check(Object.values(contract.boundaries).every((value) => value === false), 'all production boundaries false')

check(workflow.includes('workflow_dispatch:'), 'workflow_dispatch present')
check(workflow.includes('Type READ_ONLY_PREFLIGHT_ONLY'), 'confirmation input present')
check(workflow.includes("github.ref == 'refs/heads/main'"), 'main-only job condition')
check(workflow.includes("inputs.confirm == 'READ_ONLY_PREFLIGHT_ONLY'"), 'confirmation job condition')
check(workflow.includes("github.event_name == 'workflow_dispatch'"), 'dispatch-only production condition')
check(workflow.includes('CLOUDFLARE_API_TOKEN'), 'Cloudflare API token binding')
check(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), 'Cloudflare account binding')
check(workflow.includes('"$url/inspect"'), 'read-only inspect route')
check(workflow.includes('workers/services/$service'), 'temporary Worker deletion API')
check(workflow.includes('"$http_status" == \'200\''), 'inspect HTTP 200 gate')
check(workflow.includes('"$delete_http_status" == \'404\''), 'post-delete HTTP 404 gate')
check(!workflow.includes('schedule:'), 'no schedule')
check(!workflow.includes('/collect'), 'no manual collector route')
check(!workflow.includes('wrangler d1 execute'), 'no direct D1 execute')
check(!/CATEGORY_CAPTURE_ENABLED\s*=/.test(workflow), 'no category enable assignment')
check(!workflow.includes('--var CATEGORY_CAPTURE_ENABLED'), 'no category enable var')

check(worker.includes("mode: 'read_only_preflight'"), 'Worker read-only mode')
check(worker.includes('productionRowsWrittenByWorker: false'), 'Worker no-write boundary')
check(!worker.includes('scheduled('), 'Worker has no scheduled handler')
check(!twitchConfig.includes('CATEGORY_CAPTURE_ENABLED'), 'Twitch config flag absent')
check(!kickConfig.includes('CATEGORY_CAPTURE_ENABLED'), 'Kick config flag absent')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, mode: 'read_only_preflight', parentPlanningPr: 520 }, null, 2))
