#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'docs/audits/12a4-category-source-audit-evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))
const contract = JSON.parse(readFileSync('docs/audits/12a4-category-source-audit-contract.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-source-audit-evidence-v1')
assert.equal(evidence.workstream, contract.workstream)
assert.equal(evidence.stage, contract.stage)
assert.equal(evidence.status, 'accepted')
assert.equal(evidence.providerSeparated, true)
assert.equal(evidence.acceptanceIdentity.pr, 513)
assert.equal(evidence.acceptanceIdentity.workflowRunId, 29195340633)
assert.equal(evidence.acceptanceIdentity.artifactId, 8260821948)
assert.match(evidence.acceptanceIdentity.artifactDigest, /^sha256:[0-9a-f]{64}$/)

for (const provider of ['twitch', 'kick']) {
  const lifecycle = evidence.lifecycle?.[provider]
  assert.equal(lifecycle?.auditDeployExitCode, 0, `${provider}: audit deploy failed`)
  assert.equal(lifecycle?.calls?.length, 2, `${provider}: expected two live probes`)
  for (const call of lifecycle.calls) {
    assert.equal(call.curlExitCode, 0, `${provider}: probe curl failed`)
    assert.equal(call.httpStatus, 200, `${provider}: probe HTTP failed`)
  }
  assert.equal(lifecycle?.restoreExitCode, 0, `${provider}: main collector restore failed`)
  assert.equal(lifecycle?.restoreHealthCurlExitCode, 0, `${provider}: restored health curl failed`)
  assert.equal(lifecycle?.restoreHealthHttpStatus, 200, `${provider}: restored health HTTP failed`)
}

const twitch = evidence.providers.twitch
assert.equal(twitch.passes.length, 2)
assert.equal(twitch.sourceVerified, true)
assert.equal(twitch.captureApproved, true)
assert.equal(twitch.selectedSourceContract.providerIdPath, 'game_id')
assert.equal(twitch.selectedSourceContract.namePath, 'game_name')
for (const pass of twitch.passes) {
  assert.equal(pass.httpStatus, 200)
  assert.equal(pass.rowCount, 100)
  assert.equal(pass.providerIdKeyPresent, 100)
  assert.equal(pass.nameKeyPresent, 100)
  assert.equal(pass.pairedNonEmpty, 100)
}

const kick = evidence.providers.kick
assert.equal(kick.passes.length, 2)
assert.equal(kick.sourceVerified, true)
assert.equal(kick.captureApproved, true)
assert.equal(kick.alternateEvidenceCannotApprovePrimary, true)
assert.equal(kick.primaryOfficialLivestreams.sourceVerified, true)
assert.equal(kick.primaryOfficialLivestreams.firstRowCount, 100)
assert.equal(kick.primaryOfficialLivestreams.secondRowCount, 100)
assert.equal(kick.selectedSourceContract.providerIdPath, 'category.id')
assert.equal(kick.selectedSourceContract.namePath, 'category.name')
assert.equal(kick.selectedSourceContract.minimumPresenceRatio, 1)
assert.equal(kick.selectedSourceContract.categorySource, contract.providers.kick.primarySource)

assert.equal(evidence.gate.lifecyclePass, true)
assert.equal(evidence.gate.twitchSourceVerified, true)
assert.equal(evidence.gate.kickPrimarySourceVerified, true)
assert.equal(evidence.gate.categorySourceAuditPass, true)
assert.equal(evidence.gate.sourceContractAccepted, true)
assert.equal(evidence.gate.storageDesignAuthorized, true)
assert.equal(evidence.gate.runtimeCaptureAuthorized, false)

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
assert.equal(evidence.boundaries.mainCollectorsRestored, true)

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

console.log('12A-4 category source evidence verification passed.')
console.log('- Twitch: game_id / game_name, 100/100 across two probes')
console.log('- Kick: category.id / category.name, presence ratio 1.0 across two probes')
console.log('- main collectors restored and healthy')
console.log('- storage design authorized; runtime capture disabled')
