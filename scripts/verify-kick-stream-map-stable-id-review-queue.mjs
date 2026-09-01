import fs from 'node:fs'
import assert from 'node:assert/strict'

const workerPath = 'tools/kick-stream-map-stable-id-review-queue/worker.mjs'
const wranglerPath = 'tools/kick-stream-map-stable-id-review-queue/wrangler.toml'
const workflowPath = '.github/workflows/kick-stream-map-stable-id-review-queue.yml'
const contractPath = 'docs/audits/kick-stream-map-stable-id-review-queue-contract-v0.1.json'
const triggerPath = 'docs/audits/kick-stream-map-stable-id-review-queue-trigger.json'

const worker = fs.readFileSync(workerPath, 'utf8')
const wrangler = fs.readFileSync(wranglerPath, 'utf8')
const workflow = fs.readFileSync(workflowPath, 'utf8')
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))

assert.equal(contract.schemaVersion, 'viewloom-kick-stream-map-stable-id-review-queue-contract-v0.2')
assert.equal(contract.provider, 'kick')
assert.equal(contract.mode, 'read_only_preview')
assert.equal(contract.population.source, 'production_kick_stream_map_snapshot')
assert.equal(contract.population.productionUrl, 'https://www.viewloom.net/api/kick-stream-map')
assert.equal(contract.population.maxRows, 100)
assert.equal(contract.population.ordering, 'viewer_count_desc')
assert.equal(contract.population.stableIdentity, 'broadcaster_user_id')
assert.equal(contract.population.slugRole, 'lookup_and_display_only')
assert.equal(contract.population.v2OldestFirstPopulationAllowed, false)
assert.equal(contract.budgets.productionSnapshotRequestsMax, 1)
assert.equal(contract.budgets.tokenRequestsMax, 1)
assert.equal(contract.budgets.livestreamRequestsMax, 0)
assert.equal(contract.budgets.channelBatchSize, 50)
assert.equal(contract.budgets.channelRequestsMax, 2)
assert.equal(contract.budgets.d1WritesMax, 0)
assert.equal(contract.endpoints.livestreamsV2Used, false)
assert.equal(contract.endpoints.legacyPublicFallbackAllowed, false)
assert.equal(contract.execution.automaticSchedule, false)
assert.equal(contract.execution.workflowDispatch, false)
assert.equal(contract.execution.oneFileMainTriggerRequired, true)
assert.equal(contract.execution.triggerPath, triggerPath)

for (const required of [
  "const PRODUCTION_ORIGIN = 'https://www.viewloom.net'",
  "const PRODUCTION_MAP_PATH = '/api/kick-stream-map'",
  "const POPULATION_MAX = 100",
  "const CHANNEL_BATCH_SIZE = 50",
  "const CHANNEL_REQUEST_MAX = 2",
  "new URL(PRODUCTION_MAP_PATH, PRODUCTION_ORIGIN)",
  "new URL('https://api.kick.com/public/v1/channels')",
  "channelUrl.searchParams.append('slug', slug)",
  "row?.broadcaster_user_id",
  "identity_state: stableId ? 'ready' : ids.size > 1 ? 'ambiguous' : 'missing'",
  "populationAuthority: 'production_kick_stream_map_snapshot'",
  "viewerOrdering: 'desc'",
  "v2OldestFirstPopulationAllowed: false",
  "stableIdentity: 'broadcaster_user_id'",
  "slugIsStableIdentity: false",
  "productionDeployment: false",
  "productionCollectorChange: false",
  "d1Writes: 0",
  "geographyStored: false",
  "twitchEvidenceCopied: false",
]) assert.ok(worker.includes(required), `missing queue boundary: ${required}`)

assert.equal(worker.includes('https://api.kick.com/public/v2/livestreams'), false, 'v2 oldest-first livestreams must not define the Top100 queue population')
assert.equal(worker.includes('kick.com/api/v2/channels'), false, 'legacy Kick endpoint is forbidden')
assert.equal(/\b(?:DB_KICK|DB_TWITCH|D1Database)\b/.test(worker), false, 'preview queue must have no D1 binding/use')
assert.equal(worker.includes('stream_title'), false, 'raw title must not be read into the queue package')
assert.equal(worker.includes('custom_tags'), false, 'raw tags must not be read into the queue package')
assert.equal(worker.includes('channel_description'), false, 'raw profile description must not be read into the queue package')
assert.equal(wrangler.includes('[[d1_databases]]'), false, 'preview queue config must have no D1 binding')
assert.ok(wrangler.includes('keep_vars = true'), 'preview must inherit existing Kick credentials')
assert.ok(workflow.includes('wrangler@4 versions upload'), 'execution must upload only a non-production preview version')
assert.equal(/wrangler@4\s+deploy(?!\s+--dry-run)/.test(workflow), false, 'production deploy command is forbidden')
assert.ok(workflow.includes("test \"${changed[0]}\" = \"$TRIGGER_FILE\""), 'exact one-file trigger guard required')

if (process.argv.includes('--require-trigger')) {
  assert.ok(fs.existsSync(triggerPath), 'one-time trigger is missing')
  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  assert.equal(trigger.schemaVersion, 'viewloom-kick-stream-map-stable-id-review-queue-trigger-v0.1')
  assert.equal(trigger.provider, 'kick')
  assert.equal(trigger.mode, 'read_only_preview_once')
  assert.equal(trigger.productionDeployment, false)
  assert.equal(trigger.d1Writes, 0)
  assert.equal(trigger.expectedPackageMergeSha.length, 40)
}

console.log(JSON.stringify({
  ok: true,
  provider: 'kick',
  mode: 'read_only_preview',
  populationSource: 'production_kick_stream_map_snapshot',
  maxPopulation: 100,
  viewerOrdering: 'desc',
  maxProductionSnapshotRequests: 1,
  maxTokenRequests: 1,
  maxLivestreamRequests: 0,
  maxChannelRequests: 2,
  stableIdentity: 'broadcaster_user_id',
  slugIsStableIdentity: false,
  d1Writes: 0,
  productionDeployment: false,
  productionCollectorChange: false,
  geographyStored: false,
}, null, 2))
