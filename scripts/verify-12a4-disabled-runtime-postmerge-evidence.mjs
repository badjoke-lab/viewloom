#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/12a4-disabled-runtime/evidence.json'
const requirePass = process.argv.includes('--require-pass')
const evidence = JSON.parse(readFileSync(path, 'utf8'))
const contract = JSON.parse(readFileSync('docs/audits/12a4-disabled-runtime-postmerge-contract.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a4-disabled-runtime-postmerge-evidence-v1')
assert.equal(evidence.workstream, contract.workstream)
assert.ok(['observed', 'accepted'].includes(evidence.status))
assert.equal(evidence.providerSeparated, true)
assert.equal(evidence.merge.pr, 516)
assert.equal(evidence.merge.sha, '5d58b267a18399b5496a1f01aae7125a63f061c4')
assert.equal(evidence.deployment.workflow, 'Deploy Collector Workers')
assert.equal(evidence.deployment.event, 'push')
assert.equal(evidence.deployment.headSha, evidence.merge.sha)
assert.equal(evidence.deployment.gatePass, true)
for (const name of contract.deployment.requiredJobs) {
  const job = evidence.deployment.jobs?.find((row) => row.name === name)
  assert.ok(job, `missing deployment job: ${name}`)
  assert.equal(job.conclusion, 'success', `${name}: deployment job did not succeed`)
}

for (const provider of ['twitch', 'kick']) {
  const row = evidence.providers[provider]
  assert.equal(row.provider, provider)
  assert.ok(row.observedAt)
  assert.ok(row.minimumCollectedAt)
  assert.ok(row.latest)
  assert.ok(Date.parse(row.latest.collectedAt) >= Date.parse(row.minimumCollectedAt))
  assert.equal(row.latest.categoryContractType, null)
  assert.equal(row.latest.categoryIdsType, null)
  assert.equal(row.latest.categoryRefsType, null)
  assert.equal(row.schema.dictionaryTableCount, 0)
  assert.deepEqual(row.schema.presentRollupColumns, [])
  assert.deepEqual(row.schema.presentStatusColumns, [])
  assert.equal(row.checks.latestSnapshotPresent, true)
  assert.equal(row.checks.latestAfterDeployment, true)
  assert.equal(row.checks.categoryPayloadFieldsAbsent, true)
  assert.equal(row.checks.categorySchemaAbsent, true)
  assert.equal(row.checks.providerSeparated, true)
  assert.equal(row.lifecycle.deployExitCode, 0)
  assert.equal(row.lifecycle.runExitCode, 0)
  assert.equal(row.lifecycle.curlExitCode, 0)
  assert.equal(row.lifecycle.httpStatus, 200)
  assert.equal(row.lifecycle.deleteExitCode, 0)
  assert.equal(row.lifecycle.deleteCurlExitCode, 0)
  assert.equal(row.lifecycle.deleteHttpStatus, 200)
  assert.equal(row.providerGatePass, true)
}

assert.equal(evidence.gate.deploymentPass, true)
assert.equal(evidence.gate.twitchGatePass, true)
assert.equal(evidence.gate.kickGatePass, true)
assert.equal(evidence.gate.disabledRuntimePostMergePass, true)
assert.equal(evidence.gate.productionExecutionCostProbeRequired, true)
assert.equal(evidence.gate.remoteMigrationApplyAuthorized, false)
assert.equal(evidence.gate.runtimeCaptureEnablementAuthorized, false)
for (const value of Object.values(evidence.privacy)) assert.equal(value, false)
assert.equal(evidence.boundaries.readOnly, true)
assert.equal(evidence.boundaries.temporaryVerifiersRetained, false)
for (const key of [
  'productionSchemaChangedByAcceptance',
  'productionRowsWrittenByAcceptance',
  'manualCollectorRouteUsed',
  'categoryRuntimeEnabled',
  'remoteMigrationApplied',
  'backfillPerformed',
  'newCronAdded',
  'rawRetentionChanged',
  'categoryAnalyticsUiIncluded',
  'crossProviderCategoryIdentityAllowed',
  'combinedProviderCategoryRankingAllowed',
]) assert.equal(evidence.boundaries[key], false)

const serialized = JSON.stringify(evidence)
for (const forbidden of [
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'VERIFY_TOKEN',
  'database_id',
  'channelLogin',
  'displayName',
  'payload_json',
]) assert.equal(serialized.includes(forbidden), false, `forbidden evidence content: ${forbidden}`)

if (requirePass) assert.equal(evidence.gate.disabledRuntimePostMergePass, true)

console.log('12A-4 disabled runtime post-merge evidence verification passed.')
console.log(`- deployment run: ${evidence.deployment.runId}`)
console.log(`- Twitch latest: ${evidence.providers.twitch.latest.collectedAt}`)
console.log(`- Kick latest: ${evidence.providers.kick.latest.collectedAt}`)
console.log('- production category schema absent: true')
console.log('- production category payload fields absent: true')
console.log('- production cost probe still required: true')
