#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contract = JSON.parse(readFileSync('docs/audits/12a4-category-source-audit-contract.json', 'utf8'))
const shared = readFileSync('workers/category-source-audit/shared.ts', 'utf8')
const twitch = readFileSync('workers/category-source-audit/twitch.ts', 'utf8')
const kick = readFileSync('workers/category-source-audit/kick.ts', 'utf8')
const twitchConfig = readFileSync('workers/category-source-audit/wrangler.twitch.toml', 'utf8')
const kickConfig = readFileSync('workers/category-source-audit/wrangler.kick.toml', 'utf8')
const workflow = readFileSync('.github/workflows/analytics-12a4-category-source-audit.yml', 'utf8')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-source-audit-contract-v1')
assert.equal(contract.status, 'candidate')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.contractVersion, 'category-source-v1')
assert.equal(contract.providers.twitch.expectedProviderIdPath, 'game_id')
assert.equal(contract.providers.twitch.expectedNamePath, 'game_name')
assert.equal(contract.providers.kick.sourceMode, 'official-livestreams')
assert.equal(contract.providers.kick.liveProbePasses, 2)
assert.equal(contract.temporaryDeployment.existingCronPreserved, '*/5 * * * *')
assert.equal(contract.temporaryDeployment.scheduledHandlerDelegated, true)
assert.equal(contract.temporaryDeployment.mainCollectorRestoreRequired, true)
assert.equal(contract.temporaryDeployment.mainCollectorRestoreVerified, true)
for (const key of [
  'productionSchemaChanged',
  'productionRowsWrittenByAudit',
  'collectorCadenceChanged',
  'rawRetentionChanged',
  'backfillPerformed',
  'categoryCaptureEnabled',
  'categoryAnalyticsUiIncluded',
  'crossProviderCategoryIdentityAllowed',
  'combinedProviderCategoryRankingAllowed',
]) assert.equal(contract.scope[key], false)

for (const fragment of [
  '/categor|game/i',
  'candidateFields',
  'presenceRatio',
  'sampleValues',
  'topLevelKeys',
]) assert.ok(shared.includes(fragment), `shared inventory missing: ${fragment}`)

for (const [provider, source, productionImport, binding] of [
  ['twitch', twitch, "../collector-twitch/src/entry", 'DB_TWITCH_HOT'],
  ['kick', kick, "../collector-kick/src/entry", 'DB_KICK_HOT'],
]) {
  assert.ok(source.includes(productionImport), `${provider}: production entry delegation missing`)
  assert.ok(source.includes("const AUDIT_TOKEN = '__CATEGORY_AUDIT_TOKEN__'"), `${provider}: runtime token placeholder missing`)
  assert.ok(source.includes("const AUDIT_PATH = '/__viewloom_category_source_audit__'"), `${provider}: protected route missing`)
  assert.ok(source.includes('await production.scheduled(event, env)'), `${provider}: scheduled delegation missing`)
  assert.ok(source.includes('d1WritePerformed: false'), `${provider}: no-write boundary missing`)
  assert.ok(source.includes('channelIdentitiesIncluded: false'), `${provider}: privacy boundary missing`)
  assert.ok(source.includes(binding), `${provider}: expected production binding type missing`)
  assert.equal(/(?:INSERT|UPDATE|DELETE|REPLACE)\s/i.test(source), false, `${provider}: audit wrapper must not contain D1 write SQL`)
}

for (const fragment of [
  "https://api.twitch.tv/helix/streams",
  "providerIdPath: 'game_id'",
  "namePath: 'game_name'",
  'providerIdKeyPresent',
  'pairedNonEmpty',
]) assert.ok(twitch.includes(fragment), `Twitch audit missing: ${fragment}`)

for (const fragment of [
  'https://api.kick.com/public/v1/livestreams?limit=100&sort=viewer_count',
  'https://api.kick.com/public/v1/channels?slug=',
  'https://kick.com/api/v2/channels/',
  'SAMPLE_CHANNELS = 5',
  'categoryFieldInventory(primaryRows)',
]) assert.ok(kick.includes(fragment), `Kick audit missing: ${fragment}`)

for (const [provider, config, workerName, binding, databaseName] of [
  ['twitch', twitchConfig, 'viewloom-collector-twitch', 'DB_TWITCH_HOT', 'vl_twitch_hot'],
  ['kick', kickConfig, 'viewloom-collector-kick', 'DB_KICK_HOT', 'vl_kick_hot'],
]) {
  assert.match(config, new RegExp(`^name = "${workerName}"$`, 'm'), `${provider}: production worker name not preserved`)
  assert.match(config, new RegExp(`^main = "${provider}\\.ts"$`, 'm'))
  assert.match(config, /^INTRADAY_GENERATION_ENABLED = "true"$/m)
  assert.match(config, /^crons = \["\*\/5 \* \* \* \*"\]$/m)
  assert.match(config, new RegExp(`^binding = "${binding}"$`, 'm'))
  assert.match(config, new RegExp(`^database_name = "${databaseName}"$`, 'm'))
}

for (const fragment of [
  "github.repository == 'badjoke-lab/viewloom'",
  "github.head_ref == 'work-analytics-12a4-category-source-audit'",
  'github.event.pull_request.head.repo.full_name == github.repository',
  'openssl rand -hex 32',
  '__CATEGORY_AUDIT_TOKEN__',
  'Deploy temporary category audit wrappers',
  'Call each provider audit twice',
  'Restore main collector Workers',
  'restoreHealthHttpStatus',
  'collect-12a4-category-source-evidence.mjs',
  'verify-12a4-category-source-evidence.mjs',
  'Upload sanitized category source evidence',
]) assert.ok(workflow.includes(fragment), `audit workflow missing: ${fragment}`)
assert.equal(workflow.includes('pull_request_target:'), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)

console.log('12A-4 category source audit package verification passed.')
console.log('- temporary wrappers preserve scheduled collection and generator settings')
console.log('- Twitch and Kick live probes remain provider-separated')
console.log('- Kick primary approval cannot be inferred from alternate paths')
console.log('- main collector restore and post-restore health are mandatory')
console.log('- no schema, D1 row, cadence, retention, UI, or runtime capture change')
