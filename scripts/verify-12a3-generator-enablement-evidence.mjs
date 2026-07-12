#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const evidencePath = process.argv[2] || 'artifacts/12a3-generator-enablement/evidence.json'
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
const contract = JSON.parse(readFileSync('docs/audits/12a3-generator-enablement-contract.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a3-generator-enablement-evidence-v1')
assert.equal(evidence.workstream, '12A-3 bounded production generator enablement')
assert.ok(['observed', 'accepted'].includes(evidence.status), 'enablement evidence must be observed or accepted')
assert.equal(evidence.providerSeparated, true)
assert.ok(Number.isFinite(Date.parse(evidence.observedAt)), 'observedAt must be valid')

for (const provider of ['twitch', 'kick']) {
  const row = evidence.providers?.[provider]
  const providerContract = contract.providers[provider]
  assert.ok(row, `${provider}: evidence missing`)
  assert.equal(row.status, 'observed')
  assert.ok(Number.isFinite(Date.parse(row.observedAt)), `${provider}: observedAt invalid`)
  assert.ok(Number.isFinite(Date.parse(row.forcedMaintenanceTimeUtc)), `${provider}: forced maintenance time invalid`)
  assert.equal(new Date(row.forcedMaintenanceTimeUtc).getUTCHours(), 0)
  assert.equal(new Date(row.forcedMaintenanceTimeUtc).getUTCMinutes(), 20)
  assert.equal(row.config.streamerCap, providerContract.streamerCap)
  assert.equal(row.config.bucketMinutes, providerContract.bucketMinutes)
  assert.deepEqual(row.lifecycle, {
    deployExitCode: 0,
    runExitCode: 0,
    deleteExitCode: 0,
  }, `${provider}: temporary acceptance Worker lifecycle failed`)

  for (const passName of ['first', 'second']) {
    const pass = row[passName]
    assert.equal(pass.provider, provider, `${provider}: ${passName} provider mismatch`)
    assert.equal(pass.enabled, true)
    assert.equal(pass.attempted, true)
    assert.equal(pass.maintenanceWindow, true)
    assert.equal(pass.error, null)
    assert.ok(Array.isArray(pass.days) && pass.days.length === 2, `${provider}: ${passName} day count mismatch`)
    assert.equal(pass.retentionCleanup?.attempted, true, `${provider}: ${passName} retention cleanup missing`)
    assert.ok(Number(pass.totals?.maximumQueries) <= contract.acceptance.maximumGeneratorQueriesPerPass, `${provider}: ${passName} query budget exceeded`)
  }

  assert.ok(Array.isArray(row.firstObservation) && row.firstObservation.length === 2)
  assert.ok(Array.isArray(row.secondObservation) && row.secondObservation.length === 2)
  assert.deepEqual(row.secondObservation, row.firstObservation, `${provider}: second-pass observations changed`)

  for (const observation of row.firstObservation) {
    assert.match(observation.day, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(observation.sourceSnapshots >= contract.acceptance.minimumSourceSnapshotsPerDay)
    assert.ok(observation.candidateStreamers >= observation.retainedStreamers)
    assert.ok(observation.retainedStreamers > 0)
    assert.ok(observation.retainedStreamers <= observation.retainedStreamerCap)
    assert.equal(observation.retainedStreamerCap, providerContract.streamerCap)
    assert.equal(observation.rollupRows, observation.retainedStreamers)
    assert.equal(observation.distinctRanks, observation.rollupRows)
    assert.equal(observation.minimumRank, 1)
    assert.equal(observation.maximumRank, observation.rollupRows)
    assert.ok(['complete_within_daily_cap', 'capped_at_daily_limit'].includes(observation.selectionState))
    assert.ok(['good', 'partial', 'poor'].includes(observation.coverageState))
    assert.ok(typeof observation.sourceMode === 'string' && observation.sourceMode.length > 0)
    assert.ok(observation.totalViewerMinutes > 0)
    assert.ok(observation.totalSampleCount > 0)
    assert.ok(observation.hourlyPayloadBytes > 0)
  }

  for (const value of Object.values(row.checks)) assert.equal(value, true, `${provider}: acceptance check failed`)
  assert.equal(row.providerGatePass, true)
}

assert.equal(evidence.gate.twitchPass, true)
assert.equal(evidence.gate.kickPass, true)
assert.equal(evidence.gate.generatorEnablementGatePass, true)
assert.equal(evidence.gate.productionGenerationStarted, true)
assert.equal(evidence.gate.mainCollectorDeployAuthorizedByThisEvidence, true)

for (const [key, value] of Object.entries(evidence.privacy)) {
  assert.equal(value, false, `privacy.${key} must remain false`)
}
assert.equal(evidence.boundaries.productionGenerationStarted, true)
for (const key of [
  'backfillPerformed',
  'sourceRowsModified',
  'rawRetentionChanged',
  'newCronAdded',
  'categoryCaptureIncluded',
  'exactSessionFieldsIncluded',
  'crossProviderAnalyticsIncluded',
  'temporaryWorkersRetained',
]) assert.equal(evidence.boundaries[key], false, `boundaries.${key} must remain false`)
assert.ok(Array.isArray(evidence.limitations) && evidence.limitations.length >= 4)

const serialized = JSON.stringify(evidence)
for (const forbidden of [
  'streamer_id',
  'channelLogin',
  'displayName',
  'database_id',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'ACCEPTANCE_TOKEN',
]) assert.equal(serialized.includes(forbidden), false, `sanitized evidence contains forbidden field/value: ${forbidden}`)

console.log('12A-3 generator enablement evidence verification passed.')
for (const provider of ['twitch', 'kick']) {
  const row = evidence.providers[provider]
  console.log(`- ${provider}: days=${row.firstObservation.length} rows=${row.firstObservation.map((day) => day.rollupRows).join(',')} pass=${row.providerGatePass}`)
}
console.log('- actual production generation started: yes')
console.log('- second pass observations unchanged')
console.log('- temporary acceptance Workers retained: no')
