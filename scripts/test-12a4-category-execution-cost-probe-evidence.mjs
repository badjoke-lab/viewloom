import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { collectEvidence } from './collect-12a4-category-execution-cost-probe-evidence.mjs'
import { verifyEvidence } from './verify-12a4-category-execution-cost-probe-evidence.mjs'

const contract = JSON.parse(fs.readFileSync(path.resolve('docs/audits/12a4-category-execution-cost-probe-package-contract.json'), 'utf8'))

function worker(provider, overrides = {}) {
  const checks = {
    preconditionsPassed: true,
    dictionaryFirstPassChangedOnce: true,
    dictionarySecondPassNoOp: true,
    probeRowsCreated: true,
    generatorQueryCountWithinLimit: true,
    cleanupSucceeded: true,
    cleanupRemainingRowsZero: true,
    providerLeakageZero: true,
    collectorStatePreserved: true,
    categoryCaptureStillDisabled: true,
    ...(overrides.checks ?? {}),
  }
  return {
    ok: overrides.ok ?? true,
    provider,
    runId: 'fixture-run-0001',
    stage: overrides.stage ?? 'complete',
    measurements: {
      categoryGeneratorQueries: 4,
      dictionaryFirstPassChanges: 1,
      dictionarySecondPassChanges: 0,
      probeRowsAfterWrite: 3,
      probeCleanupRemainingRows: 0,
      providerLeakageRows: 0,
      databaseSizeBefore: 300000000,
      databaseSizeAfter: 300008192,
      databaseSizeDeltaBytes: 8192,
      operation: {
        statements: 13,
        rowsRead: 12,
        rowsWritten: 6,
        changes: 6,
        durationMs: 31.5,
      },
      workerWallMs: 950,
      ...(overrides.measurements ?? {}),
    },
    checks,
    errors: {
      operation: overrides.operationError ?? null,
      cleanup: overrides.cleanupError ?? null,
    },
  }
}

function lifecycle(overrides = {}) {
  return {
    preexistingHttpStatus: 404,
    deployExitCode: 0,
    secretExitCode: 0,
    inspectHttpStatus: 200,
    probeHttpStatus: 200,
    deleteExitCode: 0,
    deleteHttpStatus: 404,
    ...overrides,
  }
}

function raw(providerOverrides = {}) {
  return {
    observedAt: '2026-07-14T00:00:00Z',
    headSha: '0123456789abcdef0123456789abcdef01234567',
    workflowRunId: 123456,
    event: 'push',
    providerOrder: ['twitch', 'kick'],
    providers: {
      twitch: {
        worker: worker('twitch', providerOverrides.twitch?.worker),
        lifecycle: lifecycle(providerOverrides.twitch?.lifecycle),
        collectorLatencyDeltaMs: providerOverrides.twitch?.collectorLatencyDeltaMs ?? 250,
      },
      kick: {
        worker: worker('kick', providerOverrides.kick?.worker),
        lifecycle: lifecycle(providerOverrides.kick?.lifecycle),
        collectorLatencyDeltaMs: providerOverrides.kick?.collectorLatencyDeltaMs ?? 300,
      },
    },
  }
}

const success = collectEvidence(raw(), contract)
assert.equal(success.status, 'observed_pass')
assert.equal(success.gate.executionCostProbePass, true)
assert.equal(success.providers.twitch.providerGatePass, true)
assert.equal(success.providers.kick.providerGatePass, true)
assert.equal(verifyEvidence(success, contract, { requirePass: true }).ok, true)

const cleanupFailure = collectEvidence(raw({
  kick: {
    worker: {
      ok: false,
      stage: 'cleanup',
      measurements: { probeCleanupRemainingRows: 1 },
      checks: { cleanupRemainingRowsZero: false },
      cleanupError: 'cleanup_failed',
    },
    lifecycle: { probeHttpStatus: 409, deleteHttpStatus: 404 },
  },
}), contract)
assert.equal(cleanupFailure.status, 'observed_fail')
assert.equal(cleanupFailure.providers.twitch.providerGatePass, true)
assert.equal(cleanupFailure.providers.kick.providerGatePass, false)
assert.equal(cleanupFailure.gate.allReservedRowsRemoved, false)
assert.equal(verifyEvidence(cleanupFailure, contract).ok, true)
assert.throws(() => verifyEvidence(cleanupFailure, contract, { requirePass: true }))

const latencyFailure = collectEvidence(raw({
  twitch: { collectorLatencyDeltaMs: 2501 },
}), contract)
assert.equal(latencyFailure.status, 'observed_fail')
assert.equal(latencyFailure.providers.twitch.providerGatePass, false)
assert.equal(latencyFailure.providers.kick.providerGatePass, true)
assert.equal(verifyEvidence(latencyFailure, contract).ok, true)

const missingProvider = collectEvidence({
  ...raw(),
  providers: { twitch: raw().providers.twitch },
}, contract)
assert.equal(missingProvider.status, 'observed_fail')
assert.equal(missingProvider.providers.kick.parseError, 'provider_result_missing')
assert.equal(missingProvider.parseErrors.length, 1)
assert.equal(verifyEvidence(missingProvider, contract).ok, true)

console.log(JSON.stringify({
  ok: true,
  fixtures: {
    success: success.status,
    cleanupFailure: cleanupFailure.status,
    latencyFailure: latencyFailure.status,
    missingProvider: missingProvider.status,
  },
}, null, 2))
