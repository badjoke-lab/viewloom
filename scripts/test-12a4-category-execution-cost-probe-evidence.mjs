import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { collectEvidence } from './collect-12a4-category-execution-cost-probe-evidence.mjs'
import { verifyEvidence } from './verify-12a4-category-execution-cost-probe-evidence.mjs'

const contract = JSON.parse(fs.readFileSync(path.resolve('docs/audits/12a4-category-execution-cost-probe-package-contract.json'), 'utf8'))
const MISSING = Number.MAX_SAFE_INTEGER

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
    healthAttempts: 1,
    healthHttpStatus: 200,
    inspectAttempts: 1,
    inspectHttpStatus: 200,
    probeHttpStatus: 200,
    pollAttempts: 1,
    naturalSnapshotObserved: true,
    deleteApiHttpStatus: 200,
    deleteExitCode: 0,
    deleteHttpStatus: 404,
    ...overrides,
  }
}

function providerRaw(provider, overrides = {}) {
  return {
    attempted: overrides.attempted ?? true,
    worker: overrides.worker === null ? null : worker(provider, overrides.worker),
    lifecycle: lifecycle(overrides.lifecycle),
    collectorLatencyDeltaMs: overrides.collectorLatencyDeltaMs ?? 250,
    errors: {
      runner: overrides.runnerError ?? null,
      delete: overrides.deleteError ?? null,
    },
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
      twitch: providerRaw('twitch', providerOverrides.twitch),
      kick: providerRaw('kick', providerOverrides.kick),
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
    lifecycle: { probeHttpStatus: 409, naturalSnapshotObserved: false, deleteHttpStatus: 404 },
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
assert.equal(missingProvider.providers.kick.attempted, false)
assert.equal(missingProvider.providers.kick.parseError, 'provider_result_missing')
assert.equal(missingProvider.parseErrors.length, 1)
assert.equal(missingProvider.providers.kick.measurements.collectorLatencyDeltaMs, MISSING)
assert.equal(verifyEvidence(missingProvider, contract).ok, true)

const attemptOneFailure = collectEvidence(raw({
  twitch: {
    worker: null,
    collectorLatencyDeltaMs: null,
    lifecycle: {
      healthAttempts: 1,
      healthHttpStatus: 200,
      inspectAttempts: 1,
      inspectHttpStatus: 500,
      probeHttpStatus: 0,
      pollAttempts: 0,
      naturalSnapshotObserved: false,
      deleteApiHttpStatus: 200,
      deleteExitCode: 0,
      deleteHttpStatus: 404,
    },
    runnerError: 'pre_inspect_failed_http_500',
  },
  kick: {
    attempted: false,
    worker: null,
    collectorLatencyDeltaMs: null,
    lifecycle: {
      preexistingHttpStatus: 0,
      deployExitCode: null,
      secretExitCode: null,
      healthAttempts: 0,
      healthHttpStatus: 0,
      inspectAttempts: 0,
      inspectHttpStatus: 0,
      probeHttpStatus: 0,
      pollAttempts: 0,
      naturalSnapshotObserved: false,
      deleteApiHttpStatus: 0,
      deleteExitCode: null,
      deleteHttpStatus: 0,
    },
    runnerError: 'skipped_after_twitch_gate_failure',
  },
}), contract)
assert.equal(attemptOneFailure.status, 'observed_fail')
assert.equal(attemptOneFailure.providers.twitch.attempted, true)
assert.equal(attemptOneFailure.providers.twitch.lifecycle.probeEndpointCalled, false)
assert.equal(attemptOneFailure.providers.twitch.measurements.collectorLatencyDeltaMs, MISSING)
assert.equal(attemptOneFailure.providers.kick.attempted, false)
assert.equal(attemptOneFailure.providers.kick.lifecycle.temporaryWorkerDeployed, false)
assert.equal(attemptOneFailure.providers.kick.measurements.workerWallMs, MISSING)
assert.equal(attemptOneFailure.gate.allReservedRowsRemoved, true)
assert.equal(attemptOneFailure.gate.providerLeakageRowsZero, true)
assert.equal(attemptOneFailure.gate.temporaryWorkersDeleted, true)
assert.equal(attemptOneFailure.gate.categoryCaptureRemainedDisabled, true)
assert.equal(verifyEvidence(attemptOneFailure, contract).ok, true)

console.log(JSON.stringify({
  ok: true,
  fixtures: {
    success: success.status,
    cleanupFailure: cleanupFailure.status,
    latencyFailure: latencyFailure.status,
    missingProvider: missingProvider.status,
    attemptOneFailure: attemptOneFailure.status,
  },
}, null, 2))
