import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const [rawPath, expectedProvider, ...args] = process.argv.slice(2)
if (!rawPath || !expectedProvider) {
  console.error('usage: node verify-12a4-category-execution-cost-probe-provider-result.mjs <raw.json> <twitch|kick> [--require-pass]')
  process.exit(2)
}

const requirePass = args.includes('--require-pass')
const raw = JSON.parse(fs.readFileSync(path.resolve(rawPath), 'utf8'))
const contract = JSON.parse(fs.readFileSync(path.resolve('docs/audits/12a4-category-execution-cost-probe-package-contract.json'), 'utf8'))
const thresholds = contract.acceptanceThresholds
const worker = raw?.worker && typeof raw.worker === 'object' ? raw.worker : {}
const measurements = worker?.measurements && typeof worker.measurements === 'object' ? worker.measurements : {}
const checks = worker?.checks && typeof worker.checks === 'object' ? worker.checks : {}
const lifecycle = raw?.lifecycle && typeof raw.lifecycle === 'object' ? raw.lifecycle : {}

assert.ok(['twitch', 'kick'].includes(expectedProvider))
assert.equal(raw.provider, expectedProvider)
assert.equal(typeof raw.attempted, 'boolean')

const databaseSizeIncreaseBytes = Math.max(0, finite(measurements.databaseSizeDeltaBytes, Number.POSITIVE_INFINITY))
const collectorLatencyDeltaMs = Math.abs(finite(raw.collectorLatencyDeltaMs, Number.POSITIVE_INFINITY))
const providerGatePass = raw.attempted === true
  && worker.ok === true
  && raw.preInspect?.ok === true
  && raw.preInspect?.schema?.categorySchemaComplete === true
  && raw.preInspect?.reserved?.totalRows === 0
  && raw.preInspect?.providerLeakageRows === 0
  && worker.provider === expectedProvider
  && integer(measurements.categoryGeneratorQueries, Number.MAX_SAFE_INTEGER) <= thresholds.categoryGeneratorQueriesMax
  && integer(measurements.dictionaryFirstPassChanges, Number.MAX_SAFE_INTEGER) === thresholds.dictionaryFirstPassChanges
  && integer(measurements.dictionarySecondPassChanges, Number.MAX_SAFE_INTEGER) <= thresholds.dictionarySecondPassChangesMax
  && integer(measurements.probeRowsAfterWrite, Number.MAX_SAFE_INTEGER) === thresholds.probeRowsAfterWrite
  && integer(measurements.probeCleanupRemainingRows, Number.MAX_SAFE_INTEGER) <= thresholds.probeCleanupRemainingRowsMax
  && integer(measurements.providerLeakageRows, Number.MAX_SAFE_INTEGER) <= thresholds.providerLeakageRowsMax
  && databaseSizeIncreaseBytes <= thresholds.databaseSizeIncreaseMbPerProviderMax * 1024 * 1024
  && finite(measurements.workerWallMs, Number.POSITIVE_INFINITY) <= thresholds.probeWorkerWallMsPerProviderMax
  && collectorLatencyDeltaMs <= thresholds.collectorLatencyDeltaMsPerProviderMax
  && Object.values(checks).length > 0
  && Object.values(checks).every((value) => value === true)
  && lifecycle.preexistingHttpStatus === 404
  && lifecycle.deployExitCode === 0
  && lifecycle.secretExitCode === 0
  && integer(lifecycle.healthAttempts) >= 1
  && lifecycle.healthHttpStatus === 200
  && integer(lifecycle.inspectAttempts) >= 1
  && lifecycle.inspectHttpStatus === 200
  && lifecycle.probeHttpStatus === 200
  && lifecycle.naturalSnapshotObserved === true
  && lifecycle.deleteExitCode === 0
  && lifecycle.deleteHttpStatus === 404
  && raw.errors?.runner === null
  && raw.errors?.delete === null

if (requirePass) assert.equal(providerGatePass, true)

console.log(JSON.stringify({
  ok: true,
  provider: expectedProvider,
  requirePass,
  providerGatePass,
  healthAttempts: integer(lifecycle.healthAttempts),
  inspectAttempts: integer(lifecycle.inspectAttempts),
  categoryGeneratorQueries: integer(measurements.categoryGeneratorQueries, Number.MAX_SAFE_INTEGER),
  dictionaryFirstPassChanges: integer(measurements.dictionaryFirstPassChanges, Number.MAX_SAFE_INTEGER),
  dictionarySecondPassChanges: integer(measurements.dictionarySecondPassChanges, Number.MAX_SAFE_INTEGER),
  cleanupRemainingRows: integer(measurements.probeCleanupRemainingRows, Number.MAX_SAFE_INTEGER),
  providerLeakageRows: integer(measurements.providerLeakageRows, Number.MAX_SAFE_INTEGER),
  databaseSizeIncreaseBytes,
  collectorLatencyDeltaMs,
  deleteApiHttpStatus: lifecycle.deleteApiHttpStatus ?? 0,
  deleteHttpStatus: lifecycle.deleteHttpStatus ?? 0,
}, null, 2))

function finite(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function integer(value, fallback = 0) {
  return Math.max(0, Math.floor(finite(value, fallback)))
}
