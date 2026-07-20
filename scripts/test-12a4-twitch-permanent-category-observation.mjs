import assert from 'node:assert/strict'
import { evaluateObservation } from './evaluate-12a4-twitch-permanent-category-observation.mjs'

const contract = {
  startAt: '2026-07-20T11:40:00.000Z',
  minimumEndAt: '2026-07-21T11:40:00.000Z',
  warningEndAt: '2026-07-22T11:40:00.000Z',
  collectorCron: '*/5 * * * *',
  healthyGates: {
    providerLeakageRowsMax: 0,
    warningCategoryCoverageRatio: 0.98,
    warningCollectorErrorRunsMax: 0,
    hardStopCollectorErrorRunsMin: 3,
  },
}

const healthyEvidence = {
  outcome: 'accepted',
  storage: { providerPass: true, accountPass: true },
  bindings: { permanentCaptureEnabled: true, obsoleteCanaryBindingsPresent: false },
  data: {
    categoryPayloadRowsSinceStart: 288,
    collectorErrorRunsSinceStart: 0,
    providerLeakageRows: 0,
    minutesSinceLatestSnapshot: 1,
    latestSnapshot: { source_mode: 'real', stream_count: 300 },
  },
  gates: {
    storagePass: true,
    latestSnapshotFreshnessPass: true,
    latestSnapshotRealPass: true,
    latestSnapshotNonemptyPass: true,
  },
}

const eligible = evaluateObservation({ evidence: healthyEvidence, contract, now: new Date('2026-07-21T11:40:10.000Z') })
assert.equal(eligible.classification, 'eligible_for_acceptance')
assert.equal(eligible.rollbackRequired, false)
assert.ok(eligible.categoryCoverageRatio >= 0.99)

const warning = evaluateObservation({
  evidence: { ...healthyEvidence, data: { ...healthyEvidence.data, categoryPayloadRowsSinceStart: 280, collectorErrorRunsSinceStart: 1 } },
  contract,
  now: new Date('2026-07-21T11:40:10.000Z'),
})
assert.equal(warning.classification, 'warning')
assert.equal(warning.rollbackRequired, false)
assert.equal(warning.warnings.length, 2)

const leakage = evaluateObservation({
  evidence: { ...healthyEvidence, data: { ...healthyEvidence.data, providerLeakageRows: 1 } },
  contract,
  now: new Date('2026-07-20T12:40:00.000Z'),
})
assert.equal(leakage.classification, 'hard_stop')
assert.equal(leakage.rollbackRequired, true)

const disabled = evaluateObservation({
  evidence: { ...healthyEvidence, bindings: { permanentCaptureEnabled: false, obsoleteCanaryBindingsPresent: false } },
  contract,
  now: new Date('2026-07-20T12:40:00.000Z'),
})
assert.equal(disabled.classification, 'hard_stop')

const repeatedErrors = evaluateObservation({
  evidence: { ...healthyEvidence, data: { ...healthyEvidence.data, collectorErrorRunsSinceStart: 3 } },
  contract,
  now: new Date('2026-07-20T12:40:00.000Z'),
})
assert.equal(repeatedErrors.classification, 'hard_stop')

console.log(JSON.stringify({
  ok: true,
  eligibleForAcceptance: eligible.classification,
  warningClassification: warning.classification,
  leakageHardStop: leakage.rollbackRequired,
  disabledHardStop: disabled.rollbackRequired,
  repeatedErrorsHardStop: repeatedErrors.rollbackRequired,
}, null, 2))
