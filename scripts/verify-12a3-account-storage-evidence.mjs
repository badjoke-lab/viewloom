#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const evidencePath = process.argv[2] || 'artifacts/12a3-account-storage/evidence.json'
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
const budget = JSON.parse(readFileSync('docs/audits/12a2-intraday-rollup-budget-evidence.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a3-account-storage-gate-v1')
assert.equal(evidence.workstream, '12A-3 generation storage and execution gate')
assert.equal(evidence.status, 'observed')
assert.ok(Number.isFinite(Date.parse(evidence.observedAt)), 'observedAt must be an ISO timestamp')
assert.equal(evidence.evidenceMode, 'wrangler-d1-control-plane-json')

assert.equal(evidence.sourceCommandContract.providerInfo, 'wrangler d1 info [NAME] --json')
assert.equal(evidence.sourceCommandContract.accountList, 'wrangler d1 list --json')
assert.equal(evidence.sourceCommandContract.rawControlPlaneResponsesPersisted, false)

assert.equal(evidence.platformLimits.plan, 'Workers Free')
assert.equal(evidence.platformLimits.maximumDatabaseMb, 500)
assert.equal(evidence.platformLimits.maximumAccountStorageMb, 5120)
assert.equal(evidence.platformLimits.perDatabaseOperationalCeilingMb, 450)
assert.equal(evidence.platformLimits.accountOperationalCeilingMb, 4608)
assert.equal(evidence.platformLimits.operationalCeilingPct, 90)
assert.equal(evidence.platformLimits.officialSource, 'https://developers.cloudflare.com/d1/platform/limits/')
assert.equal(evidence.platformLimits.officialSourceCheckedAt, '2026-07-12')

const expected = {
  twitch: budget.providers.twitch.projectedStorageMb90dWithSafety,
  kick: budget.providers.kick.projectedStorageMb90dWithSafety,
}

for (const [provider, safeRollupProjectionMb] of Object.entries(expected)) {
  const row = evidence.providers?.[provider]
  assert.ok(row, `${provider}: provider evidence missing`)
  assert.ok(positive(row.currentSizeBytes), `${provider}: currentSizeBytes must be positive`)
  assert.ok(positive(row.currentSizeMb), `${provider}: currentSizeMb must be positive`)
  assert.equal(row.safeRollupProjectionMb, safeRollupProjectionMb, `${provider}: accepted projection drift`)
  assert.equal(row.projectedSizeMbWithSafety, round(row.currentSizeMb + safeRollupProjectionMb, 2), `${provider}: projected size math mismatch`)
  assert.equal(row.maximumDatabaseMb, 500)
  assert.equal(row.operationalCeilingMb, 450)
  assert.equal(row.projectedHeadroomMb, round(500 - row.projectedSizeMbWithSafety, 2), `${provider}: headroom math mismatch`)
  assert.equal(row.projectedUtilizationPct, round((row.projectedSizeMbWithSafety / 500) * 100, 2), `${provider}: utilization math mismatch`)
  assert.equal(row.providerStorageGatePass, row.projectedSizeMbWithSafety <= 450, `${provider}: provider gate mismatch`)
}

const account = evidence.account
assert.ok(account, 'account evidence missing')
assert.ok(Number.isInteger(account.databaseCount) && account.databaseCount > 0, 'account database count invalid')
assert.equal(account.sizedDatabaseCount, account.databaseCount, 'account size coverage incomplete')
assert.ok(positive(account.currentSizeBytes), 'account current size bytes must be positive')
assert.ok(positive(account.currentSizeMb), 'account current size MB must be positive')
const combinedProjection = round(expected.twitch + expected.kick, 2)
assert.equal(account.combinedSafeRollupProjectionMb, combinedProjection)
assert.equal(account.projectedSizeMbWithSafety, round(account.currentSizeMb + combinedProjection, 2), 'account projected size math mismatch')
assert.equal(account.maximumAccountStorageMb, 5120)
assert.equal(account.operationalCeilingMb, 4608)
assert.equal(account.projectedHeadroomMb, round(5120 - account.projectedSizeMbWithSafety, 2), 'account headroom math mismatch')
assert.equal(account.projectedUtilizationPct, round((account.projectedSizeMbWithSafety / 5120) * 100, 2), 'account utilization math mismatch')
assert.equal(account.accountStorageGatePass, account.projectedSizeMbWithSafety <= 4608, 'account gate mismatch')

assert.equal(evidence.gate.twitchProviderPass, evidence.providers.twitch.providerStorageGatePass)
assert.equal(evidence.gate.kickProviderPass, evidence.providers.kick.providerStorageGatePass)
assert.equal(evidence.gate.accountPass, account.accountStorageGatePass)
assert.equal(evidence.gate.accountAggregateMeasured, true)
assert.equal(
  evidence.gate.generationStorageGatePass,
  evidence.providers.twitch.providerStorageGatePass
    && evidence.providers.kick.providerStorageGatePass
    && account.accountStorageGatePass,
  'generation storage gate mismatch',
)
assert.equal(evidence.gate.generationAuthorizedByThisEvidenceAlone, false)
assert.equal(evidence.gate.nextGate, 'generation_execution_cost_measurement')

for (const [key, value] of Object.entries(evidence.privacy)) {
  assert.equal(value, false, `privacy.${key} must remain false`)
}
for (const [key, value] of Object.entries(evidence.boundaries)) {
  assert.equal(value, false, `boundaries.${key} must remain false`)
}

assert.ok(Array.isArray(evidence.limitations) && evidence.limitations.length >= 4, 'limitations must remain explicit')

const serialized = JSON.stringify(evidence)
for (const forbidden of [
  'databaseName',
  'databaseId',
  'accountId',
  'vl_twitch_hot',
  'vl_kick_hot',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
]) {
  assert.equal(serialized.includes(forbidden), false, `sanitized evidence contains forbidden field/value: ${forbidden}`)
}

console.log('12A-3 account storage evidence verification passed.')
console.log(`- Twitch current/projected: ${evidence.providers.twitch.currentSizeMb} / ${evidence.providers.twitch.projectedSizeMbWithSafety} MB`)
console.log(`- Kick current/projected: ${evidence.providers.kick.currentSizeMb} / ${evidence.providers.kick.projectedSizeMbWithSafety} MB`)
console.log(`- Account databases: ${account.databaseCount}`)
console.log(`- Account current/projected: ${account.currentSizeMb} / ${account.projectedSizeMbWithSafety} MB`)
console.log(`- Generation storage gate: ${evidence.gate.generationStorageGatePass ? 'pass' : 'blocked'}`)
console.log('- Generation authorization: no; execution-cost gate remains')

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
