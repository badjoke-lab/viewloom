import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PROVIDERS = ['twitch', 'kick']
const FIVE_MIB = 5 * 1024 * 1024

const number = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const integer = (value, fallback = 0) => Math.max(0, Math.floor(number(value, fallback)))
const text = (value, fallback = '') => typeof value === 'string' ? value.slice(0, 240) : fallback
const boolean = (value) => value === true

export function collectEvidence(raw, contract) {
  const thresholds = contract.acceptanceThresholds
  const providers = Object.fromEntries(PROVIDERS.map((provider) => [
    provider,
    normalizeProvider(provider, raw?.providers?.[provider], thresholds),
  ]))
  const providerOrder = Array.isArray(raw?.providerOrder) ? raw.providerOrder.filter((value) => PROVIDERS.includes(value)) : []
  const providerOrderPass = JSON.stringify(providerOrder) === JSON.stringify(PROVIDERS)
  const executionCostProbePass = providerOrderPass && PROVIDERS.every((provider) => providers[provider].providerGatePass)

  return {
    schemaVersion: 'viewloom-12a4-category-execution-cost-probe-evidence-v1',
    workstream: contract.workstream,
    status: executionCostProbePass ? 'observed_pass' : 'observed_fail',
    observedAt: text(raw?.observedAt, new Date().toISOString()),
    source: {
      headSha: text(raw?.headSha),
      workflowRunId: integer(raw?.workflowRunId),
      event: text(raw?.event),
      artifactName: 'phase12a4-category-execution-cost-probe',
    },
    providerOrder,
    providers,
    gate: {
      providerOrderPass,
      twitchGatePass: providers.twitch.providerGatePass,
      kickGatePass: providers.kick.providerGatePass,
      allReservedRowsRemoved: PROVIDERS.every((provider) => providers[provider].measurements.probeCleanupRemainingRows === 0),
      providerLeakageRowsZero: PROVIDERS.every((provider) => providers[provider].measurements.providerLeakageRows === 0),
      temporaryWorkersDeleted: PROVIDERS.every((provider) => providers[provider].lifecycle.deleteHttpStatus === 404),
      categoryCaptureRemainedDisabled: PROVIDERS.every((provider) => providers[provider].checks.categoryCaptureStillDisabled),
      executionCostProbePass,
      runtimeCaptureEnablementAuthorized: false,
    },
    boundaries: {
      remoteSchemaApply: false,
      categoryCaptureEnablement: false,
      persistentProductionCategoryRows: false,
      newCron: false,
      backfill: false,
      rawRetentionChange: false,
      categoryAnalyticsUi: false,
      crossProviderCategoryIdentity: false,
      combinedProviderCategoryRanking: false,
    },
    parseErrors: PROVIDERS.flatMap((provider) => providers[provider].parseError ? [`${provider}:${providers[provider].parseError}`] : []),
  }
}

