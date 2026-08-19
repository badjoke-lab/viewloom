import fs from 'node:fs'

const contractPath = 'docs/audits/12a37-kick-history-first-natural-generation-observation-contract.json'
const workflowPath = '.github/workflows/analytics-12a37-kick-history-first-natural-generation-observation.yml'

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(contract.schemaVersion === 'viewloom-12a37-kick-history-first-natural-generation-observation-contract-v1', 'schema')
assert(contract.phase === '12A-37', 'phase')
assert(contract.status === 'armed_read_only_observation', 'status')
assert(contract.issue === 913, 'issue')
assert(contract.provider === 'kick', 'provider')
assert(contract.startDay === '2026-08-17', 'start day')
assert(contract.database.name === 'vl_kick_hot', 'database name')
assert(contract.database.id === 'ed1e082f-85ac-4dd0-a44e-5d3e200667d5', 'database id')
assert(contract.observation.remote === true && contract.observation.readOnly === true, 'read-only observation')
for (const key of ['manualGeneratorInvocation', 'backfill', 'workerDeployment', 'collectorDeployment']) {
  assert(contract.observation[key] === false, `forbidden observation mutation: ${key}`)
}
assert(contract.acceptedProduction.generatorEnabled === true, 'generator enabled truth')
assert(contract.acceptedProduction.cron === '*/5 * * * *', 'cron')
assert(contract.acceptedProduction.categoryRowCapPerDay === 300, 'category cap')
assert(contract.acceptedProduction.streamerCategoryRowCapPerDay === 1000, 'streamer category cap')
assert(contract.acceptedProduction.rowsReadMaximum === 250000, 'rows read threshold')

assert(workflow.includes('workflow_dispatch:'), 'workflow dispatch missing')
assert(workflow.includes('pull_request:'), 'PR contract gate missing')
assert(workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'), 'Cloudflare token wiring missing')
assert(workflow.includes('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}'), 'Cloudflare account wiring missing')
assert(workflow.includes('d1 execute vl_kick_hot --remote'), 'remote D1 command missing')
assert(workflow.includes("START_DAY: '2026-08-17'"), 'start day env missing')
assert(workflow.includes("ROWS_READ_MAX: '250000'"), 'rows-read max missing')
assert(workflow.includes('actions/upload-artifact@v4'), 'evidence upload missing')

const forbidden = [
  /wrangler@4\s+deploy/i,
  /wrangler@4\s+delete/i,
  /secret\s+put/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[A-Za-z_]/i,
  /\bDELETE\s+FROM\b/i,
  /\bCREATE\s+(TABLE|INDEX)\b/i,
  /\bDROP\s+(TABLE|INDEX)\b/i,
  /\bALTER\s+TABLE\b/i,
]
for (const pattern of forbidden) assert(!pattern.test(workflow), `forbidden production mutation surface: ${pattern}`)

for (const table of ['history_category_day_status', 'history_category_daily', 'history_category_streamer_daily']) {
  assert(workflow.includes(table), `missing query target ${table}`)
}

console.log('12A-37 read-only observation contract verified')
