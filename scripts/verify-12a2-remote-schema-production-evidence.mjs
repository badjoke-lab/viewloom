#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const evidencePath = process.argv[2] || 'artifacts/12a2-remote-schema/evidence.json'
const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a2-remote-schema-production-evidence-v1')
assert.equal(evidence.workstream, '12A-2 remote schema apply and verification gate')
assert.ok(Number.isFinite(Date.parse(evidence.observedAt)), 'observedAt must be an ISO timestamp')
assert.ok(Number.isFinite(Date.parse(evidence.productionGeneratedAt)), 'productionGeneratedAt must be an ISO timestamp')
assert.equal(evidence.source.path, '/api/schema-audit')
assert.equal(evidence.source.mode, 'read-only-schema-probe')
assert.equal(evidence.source.querySource, 'sqlite_master')
assert.equal(evidence.source.readOnly, true)

const expectedObjects = [
  { type: 'table', name: 'streamer_intraday_rollups' },
  { type: 'index', name: 'idx_intraday_streamer_day' },
  { type: 'table', name: 'intraday_rollup_status' },
]

for (const provider of ['twitch', 'kick']) {
  const row = evidence.providers?.[provider]
  assert.ok(row, `${provider}: provider evidence missing`)
  assert.equal(row.expectedObjectCount, 3)
  assert.ok(Number.isInteger(row.observedObjectCount) && row.observedObjectCount >= 0 && row.observedObjectCount <= 3, `${provider}: observed object count invalid`)
  assert.ok(Array.isArray(row.objects) && row.objects.length === 3, `${provider}: object result length mismatch`)

  for (const expected of expectedObjects) {
    const object = row.objects.find((item) => item.name === expected.name)
    assert.ok(object, `${provider}: missing object result ${expected.name}`)
    assert.equal(object.type, expected.type, `${provider}: expected type drift for ${expected.name}`)
    assert.equal(typeof object.present, 'boolean', `${provider}: present flag invalid for ${expected.name}`)
    assert.equal(typeof object.definitionMatches, 'boolean', `${provider}: definitionMatches invalid for ${expected.name}`)
    if (!object.present) {
      assert.equal(object.observedType, null, `${provider}: absent object must not have observed type`)
      assert.equal(object.definitionMatches, false, `${provider}: absent object cannot match definition`)
    }
    if (object.definitionMatches) {
      assert.equal(object.present, true, `${provider}: matching definition requires present object`)
      assert.equal(object.observedType, object.type, `${provider}: matching definition requires expected observed type`)
    }
  }

  const derivedComplete = row.objects.every((object) => object.present && object.definitionMatches)
  assert.equal(row.schemaComplete, derivedComplete, `${provider}: schemaComplete mismatch`)
  assert.equal(row.observedObjectCount, row.objects.filter((object) => object.present).length, `${provider}: observed count mismatch`)
  assert.ok(nonNegative(row.auditQuery?.rowsRead), `${provider}: rowsRead must be nonnegative`)
  assert.equal(row.auditQuery?.rowsWritten, 0, `${provider}: schema probe wrote rows`)
  assert.ok(nonNegative(row.auditQuery?.sqlDurationMs), `${provider}: SQL duration must be nonnegative`)
  assert.ok(positive(row.auditQuery?.databaseSizeBytes), `${provider}: database size evidence missing`)
}

assert.equal(evidence.gate.twitchRemoteSchemaComplete, evidence.providers.twitch.schemaComplete)
assert.equal(evidence.gate.kickRemoteSchemaComplete, evidence.providers.kick.schemaComplete)
assert.equal(
  evidence.gate.remoteSchemaGatePass,
  evidence.providers.twitch.schemaComplete && evidence.providers.kick.schemaComplete,
  'remote schema gate must equal provider conjunction',
)
assert.equal(evidence.gate.accountAggregateMeasured, false)
assert.equal(evidence.gate.generationStorageGatePass, false)
assert.equal(evidence.gate.generationAuthorizedByThisEvidenceAlone, false)
assert.ok(Array.isArray(evidence.gate.blockers) && evidence.gate.blockers.includes('account_aggregate_storage_unmeasured'))
if (evidence.gate.remoteSchemaGatePass) {
  assert.equal(evidence.gate.blockers.includes('remote_schema_apply_unverified'), false)
} else {
  assert.equal(evidence.gate.blockers.includes('remote_schema_apply_unverified'), true)
}

assert.equal(evidence.boundary.migrationApplyPerformedByProbe, false)
assert.equal(evidence.boundary.backfillPerformedByProbe, false)
assert.equal(evidence.boundary.generationStartedByProbe, false)
assert.equal(evidence.boundary.rawSqlDefinitionsPersisted, false)

console.log('12A-2 remote schema production evidence verification passed.')
console.log(`- Twitch schema complete: ${evidence.providers.twitch.schemaComplete}`)
console.log(`- Kick schema complete: ${evidence.providers.kick.schemaComplete}`)
console.log(`- Remote schema gate: ${evidence.gate.remoteSchemaGatePass ? 'pass' : 'blocked'}`)
console.log(`- Generation blockers: ${evidence.gate.blockers.join(', ')}`)

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function nonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
