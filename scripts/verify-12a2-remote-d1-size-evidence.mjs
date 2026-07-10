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

assert.equal(evidence.privacy.unrelatedDatabaseNamesIncluded, false)
assert.equal(evidence.privacy.secretsIncluded, false)
assert.equal(evidence.privacy.accountIdIncluded, false)
assert.ok(Array.isArray(evidence.limitations) && evidence.limitations.length >= 3, 'remote size limitations must remain explicit')
assert.equal(evidence.gate.migrationAuthorizedByThisEvidenceAlone, false)

if (evidence.status === 'blocked') {
  verifyBlocked(evidence)
} else {
  verifyObserved(evidence)
}

function verifyBlocked(row) {
  assert.equal(row.blocker?.code, 'cloudflare_credentials_missing')
  assert.deepEqual(row.blocker?.requiredRepositorySecrets, [
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
  ])
  assert.equal(row.blocker?.secretValuesIncluded, false)
  assert.equal(row.gate.twitchPass, false)
  assert.equal(row.gate.kickPass, false)
  assert.equal(row.gate.accountPass, false)
  assert.equal(row.gate.migrationStorageGatePass, false)
  assert.equal('providers' in row, false, 'blocked evidence must not fabricate provider sizes')
  assert.equal('account' in row, false, 'blocked evidence must not fabricate account sizes')

  console.log('12A-2 remote D1 size evidence verification passed in blocked mode.')
  console.log('- blocker: cloudflare_credentials_missing')
  console.log('- remote size claims: none')
  console.log('- migration storage gate: blocked')
  console.log('- migration authorized: no')
}

function verifyObserved(row) {
  assert.ok(row.status === undefined || row.status === 'observed', 'unexpected observed evidence status')
  assert.equal(row.platformLimits.maximumDatabaseMb, 500)
  assert.equal(row.platformLimits.maximumAccountStorageMb, 5120)
  assert.equal(row.platformLimits.perDatabaseOperationalCeilingMb, 450)
  assert.equal(row.platformLimits.accountOperationalCeilingMb, 4608)

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
    const providerRow = row.providers?.[provider]
    assert.ok(providerRow, `${provider}: provider size evidence missing`)
    assert.equal(providerRow.databaseName, target.databaseName)
    assert.ok(typeof providerRow.databaseId === 'string' && providerRow.databaseId.length > 0, `${provider}: database id missing`)
    assert.ok(positive(providerRow.currentSizeBytes), `${provider}: currentSizeBytes must be positive`)
    assert.ok(positive(providerRow.currentSizeMb), `${provider}: currentSizeMb must be positive`)
    assert.equal(providerRow.safeRollupProjectionMb, target.safeRollupProjectionMb, `${provider}: safe rollup projection drift`)
    assert.equal(providerRow.projectedSizeMbWithSafety, round(providerRow.currentSizeMb + providerRow.safeRollupProjectionMb, 2), `${provider}: projected size math mismatch`)
    assert.equal(providerRow.maximumDatabaseMb, 500)
    assert.equal(providerRow.operationalCeilingMb, 450)
    assert.equal(providerRow.projectedHeadroomMb, round(500 - providerRow.projectedSizeMbWithSafety, 2), `${provider}: headroom math mismatch`)
    assert.equal(providerRow.projectedUtilizationPct, round((providerRow.projectedSizeMbWithSafety / 500) * 100, 2), `${provider}: utilization math mismatch`)
    assert.equal(providerRow.perDatabaseGatePass, providerRow.projectedSizeMbWithSafety <= 450, `${provider}: gate result mismatch`)
  }

  const account = row.account
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

  assert.equal(row.gate.twitchPass, row.providers.twitch.perDatabaseGatePass)
  assert.equal(row.gate.kickPass, row.providers.kick.perDatabaseGatePass)
  assert.equal(row.gate.accountPass, account.accountGatePass)
  assert.equal(
    row.gate.migrationStorageGatePass,
    row.providers.twitch.perDatabaseGatePass
      && row.providers.kick.perDatabaseGatePass
      && account.accountGatePass,
    'combined storage gate mismatch',
  )

  console.log('12A-2 remote D1 size evidence verification passed in observed mode.')
  console.log(`- Twitch current/projected: ${row.providers.twitch.currentSizeMb} / ${row.providers.twitch.projectedSizeMbWithSafety} MB`)
  console.log(`- Kick current/projected: ${row.providers.kick.currentSizeMb} / ${row.providers.kick.projectedSizeMbWithSafety} MB`)
  console.log(`- Account current/projected: ${account.currentSizeMb} / ${account.projectedSizeMbWithSafety} MB`)
  console.log(`- Migration storage gate: ${row.gate.migrationStorageGatePass ? 'pass' : 'blocked'}`)
  console.log('- Migration authorized by this evidence alone: no')
}

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
