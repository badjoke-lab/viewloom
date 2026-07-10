#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const evidencePath = resolve(process.argv[2] || 'artifacts/12a0-capacity-baseline/evidence.json')
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a0-capacity-baseline-v1')
assert.equal(evidence.workstream, '12A-0 current data and capacity baseline')
assert.equal(evidence.evidenceMode, 'read-only-production-observation')
assert.equal(evidence.providerSeparated, true)
assert.equal(evidence.runtimeChanged, false)
assert.match(evidence.origin, /^https:\/\/vl\.badjoke-lab\.com\/?$/)
assert.ok(Number.isFinite(Date.parse(evidence.generatedAt)), 'generatedAt must be an ISO timestamp')

const expected = {
  twitch: {
    binding: 'DB_TWITCH_HOT',
    database: 'vl_twitch_hot',
    rawRetentionDays: 30,
    rollupRetentionDays: 180,
    sourceMode: 'real',
    cadenceSeconds: 300,
  },
  kick: {
    binding: 'DB_KICK_HOT',
    database: 'vl_kick_hot',
    rawRetentionDays: 60,
    rollupRetentionDays: 180,
    sourceMode: 'authenticated',
    cadenceSeconds: 300,
  },
}

for (const [provider, contract] of Object.entries(expected)) {
  const row = evidence.providers?.[provider]
  assert.ok(row, `${provider}: provider evidence missing`)
  assert.equal(row.storage.binding, contract.binding, `${provider}: wrong binding`)
  assert.equal(row.storage.database, contract.database, `${provider}: wrong database`)
  assert.equal(row.storage.rawRetentionDays, contract.rawRetentionDays, `${provider}: raw retention mismatch`)
  assert.equal(row.storage.rollupRetentionDays, contract.rollupRetentionDays, `${provider}: rollup retention mismatch`)
  assert.ok(positive(row.storage.rawRows), `${provider}: rawRows must be positive`)
  assert.ok(nonNegative(row.storage.rows24h), `${provider}: rows24h must be non-negative`)
  assert.ok(positive(row.storage.averagePayloadBytes), `${provider}: average payload must be positive`)
  assert.ok(positive(row.storage.maximumPayloadBytes), `${provider}: maximum payload must be positive`)
  assert.ok(nonNegative(row.storage.retainedPayloadMb), `${provider}: retained payload MB must be non-negative`)
  assert.ok(nonNegative(row.storage.estimatedPayloadMbPerDay), `${provider}: daily payload estimate must be non-negative`)
  assert.ok(nonNegative(row.storage.estimatedPayloadMbAtRetention), `${provider}: retention payload estimate must be non-negative`)
  assert.ok(validTimestamp(row.storage.oldestRawBucket), `${provider}: oldest raw bucket invalid`)
  assert.ok(validTimestamp(row.storage.latestRawBucket), `${provider}: latest raw bucket invalid`)
  assert.ok(Date.parse(row.storage.oldestRawBucket) <= Date.parse(row.storage.latestRawBucket), `${provider}: raw bucket order invalid`)
  assert.ok(positive(row.storage.dailyRollupObservedDays), `${provider}: daily rollup observed days must be positive`)

  assert.equal(row.collection.sourceMode, contract.sourceMode, `${provider}: unexpected production source mode`)
  assert.equal(row.collection.runCadenceSeconds, contract.cadenceSeconds, `${provider}: cadence mismatch`)
  assert.ok(positive(row.collection.observedCount), `${provider}: observed count must be positive`)
  assert.ok(positive(row.collection.topLimit), `${provider}: top limit must be positive`)
  assert.ok(validTimestamp(row.collection.latestBucketMinute), `${provider}: latest bucket missing`)
  assert.ok(validTimestamp(row.collection.latestCollectedAt), `${provider}: latest collection timestamp missing`)
  assert.ok(nonNegative(row.collection.rows24h), `${provider}: 24h row count invalid`)
  assert.ok(positive(row.collection.expectedRows24h), `${provider}: expected 24h row count invalid`)
  assert.ok(Number.isFinite(row.collection.cadenceRatio) && row.collection.cadenceRatio >= 0, `${provider}: cadence ratio invalid`)

  const windows = row.history?.windows
  assert.equal(Array.isArray(windows), true, `${provider}: history windows missing`)
  assert.equal(windows.length, 2, `${provider}: expected two bounded History windows`)
  for (const window of windows) {
    assert.equal(window.requestedDays, 90, `${provider}: History window must remain within the 90-day API limit`)
    assert.equal(window.responseDays, 90, `${provider}: History response must include explicit daily rows for the requested window`)
    assert.ok(['daily_rollups', 'minute_snapshots'].includes(window.readPath), `${provider}: unexpected History read path ${window.readPath}`)
    assert.ok(nonNegative(window.observedDays), `${provider}: observed History days invalid`)
    if (window.readPath === 'minute_snapshots') {
      assert.equal(window.observedDays, 0, `${provider}: a historical raw fallback window with observed days would not prove rollup retention`)
    }
  }
  const rollupWindows = windows.filter((window) => window.readPath === 'daily_rollups')
  assert.ok(rollupWindows.length >= 1, `${provider}: at least one History window must prove daily_rollups read path`)
  assert.equal(
    row.storage.dailyRollupObservedDays,
    rollupWindows.reduce((sum, window) => sum + window.observedDays, 0),
    `${provider}: daily rollup observed-day count mismatch`,
  )
}

