#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contract = JSON.parse(readFileSync('docs/audits/12a3-postmerge-acceptance-contract.json', 'utf8'))
const worker = readFileSync('workers/analytics-postmerge-verifier/src/index.ts', 'utf8')
const twitch = readFileSync('workers/analytics-postmerge-verifier/wrangler.twitch.toml', 'utf8')
const kick = readFileSync('workers/analytics-postmerge-verifier/wrangler.kick.toml', 'utf8')
const workflow = readFileSync('.github/workflows/analytics-12a3-postmerge-acceptance.yml', 'utf8')

assert.equal(contract.schemaVersion, 'viewloom-12a3-postmerge-acceptance-contract-v1')
assert.equal(contract.status, 'candidate')
assert.equal(contract.merge.pr, 510)
assert.equal(contract.merge.sha, 'ad90585d74149b0fb1805b9a76fd8d796a5e7c2d')
assert.equal(contract.deployment.workflow, 'deploy-collector-workers.yml')
assert.equal(contract.naturalMaintenance.minimumRefreshedAt, '2026-07-12T12:20:00.000Z')
assert.equal(contract.naturalMaintenance.newCronAdded, false)
assert.equal(contract.naturalMaintenance.manualCollectorRouteUsed, false)
assert.equal(contract.naturalMaintenance.temporaryGeneratorUsed, false)
for (const value of Object.values(contract.privacy)) assert.equal(value, false)
for (const value of Object.values(contract.scope)) assert.equal(value, false)

for (const fragment of [
  "type Provider = 'twitch' | 'kick'",
  "request.method !== 'POST' || url.pathname !== '/verify'",
  'MIN_REFRESHED_AT',
  'intraday_rollup_status',
  'streamer_intraday_rollups',
  'refreshed_at',
  'MIN(r.updated_at)',
  'MAX(r.updated_at)',
  'provider <> ?',
  'readOnly: true',
  'streamerIdentitiesIncluded: false',
  'crossProviderAggregation: false',
  'sourceRowsModified: false',
]) assert.ok(worker.includes(fragment), `post-merge verifier missing: ${fragment}`)
assert.equal(/(?:INSERT|UPDATE|DELETE|REPLACE)\s/i.test(worker), false, 'post-merge verifier must remain read-only')
assert.equal(worker.includes('async scheduled('), false, 'post-merge verifier must not own a cron')
assert.equal(worker.includes('wrangler d1 execute'), false, 'direct D1 execute is forbidden')

for (const [provider, config, source] of [
  ['twitch', contract.providers.twitch, twitch],
  ['kick', contract.providers.kick, kick],
]) {
  assert.match(source, new RegExp(`^name = "${config.temporaryVerifier}"$`, 'm'))
  assert.match(source, /^main = "src\/index\.ts"$/m)
  assert.match(source, /^workers_dev = true$/m)
  assert.match(source, new RegExp(`^PROVIDER = "${provider}"$`, 'm'))
  assert.match(source, new RegExp(`^STREAMER_CAP = "${config.streamerCap}"$`, 'm'))
  assert.match(source, /^MIN_REFRESHED_AT = "2026-07-12T12:20:00\.000Z"$/m)
  assert.match(source, /^binding = "DB"$/m)
  assert.match(source, new RegExp(`^database_name = "${config.databaseName}"$`, 'm'))
  assert.equal(source.includes('[triggers]'), false, `${provider}: verifier must not have cron`)
}

for (const fragment of [
  "github.repository == 'badjoke-lab/viewloom'",
  "github.head_ref == 'work-analytics-12a3-postmerge-acceptance'",
  'actions: read',
  'contents: write',
  'deploy-collector-workers.yml/runs',
  'head_sha == $merge_sha',
  'Deploy read-only verifier Workers',
  'Delete temporary verifier Workers',
  'collect-12a3-postmerge-evidence.mjs',
  'verify-12a3-postmerge-evidence.mjs',
  'docs/audits/12a3-postmerge-acceptance-evidence.json',
  'Remove one-time workflow and commit accepted evidence',
]) assert.ok(workflow.includes(fragment), `post-merge workflow missing: ${fragment}`)
assert.equal(workflow.includes('pull_request_target:'), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)

console.log('12A-3 post-merge acceptance package verification passed.')
console.log('- merge deployment and natural maintenance refresh are separate gates')
console.log('- verifier Workers are read-only, provider-specific, temporary, and token-protected')
console.log('- no manual collector route, generator invocation, backfill, or new cron')
