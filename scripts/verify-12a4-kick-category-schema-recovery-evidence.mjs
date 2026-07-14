import assert from 'node:assert/strict'
import fs from 'node:fs'

const [file, mode] = process.argv.slice(2)
if (!file) {
  console.error('usage: node verify-12a4-kick-category-schema-recovery-evidence.mjs <evidence.json> [--require-pass]')
  process.exit(2)
}
const evidence = JSON.parse(fs.readFileSync(file, 'utf8'))
assert.equal(evidence.schemaVersion, 'viewloom-12a4-kick-category-schema-recovery-evidence-v1')
assert.equal(evidence.execution.targetProvider, 'kick')
assert.equal(evidence.execution.twitchExecutionIncluded, false)
assert.equal(evidence.acceptedAudit.acceptancePr, 537)
assert.equal(evidence.acceptedAudit.mergeSha, '56891f4d0441da2122fa130c7e7d8a3491ee2740')
assert.equal(evidence.gate.twitchSchemaApplyAuthorized, false)
assert.equal(evidence.gate.categoryRuntimeEnablementAuthorized, false)
assert.equal(evidence.gate.boundedCategoryCostProbeAuthorizedByThisEvidence, false)
assert.equal(evidence.boundaries.twitchSchemaApply, false)
assert.equal(evidence.boundaries.categoryRuntimeEnablement, false)

if (mode === '--require-pass') {
  assert.ok(['observed_pass', 'accepted'].includes(evidence.status))
  assert.equal(evidence.gate.kickRecoveryPass, true)
  assert.equal(evidence.parseErrors.length, 0)
  assert.equal(evidence.acceptedAudit.twitchSchemaState, 'complete')
  assert.equal(evidence.acceptedAudit.kickSchemaState, 'absent')
  assert.equal(evidence.kick.providerGatePass, true)
  assert.equal(Object.values(evidence.kick.checks).every(Boolean), true)
  assert.equal(evidence.kick.pre.schema.absent, true)
  assert.equal(evidence.kick.pre.schema.partial, false)
  assert.equal(evidence.kick.firstApply.apply.metrics.statementCount, 9)
  assert.equal(evidence.kick.firstApply.apply.reason, 'applied')
  assert.equal(evidence.kick.secondApply.apply.metrics.statementCount, 0)
  assert.equal(evidence.kick.secondApply.apply.reason, 'already-complete')
  assert.equal(evidence.kick.post.schema.complete, true)
  assert.equal(evidence.kick.post.categoryDictionaryRows, 0)
  assert.equal(evidence.kick.post.reservedProbeRows, 0)
  assert.equal(evidence.kick.post.providerLeakageRows, 0)
  assert.equal(evidence.kick.measurements.firstApplyRowsWritten >= 0, true)
  assert.equal(evidence.kick.lifecycle.postDeleteHttpStatus, 404)
}

console.log(JSON.stringify({
  ok: true,
  requirePass: mode === '--require-pass',
  status: evidence.status,
  kickRecoveryPass: evidence.gate.kickRecoveryPass,
}, null, 2))
