#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contract = JSON.parse(readFileSync('docs/audits/12a3-generator-enablement-contract.json', 'utf8'))
const worker = readFileSync('workers/analytics-generator-acceptance/src/index.ts', 'utf8')
const twitchConfig = readFileSync('workers/analytics-generator-acceptance/wrangler.twitch.toml', 'utf8')
const kickConfig = readFileSync('workers/analytics-generator-acceptance/wrangler.kick.toml', 'utf8')
const twitchWrangler = readFileSync('workers/collector-twitch/wrangler.toml', 'utf8')
const kickWrangler = readFileSync('workers/collector-kick/wrangler.toml', 'utf8')
const workflow = readFileSync('.github/workflows/analytics-12a3-generator-enablement.yml', 'utf8')

assert.equal(contract.schemaVersion, 'viewloom-12a3-generator-enablement-contract-v1')
assert.equal(contract.workstream, '12A-3 bounded production generator enablement')
assert.equal(contract.status, 'candidate')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.collectorEnablement.flag, 'INTRADAY_GENERATION_ENABLED')
assert.equal(contract.collectorEnablement.value, 'true')
assert.equal(contract.collectorEnablement.existingCron, '*/5 * * * *')
assert.equal(contract.collectorEnablement.newCronAdded, false)
assert.equal(contract.acceptanceProbe.sharedGenerator, 'workers/shared/intraday-rollup.ts')
assert.equal(contract.acceptanceProbe.sameRepositoryOnly, true)
assert.equal(contract.acceptanceProbe.forkSecretsAllowed, false)
assert.equal(contract.acceptanceProbe.generatorPasses, 2)
assert.deepEqual(contract.acceptanceProbe.targetDays, ['today_utc', 'yesterday_utc'])
assert.equal(contract.acceptanceProbe.actualProductionRowsWritten, true)
assert.equal(contract.acceptanceProbe.backfillPerformed, false)
assert.equal(contract.acceptanceProbe.temporaryWorkerDeleteRequired, true)
assert.equal(contract.acceptance.expectedObservedDaysPerProvider, 2)
assert.equal(contract.acceptance.secondPassMustMatchFirstPass, true)
assert.equal(contract.acceptance.maximumGeneratorQueriesPerPass, 12)
assert.equal(contract.acceptance.retentionCleanupMustRun, true)
assert.equal(contract.acceptance.temporaryWorkersRetained, false)
for (const value of Object.values(contract.evidence)) assert.equal(value, false)
for (const value of Object.values(contract.scope)) assert.equal(value, false)

for (const [provider, source, binding] of [
  ['twitch', twitchWrangler, 'DB_TWITCH_HOT'],
  ['kick', kickWrangler, 'DB_KICK_HOT'],
]) {
  assert.match(source, /^INTRADAY_GENERATION_ENABLED = "true"$/m, `${provider}: enable flag missing`)
  assert.equal((source.match(/INTRADAY_GENERATION_ENABLED/g) ?? []).length, 1, `${provider}: duplicate enable flag`)
  assert.match(source, /^crons = \["\*\/5 \* \* \* \*"\]$/m, `${provider}: existing cron changed`)
  assert.match(source, new RegExp(`^binding = "${binding}"$`, 'm'), `${provider}: D1 binding changed`)
}

for (const [provider, config, source] of [
  ['twitch', contract.providers.twitch, twitchConfig],
  ['kick', contract.providers.kick, kickConfig],
]) {
  assert.match(source, new RegExp(`^name = "${config.temporaryWorker}"$`, 'm'))
  assert.match(source, /^main = "src\/index\.ts"$/m)
  assert.match(source, /^workers_dev = true$/m)
  assert.match(source, new RegExp(`^PROVIDER = "${provider}"$`, 'm'))
  assert.match(source, new RegExp(`^STREAMER_CAP = "${config.streamerCap}"$`, 'm'))
  assert.match(source, new RegExp(`^BUCKET_MINUTES = "${config.bucketMinutes}"$`, 'm'))
  assert.match(source, /^binding = "DB"$/m)
  assert.match(source, new RegExp(`^database_name = "${config.databaseName}"$`, 'm'))
  assert.equal(source.includes('[triggers]'), false, `${provider}: temporary acceptance Worker must not have a cron`)
}

for (const fragment of [
  "from '../../shared/intraday-rollup'",
  "url.pathname !== '/run'",
  'const first = await maybeGenerateIntradayRollups',
  'const second = await maybeGenerateIntradayRollups',
  'enabled: true',
  'firstObservation',
  'secondObservation',
  'JSON.stringify(firstObservation) === JSON.stringify(secondObservation)',
  'forced.setUTCHours(0, 20, 0, 0)',
  'retentionCleanupObserved',
  'queryBudgetBounded',
  'streamerIdentitiesIncluded: false',
  'sourceRowsModified: false',
  'backfillPerformed: false',
  'crossProviderOperation: false',
]) assert.ok(worker.includes(fragment), `acceptance Worker missing: ${fragment}`)

assert.equal((worker.match(/maybeGenerateIntradayRollups\(/g) ?? []).length, 3, 'acceptance Worker must import/type and execute exactly two generation passes')
assert.equal(/(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+|FROM\s+)?minute_snapshots/i.test(worker), false, 'acceptance Worker must not modify minute_snapshots')
assert.equal(worker.includes('async scheduled('), false, 'acceptance Worker must not own a cron')
assert.equal(worker.includes('wrangler d1 execute'), false, 'direct D1 execute is forbidden')

for (const fragment of [
  "github.repository == 'badjoke-lab/viewloom'",
  "github.event.action == 'opened'",
  "github.head_ref == 'work-analytics-12a3-enable-generator'",
  'github.event.pull_request.head.repo.full_name == github.repository',
  'openssl rand -hex 32',
  'Delete temporary acceptance Worker services',
  '-X DELETE',
  '/workers/services/$worker_name?force=true',
  'Normalize sanitized enablement evidence',
  'Verify generator enablement evidence',
  'Remove raw responses and deployment logs',
  'Upload sanitized enablement evidence only',
]) assert.ok(workflow.includes(fragment), `enablement workflow missing: ${fragment}`)

assert.equal(workflow.includes('pull_request_target:'), false, 'enablement workflow must not use pull_request_target')
assert.equal(workflow.includes('schedule:'), false, 'enablement workflow must not add recurring execution')
assert.equal(workflow.includes('wrangler d1 execute'), false, 'enablement workflow must use Worker bindings')

console.log('12A-3 generator enablement static verification passed.')
console.log('- both collector Wrangler configs enable the accepted generator')
console.log('- existing provider crons and bindings remain unchanged')
console.log('- temporary acceptance Workers run two generator passes')
console.log('- actual today/yesterday rows and status are observed without identities')
console.log('- exact trusted branch and temporary service deletion are required')
console.log('- no backfill, source mutation, new cron, or direct D1 execute')
