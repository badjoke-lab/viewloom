#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/12a4-category-source/evidence.json'
const requirePass = process.argv.includes('--require-pass')
const evidence = JSON.parse(readFileSync(path, 'utf8'))
const contract = JSON.parse(readFileSync('docs/audits/12a4-category-source-audit-contract.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-source-audit-evidence-v1')
assert.equal(evidence.workstream, contract.workstream)
assert.equal(evidence.stage, contract.stage)
assert.ok(['observed', 'accepted'].includes(evidence.status))
assert.equal(evidence.providerSeparated, true)

for (const provider of ['twitch', 'kick']) {
  const lifecycle = evidence.lifecycle?.[provider]
  assert.equal(lifecycle?.auditDeployExitCode, 0, `${provider}: audit deploy failed`)
  assert.equal(lifecycle?.calls?.length, 2, `${provider}: expected two live probes`)
  for (const call of lifecycle.calls) {
    assert.equal(call.curlExitCode, 0, `${provider}: probe curl failed`)
    assert.equal(call.httpStatus, 200, `${provider}: probe HTTP failed`)
  }
  assert.equal(lifecycle?.restoreExitCode, 0, `${provider}: main collector restore failed`)
}
assert.equal(evidence.gate.lifecyclePass, true)
assert.equal(evidence.boundaries.mainCollectorsRestored, true)

const twitch = evidence.providers.twitch
assert.equal(twitch.passes.length, 2)
for (const pass of twitch.passes) {
  assert.equal(pass.source.endpoint, contract.providers.twitch.primarySource)
  assert.ok(pass.inventory.rowCount > 0)
  assert.equal(pass.canonicalCandidate.rowCount, pass.inventory.rowCount)
  assert.equal(pass.canonicalCandidate.providerIdKeyPresent, pass.inventory.rowCount)
  assert.equal(pass.canonicalCandidate.nameKeyPresent, pass.inventory.rowCount)
}
if (twitch.captureApproved) {
  assert.equal(twitch.sourceVerified, true)
  assert.equal(twitch.selectedSourceContract.providerIdPath, contract.providers.twitch.expectedProviderIdPath)
  assert.equal(twitch.selectedSourceContract.namePath, contract.providers.twitch.expectedNamePath)
}

const kick = evidence.providers.kick
assert.equal(kick.passes.length, 2)
assert.equal(kick.alternateEvidenceCannotApprovePrimary, true)
for (const key of ['primaryOfficialLivestreams', 'alternateOfficialChannels', 'publicChannelFallback']) {
  const source = kick.sources[key]
  assert.ok(source)
  assert.ok(Array.isArray(source.stableFields))
  assert.ok(Array.isArray(source.stableIdentityNamePairs))
}
if (kick.captureApproved) {
  assert.equal(kick.sourceVerified, true)
  assert.equal(kick.sources.primaryOfficialLivestreams.sourceVerified, true)
  assert.ok(kick.selectedSourceContract.providerIdPath)
  assert.ok(kick.selectedSourceContract.namePath)
  assert.equal(kick.selectedSourceContract.categorySource, contract.providers.kick.primarySource)
}

for (const value of Object.values(evidence.privacy)) assert.equal(value, false)
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
]) assert.equal(evidence.boundaries[key], false)

assert.equal(evidence.gate.runtimeCaptureAuthorized, false)
assert.equal(evidence.gate.storageDesignAuthorized, evidence.gate.categorySourceAuditPass)
assert.equal(evidence.gate.twitchSourceVerified, twitch.sourceVerified)
assert.equal(evidence.gate.kickPrimarySourceVerified, kick.sourceVerified)

const serialized = JSON.stringify(evidence)
for (const forbidden of [
  'TWITCH_CLIENT_SECRET',
  'KICK_CLIENT_SECRET',
  'KICK_ACCESS_TOKEN',
  'CATEGORY_AUDIT_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'rawPrefix',
]) assert.equal(serialized.includes(forbidden), false, `forbidden evidence content: ${forbidden}`)

if (requirePass) {
  assert.equal(evidence.gate.categorySourceAuditPass, true, 'category source audit did not pass')
  assert.equal(twitch.captureApproved, true)
  assert.equal(kick.captureApproved, true)
}

console.log('12A-4 category source evidence verification passed.')
console.log(`- lifecycle: ${evidence.gate.lifecyclePass}`)
console.log(`- Twitch source verified: ${evidence.gate.twitchSourceVerified}`)
console.log(`- Kick primary source verified: ${evidence.gate.kickPrimarySourceVerified}`)
console.log(`- storage design authorized: ${evidence.gate.storageDesignAuthorized}`)
console.log('- runtime capture authorized: false')
