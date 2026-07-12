#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const inputDir = resolve(process.argv[2] || 'artifacts/12a3-execution-cost/raw')
const outputPath = resolve(process.argv[3] || 'artifacts/12a3-execution-cost/evidence.json')
const contract = JSON.parse(readFileSync('docs/audits/12a3-execution-cost-probe-contract.json', 'utf8'))
const lifecycle = readJson(`${inputDir}/lifecycle.json`, {})

const providers = {}
let blocked = false

for (const provider of ['twitch', 'kick']) {
  const providerLifecycle = sanitizeLifecycle(lifecycle[provider])
  const rawPath = `${inputDir}/${provider}.json`
  const loaded = loadProbeResponse(rawPath, provider)

  if (!loaded.ok) {
    blocked = true
    providers[provider] = {
      status: 'blocked',
      diagnostic: loaded.diagnostic,
      lifecycle: providerLifecycle,
      providerGatePass: false,
    }
    continue
  }

  const raw = loaded.value
  const acceptance = contract.acceptance
  const checks = {
    lifecyclePass: Object.values(providerLifecycle).every((value) => value === 0),
    sourceSupportPass: number(raw.source?.sourceSnapshots) >= acceptance.minimumSourceSnapshots,
    writeSamplePass: number(raw.writeProbe?.sampledRows) >= acceptance.minimumProbeWriteRows,
    aggregateD1DurationPass: number(raw.query?.aggregate?.durationMs) <= acceptance.maximumAggregateD1DurationMs,
    aggregateWallPass: number(raw.query?.aggregateWallMs) <= acceptance.maximumAggregateWallMs,
    totalWorkerWallPass: number(raw.totalWorkerWallMs) <= acceptance.maximumTotalWorkerWallMs,
    projectedWriteD1DurationPass:
      number(raw.projections?.projectedFirstPassDurationMs) <= acceptance.maximumProjectedFullCapWriteD1DurationMs,
    projectedWriteWallPass:
      number(raw.projections?.projectedFirstPassWallMs) <= acceptance.maximumProjectedFullCapWriteWallMs,
    idempotentRowCountPass: raw.writeProbe?.idempotentRowCount === acceptance.idempotentRowCountRequired,
    cleanupPass:
      number(raw.writeProbe?.cleanup?.remainingRows) === contract.writeProbe.retainedProbeRowsRequired
      && number(raw.boundaries?.probeRowsRetained) === contract.writeProbe.retainedProbeRowsRequired,
    noProductionGenerationPass: raw.boundaries?.productionGenerationStarted === false,
    noSourceMutationPass: raw.boundaries?.sourceRowsModified === false,
    providerSeparationPass: raw.boundaries?.crossProviderOperation === false,
  }

  const providerGatePass = Object.values(checks).every(Boolean)
  if (!providerGatePass) blocked = true

  providers[provider] = {
    status: 'observed',
    observedAt: raw.observedAt,
    lifecycle: providerLifecycle,
    source: {
      day: raw.source.day,
      sourceSnapshots: number(raw.source.sourceSnapshots),
      bucketMinutes: number(raw.source.bucketMinutes),
      streamerCap: number(raw.source.streamerCap),
      candidateStreamers: number(raw.source.candidateStreamers),
      retainedCandidateRows: number(raw.source.retainedCandidateRows),
    },
    query: {
      dayResolution: sanitizeMeta(raw.query.dayResolution),
      aggregate: sanitizeMeta(raw.query.aggregate),
      aggregateWallMs: number(raw.query.aggregateWallMs),
      resultRows: number(raw.query.resultRows),
      serializedResultBytes: number(raw.query.serializedResultBytes),
    },
    writeProbe: {
      requestedRows: number(raw.writeProbe.requestedRows),
      sampledRows: number(raw.writeProbe.sampledRows),
      expectedRetainedRows: number(raw.writeProbe.expectedRetainedRows),
      firstPass: sanitizePass(raw.writeProbe.firstPass),
      secondPass: sanitizePass(raw.writeProbe.secondPass),
      idempotentRowCount: raw.writeProbe.idempotentRowCount === true,
      cleanup: sanitizePass(raw.writeProbe.cleanup),
    },
    projections: {
      fullCapRows: number(raw.projections.fullCapRows),
      projectedFirstPassRowsRead: nullableNumber(raw.projections.projectedFirstPassRowsRead),
      projectedFirstPassRowsWritten: nullableNumber(raw.projections.projectedFirstPassRowsWritten),
      projectedFirstPassDurationMs: nullableNumber(raw.projections.projectedFirstPassDurationMs),
      projectedFirstPassWallMs: nullableNumber(raw.projections.projectedFirstPassWallMs),
    },
    totalWorkerWallMs: number(raw.totalWorkerWallMs),
    checks,
    providerGatePass,
  }
}

