#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const evidencePath = process.argv[2] || 'artifacts/12a2-remote-d1-size/evidence.json'
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
const budget = JSON.parse(readFileSync('docs/audits/12a2-intraday-rollup-budget-evidence.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a2-remote-d1-size-gate-v1')
assert.equal(evidence.workstream, '12A-2 compact intraday rollup design and migration')
assert.equal(evidence.evidenceMode, 'wrangler-d1-info-json')
assert.ok(Number.isFinite(Date.parse(evidence.generatedAt)), 'generatedAt must be an ISO timestamp')

assert.equal(evidence.sourceCommandContract.providerInfo, 'wrangler d1 info [NAME] --json')
assert.equal(evidence.sourceCommandContract.accountList, 'wrangler d1 list --json')
assert.equal(evidence.sourceCommandContract.rawAccountDatabaseNamesPersisted, false)

assert.equal(evidence.platformLimits.maximumDatabaseMb, 500)
assert.equal(evidence.platformLimits.maximumAccountStorageMb, 5120)
assert.equal(evidence.platformLimits.perDatabaseOperationalCeilingMb, 450)
assert.equal(evidence.platformLimits.accountOperationalCeilingMb, 4608)

const expected = {
  twitch: {
    databaseName: 'vl_twitch_hot',
    safeRollupProjectionMb: budget.providers.twitch.projectedStorageMb90dWithSafety,
  },
  kick: {
    databaseName: 'vl_kick_hot',
    safeRollupProjectionMb: budget.providers.kick.projectedStorageMb90dWithSafety,
  },
}

for (const [provider, target] of Object.entries(expected)) {
  const row = evidence.providers?.[provider]
  assert.ok(row, `${provider}: provider size evidence missing`)
  assert.equal(row.databaseName, target.databaseName)
  assert.ok(typeof row.databaseId === 'string' && row.databaseId.length > 0, `${provider}: database id missing`)
  assert.ok(positive(row.currentSizeBytes), `${provider}: currentSizeBytes must be positive`)
  assert.ok(positive(row.currentSizeMb), `${provider}: currentSizeMb must be positive`)
  assert.equal(row.safeRollupProjectionMb, target.safeRollupProjectionMb, `${provider}: safe rollup projection drift`)
  assert.equal(row.projectedSizeMbWithSafety, round(row.currentSizeMb + row.safeRollupProjectionMb, 2), `${provider}: projected size math mismatch`)
  assert.equal(row.maximumDatabaseMb, 500)
  assert.equal(row.operationalCeilingMb, 450)
  assert.equal(row.projectedHeadroomMb, round(500 - row.projectedSizeMbWithSafety, 2), `${provider}: headroom math mismatch`)
  assert.equal(row.projectedUtilizationPct, round((row.projectedSizeMbWithSafety / 500) * 100, 2), `${provider}: utilization math mismatch`)
  assert.equal(row.perDatabaseGatePass, row.projectedSizeMbWithSafety <= 450, `${provider}: gate result mismatch`)
}

const account = evidence.account
assert.ok(account, 'account evidence missing')
assert.ok(Number.isInteger(account.databaseCount) && account.databaseCount > 0, 'account database count invalid')
assert.equal(account.sizedDatabaseCount, account.databaseCount, 'account size coverage incomplete')
assert.ok(positive(account.currentSizeBytes), 'account current size bytes must be positive')
assert.ok(positive(account.currentSizeMb), 'account current size MB must be positive')
const combinedProjection = round(expected.twitch.safeRollupProjectionMb + expected.kick.safeRollupProjectionMb, 2)
assert.equal(account.combinedSafeRollupProjectionMb, combinedProjection)
assert.equal(account.projectedSizeMbWithSafety, round(account.currentSizeMb + combinedProjection, 2), 'account projected size math mismatch')
assert.equal(account.maximumAccountStorageMb, 5120)
assert.equal(account.operationalCeilingMb, 4608)
assert.equal(account.projectedHeadroomMb, round(5120 - account.projectedSizeMbWithSafety, 2), 'account headroom math mismatch')
assert.equal(account.projectedUtilizationPct, round((account.projectedSizeMbWithSafety / 5120) * 100, 2), 'account utilization math mismatch')
assert.equal(account.accountGatePass, account.projectedSizeMbWithSafety <= 4608, 'account gate mismatch')

assert.equal(evidence.gate.twitchPass, evidence.providers.twitch.perDatabaseGatePass)
assert.equal(evidence.gate.kickPass, evidence.providers.kick.perDatabaseGatePass)
assert.equal(evidence.gate.accountPass, account.accountGatePass)
assert.equal(
  evidence.gate.migrationStorageGatePass,
  evidence.providers.twitch.perDatabaseGatePass
    && evidence.providers.kick.perDatabaseGatePass
    && account.accountGatePass,
  'combined storage gate mismatch',
)
assert.equal(evidence.gate.migrationAuthorizedByThisEvidenceAlone, false)

assert.equal(evidence.privacy.unrelatedDatabaseNamesIncluded, false)
assert.equal(evidence.privacy.secretsIncluded, false)
assert.equal(evidence.privacy.accountIdIncluded, false)
assert.ok(Array.isArray(evidence.limitations) && evidence.limitations.length >= 3, 'remote size limitations must remain explicit')

const serialized = JSON.stringify(evidence)
for (const forbidden of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) {
  assert.equal(serialized.includes(forbidden), false, `evidence leaked forbidden secret name/value marker: ${forbidden}`)
}

console.log('12A-2 remote D1 size evidence verification passed.')
console.log(`- Twitch current/projected: ${evidence.providers.twitch.currentSizeMb} / ${evidence.providers.twitch.projectedSizeMbWithSafety} MB`)
console.log(`- Kick current/projected: ${evidence.providers.kick.currentSizeMb} / ${evidence.providers.kick.projectedSizeMbWithSafety} MB`)
console.log(`- Account current/projected: ${account.currentSizeMb} / ${account.projectedSizeMbWithSafety} MB`)
console.log(`- Migration storage gate: ${evidence.gate.migrationStorageGatePass ? 'pass' : 'blocked'}`)
console.log('- Migration authorized by this evidence alone: no')

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