function normalizeProvider(provider, rawProvider, thresholds) {
  const worker = rawProvider?.worker && typeof rawProvider.worker === 'object' ? rawProvider.worker : {}
  const measurements = worker.measurements && typeof worker.measurements === 'object' ? worker.measurements : {}
  const checks = worker.checks && typeof worker.checks === 'object' ? worker.checks : {}
  const lifecycle = rawProvider?.lifecycle && typeof rawProvider.lifecycle === 'object' ? rawProvider.lifecycle : {}
  const collectorLatencyDeltaMs = Math.abs(number(rawProvider?.collectorLatencyDeltaMs, Number.POSITIVE_INFINITY))
  const databaseSizeDeltaBytes = number(measurements.databaseSizeDeltaBytes, Number.POSITIVE_INFINITY)
  const normalizedMeasurements = {
    categoryGeneratorQueries: integer(measurements.categoryGeneratorQueries, Number.MAX_SAFE_INTEGER),
    dictionaryFirstPassChanges: integer(measurements.dictionaryFirstPassChanges, Number.MAX_SAFE_INTEGER),
    dictionarySecondPassChanges: integer(measurements.dictionarySecondPassChanges, Number.MAX_SAFE_INTEGER),
    probeRowsAfterWrite: integer(measurements.probeRowsAfterWrite, Number.MAX_SAFE_INTEGER),
    probeCleanupRemainingRows: integer(measurements.probeCleanupRemainingRows, Number.MAX_SAFE_INTEGER),
    providerLeakageRows: integer(measurements.providerLeakageRows, Number.MAX_SAFE_INTEGER),
    databaseSizeBefore: number(measurements.databaseSizeBefore, null),
    databaseSizeAfter: number(measurements.databaseSizeAfter, null),
    databaseSizeDeltaBytes,
    databaseSizeIncreaseBytes: Math.max(0, databaseSizeDeltaBytes),
    d1Statements: integer(measurements.operation?.statements),
    d1RowsRead: integer(measurements.operation?.rowsRead),
    d1RowsWritten: integer(measurements.operation?.rowsWritten),
    d1Changes: integer(measurements.operation?.changes),
    d1SqlDurationMs: number(measurements.operation?.durationMs),
    workerWallMs: number(measurements.workerWallMs, Number.POSITIVE_INFINITY),
    collectorLatencyDeltaMs,
  }
  const normalizedChecks = {
    preconditionsPassed: boolean(checks.preconditionsPassed),
    dictionaryFirstPassChangedOnce: boolean(checks.dictionaryFirstPassChangedOnce),
    dictionarySecondPassNoOp: boolean(checks.dictionarySecondPassNoOp),
    probeRowsCreated: boolean(checks.probeRowsCreated),
    generatorQueryCountWithinLimit: boolean(checks.generatorQueryCountWithinLimit),
    cleanupSucceeded: boolean(checks.cleanupSucceeded),
    cleanupRemainingRowsZero: boolean(checks.cleanupRemainingRowsZero),
    providerLeakageZero: boolean(checks.providerLeakageZero),
    collectorStatePreserved: boolean(checks.collectorStatePreserved),
    categoryCaptureStillDisabled: boolean(checks.categoryCaptureStillDisabled),
  }
  const normalizedLifecycle = {
    preexistingHttpStatus: integer(lifecycle.preexistingHttpStatus),
    deployExitCode: integer(lifecycle.deployExitCode, Number.MAX_SAFE_INTEGER),
    secretExitCode: integer(lifecycle.secretExitCode, Number.MAX_SAFE_INTEGER),
    inspectHttpStatus: integer(lifecycle.inspectHttpStatus),
    probeHttpStatus: integer(lifecycle.probeHttpStatus),
    deleteExitCode: integer(lifecycle.deleteExitCode, Number.MAX_SAFE_INTEGER),
    deleteHttpStatus: integer(lifecycle.deleteHttpStatus),
  }
  const providerGatePass = boolean(worker.ok)
    && normalizedMeasurements.categoryGeneratorQueries <= thresholds.categoryGeneratorQueriesMax
    && normalizedMeasurements.dictionaryFirstPassChanges === thresholds.dictionaryFirstPassChanges
    && normalizedMeasurements.dictionarySecondPassChanges <= thresholds.dictionarySecondPassChangesMax
    && normalizedMeasurements.probeRowsAfterWrite === thresholds.probeRowsAfterWrite
    && normalizedMeasurements.probeCleanupRemainingRows <= thresholds.probeCleanupRemainingRowsMax
    && normalizedMeasurements.providerLeakageRows <= thresholds.providerLeakageRowsMax
    && normalizedMeasurements.databaseSizeIncreaseBytes <= thresholds.databaseSizeIncreaseMbPerProviderMax * 1024 * 1024
    && normalizedMeasurements.databaseSizeIncreaseBytes <= FIVE_MIB
    && normalizedMeasurements.workerWallMs <= thresholds.probeWorkerWallMsPerProviderMax
    && normalizedMeasurements.collectorLatencyDeltaMs <= thresholds.collectorLatencyDeltaMsPerProviderMax
    && Object.values(normalizedChecks).every(Boolean)
    && normalizedLifecycle.preexistingHttpStatus === 404
    && normalizedLifecycle.deployExitCode === 0
    && normalizedLifecycle.secretExitCode === 0
    && normalizedLifecycle.inspectHttpStatus === 200
    && normalizedLifecycle.probeHttpStatus === 200
    && normalizedLifecycle.deleteExitCode === 0
    && normalizedLifecycle.deleteHttpStatus === 404

  return {
    provider,
    attempted: Boolean(rawProvider),
    workerOk: boolean(worker.ok),
    runId: text(worker.runId),
    stage: text(worker.stage),
    measurements: normalizedMeasurements,
    checks: normalizedChecks,
    lifecycle: normalizedLifecycle,
    errors: {
      operation: text(worker.errors?.operation, '') || null,
      cleanup: text(worker.errors?.cleanup, '') || null,
    },
    providerGatePass,
    parseError: rawProvider ? null : 'provider_result_missing',
  }
}

function main() {
  const [rawPath, outputPath, contractPath = 'docs/audits/12a4-category-execution-cost-probe-package-contract.json'] = process.argv.slice(2)
  if (!rawPath || !outputPath) {
    console.error('usage: node collect-12a4-category-execution-cost-probe-evidence.mjs <raw.json> <output.json> [contract.json]')
    process.exit(2)
  }
  const raw = JSON.parse(fs.readFileSync(path.resolve(rawPath), 'utf8'))
  const contract = JSON.parse(fs.readFileSync(path.resolve(contractPath), 'utf8'))
  const evidence = collectEvidence(raw, contract)
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true })
  fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ ok: true, outputPath, status: evidence.status }, null, 2))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