assert.equal(evidence.providers.twitch.collection.coverageMode, 'top-window')
assert.equal(typeof evidence.providers.twitch.collection.hasMore, 'boolean')
assert.equal(evidence.providers.kick.collection.coverageMode, 'official-livestreams')
assert.equal(evidence.providers.kick.collection.targetSource, 'official-livestreams')
assert.equal(Array.isArray(evidence.providers.kick.collection.sourceModes), true)

assert.equal(evidence.schedules?.cadence?.twitch?.minutes, 5)
assert.equal(evidence.schedules?.cadence?.kick?.minutes, 5)
assert.equal(evidence.schedules?.retentionCleanup?.twitch?.rawDays, 30)
assert.equal(evidence.schedules?.retentionCleanup?.kick?.rawDays, 60)
assert.equal(evidence.schedules?.retentionCleanup?.twitch?.dailyRollupDays, 180)
assert.equal(evidence.schedules?.retentionCleanup?.kick?.dailyRollupDays, 180)

const stableTimingTargets = [
  'data_audit',
  'twitch_status',
  'kick_status',
  'twitch_history_30d',
  'kick_history_30d',
  'twitch_day_flow',
  'kick_day_flow',
]
const availabilityTimingTargets = [
  'twitch_battle_lines',
  'kick_battle_lines',
]
const requiredTimingTargets = [...stableTimingTargets, ...availabilityTimingTargets]
assert.ok(evidence.queryTimings?.sampleCountPerTarget >= 3, 'at least three timing samples are required')
for (const key of requiredTimingTargets) {
  const target = evidence.queryTimings?.targets?.[key]
  assert.ok(target, `timing target missing: ${key}`)
  assert.equal(target.samples.length, evidence.queryTimings.sampleCountPerTarget, `${key}: timing sample count mismatch`)
  assert.ok(positive(target.durationMs.min), `${key}: min timing invalid`)
  assert.ok(positive(target.durationMs.median), `${key}: median timing invalid`)
  assert.ok(positive(target.durationMs.max), `${key}: max timing invalid`)
  assert.ok(target.durationMs.min <= target.durationMs.median, `${key}: timing order invalid`)
  assert.ok(target.durationMs.median <= target.durationMs.max, `${key}: timing order invalid`)
  assert.ok(positive(target.responseBytes.min), `${key}: response bytes invalid`)
}
for (const key of stableTimingTargets) {
  const target = evidence.queryTimings.targets[key]
  assert.deepEqual(target.statusCodes, [200], `${key}: baseline stable target must return HTTP 200 for every sample`)
}
for (const key of availabilityTimingTargets) {
  const target = evidence.queryTimings.targets[key]
  const statuses = target.samples.map((sample) => sample.status)
  assert.ok(statuses.every((status) => status === 200 || status === 503), `${key}: only observed 200/503 availability states are accepted`)
  assert.ok(statuses.includes(200), `${key}: at least one successful sample is required to establish a timing baseline`)
}

