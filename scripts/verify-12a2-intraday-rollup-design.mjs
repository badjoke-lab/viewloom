#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contractPath = process.argv[2] || 'docs/audits/12a2-intraday-rollup-design-contract.json'
const evidencePath = process.argv[3]
const contract = JSON.parse(readFileSync(contractPath, 'utf8'))

assert.equal(contract.schemaVersion, 'viewloom-12a2-intraday-rollup-design-v1')
assert.equal(contract.workstream, '12A-2 compact intraday rollup design and migration')
assert.equal(contract.status, 'candidate_design')
assert.equal(contract.designOnly, true)
assert.equal(contract.migrationIncluded, false)
assert.equal(contract.runtimeGenerationIncluded, false)
assert.equal(contract.providerSeparated, true)
assert.equal(contract.sourceContractVersion, 'analytics-source-v1')

assert.equal(contract.platformConstraints.workersFree.maximumDatabaseMb, 500)
assert.equal(contract.platformConstraints.workersFree.maximumAccountStorageMb, 5120)
assert.equal(contract.platformConstraints.workersFree.rowsReadPerDay, 5000000)
assert.equal(contract.platformConstraints.workersFree.rowsWrittenPerDay, 100000)
assert.equal(contract.platformConstraints.workersFree.queriesPerWorkerInvocation, 50)
assert.equal(contract.platformConstraints.workersFree.maximumQuerySeconds, 30)

assert.equal(contract.model.primaryTable, 'streamer_intraday_rollups')
assert.equal(contract.model.statusTable, 'intraday_rollup_status')
assert.equal(contract.model.grain, 'provider x day x streamer')
assert.equal(contract.model.hourlyEncoding.type, 'sparse_json_array_of_arrays')
assert.equal(contract.model.hourlyEncoding.maximumCellsPerRow, 24)
assert.deepEqual(contract.model.hourlyEncoding.cell, [
  'hour_utc',
  'viewer_minutes',
  'peak_viewers',
  'sample_count',
  'observed_minutes',
  'first_viewers',
  'last_viewers',
])
assert.deepEqual(contract.model.primaryKey, ['provider', 'day', 'streamer_id'])
assert.deepEqual(contract.model.secondaryIndex, ['provider', 'streamer_id', 'day'])
assert.equal(contract.model.categoryFieldsIncluded, false)
assert.equal(contract.model.providerStartedAtIncluded, false)
assert.equal(contract.model.exactSessionFieldsIncluded, false)

assert.equal(contract.selection.twitch.currentObservedWindow, 300)
assert.equal(contract.selection.twitch.retainedStreamerCapPerDay, 600)
assert.equal(contract.selection.twitch.capMultiplier, 2)
assert.equal(contract.selection.kick.currentObservedWindow, 100)
assert.equal(contract.selection.kick.retainedStreamerCapPerDay, 200)
assert.equal(contract.selection.kick.capMultiplier, 2)
assert.match(contract.selection.truncationLanguage, /does not mean offline/i)

assert.equal(contract.retention.intradayDays, 90)
assert.equal(contract.retention.rawRetentionChanged, false)
assert.equal(contract.retention.dailyRollupRetentionChanged, false)
assert.equal(contract.retention.twitchRawDays, 30)
assert.equal(contract.retention.kickRawDays, 60)
assert.equal(contract.retention.dailyRollupDays, 180)

assert.equal(contract.refresh.newCronRequired, false)
assert.deepEqual(contract.refresh.daysPerRefresh, ['today', 'yesterday'])
assert.equal(contract.refresh.idempotentUpsertRequired, true)
assert.equal(contract.refresh.analyticsFailureMustNotInvalidateRawCollection, true)
assert.equal(contract.refresh.maximumRollupRowUpsertsPerDay.twitch, 2400)
assert.equal(contract.refresh.maximumRollupRowUpsertsPerDay.kick, 800)
assert.equal(contract.refresh.maximumRollupRowUpsertsPerDay.combined, 3200)
assert.equal(contract.refresh.maximumStatusRowUpsertsPerDay.combined, 8)
assert.equal(contract.refresh.logicalSourceObservationUpperBoundPerDay.combined, 460800)
assert.match(contract.refresh.logicalSourceObservationUpperBoundPerDay.billingDisclaimer, /not claimed D1 billed rows_read/i)

assert.equal(contract.queryContracts.streamer90DayBaseline.maximumPrimaryRowsSelected, 90)
assert.deepEqual(contract.queryContracts.streamer90DayBaseline.index, ['provider', 'streamer_id', 'day'])
assert.equal(contract.queryContracts.streamerRecentTrend.maximumPrimaryRowsSelected, 30)
assert.equal(contract.queryContracts.productionTimingTargetsFor12A3.singleProviderDayRefreshTargetMs, 10000)
assert.equal(contract.queryContracts.productionTimingTargetsFor12A3.singleProviderDayRefreshHardStopMs, 25000)
assert.equal(contract.queryContracts.productionTimingTargetsFor12A3.streamer90DayLookupTargetMs, 1000)

assert.equal(contract.budgetMeasurement.benchmarkDays, 7)
assert.equal(contract.budgetMeasurement.projectionDays, 90)
assert.equal(contract.budgetMeasurement.hourlyCellsPerSyntheticRow, 24)
assert.equal(contract.budgetMeasurement.safetyMarginPct, 20)

assert.equal(contract.migrationGate.designBudgetArtifactAccepted, false)
assert.equal(contract.migrationGate.remoteDatabaseSizeEvidenceRequiredBeforeApply, true)
assert.equal(contract.migrationGate.remoteDatabaseSizeEvidencePresent, false)
assert.equal(contract.migrationGate.migrationAuthorized, false)

