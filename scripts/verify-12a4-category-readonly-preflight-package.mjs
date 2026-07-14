import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-contract.json'))
const trigger = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-trigger.json'))
const evidence = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-evidence.json'))
const workflow = read('.github/workflows/analytics-12a4-category-readonly-preflight.yml')
const twitchConfig = read('workers/category-cost-probe/wrangler.twitch.toml')
const kickConfig = read('workers/category-cost-probe/wrangler.kick.toml')

const failures = []
const check = (condition, label) => {
  if (!condition) failures.push(label)
}

check(contract.schemaVersion === 'viewloom-12a4-category-readonly-preflight-contract-v1', 'contract schemaVersion')
check(contract.parentPlanningPr === 520, 'parent planning PR')
check(contract.providerSeparated === true, 'provider separation contract')
check(contract.providers.twitch.healthEvidenceSource === 'collector_status', 'Twitch health source contract')
check(contract.providers.kick.healthEvidenceSource === 'latest_snapshot', 'Kick health source contract')
check(contract.acceptance.rowsWrittenMax === 0, 'zero rows-written threshold')
check(contract.acceptance.changesMax === 0, 'zero changes threshold')
check(Object.values(contract.boundaries).every((value) => value === false), 'all contract boundaries false')

check(trigger.schemaVersion === 'viewloom-12a4-category-readonly-preflight-trigger-v1', 'trigger schemaVersion')
check(trigger.status === 'consumed_and_retired', 'trigger retired status')
check(trigger.planningPr === 520, 'trigger planning PR')
check(trigger.packagePr === 521, 'trigger package PR')
check(trigger.triggerPr === 527, 'accepted trigger PR')
check(trigger.acceptancePr === 523, 'acceptance PR')
check(trigger.confirmation === 'READ_ONLY_PREFLIGHT_ONLY', 'trigger confirmation')
check(trigger.oneTime === true, 'one-time trigger')
check(trigger.consumed === true, 'trigger consumed')
check(trigger.rearmAuthorized === false, 'trigger rearm forbidden')
check(Object.values(trigger.boundaries).every((value) => value === false), 'all trigger boundaries false')

check(evidence.schemaVersion === 'viewloom-12a4-category-readonly-preflight-evidence-v1', 'evidence schemaVersion')
check(evidence.status === 'accepted', 'evidence accepted')
check(evidence.providerSeparated === true, 'evidence provider separation')
check(evidence.acceptanceIdentity.triggerPr === 527, 'evidence trigger PR')
check(evidence.gate.twitchGatePass === true, 'Twitch gate pass')
check(evidence.gate.kickGatePass === true, 'Kick gate pass')
check(evidence.gate.readOnlyPreflightPass === true, 'preflight gate pass')
check(evidence.providers.twitch.health.source === 'collector_status', 'Twitch accepted health source')
check(evidence.providers.kick.health.source === 'latest_snapshot', 'Kick accepted health source')
check(evidence.providers.twitch.query.rowsWritten === 0, 'Twitch rows-written zero')
check(evidence.providers.kick.query.rowsWritten === 0, 'Kick rows-written zero')
check(evidence.providers.twitch.query.changes === 0, 'Twitch changes zero')
check(evidence.providers.kick.query.changes === 0, 'Kick changes zero')
check(evidence.providers.twitch.lifecycle.deleteHttpStatus === 404, 'Twitch temporary Worker deleted')
check(evidence.providers.kick.lifecycle.deleteHttpStatus === 404, 'Kick temporary Worker deleted')
check(evidence.gate.remoteMigrationApplyAuthorized === false, 'remote migration unauthorized')
check(evidence.gate.runtimeCaptureEnablementAuthorized === false, 'runtime capture unauthorized')

check(workflow.includes('Read-Only Preflight Retired'), 'retired workflow name')
check(!workflow.includes('\n  push:'), 'production push trigger removed')
check(!workflow.includes('production-preflight:'), 'production deployment job removed')
check(!workflow.includes('CLOUDFLARE_API_TOKEN'), 'Cloudflare API token removed')
check(!workflow.includes('CLOUDFLARE_ACCOUNT_ID'), 'Cloudflare account id removed')
check(!workflow.includes('workers/services/$service'), 'temporary Worker deletion API removed')
check(!workflow.includes('wrangler d1 execute'), 'no direct D1 execute')
check(!workflow.includes('schedule:'), 'no schedule')
check(workflow.includes('wrangler@4 deploy --dry-run'), 'dry-run bundle retained')
check(!workflow.includes("'workers/category-cost-probe/**'"), 'retired workflow no longer watches active probe Worker')

check(!twitchConfig.includes('CATEGORY_CAPTURE_ENABLED'), 'Twitch config flag absent')
check(!kickConfig.includes('CATEGORY_CAPTURE_ENABLED'), 'Kick config flag absent')
check(!twitchConfig.includes('[triggers]'), 'Twitch config has no trigger')
check(!kickConfig.includes('[triggers]'), 'Kick config has no trigger')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  mode: 'accepted_and_retired_read_only_preflight',
  acceptancePr: trigger.acceptancePr,
  productionPushTrigger: false,
  productionDeploymentJob: false,
  activeProbeWorkerCoupling: false,
}, null, 2))