const temporaryWorkersRetained = Object.values(providers)
  .some((row) => row.lifecycle?.deleteExitCode !== 0)
const executionGatePass = !blocked
  && providers.twitch?.providerGatePass === true
  && providers.kick?.providerGatePass === true

const evidence = {
  schemaVersion: 'viewloom-12a3-execution-cost-evidence-v1',
  workstream: '12A-3 bounded intraday rollup generation',
  status: executionGatePass ? 'observed' : 'blocked',
  observedAt: new Date().toISOString(),
  acceptanceIdentity: {
    pr: number(process.env.PR_NUMBER),
    headSha: process.env.GITHUB_SHA || null,
    workflowRunId: number(process.env.GITHUB_RUN_ID),
    artifactName: 'phase12a3-execution-cost-probe',
  },
  providerSeparated: true,
  contract: 'docs/audits/12a3-execution-cost-probe-contract.json',
  providers,
  gate: {
    twitchPass: providers.twitch?.providerGatePass === true,
    kickPass: providers.kick?.providerGatePass === true,
    generationExecutionCostGatePass: executionGatePass,
    generationAuthorizedByThisEvidenceAlone: false,
    nextAction: executionGatePass
      ? 'accept bounded production generator implementation behind existing maintenance windows'
      : 'inspect sanitized provider diagnostics and lifecycle before rerunning',
  },
  privacy: {
    streamerIdsIncluded: false,
    streamerNamesIncluded: false,
    databaseIdsIncluded: false,
    accountIdIncluded: false,
    secretsIncluded: false,
    rawResponsesIncluded: false,
  },
  boundaries: {
    productionGenerationStarted: false,
    probeRowsRetained: false,
    sourceRowsModified: false,
    rawRetentionChanged: false,
    newCronAdded: false,
    categoryCaptureIncluded: false,
    exactSessionFieldsIncluded: false,
    crossProviderAnalyticsIncluded: false,
    temporaryWorkersRetained,
  },
  limitations: [
    'This is a point-in-time production D1 measurement against the latest complete UTC source day.',
    'Write cost is measured with a bounded 25-row sample plus one status row and projected linearly to the accepted provider cap.',
    'A passing gate does not itself start production rollup generation.',
    'Worker and D1 timings may vary with platform load and must remain observable after generation begins.',
  ],
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
console.log(`12A-3 execution cost evidence written to ${outputPath}`)
for (const [provider, row] of Object.entries(providers)) {
  if (row.status === 'blocked') {
    console.log(`${provider}: blocked=${row.diagnostic.code} lifecycle=${JSON.stringify(row.lifecycle)}`)
  } else {
    console.log(`${provider}: source=${row.source.sourceSnapshots} aggregate=${row.query.aggregate.durationMs}ms worker=${row.totalWorkerWallMs}ms pass=${row.providerGatePass}`)
  }
}
console.log(`generationExecutionCostGatePass=${executionGatePass}`)

function loadProbeResponse(path, provider) {
  if (!existsSync(path)) return { ok: false, diagnostic: { code: 'missing_probe_response' } }
  let raw
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return { ok: false, diagnostic: { code: 'invalid_probe_response' } }
  }
  if (raw?.provider !== provider) return { ok: false, diagnostic: { code: 'provider_mismatch' } }
  if (raw?.ok !== true) {
    return {
      ok: false,
      diagnostic: {
        code: 'probe_execution_failed',
        reason: classifyProbeError(raw?.error),
        cleanupRemainingRows: nullableNumber(raw?.cleanup?.remainingRows),
      },
    }
  }
  return { ok: true, value: raw }
}

function classifyProbeError(value) {
  const allowed = new Set([
    'initial_probe_cleanup_incomplete',
    'complete_source_day_unavailable',
    'intraday_aggregate_empty',
  ])
  return allowed.has(value) ? value : 'unclassified_probe_error'
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

function sanitizeLifecycle(value = {}) {
  return {
    deployExitCode: code(value.deployExitCode),
    runExitCode: code(value.runExitCode),
    cleanupExitCode: code(value.cleanupExitCode),
    deleteExitCode: code(value.deleteExitCode),
  }
}

function sanitizeMeta(value = {}) {
  return {
    statements: number(value.statements),
    durationMs: number(value.durationMs),
    rowsRead: number(value.rowsRead),
    rowsWritten: number(value.rowsWritten),
    changes: number(value.changes),
  }
}

function sanitizePass(value = {}) {
  return {
    ...sanitizeMeta(value),
    wallMs: number(value.wallMs),
    retainedRows: value.retainedRows == null ? undefined : number(value.retainedRows),
    remainingRows: value.remainingRows == null ? undefined : number(value.remainingRows),
  }
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function code(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : 1
}

function nullableNumber(value) {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
