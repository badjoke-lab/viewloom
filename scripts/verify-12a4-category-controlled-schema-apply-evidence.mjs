import assert from 'node:assert/strict'
import fs from 'node:fs'

const [file, mode] = process.argv.slice(2)
if (!file) {
  console.error('usage: node verify-12a4-category-controlled-schema-apply-evidence.mjs <evidence.json> [--require-pass]')
  process.exit(2)
}

const evidence = JSON.parse(fs.readFileSync(file, 'utf8'))
const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-category-controlled-schema-apply-execution-contract.json', 'utf8'))
const requirePass = mode === '--require-pass'

assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-evidence-v1')
assert.equal(evidence.workstream, contract.workstream)
assert.ok(['observed_pass', 'observed_failure', 'accepted'].includes(evidence.status))
assert.equal(evidence.providerSeparated, true)
assert.equal(evidence.execution.event, 'push')
assert.equal(evidence.execution.designPr, 528)
assert.equal(evidence.execution.designMerged, true)
assert.equal(evidence.execution.designMergeSha, contract.design.mergeSha)
assert.ok(Number.isInteger(evidence.execution.packagePr) && evidence.execution.packagePr > 528)
assert.equal(evidence.execution.packageMerged, true)
assert.match(evidence.execution.packageHeadSha, /^[0-9a-f]{40}$/)
assert.match(evidence.execution.packageMergeSha, /^[0-9a-f]{40}$/)
assert.equal(evidence.execution.trigger.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-trigger-v1')
assert.equal(evidence.execution.trigger.status, 'armed_for_one_time_main_push')
assert.equal(evidence.execution.trigger.confirmation, 'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED')
assert.equal(evidence.execution.trigger.oneTime, true)
assert.equal(evidence.execution.trigger.expectedPackageHeadSha, evidence.execution.packageHeadSha)
assert.deepEqual(evidence.execution.providerOrder, ['twitch', 'kick'])
assert.equal(evidence.execution.stopAfterFirstProviderFailure, true)

const providerResults = []
for (const provider of contract.providers.order) {
  const item = evidence.providers[provider]
  assert.equal(item.provider, provider)
  assert.equal(item.expectedHealthSource, contract.providers[provider].healthSource)
  assert.equal(typeof item.attempted, 'boolean')
  assert.equal(typeof item.providerGatePass, 'boolean')
  assert.equal(typeof item.checks, 'object')
  assert.equal(typeof item.lifecycle, 'object')
  assert.equal(typeof item.measurements, 'object')

  for (const [name, value] of Object.entries(item.checks)) {
    assert.equal(typeof value, 'boolean', `${provider} check ${name} must be boolean`)
  }
  const expectedProviderPass = Object.values(item.checks).every(Boolean)
  assert.equal(item.providerGatePass, expectedProviderPass)

  if (!item.attempted) {
    assert.equal(provider, 'kick', 'only Kick may be skipped after a Twitch failure')
    assert.equal(item.providerGatePass, false)
    providerResults.push(false)
    continue
  }

  if (item.providerGatePass || requirePass) validatePassedProvider(provider, item)
  providerResults.push(item.providerGatePass)
}

assert.equal(evidence.gate.designAccepted, true)
assert.equal(evidence.gate.acceptedReadOnlyPreflight, true)
assert.equal(evidence.gate.twitchGatePass, evidence.providers.twitch.providerGatePass)
assert.equal(evidence.gate.kickGatePass, evidence.providers.kick.providerGatePass)
assert.equal(evidence.gate.controlledSchemaApplyPass, providerResults.every(Boolean))
assert.equal(evidence.gate.categoryRuntimeEnablementAuthorized, false)
assert.equal(evidence.gate.boundedCategoryCostProbeAuthorizedByThisEvidence, false)

for (const [key, value] of Object.entries(evidence.privacy)) {
  assert.equal(value, false, `privacy field must be false: ${key}`)
}
assert.equal(evidence.failurePolicy.doNotDropAppliedSchema, true)
assert.equal(evidence.failurePolicy.leaveCategoryCaptureDisabled, true)
assert.equal(evidence.failurePolicy.doNotBackfill, true)
assert.equal(evidence.failurePolicy.doNotWriteProbeRows, true)
assert.equal(evidence.failurePolicy.stopBeforeNextProviderOnFailure, true)
assert.equal(evidence.failurePolicy.deleteTemporaryWorkerEvenOnFailure, true)
assert.equal(evidence.failurePolicy.preserveSanitizedFailureEvidence, true)
assert.equal(evidence.failurePolicy.partialProviderCompletionRequiresSeparateRecoveryDecision, true)
for (const [key, value] of Object.entries(evidence.boundaries)) {
  assert.equal(value, false, `boundary field must be false: ${key}`)
}

if (requirePass) {
  assert.equal(evidence.status === 'observed_pass' || evidence.status === 'accepted', true)
  assert.equal(evidence.providers.twitch.attempted, true)
  assert.equal(evidence.providers.kick.attempted, true)
  assert.equal(evidence.gate.twitchGatePass, true)
  assert.equal(evidence.gate.kickGatePass, true)
  assert.equal(evidence.gate.controlledSchemaApplyPass, true)
}

console.log(JSON.stringify({
  ok: true,
  requirePass,
  status: evidence.status,
  controlledSchemaApplyPass: evidence.gate.controlledSchemaApplyPass,
  twitchGatePass: evidence.gate.twitchGatePass,
  kickGatePass: evidence.gate.kickGatePass,
}, null, 2))

function validatePassedProvider(provider, item) {
  assert.equal(item.pre.schema.absent, true)
  assert.equal(item.pre.schema.complete, false)
  assert.equal(item.pre.schema.partial, false)
  assert.equal(item.pre.operational.healthSource, item.expectedHealthSource)
  assert.equal(item.pre.operational.healthEvidenceAvailable, true)
  assert.equal(item.pre.providerLeakageRows, 0)
  assert.equal(item.pre.categoryDictionaryRows, 0)
  assert.equal(item.pre.reservedProbeRows, 0)
  assert.ok(Number.isFinite(item.pre.databaseSizeBytes) && item.pre.databaseSizeBytes >= 0)

  assert.equal(item.firstApply.apply.reason, 'applied')
  assert.equal(item.firstApply.apply.applied, true)
  assert.equal(item.firstApply.apply.metrics.statementCount, contract.acceptanceThresholds.schemaApplyStatementsPerProvider)
  assert.equal(item.firstApply.apply.post.complete, true)
  assert.ok(Number.isFinite(item.firstApply.workerWallMs) && item.firstApply.workerWallMs >= 0)

  assert.equal(item.secondApply.apply.reason, 'already-complete')
  assert.equal(item.secondApply.apply.applied, false)
  assert.ok(item.secondApply.apply.metrics.statementCount <= contract.acceptanceThresholds.secondPassStatementCountMax)
  assert.equal(item.secondApply.apply.post.complete, true)

  assert.equal(item.post.schema.complete, true)
  assert.equal(item.post.schema.absent, false)
  assert.equal(item.post.schema.partial, false)
  assert.equal(item.post.operational.healthSource, item.expectedHealthSource)
  assert.equal(item.post.operational.healthEvidenceAvailable, true)
  assert.equal(item.post.providerLeakageRows, 0)
  assert.equal(item.post.categoryDictionaryRows, 0)
  assert.equal(item.post.reservedProbeRows, 0)
  assert.ok(Number.isFinite(item.post.databaseSizeBytes) && item.post.databaseSizeBytes >= 0)

  const measurements = item.measurements
  assert.ok(Number.isFinite(measurements.databaseSizeBefore) && measurements.databaseSizeBefore >= 0)
  assert.ok(Number.isFinite(measurements.databaseSizeAfter) && measurements.databaseSizeAfter >= 0)
  assert.ok(Number.isFinite(measurements.schemaSizeIncreaseBytes) && measurements.schemaSizeIncreaseBytes >= 0)
  assert.ok(measurements.schemaSizeIncreaseBytes <= contract.acceptanceThresholds.schemaSizeIncreaseBytesPerProviderMax)
  assert.ok(Number.isFinite(measurements.collectorLatencyBeforeMs) && measurements.collectorLatencyBeforeMs >= 0)
  assert.ok(Number.isFinite(measurements.collectorLatencyAfterMs) && measurements.collectorLatencyAfterMs >= 0)
  assert.ok(Number.isFinite(measurements.collectorLatencyDeltaMs) && measurements.collectorLatencyDeltaMs >= 0)
  assert.ok(measurements.collectorLatencyDeltaMs <= contract.acceptanceThresholds.collectorLatencyDeltaMsPerProviderMax)
  assert.equal(measurements.schemaApplyStatementCount, contract.acceptanceThresholds.schemaApplyStatementsPerProvider)
  assert.ok(Number.isFinite(measurements.schemaApplyDurationMs) && measurements.schemaApplyDurationMs >= 0)
  assert.ok(Number.isFinite(measurements.schemaApplyRowsRead) && measurements.schemaApplyRowsRead >= 0)
  assert.ok(Number.isFinite(measurements.schemaApplyRowsWritten) && measurements.schemaApplyRowsWritten >= 0)
  assert.ok(Number.isFinite(measurements.schemaApplyChanges) && measurements.schemaApplyChanges >= 0)
  assert.ok(Number.isFinite(measurements.schemaApplyWorkerWallMs) && measurements.schemaApplyWorkerWallMs >= 0)
  assert.ok(measurements.schemaApplyWorkerWallMs <= contract.acceptanceThresholds.schemaApplyWorkerWallMsPerProviderMax)
  assert.ok(measurements.secondPassStatementCount <= contract.acceptanceThresholds.secondPassStatementCountMax)

  assert.equal(item.lifecycle.deployExitCode, 0, `${provider} deploy`)
  assert.equal(item.lifecycle.secretExitCode, 0, `${provider} secret`)
  assert.equal(item.lifecycle.preCurlExitCode, 0, `${provider} pre curl`)
  assert.equal(item.lifecycle.preHttpStatus, 200, `${provider} pre HTTP`)
  assert.equal(item.lifecycle.firstCurlExitCode, 0, `${provider} first curl`)
  assert.equal(item.lifecycle.firstHttpStatus, 200, `${provider} first HTTP`)
  assert.equal(item.lifecycle.secondCurlExitCode, 0, `${provider} second curl`)
  assert.equal(item.lifecycle.secondHttpStatus, 200, `${provider} second HTTP`)
  assert.equal(item.lifecycle.pollSucceeded, true, `${provider} poll`)
  assert.equal(item.lifecycle.deleteExitCode, 0, `${provider} delete`)
  assert.equal(item.lifecycle.deleteCurlExitCode, 0, `${provider} delete check`)
  assert.equal(item.lifecycle.deleteHttpStatus, contract.acceptanceThresholds.postDeleteHttpStatus, `${provider} post-delete HTTP`)
}
