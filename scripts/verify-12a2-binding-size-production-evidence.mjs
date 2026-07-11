#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const evidencePath = process.argv[2] || 'artifacts/12a2-binding-size/evidence.json'
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
const budget = JSON.parse(readFileSync('docs/audits/12a2-intraday-rollup-budget-evidence.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a2-binding-size-production-evidence-v1')
assert.equal(evidence.workstream, '12A-2 compact intraday rollup design and migration')
assert.ok(Number.isFinite(Date.parse(evidence.observedAt)), 'observedAt must be an ISO timestamp')
assert.ok(Number.isFinite(Date.parse(evidence.productionGeneratedAt)), 'productionGeneratedAt must be an ISO timestamp')
assert.equal(evidence.source.path, '/api/data-audit')
assert.equal(evidence.source.evidenceField, 'D1Result.meta.size_after')

const expected = {
  twitch: budget.providers.twitch.projectedStorageMb90dWithSafety,
  kick: budget.providers.kick.projectedStorageMb90dWithSafety,
}

for (const [provider, safeProjectionMb] of Object.entries(expected)) {
  const row = evidence.providers?.[provider]
  assert.ok(row, `${provider}: provider evidence missing`)
  assert.equal(row.databaseSizeEvidence, 'd1_result_meta_size_after')
  assert.ok(positive(row.currentSizeBytes), `${provider}: current size bytes must be positive`)
  assert.ok(positive(row.currentSizeMb), `${provider}: current size MB must be positive`)
  assert.equal(row.safeRollupProjectionMb, safeProjectionMb, `${provider}: accepted projection drift`)
  assert.equal(row.projectedSizeMbWithSafety, round(row.currentSizeMb + safeProjectionMb, 2), `${provider}: projected size math mismatch`)
  assert.equal(row.maximumDatabaseMb, 500)
  assert.equal(row.operationalCeilingMb, 450)
  assert.equal(row.projectedHeadroomMb, round(500 - row.projectedSizeMbWithSafety, 2), `${provider}: headroom math mismatch`)
  assert.equal(row.projectedUtilizationPct, round((row.projectedSizeMbWithSafety / 500) * 100, 2), `${provider}: utilization math mismatch`)
  assert.equal(row.providerMigrationGatePass, row.projectedSizeMbWithSafety <= 450, `${provider}: provider migration gate mismatch`)
  assert.ok(nonNegative(row.auditQuery?.rowsRead), `${provider}: rowsRead must be nonnegative`)
  assert.equal(row.auditQuery?.rowsWritten, 0, `${provider}: audit query must not write rows`)
  assert.ok(nonNegative(row.auditQuery?.sqlDurationMs), `${provider}: sql duration must be nonnegative`)
}

assert.equal(evidence.gate.twitchProviderPass, evidence.providers.twitch.providerMigrationGatePass)
assert.equal(evidence.gate.kickProviderPass, evidence.providers.kick.providerMigrationGatePass)
assert.equal(
  evidence.gate.schemaMigrationGatePass,
  evidence.providers.twitch.providerMigrationGatePass && evidence.providers.kick.providerMigrationGatePass,
  'schema migration gate must be exact conjunction of provider gates',
)
assert.equal(evidence.gate.accountAggregateMeasured, false)
assert.equal(evidence.gate.generationStorageGatePass, false)
assert.equal(evidence.gate.generationAuthorizedByThisEvidenceAlone, false)
assert.equal(evidence.boundary.migrationAppliesData, false)
assert.equal(evidence.boundary.migrationStartsGeneration, false)
assert.match(evidence.boundary.schemaMigrationMeaning, /provider database headroom/i)
assert.match(evidence.boundary.generationMeaning, /account-wide D1 aggregate storage remains unmeasured/i)

const serialized = JSON.stringify(evidence)
for (const forbidden of [
  'combined ranking',
  'combined total',
  'cross-provider baseline',
  'cross-provider relationship',
]) {
  assert.equal(serialized.toLowerCase().includes(forbidden), false, `forbidden cross-provider claim present: ${forbidden}`)
}

console.log('12A-2 binding-size production evidence verification passed.')
console.log(`- Twitch current/projected: ${evidence.providers.twitch.currentSizeMb} / ${evidence.providers.twitch.projectedSizeMbWithSafety} MB`)
console.log(`- Kick current/projected: ${evidence.providers.kick.currentSizeMb} / ${evidence.providers.kick.projectedSizeMbWithSafety} MB`)
console.log(`- Schema migration gate: ${evidence.gate.schemaMigrationGatePass ? 'pass' : 'blocked'}`)
console.log('- Account aggregate measured: no')
console.log('- Generation storage gate: blocked')

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function nonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
