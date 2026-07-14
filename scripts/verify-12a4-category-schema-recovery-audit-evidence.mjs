import assert from 'node:assert/strict'
import fs from 'node:fs'

const [file, mode] = process.argv.slice(2)
if (!file) {
  console.error('usage: node verify-12a4-category-schema-recovery-audit-evidence.mjs <evidence.json> [--require-pass]')
  process.exit(2)
}

const evidence = JSON.parse(fs.readFileSync(file, 'utf8'))
assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-schema-recovery-audit-evidence-v1')
assert.equal(evidence.sourceAttempt.triggerPr, 533)
assert.equal(evidence.sourceAttempt.triggerMergeSha, 'a83b412e479dccb36ad04541843e3dd9456e7dff')
assert.deepEqual(evidence.execution.providerOrder, ['twitch', 'kick'])
assert.equal(evidence.gate.remoteSchemaApplyAuthorized, false)
assert.equal(evidence.gate.categoryRuntimeEnablementAuthorized, false)
assert.equal(evidence.gate.providerSpecificRecoveryAuthorizedByThisEvidence, false)
assert.equal(Object.values(evidence.boundaries).every((value) => value === false || value === true), true)
assert.equal(evidence.boundaries.readOnly, true)
assert.equal(evidence.boundaries.remoteSchemaApply, false)
assert.equal(evidence.boundaries.categoryRuntimeEnablement, false)

for (const provider of ['twitch', 'kick']) {
  const item = evidence.providers[provider]
  assert.equal(item.provider, provider)
  assert.ok(['absent', 'complete', 'partial', 'unknown'].includes(item.schemaState))
  assert.equal(item.lifecycle.preExistingHttpStatus === 404 || item.lifecycle.preExistingHttpStatus === 0, true)
  assert.equal(item.lifecycle.deleteHttpStatus === 404 || item.lifecycle.deleteHttpStatus === 0, true)
  assert.equal(typeof item.checks, 'object')
  assert.equal(typeof item.providerGatePass, 'boolean')
  if (item.query) {
    assert.ok(Number(item.query.rowsWritten) >= 0)
    assert.ok(Number(item.query.changes) >= 0)
  }
}

if (mode === '--require-pass') {
  assert.equal(evidence.status, 'observed_pass')
  assert.equal(evidence.gate.recoveryAuditPass, true)
  assert.equal(evidence.gate.providerStatesKnown, true)
  assert.equal(evidence.parseErrors.length, 0)
  for (const provider of ['twitch', 'kick']) {
    const item = evidence.providers[provider]
    assert.notEqual(item.schemaState, 'unknown')
    assert.equal(item.providerGatePass, true)
    assert.equal(Object.values(item.checks).every(Boolean), true)
    assert.equal(item.query.rowsWritten, 0)
    assert.equal(item.query.changes, 0)
    assert.equal(item.providerLeakageRows, 0)
  }
}

console.log(JSON.stringify({
  ok: true,
  requirePass: mode === '--require-pass',
  recoveryAuditPass: evidence.gate.recoveryAuditPass,
  providerStates: {
    twitch: evidence.providers.twitch.schemaState,
    kick: evidence.providers.kick.schemaState,
  },
}, null, 2))
