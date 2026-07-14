import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-contract.json'))
const workflow = read('.github/workflows/analytics-12a4-category-readonly-preflight.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const twitchConfig = read('workers/category-cost-probe/wrangler.twitch.toml')
const kickConfig = read('workers/category-cost-probe/wrangler.kick.toml')
const triggerPath = 'docs/audits/12a4-category-readonly-preflight-trigger.json'
const trigger = fs.existsSync(triggerPath) ? JSON.parse(read(triggerPath)) : null

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
check(contract.providers.twitch.healthEvidenceSource === 'collector_status', 'Twitch health source contract')
check(contract.providers.kick.healthEvidenceSource === 'latest_snapshot', 'Kick health source contract')
check(contract.acceptance.healthEvidenceSource.twitch === 'collector_status', 'Twitch acceptance health source')
check(contract.acceptance.healthEvidenceSource.kick === 'latest_snapshot', 'Kick acceptance health source')
check(contract.acceptance.rowsWrittenMax === 0, 'zero rows-written threshold')
check(contract.acceptance.changesMax === 0, 'zero changes threshold')
check(Object.values(contract.boundaries).every((value) => value === false), 'all contract boundaries false')

check(workflow.includes('workflow_dispatch:'), 'workflow_dispatch present')
check(workflow.includes('Type READ_ONLY_PREFLIGHT_ONLY'), 'confirmation input present')
check(workflow.includes("github.ref == 'refs/heads/main'"), 'main-only condition')
check(workflow.includes("inputs.confirm == 'READ_ONLY_PREFLIGHT_ONLY'"), 'dispatch confirmation condition')
check(workflow.includes("github.event_name == 'workflow_dispatch'"), 'dispatch condition')
check(workflow.includes('CLOUDFLARE_API_TOKEN'), 'Cloudflare API token binding')
check(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), 'Cloudflare account binding')
check(workflow.includes('"$url/inspect"'), 'read-only inspect route')
check(workflow.includes('workers/services/$service'), 'temporary Worker deletion API')
check(workflow.includes('"$http_status" == \'200\''), 'inspect HTTP 200 gate')
check(workflow.includes('"$delete_http_status" == \'404\''), 'post-delete HTTP 404 gate')
check(!workflow.includes('schedule:'), 'no schedule')
check(!workflow.includes('"$url/collect"') && !workflow.includes("'$url/collect'"), 'no manual collector route')
check(!workflow.includes('wrangler d1 execute'), 'no direct D1 execute')
check(!/CATEGORY_CAPTURE_ENABLED\s*=/.test(workflow), 'no category enable assignment')
check(!workflow.includes('--var CATEGORY_CAPTURE_ENABLED'), 'no category enable var')

if (trigger) {
  check(trigger.schemaVersion === 'viewloom-12a4-category-readonly-preflight-trigger-v1', 'trigger schemaVersion')
  check(trigger.status === 'armed_for_one_time_main_push', 'trigger armed status')
  check(trigger.planningPr === 520, 'trigger planning PR')
  check(trigger.packagePr === 521, 'trigger package PR')
  check(trigger.confirmation === 'READ_ONLY_PREFLIGHT_ONLY', 'trigger confirmation')
  check(trigger.oneTime === true, 'one-time trigger')
  check(Object.values(trigger.boundaries).every((value) => value === false), 'all trigger boundaries false')
  check(workflow.includes('push:'), 'main push trigger present')
  check(workflow.includes("github.event_name == 'push'"), 'push job condition')
  check(workflow.includes(triggerPath), 'trigger path present')
  check(workflow.includes('package=$(gh api'), 'package PR verification')
  check(workflow.includes('expectedPackageHeadSha'), 'package head pin')
}

check(worker.includes("schemaVersion: 'viewloom-12a4-category-cost-preflight-v2'"), 'Worker provider-aware schema version')
check(worker.includes('collectorStatusTablePresent'), 'Worker collector-status schema inspection')
check(worker.includes("healthSource = collector ? 'collector_status' : latest ? 'latest_snapshot'"), 'Worker provider health fallback')
check(worker.includes("mode: 'read_only_preflight'"), 'Worker read-only mode')
check(worker.includes('productionRowsWrittenByWorker: false'), 'Worker no-write boundary')
check(!worker.includes('scheduled('), 'Worker has no scheduled handler')
check(!twitchConfig.includes('CATEGORY_CAPTURE_ENABLED'), 'Twitch config flag absent')
check(!kickConfig.includes('CATEGORY_CAPTURE_ENABLED'), 'Kick config flag absent')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, mode: 'read_only_preflight', parentPlanningPr: 520, oneTimeTrigger: Boolean(trigger), providerHealthAware: true }, null, 2))
