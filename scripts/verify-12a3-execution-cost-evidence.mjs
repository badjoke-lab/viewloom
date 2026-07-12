#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const evidencePath = process.argv[2] || 'artifacts/12a3-execution-cost/evidence.json'
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))
const contract = JSON.parse(readFileSync('docs/audits/12a3-execution-cost-probe-contract.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a3-execution-cost-evidence-v1')
assert.equal(evidence.workstream, '12A-3 bounded intraday rollup generation')
assert.equal(evidence.status, 'observed')
assert.equal(evidence.providerSeparated, true)
assert.ok(Number.isFinite(Date.parse(evidence.observedAt)), 'observedAt must be an ISO timestamp')
assert.equal(evidence.contract, 'docs/audits/12a3-execution-cost-probe-contract.json')
assert.equal(evidence.gate.generationAuthorizedByThisEvidenceAlone, false)

for (const provider of ['twitch', 'kick']) {
  const row = evidence.providers?.[provider]
  const providerContract = contract.temporaryWorkers[provider]
  assert.ok(row, `${provider}: evidence missing`)
  assert.ok(Number.isFinite(Date.parse(row.observedAt)), `${provider}: observedAt invalid`)
  assert.ok(typeof row.source.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.source.day), `${provider}: source day invalid`)
  assert.ok(row.source.sourceSnapshots >= contract.acceptance.minimumSourceSnapshots, `${provider}: insufficient source snapshots`)
  assert.equal(row.source.bucketMinutes, providerContract.bucketMinutes)
  assert.equal(row.source.streamerCap, providerContract.streamerCap)
  assert.ok(row.source.candidateStreamers >= row.source.retainedCandidateRows, `${provider}: candidate count invalid`)
  assert.ok(row.source.retainedCandidateRows > 0 && row.source.retainedCandidateRows <= providerContract.streamerCap, `${provider}: retained candidates invalid`)

  verifyMeta(row.query.dayResolution, `${provider}.query.dayResolution`)
  verifyMeta(row.query.aggregate, `${provider}.query.aggregate`)
  assert.ok(nonNegative(row.query.aggregateWallMs), `${provider}: aggregate wall invalid`)
  assert.equal(row.query.resultRows, row.source.retainedCandidateRows)
  assert.ok(row.query.serializedResultBytes > 0, `${provider}: serialized result bytes missing`)

  assert.equal(row.writeProbe.requestedRows, providerContract.probeWriteRows)
  assert.ok(row.writeProbe.sampledRows >= contract.acceptance.minimumProbeWriteRows, `${provider}: write sample too small`)
  assert.ok(row.writeProbe.sampledRows <= providerContract.probeWriteRows, `${provider}: write sample exceeds contract`)
  verifyPass(row.writeProbe.firstPass, `${provider}.writeProbe.firstPass`)
  verifyPass(row.writeProbe.secondPass, `${provider}.writeProbe.secondPass`)
  verifyPass(row.writeProbe.cleanup, `${provider}.writeProbe.cleanup`)
  assert.equal(row.writeProbe.firstPass.retainedRows, row.writeProbe.sampledRows + 1, `${provider}: first-pass row count mismatch`)
  assert.equal(row.writeProbe.secondPass.retainedRows, row.writeProbe.firstPass.retainedRows, `${provider}: second-pass row count changed`)
  assert.equal(row.writeProbe.idempotentRowCount, true, `${provider}: idempotency failed`)
  assert.equal(row.writeProbe.cleanup.remainingRows, 0, `${provider}: cleanup incomplete`)

  assert.equal(row.projections.fullCapRows, providerContract.streamerCap)
  for (const key of [
    'projectedFirstPassRowsRead',
    'projectedFirstPassRowsWritten',
    'projectedFirstPassDurationMs',
    'projectedFirstPassWallMs',
  ]) assert.ok(row.projections[key] == null || nonNegative(row.projections[key]), `${provider}: ${key} invalid`)

  assert.equal(row.checks.sourceSupportPass, true)
  assert.equal(row.checks.writeSamplePass, true)
  assert.equal(row.checks.aggregateD1DurationPass, true)
  assert.equal(row.checks.aggregateWallPass, true)
  assert.equal(row.checks.totalWorkerWallPass, true)
  assert.equal(row.checks.projectedWriteD1DurationPass, true)
  assert.equal(row.checks.projectedWriteWallPass, true)
  assert.equal(row.checks.idempotentRowCountPass, true)
  assert.equal(row.checks.cleanupPass, true)
  assert.equal(row.checks.noProductionGenerationPass, true)
  assert.equal(row.checks.noSourceMutationPass, true)
  assert.equal(row.checks.providerSeparationPass, true)
  assert.equal(row.providerGatePass, true, `${provider}: provider gate failed`)
}

assert.equal(evidence.gate.twitchPass, true)
assert.equal(evidence.gate.kickPass, true)
assert.equal(evidence.gate.generationExecutionCostGatePass, true)

for (const [key, value] of Object.entries(evidence.privacy)) {
  assert.equal(value, false, `privacy.${key} must remain false`)
}
for (const [key, value] of Object.entries(evidence.boundaries)) {
  assert.equal(value, false, `boundaries.${key} must remain false`)
}
assert.ok(Array.isArray(evidence.limitations) && evidence.limitations.length >= 4, 'limitations must remain explicit')

const serialized = JSON.stringify(evidence)
for (const forbidden of [
  'channelLogin',
  'displayName',
  'streamer_id',
  'database_id',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  '__viewloom_cost_probe__',
]) assert.equal(serialized.includes(forbidden), false, `sanitized evidence contains forbidden field/value: ${forbidden}`)

console.log('12A-3 execution cost evidence verification passed.')
for (const provider of ['twitch', 'kick']) {
  const row = evidence.providers[provider]
  console.log(`- ${provider}: aggregate=${row.query.aggregate.durationMs}ms worker=${row.totalWorkerWallMs}ms writeSample=${row.writeProbe.sampledRows}`)
}
console.log('- generation execution cost gate: pass')
console.log('- generation authorized by this evidence alone: no')
console.log('- probe rows retained: 0')

function verifyMeta(value, label) {
  assert.ok(Number.isInteger(value.statements) && value.statements >= 1, `${label}: statements invalid`)
  assert.ok(nonNegative(value.durationMs), `${label}: duration invalid`)
  assert.ok(Number.isInteger(value.rowsRead) && value.rowsRead >= 0, `${label}: rowsRead invalid`)
  assert.ok(Number.isInteger(value.rowsWritten) && value.rowsWritten >= 0, `${label}: rowsWritten invalid`)
  assert.ok(Number.isInteger(value.changes) && value.changes >= 0, `${label}: changes invalid`)
}

function verifyPass(value, label) {
  verifyMeta(value, label)
  assert.ok(nonNegative(value.wallMs), `${label}: wallMs invalid`)
}

function nonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
