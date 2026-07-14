import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-execution-cost-probe-contract.json'))
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const twitch = read('workers/category-cost-probe/wrangler.twitch.toml')
const kick = read('workers/category-cost-probe/wrangler.kick.toml')
const migration = read('db/d1/005_category_capture.sql')

const failures = []
const expect = (condition, message) => {
  if (!condition) failures.push(message)
}

expect(contract.schemaVersion === 'viewloom-12a4-category-execution-cost-probe-contract-v1', 'unexpected contract schemaVersion')
expect(contract.trackingIssue === 519, 'tracking issue must be #519')
expect(contract.acceptedStartingPoint.implementationPr === 516, 'implementation PR must be #516')
expect(contract.acceptedStartingPoint.evidenceFreezePr === 518, 'evidence freeze PR must be #518')
expect(contract.acceptanceThresholds.categoryGeneratorQueriesMax === 12, 'generator query ceiling must remain 12')
expect(contract.acceptanceThresholds.dictionarySecondPassChangesMax === 0, 'dictionary second pass must be a no-op')
expect(contract.planningPrBoundary.remoteMigrationApply === false, 'planning PR may not apply remote migration')
expect(contract.planningPrBoundary.productionCategoryCapture === false, 'planning PR may not enable category capture')
expect(contract.planningPrBoundary.productionDeploymentJobIncluded === false, 'planning PR may not include production deploy job')
expect(contract.planningPrBoundary.cloudflareSecretsRequired === false, 'planning PR may not require Cloudflare secrets')

expect(!workflow.includes('CLOUDFLARE_API_TOKEN'), 'workflow may not use Cloudflare API token')
expect(!workflow.includes('CLOUDFLARE_ACCOUNT_ID'), 'workflow may not use Cloudflare account id')
expect(!/wrangler\s+deploy(?!\s+--dry-run)/.test(workflow), 'workflow may only use Wrangler dry-run')
expect(!workflow.includes('schedule:'), 'workflow may not add a schedule')
expect(!worker.includes('scheduled('), 'preflight Worker may not have a scheduled handler')
expect(worker.includes("mode: 'read_only_preflight'"), 'Worker must declare read-only preflight mode')
expect(worker.includes('productionRowsWrittenByWorker: false'), 'Worker must freeze no-write boundary')

for (const [provider, config] of [['twitch', twitch], ['kick', kick]]) {
  expect(config.includes(`PROVIDER = "${provider}"`), `${provider} provider config missing`)
  expect(!config.includes('CATEGORY_CAPTURE_ENABLED'), `${provider} config may not set category capture flag`)
  expect(!config.includes('REMOTE_SCHEMA_APPLY'), `${provider} config may not set remote apply flag`)
  expect(!config.includes('[triggers]'), `${provider} config may not add triggers`)
}

expect(migration.includes('provider_category_dictionary'), 'migration candidate missing dictionary')
expect(migration.includes('category_hourly_json'), 'migration candidate missing category hourly column')
expect(migration.includes('Do not apply to production'), 'migration must retain production warning')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  workstream: contract.workstream,
  mode: 'planning_and_read_only_preflight',
  remoteMigrationApply: false,
  productionCategoryCapture: false,
  providerSeparated: true,
}, null, 2))
