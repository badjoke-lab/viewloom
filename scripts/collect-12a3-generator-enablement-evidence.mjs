#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const inputDir = resolve(process.argv[2] || 'artifacts/12a3-generator-enablement/raw')
const outputPath = resolve(process.argv[3] || 'artifacts/12a3-generator-enablement/evidence.json')
const lifecycle = readJson(`${inputDir}/lifecycle.json`, {})

const providers = {}
let blocked = false

for (const provider of ['twitch', 'kick']) {
  const providerLifecycle = sanitizeLifecycle(lifecycle[provider])
  const responsePath = `${inputDir}/${provider}.json`
  const loaded = loadResponse(responsePath, provider)

  if (!loaded.ok) {
    blocked = true
    providers[provider] = {
      status: 'blocked',
      lifecycle: providerLifecycle,
      diagnostic: loaded.diagnostic,
      providerGatePass: false,
    }
    continue
  }

  const raw = loaded.value
  const checks = {
    lifecyclePass: Object.values(providerLifecycle).every((value) => value === 0),
    workerChecksPass: Object.values(raw.checks ?? {}).every((value) => value === true),
    expectedDayCount:
      Array.isArray(raw.firstObservation)
      && raw.firstObservation.length === 2
      && Array.isArray(raw.secondObservation)
      && raw.secondObservation.length === 2,
    idempotentObservations:
      JSON.stringify(raw.firstObservation) === JSON.stringify(raw.secondObservation),
    firstPassBounded: number(raw.first?.totals?.maximumQueries) <= 12,
    secondPassBounded: number(raw.second?.totals?.maximumQueries) <= 12,
    retentionCleanupObserved:
      raw.first?.retentionCleanup?.attempted === true
      && raw.second?.retentionCleanup?.attempted === true,
    providerSeparated:
      raw.first?.provider === provider
      && raw.second?.provider === provider
      && raw.boundaries?.crossProviderOperation === false,
    sourceRowsUnmodified: raw.boundaries?.sourceRowsModified === false,
    noBackfill: raw.boundaries?.backfillPerformed === false,
    noNewCron: raw.boundaries?.newCronAdded === false,
  }
  const providerGatePass = Object.values(checks).every(Boolean)
  if (!providerGatePass) blocked = true

  providers[provider] = {
    status: 'observed',
    observedAt: raw.observedAt,
    forcedMaintenanceTimeUtc: raw.forcedMaintenanceTimeUtc,
    config: {
      streamerCap: number(raw.config?.streamerCap),
      bucketMinutes: number(raw.config?.bucketMinutes),
    },
    lifecycle: providerLifecycle,
    first: sanitizeGeneration(raw.first),
    second: sanitizeGeneration(raw.second),
    firstObservation: sanitizeObservations(raw.firstObservation),
    secondObservation: sanitizeObservations(raw.secondObservation),
    checks,
    providerGatePass,
  }
}

const temporaryWorkersRetained = Object.values(providers)
  .some((row) => row.lifecycle?.deleteExitCode !== 0)
const gatePass = !blocked
  && providers.twitch?.providerGatePass === true
  && providers.kick?.providerGatePass === true
  && !temporaryWorkersRetained

