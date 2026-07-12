#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contract = JSON.parse(readFileSync('docs/audits/12a3-execution-cost-probe-contract.json', 'utf8'))
const worker = readFileSync('workers/analytics-cost-probe/src/index.ts', 'utf8')
const twitchConfig = readFileSync('workers/analytics-cost-probe/wrangler.twitch.toml', 'utf8')
const kickConfig = readFileSync('workers/analytics-cost-probe/wrangler.kick.toml', 'utf8')

assert.equal(contract.schemaVersion, 'viewloom-12a3-execution-cost-probe-contract-v1')
assert.equal(contract.workstream, '12A-3 bounded intraday rollup generation')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.source.table, 'minute_snapshots')
assert.equal(contract.source.daySelection, 'latest_complete_utc_day')
assert.equal(contract.source.rawRowsModified, false)
assert.equal(contract.writeProbe.reservedDay, '1900-01-01')
assert.equal(contract.writeProbe.selectionState, 'cost_probe')
assert.equal(contract.writeProbe.cleanupRequired, true)
assert.equal(contract.writeProbe.retainedProbeRowsRequired, 0)
assert.equal(contract.workflow.sameRepositoryOnly, true)
assert.equal(contract.workflow.forkSecretsAllowed, false)
assert.equal(contract.workflow.temporaryWorkerDeleteRequired, true)
assert.equal(contract.workflow.permanentPublicRouteAdded, false)
assert.equal(contract.workflow.newCronAdded, false)
assert.equal(contract.boundaries.productionGenerationStarted, false)
assert.equal(contract.boundaries.backfillIncluded, false)
assert.equal(contract.boundaries.retentionChanged, false)
assert.equal(contract.boundaries.crossProviderAnalyticsIncluded, false)

for (const [provider, config, source] of [
  ['twitch', contract.temporaryWorkers.twitch, twitchConfig],
  ['kick', contract.temporaryWorkers.kick, kickConfig],
]) {
  assert.equal(config.probeWriteRows, 25, `${provider}: write probe row contract drift`)
  assert.match(source, new RegExp(`^name = "${config.name}"$`, 'm'))
  assert.match(source, /^main = "src\/index\.ts"$/m)
  assert.match(source, /^workers_dev = true$/m)
  assert.match(source, new RegExp(`^PROVIDER = "${provider}"$`, 'm'))
  assert.match(source, new RegExp(`^STREAMER_CAP = "${config.streamerCap}"$`, 'm'))
  assert.match(source, /^PROBE_WRITE_ROWS = "25"$/m)
  assert.match(source, /^BUCKET_MINUTES = "5"$/m)
  assert.match(source, /^binding = "DB"$/m)
  assert.match(source, new RegExp(`^database_name = "${config.databaseName}"$`, 'm'))
  assert.equal(source.includes('[triggers]'), false, `${provider}: temporary probe must not have a cron`)
}

for (const fragment of [
  "url.pathname === '/run'",
  "url.pathname === '/cleanup'",
  "const PROBE_DAY = '1900-01-01'",
  "const PROBE_PREFIX = '__viewloom_cost_probe__:'",
  "selection_state = 'cost_probe'",
  'const expectedProbeRows = sampleRows.length + 1',
  'countAfterFirst === expectedProbeRows',
  'countAfterSecond === countAfterFirst',
  'cleanup = await cleanupProbeRows(env)',
  'productionGenerationStarted: false',
  'sourceRowsModified: false',
  'crossProviderOperation: false',
]) assert.ok(worker.includes(fragment), `probe Worker missing: ${fragment}`)

assert.ok(worker.includes(`target.day,\n        bucketMinutes,\n        bucketMinutes,\n        streamerCap,\n        bucketMinutes,`), 'aggregate bind order must be provider/day/totals/observed/cap/hourly')
assert.equal(/(?:UPDATE|DELETE\s+FROM|INSERT\s+INTO)\s+minute_snapshots/i.test(worker), false, 'probe must not modify minute_snapshots')
assert.equal(/(?:UPDATE|DELETE\s+FROM|INSERT\s+INTO)\s+daily_rollups/i.test(worker), false, 'probe must not modify daily_rollups')
assert.equal(worker.includes('fetch('), true, 'probe Worker fetch handler missing')
assert.equal(worker.includes('scheduled('), false, 'probe Worker must not expose scheduled execution')

console.log('12A-3 execution cost probe static verification passed.')
console.log('- Twitch and Kick use separate temporary Workers and D1 bindings')
console.log('- latest complete UTC source day is read without source mutation')
console.log('- bounded 25-row write sample runs twice for idempotency')
console.log('- cleanup and temporary Worker deletion are required')
console.log('- production generation and new cron remain absent')
