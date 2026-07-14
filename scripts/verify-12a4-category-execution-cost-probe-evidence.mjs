import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROVIDERS = ['twitch', 'kick']

export function verifyEvidence(evidence, contract, { requirePass = false } = {}) {
  assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-evidence-v1')
  assert.equal(evidence.workstream, contract.workstream)
  assert.ok(['observed_pass', 'observed_fail'].includes(evidence.status))
  assert.deepEqual(evidence.providerOrder, PROVIDERS)
  assert.equal(evidence.gate.providerOrderPass, true)
  assert.equal(evidence.gate.runtimeCaptureEnablementAuthorized, false)
  assert.equal(evidence.boundaries.remoteSchemaApply, false)
  assert.equal(evidence.boundaries.categoryCaptureEnablement, false)
  assert.equal(evidence.boundaries.persistentProductionCategoryRows, false)
  assert.equal(evidence.boundaries.newCron, false)
  assert.equal(evidence.boundaries.backfill, false)
  assert.equal(evidence.boundaries.rawRetentionChange, false)
  assert.equal(evidence.boundaries.crossProviderCategoryIdentity, false)
  assert.equal(evidence.boundaries.combinedProviderCategoryRanking, false)
  assert.ok(Array.isArray(evidence.parseErrors))

  for (const provider of PROVIDERS) {
    const item = evidence.providers[provider]
    assert.equal(item.provider, provider)
    assert.equal(typeof item.attempted, 'boolean')
    assert.equal(typeof item.workerOk, 'boolean')
    assert.equal(typeof item.providerGatePass, 'boolean')
    assert.equal(typeof item.measurements.categoryGeneratorQueries, 'number')
    assert.equal(typeof item.measurements.dictionaryFirstPassChanges, 'number')
    assert.equal(typeof item.measurements.dictionarySecondPassChanges, 'number')
    assert.equal(typeof item.measurements.probeRowsAfterWrite, 'number')
    assert.equal(typeof item.measurements.probeCleanupRemainingRows, 'number')
    assert.equal(typeof item.measurements.providerLeakageRows, 'number')
    assert.equal(typeof item.measurements.databaseSizeIncreaseBytes, 'number')
    assert.equal(typeof item.measurements.workerWallMs, 'number')
    assert.equal(typeof item.measurements.collectorLatencyDeltaMs, 'number')
    assert.equal(typeof item.lifecycle.deleteHttpStatus, 'number')
    assert.equal(typeof item.checks.categoryCaptureStillDisabled, 'boolean')

    if (item.providerGatePass) {
      assert.equal(item.workerOk, true)
      assert.ok(item.measurements.categoryGeneratorQueries <= contract.acceptanceThresholds.categoryGeneratorQueriesMax)
      assert.equal(item.measurements.dictionaryFirstPassChanges, contract.acceptanceThresholds.dictionaryFirstPassChanges)
      assert.ok(item.measurements.dictionarySecondPassChanges <= contract.acceptanceThresholds.dictionarySecondPassChangesMax)
      assert.equal(item.measurements.probeRowsAfterWrite, contract.acceptanceThresholds.probeRowsAfterWrite)
      assert.ok(item.measurements.probeCleanupRemainingRows <= contract.acceptanceThresholds.probeCleanupRemainingRowsMax)
      assert.ok(item.measurements.providerLeakageRows <= contract.acceptanceThresholds.providerLeakageRowsMax)
      assert.ok(item.measurements.databaseSizeIncreaseBytes <= contract.acceptanceThresholds.databaseSizeIncreaseMbPerProviderMax * 1024 * 1024)
      assert.ok(item.measurements.workerWallMs <= contract.acceptanceThresholds.probeWorkerWallMsPerProviderMax)
      assert.ok(item.measurements.collectorLatencyDeltaMs <= contract.acceptanceThresholds.collectorLatencyDeltaMsPerProviderMax)
      assert.equal(Object.values(item.checks).every(Boolean), true)
      assert.equal(item.lifecycle.preexistingHttpStatus, 404)
      assert.equal(item.lifecycle.deployExitCode, 0)
      assert.equal(item.lifecycle.secretExitCode, 0)
      assert.equal(item.lifecycle.inspectHttpStatus, 200)
      assert.equal(item.lifecycle.probeHttpStatus, 200)
      assert.equal(item.lifecycle.deleteExitCode, 0)
      assert.equal(item.lifecycle.deleteHttpStatus, 404)
      assert.equal(item.errors.operation, null)
      assert.equal(item.errors.cleanup, null)
    }
  }

  const derivedPass = PROVIDERS.every((provider) => evidence.providers[provider].providerGatePass)
  const derivedCaptureDisabled = PROVIDERS.every((provider) => evidence.providers[provider].checks.categoryCaptureStillDisabled)
  assert.equal(evidence.gate.executionCostProbePass, derivedPass)
  assert.equal(evidence.gate.twitchGatePass, evidence.providers.twitch.providerGatePass)
  assert.equal(evidence.gate.kickGatePass, evidence.providers.kick.providerGatePass)
  assert.equal(evidence.gate.allReservedRowsRemoved, PROVIDERS.every((provider) => evidence.providers[provider].measurements.probeCleanupRemainingRows === 0))
  assert.equal(evidence.gate.providerLeakageRowsZero, PROVIDERS.every((provider) => evidence.providers[provider].measurements.providerLeakageRows === 0))
  assert.equal(evidence.gate.temporaryWorkersDeleted, PROVIDERS.every((provider) => evidence.providers[provider].lifecycle.deleteHttpStatus === 404))
  assert.equal(evidence.gate.categoryCaptureRemainedDisabled, derivedCaptureDisabled)

  if (requirePass) {
    assert.equal(evidence.status, 'observed_pass')
    assert.equal(evidence.gate.executionCostProbePass, true)
    assert.equal(evidence.gate.categoryCaptureRemainedDisabled, true)
    assert.equal(evidence.parseErrors.length, 0)
  }

  return {
    ok: true,
    status: evidence.status,
    requirePass,
    providerGatePass: Object.fromEntries(PROVIDERS.map((provider) => [provider, evidence.providers[provider].providerGatePass])),
  }
}

function main() {
  const [evidencePath, ...args] = process.argv.slice(2)
  if (!evidencePath) {
    console.error('usage: node verify-12a4-category-execution-cost-probe-evidence.mjs <evidence.json> [--require-pass] [contract.json]')
    process.exit(2)
  }
  const requirePass = args.includes('--require-pass')
  const contractArg = args.find((value) => value !== '--require-pass')
  const contractPath = contractArg ?? 'docs/audits/12a4-category-execution-cost-probe-package-contract.json'
  const evidence = JSON.parse(fs.readFileSync(path.resolve(evidencePath), 'utf8'))
  const contract = JSON.parse(fs.readFileSync(path.resolve(contractPath), 'utf8'))
  console.log(JSON.stringify(verifyEvidence(evidence, contract, { requirePass }), null, 2))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