for (const assumption of [
  'exact session boundaries',
  'Kick provider_started_at availability',
  'category capture approval',
  'cross-provider category identity equivalence',
]) assert.ok(contract.prohibitedAssumptions.includes(assumption), `missing prohibited assumption: ${assumption}`)

const design = readFileSync('docs/product/intraday-rollup-design-v1.md', 'utf8')
for (const fragment of [
  'provider x day x streamer',
  'daily_cap_truncated',
  'Twitch daily retained cap: 600',
  'Kick daily retained cap: 200',
  'intraday rollup: 90 days',
  'No new cron is required by default.',
  'design budget artifact accepted != migration authorized',
  'provider_started_at',
]) assert.ok(design.includes(fragment), `human design missing: ${fragment}`)

if (evidencePath) verifyEvidence(JSON.parse(readFileSync(evidencePath, 'utf8')))

console.log('12A-2 intraday rollup design verification passed.')
console.log('- grain: provider x day x streamer')
console.log('- caps: Twitch 600/day, Kick 200/day')
console.log('- retention: 90 days')
console.log('- new cron: no')
console.log('- migration authorized: no')

function verifyEvidence(evidence) {
  assert.equal(evidence.schemaVersion, 'viewloom-12a2-intraday-rollup-budget-v1')
  assert.equal(evidence.workstream, contract.workstream)
  assert.equal(evidence.benchmark.benchmarkDays, 7)
  assert.equal(evidence.benchmark.projectionDays, 90)
  assert.equal(evidence.benchmark.hourlyCellsPerSyntheticRow, 24)
  assert.equal(evidence.benchmark.safetyMarginPct, 20)
  assert.match(evidence.benchmark.measurementBoundary, /not remote D1 database-size evidence/i)

  const expected = {
    twitch: { cap: 600, rows90d: 54000, baselineMb: 311.4 },
    kick: { cap: 200, rows90d: 18000, baselineMb: 277.8 },
  }

  for (const [provider, target] of Object.entries(expected)) {
    const row = evidence.providers?.[provider]
    assert.ok(row, `${provider}: budget evidence missing`)
    assert.equal(row.retainedStreamerCapPerDay, target.cap)
    assert.equal(row.benchmarkRows, target.cap * 7)
    assert.equal(row.benchmarkStatusRows, 7)
    assert.ok(positive(row.dataAndPrimaryKeyBytesPerRow), `${provider}: data bytes/row invalid`)
    assert.ok(positive(row.secondaryIndexBytesPerRow), `${provider}: index bytes/row invalid`)
    assert.ok(positive(row.totalMeasuredBytesPerRollupRow), `${provider}: total bytes/row invalid`)
    assert.equal(row.projectedRows90d, target.rows90d)
    assert.ok(positive(row.projectedStorageMb90d), `${provider}: storage projection invalid`)
    assert.ok(row.projectedStorageMb90dWithSafety > row.projectedStorageMb90d, `${provider}: safety margin missing`)
    assert.equal(row.rawPayloadMbAtRetentionBaseline, target.baselineMb)
    assert.ok(row.payloadBaselinePlusProjectionWithSafetyMb > target.baselineMb, `${provider}: combined projection invalid`)

    const streamerPlan = row.queryPlans?.streamer90DayLookup?.join(' ') ?? ''
    assert.match(streamerPlan, /idx_intraday_streamer_day/, `${provider}: streamer lookup does not use secondary index`)
    const dayPlan = row.queryPlans?.providerDayLookup?.join(' ') ?? ''
    assert.match(dayPlan, /sqlite_autoindex_streamer_intraday_rollups_1|PRIMARY KEY/i, `${provider}: provider/day lookup does not use primary-key index`)
  }

  assert.ok(evidence.providers.twitch.projectedStorageMb90dWithSafety <= evidence.acceptance.twitchProjected90dWithSafetyMbMax)
  assert.ok(evidence.providers.kick.projectedStorageMb90dWithSafety <= evidence.acceptance.kickProjected90dWithSafetyMbMax)
  assert.ok(evidence.providers.twitch.payloadBaselinePlusProjectionWithSafetyMb <= evidence.acceptance.twitchPayloadBaselinePlusProjectionWithSafetyMbMax)
  assert.ok(evidence.providers.kick.payloadBaselinePlusProjectionWithSafetyMb <= evidence.acceptance.kickPayloadBaselinePlusProjectionWithSafetyMbMax)
  assert.ok(
    evidence.providers.twitch.projectedStorageMb90dWithSafety + evidence.providers.kick.projectedStorageMb90dWithSafety
      <= evidence.acceptance.combinedProjectedRollupWithSafetyMbMax,
  )
  assert.equal(evidence.writes.maximumRollupRowUpsertsPerDay.combined, 3200)
  assert.equal(evidence.writes.maximumStatusRowUpsertsPerDay.combined, 8)
  assert.ok(evidence.writes.maximumRollupRowUpsertsPerDay.combined + evidence.writes.maximumStatusRowUpsertsPerDay.combined < contract.platformConstraints.workersFree.rowsWrittenPerDay)
  assert.equal(evidence.acceptance.migrationAuthorized, false)
  assert.equal(evidence.acceptance.remoteDatabaseSizeEvidenceRequiredBeforeApply, true)
  assert.ok(Array.isArray(evidence.limitations) && evidence.limitations.length >= 4)

  console.log(`- Twitch projected 90d with safety: ${evidence.providers.twitch.projectedStorageMb90dWithSafety} MB`)
  console.log(`- Kick projected 90d with safety: ${evidence.providers.kick.projectedStorageMb90dWithSafety} MB`)
}

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
