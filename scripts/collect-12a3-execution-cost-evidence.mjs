#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const inputDir = resolve(process.argv[2] || 'artifacts/12a3-execution-cost/raw')
const outputPath = resolve(process.argv[3] || 'artifacts/12a3-execution-cost/evidence.json')
const contract = JSON.parse(readFileSync('docs/audits/12a3-execution-cost-probe-contract.json', 'utf8'))
const lifecycle = JSON.parse(readFileSync(`${inputDir}/lifecycle.json`, 'utf8'))

const providers = {}
for (const provider of ['twitch', 'kick']) {
  const raw = JSON.parse(readFileSync(`${inputDir}/${provider}.json`, 'utf8'))
  if (raw.ok !== true) throw new Error(`${provider}: cost probe failed: ${raw.error || 'unknown_error'}`)
  if (raw.provider !== provider) throw new Error(`${provider}: provider mismatch`)

  const providerLifecycle = sanitizeLifecycle(lifecycle[provider])
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
  providers[provider] = {
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

const temporaryWorkersRetained = [providers.twitch, providers.kick]
  .some((row) => row.lifecycle.deleteExitCode !== 0)
const executionGatePass = providers.twitch.providerGatePass && providers.kick.providerGatePass

const evidence = {
  schemaVersion: 'viewloom-12a3-execution-cost-evidence-v1',
  workstream: '12A-3 bounded intraday rollup generation',
  status: 'observed',
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
    twitchPass: providers.twitch.providerGatePass,
    kickPass: providers.kick.providerGatePass,
    generationExecutionCostGatePass: executionGatePass,
    generationAuthorizedByThisEvidenceAlone: false,
    nextAction: executionGatePass
      ? 'accept bounded production generator implementation behind existing maintenance windows'
      : 'reduce query/write cost or probe scope before production generation',
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
  console.log(`${provider}: source=${row.source.sourceSnapshots} aggregate=${row.query.aggregate.durationMs}ms worker=${row.totalWorkerWallMs}ms pass=${row.providerGatePass}`)
}
console.log(`generationExecutionCostGatePass=${evidence.gate.generationExecutionCostGatePass}`)

function sanitizeLifecycle(value = {}) {
  return {
    deployExitCode: number(value.deployExitCode),
    runExitCode: number(value.runExitCode),
    cleanupExitCode: number(value.cleanupExitCode),
    deleteExitCode: number(value.deleteExitCode),
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

function nullableNumber(value) {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