const evidence = {
  schemaVersion: 'viewloom-12a3-generator-enablement-evidence-v1',
  workstream: '12A-3 bounded production generator enablement',
  status: gatePass ? 'observed' : 'blocked',
  observedAt: new Date().toISOString(),
  acceptanceIdentity: {
    pr: number(process.env.PR_NUMBER),
    headSha: process.env.GITHUB_SHA || null,
    workflowRunId: number(process.env.GITHUB_RUN_ID),
    artifactName: 'phase12a3-generator-enablement',
  },
  providerSeparated: true,
  providers,
  gate: {
    twitchPass: providers.twitch?.providerGatePass === true,
    kickPass: providers.kick?.providerGatePass === true,
    generatorEnablementGatePass: gatePass,
    productionGenerationStarted: gatePass,
    mainCollectorDeployAuthorizedByThisEvidence: gatePass,
    nextAction: gatePass
      ? 'merge enabled collector configuration and verify main deployment'
      : 'inspect sanitized lifecycle and provider checks before merge',
  },
  privacy: {
    streamerIdentitiesIncluded: false,
    databaseIdsIncluded: false,
    accountIdIncluded: false,
    secretsIncluded: false,
    rawResponsesIncluded: false,
    deploymentLogsIncluded: false,
  },
  boundaries: {
    productionGenerationStarted: gatePass,
    backfillPerformed: false,
    sourceRowsModified: false,
    rawRetentionChanged: false,
    newCronAdded: false,
    categoryCaptureIncluded: false,
    exactSessionFieldsIncluded: false,
    crossProviderAnalyticsIncluded: false,
    temporaryWorkersRetained,
  },
  limitations: [
    'The acceptance probe forces the current UTC day to the existing 00:20 maintenance window and refreshes only today and yesterday.',
    'The probe proves actual provider-specific D1 rows and status records, but the enabled production collector deployment occurs only after merge.',
    'The second pass compares aggregate observations and does not compare updated_at timestamps.',
    'Ongoing accumulation must continue to expose provider-specific operational logs and remain within accepted storage and query budgets.'
  ],
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
console.log(`12A-3 generator enablement evidence written to ${outputPath}`)
for (const [provider, row] of Object.entries(providers)) {
  if (row.status === 'blocked') {
    console.log(`${provider}: blocked=${row.diagnostic.code} lifecycle=${JSON.stringify(row.lifecycle)}`)
  } else {
    console.log(`${provider}: days=${row.firstObservation.length} rows=${row.firstObservation.map((day) => day.rollupRows).join(',')} pass=${row.providerGatePass}`)
  }
}
console.log(`generatorEnablementGatePass=${gatePass}`)

function loadResponse(path, provider) {
  if (!existsSync(path)) return { ok: false, diagnostic: { code: 'missing_acceptance_response' } }
  let raw
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return { ok: false, diagnostic: { code: 'invalid_acceptance_response' } }
  }
  if (raw?.provider !== provider) return { ok: false, diagnostic: { code: 'provider_mismatch' } }
  if (raw?.ok !== true) {
    return {
      ok: false,
      diagnostic: {
        code: 'generator_acceptance_failed',
        reason: classifyReason(raw?.error),
      },
    }
  }
  return { ok: true, value: raw }
}

function classifyReason(value) {
  const allowed = new Set([
    'first_generation_incomplete',
    'second_generation_incomplete',
  ])
  return allowed.has(value) ? value : 'unclassified_acceptance_error'
}

function sanitizeLifecycle(value = {}) {
  return {
    deployExitCode: code(value.deployExitCode),
    runExitCode: code(value.runExitCode),
    deleteExitCode: code(value.deleteExitCode),
  }
}

function sanitizeGeneration(value = {}) {
  return {
    provider: value.provider,
    enabled: value.enabled === true,
    attempted: value.attempted === true,
    maintenanceWindow: value.maintenanceWindow === true,
    days: Array.isArray(value.days) ? value.days : [],
    retentionCleanup: value.retentionCleanup ?? null,
    totals: value.totals ?? null,
    error: value.error ?? null,
  }
}

function sanitizeObservations(value) {
  if (!Array.isArray(value)) return []
  return value.map((row) => ({
    day: typeof row.day === 'string' ? row.day : '',
    candidateStreamers: number(row.candidateStreamers),
    retainedStreamers: number(row.retainedStreamers),
    retainedStreamerCap: number(row.retainedStreamerCap),
    sourceSnapshots: number(row.sourceSnapshots),
    selectionState: typeof row.selectionState === 'string' ? row.selectionState : '',
    coverageState: typeof row.coverageState === 'string' ? row.coverageState : '',
    sourceMode: typeof row.sourceMode === 'string' ? row.sourceMode : '',
    rollupRows: number(row.rollupRows),
    distinctRanks: number(row.distinctRanks),
    minimumRank: number(row.minimumRank),
    maximumRank: number(row.maximumRank),
    totalViewerMinutes: number(row.totalViewerMinutes),
    totalSampleCount: number(row.totalSampleCount),
    hourlyPayloadBytes: number(row.hourlyPayloadBytes),
  }))
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return fallback
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