assert.equal(Array.isArray(evidence.fieldMatrix), true)
assert.ok(evidence.fieldMatrix.length >= 17, 'field matrix is incomplete')
const startedAt = evidence.fieldMatrix.find((row) => row.fact === 'upstream_start_time')
assert.equal(startedAt?.twitch, 'fetched_used_then_discarded')
assert.equal(startedAt?.kick, 'not_retained')
const category = evidence.fieldMatrix.find((row) => row.fact === 'category_game')
assert.equal(category?.twitch, 'not_stored')
assert.equal(category?.kick, 'not_stored_as_category')

const twitchDiscard = evidence.upstreamDiscardAudit?.twitch?.find((row) => row.field === 'started_at')
assert.equal(twitchDiscard?.fetched, true)
assert.equal(twitchDiscard?.retained, false)
const kickDiscard = evidence.upstreamDiscardAudit?.kick?.find((row) => row.field === 'category')
assert.equal(kickDiscard?.fetchedWhenPresent, true)
assert.equal(kickDiscard?.retainedAsCategory, false)

for (const provider of Object.keys(expected)) {
  const duration = evidence.collectorDuration?.[provider]
  assert.equal(duration?.measurementStatus, 'not_persisted', `${provider}: duration limitation must remain explicit`)
  assert.equal(duration?.proxyMetric, 'bucket_completion_offset_seconds', `${provider}: duration proxy contract mismatch`)
  assert.ok(duration?.proxySeconds === null || nonNegative(duration.proxySeconds), `${provider}: duration proxy invalid`)
  assert.match(duration?.interpretation ?? '', /not pure collector execution duration/i)
}

for (const provider of Object.keys(expected)) {
  const budget = evidence.budgets?.storage?.[provider]
  assert.ok(budget, `${provider}: storage budget baseline missing`)
  assert.ok(nonNegative(budget.currentRetainedPayloadMb), `${provider}: retained budget invalid`)
  assert.ok(nonNegative(budget.estimatedPayloadMbPerDay), `${provider}: daily budget invalid`)
  assert.equal(budget.acceptedRawRetentionDays, expected[provider].rawRetentionDays)
}
assert.match(evidence.budgets?.decisionBoundary ?? '', /No 12A-2 migration is authorized/i)
assert.ok(Array.isArray(evidence.limitations) && evidence.limitations.length >= 4, 'baseline limitations must be explicit')

console.log('12A-0 capacity baseline evidence verification passed.')
console.log(`- generatedAt: ${evidence.generatedAt}`)
console.log(`- origin: ${evidence.origin}`)
console.log(`- Twitch raw rows: ${evidence.providers.twitch.storage.rawRows}`)
console.log(`- Kick raw rows: ${evidence.providers.kick.storage.rawRows}`)
console.log(`- Twitch observed rollup days: ${evidence.providers.twitch.storage.dailyRollupObservedDays}`)
console.log(`- Kick observed rollup days: ${evidence.providers.kick.storage.dailyRollupObservedDays}`)
for (const key of availabilityTimingTargets) {
  const target = evidence.queryTimings.targets[key]
  const success = target.samples.filter((sample) => sample.status === 200).length
  console.log(`- ${key} availability samples: ${success}/${target.samples.length} HTTP 200`)
}
console.log('- provider separation: retained')
console.log('- runtime change: none')

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function nonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function validTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}
