import assert from 'node:assert/strict'
import fs from 'node:fs'

const [file, mode] = process.argv.slice(2)
if (!file) {
  console.error('usage: node verify-12a4-category-readonly-preflight-evidence.mjs <evidence.json> [--require-pass]')
  process.exit(2)
}

const evidence = JSON.parse(fs.readFileSync(file, 'utf8'))
assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-readonly-preflight-evidence-v1')
assert.equal(evidence.providerSeparated, true)
assert.equal(evidence.execution.parentPlanningPr, 520)
assert.equal(evidence.execution.parentMerged, true)
assert.equal(evidence.execution.packagePr, 521)
assert.equal(evidence.execution.packageMerged, true)
assert.ok(['workflow_dispatch', 'push'].includes(evidence.execution.event))
if (evidence.execution.event === 'push') {
  assert.equal(evidence.execution.trigger.schemaVersion, 'viewloom-12a4-category-readonly-preflight-trigger-v1')
  assert.equal(evidence.execution.trigger.confirmation, 'READ_ONLY_PREFLIGHT_ONLY')
  assert.equal(evidence.execution.trigger.oneTime, true)
  assert.equal(evidence.execution.trigger.expectedPackageHeadSha, evidence.execution.packageHeadSha)
}
assert.equal(evidence.execution.readOnly, true)

for (const provider of ['twitch', 'kick']) {
  const item = evidence.providers[provider]
  assert.equal(item.provider, provider)
  assert.equal(item.mode, 'read_only_preflight')
  assert.equal(item.schema.dictionaryTablePresent, false)
  assert.deepEqual(item.schema.presentRollupColumns, [])
  assert.deepEqual(item.schema.presentStatusColumns, [])
  assert.equal(item.schema.categorySchemaComplete, false)
  assert.equal(item.providerLeakageRows, 0)
  assert.equal(item.query.rowsWritten, 0)
  assert.equal(item.query.changes, 0)
  for (const value of Object.values(item.checks)) assert.equal(value, true, `${provider} preflight check failed`)
  assert.equal(item.providerGatePass, true)
}

assert.equal(evidence.gate.parentPlanningPrMerged, true)
assert.equal(evidence.gate.packagePrMerged, true)
assert.equal(evidence.gate.remoteMigrationApplyAuthorized, false)
assert.equal(evidence.gate.runtimeCaptureEnablementAuthorized, false)
for (const value of Object.values(evidence.privacy)) assert.equal(value, false)
for (const value of Object.values(evidence.boundaries)) assert.equal(value, false)

if (mode === '--require-pass') {
  assert.equal(evidence.gate.twitchGatePass, true)
  assert.equal(evidence.gate.kickGatePass, true)
  assert.equal(evidence.gate.readOnlyPreflightPass, true)
}

console.log(JSON.stringify({ ok: true, readOnlyPreflightPass: evidence.gate.readOnlyPreflightPass }, null, 2))
