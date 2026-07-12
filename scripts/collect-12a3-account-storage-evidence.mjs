#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const inputDir = resolve(process.argv[2] || 'artifacts/12a3-account-storage/raw')
const outputPath = resolve(process.argv[3] || 'artifacts/12a3-account-storage/evidence.json')
const budget = JSON.parse(readFileSync('docs/audits/12a2-intraday-rollup-budget-evidence.json', 'utf8'))

const configs = {
  twitch: {
    infoFile: 'twitch-info.json',
    safeRollupProjectionMb: budget.providers.twitch.projectedStorageMb90dWithSafety,
  },
  kick: {
    infoFile: 'kick-info.json',
    safeRollupProjectionMb: budget.providers.kick.projectedStorageMb90dWithSafety,
  },
}

const providers = {}
for (const [provider, config] of Object.entries(configs)) {
  const raw = parseJson(`${inputDir}/${config.infoFile}`)
  const info = unwrap(raw)
  const currentSizeBytes = findSizeBytes(info)
  if (!Number.isFinite(currentSizeBytes) || currentSizeBytes <= 0) {
    throw new Error(`${provider}: unable to locate a positive current database size in Wrangler d1 info JSON`)
  }

  const currentSizeMb = bytesToMb(currentSizeBytes)
  const projectedSizeMbWithSafety = round(currentSizeMb + config.safeRollupProjectionMb, 2)
  const maximumDatabaseMb = 500
  const operationalCeilingMb = 450

  providers[provider] = {
    currentSizeBytes,
    currentSizeMb,
    safeRollupProjectionMb: config.safeRollupProjectionMb,
    projectedSizeMbWithSafety,
    maximumDatabaseMb,
    operationalCeilingMb,
    projectedHeadroomMb: round(maximumDatabaseMb - projectedSizeMbWithSafety, 2),
    projectedUtilizationPct: round((projectedSizeMbWithSafety / maximumDatabaseMb) * 100, 2),
    providerStorageGatePass: projectedSizeMbWithSafety <= operationalCeilingMb,
  }
}

const listRaw = parseJson(`${inputDir}/account-list.json`)
const list = extractList(listRaw)
let accountCurrentSizeBytes = 0
let accountSizedDatabaseCount = 0
for (const item of list) {
  const size = findSizeBytes(item)
  if (Number.isFinite(size) && size >= 0) {
    accountCurrentSizeBytes += size
    accountSizedDatabaseCount += 1
  }
}
if (!list.length || accountSizedDatabaseCount !== list.length) {
  throw new Error(`account list size coverage incomplete: databases=${list.length} sized=${accountSizedDatabaseCount}`)
}
if (accountCurrentSizeBytes <= 0) {
  throw new Error('account aggregate size must be positive')
}

const accountCurrentSizeMb = bytesToMb(accountCurrentSizeBytes)
const combinedSafeRollupProjectionMb = round(
  providers.twitch.safeRollupProjectionMb + providers.kick.safeRollupProjectionMb,
  2,
)
const projectedSizeMbWithSafety = round(accountCurrentSizeMb + combinedSafeRollupProjectionMb, 2)
const maximumAccountStorageMb = 5120
const operationalCeilingMb = 4608
const accountStorageGatePass = projectedSizeMbWithSafety <= operationalCeilingMb
const generationStorageGatePass =
  providers.twitch.providerStorageGatePass
  && providers.kick.providerStorageGatePass
  && accountStorageGatePass

const evidence = {
  schemaVersion: 'viewloom-12a3-account-storage-gate-v1',
  workstream: '12A-3 generation storage and execution gate',
  status: 'observed',
  observedAt: new Date().toISOString(),
  evidenceMode: 'wrangler-d1-control-plane-json',
  sourceCommandContract: {
    providerInfo: 'wrangler d1 info [NAME] --json',
    accountList: 'wrangler d1 list --json',
    rawControlPlaneResponsesPersisted: false,
  },
  platformLimits: {
    plan: 'Workers Free',
    maximumDatabaseMb: 500,
    maximumAccountStorageMb: 5120,
    perDatabaseOperationalCeilingMb: 450,
    accountOperationalCeilingMb: 4608,
    operationalCeilingPct: 90,
    officialSource: 'https://developers.cloudflare.com/d1/platform/limits/',
    officialSourceCheckedAt: '2026-07-12',
  },
  providers,
  account: {
    databaseCount: list.length,
    sizedDatabaseCount: accountSizedDatabaseCount,
    currentSizeBytes: accountCurrentSizeBytes,
    currentSizeMb: accountCurrentSizeMb,
    combinedSafeRollupProjectionMb,
    projectedSizeMbWithSafety,
    maximumAccountStorageMb,
    operationalCeilingMb,
    projectedHeadroomMb: round(maximumAccountStorageMb - projectedSizeMbWithSafety, 2),
    projectedUtilizationPct: round((projectedSizeMbWithSafety / maximumAccountStorageMb) * 100, 2),
    accountStorageGatePass,
  },
  gate: {
    twitchProviderPass: providers.twitch.providerStorageGatePass,
    kickProviderPass: providers.kick.providerStorageGatePass,
    accountPass: accountStorageGatePass,
    accountAggregateMeasured: true,
    generationStorageGatePass,
    generationAuthorizedByThisEvidenceAlone: false,
    nextGate: 'generation_execution_cost_measurement',
  },
  privacy: {
    providerDatabaseNamesIncluded: false,
    providerDatabaseIdsIncluded: false,
    unrelatedDatabaseNamesIncluded: false,
    accountIdIncluded: false,
    secretsIncluded: false,
  },
  boundaries: {
    d1ExecuteUsed: false,
    writesPerformed: false,
    migrationApplied: false,
    backfillPerformed: false,
    generationStarted: false,
    retentionChanged: false,
    crossProviderAnalyticsCreated: false,
  },
  limitations: [
    'Database sizes are point-in-time Wrangler control-plane observations.',
    'The accepted safe rollup projections are added to current size and do not model unrelated future growth.',
    'Passing the storage gate does not authorize generation without a separate production execution-cost gate.',
    'Account aggregate storage is summed only when every listed database exposes a size value.',
  ],
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

console.log(`12A-3 account storage evidence written to ${outputPath}`)
for (const [provider, row] of Object.entries(providers)) {
  console.log(`${provider}: current=${row.currentSizeMb}MB projected=${row.projectedSizeMbWithSafety}MB pass=${row.providerStorageGatePass}`)
}
console.log(`account: databases=${list.length} current=${accountCurrentSizeMb}MB projected=${projectedSizeMbWithSafety}MB pass=${accountStorageGatePass}`)
console.log(`generationStorageGatePass=${generationStorageGatePass}`)

function parseJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function unwrap(value) {
  if (Array.isArray(value)) return value[0] ?? {}
  if (value && typeof value === 'object' && 'result' in value) return unwrap(value.result)
  return value ?? {}
}

function extractList(value) {
  const unwrapped = value && typeof value === 'object' && !Array.isArray(value) && 'result' in value
    ? value.result
    : value
  return Array.isArray(unwrapped) ? unwrapped : []
}

function findSizeBytes(value) {
  const priority = ['file_size', 'fileSize', 'size_bytes', 'sizeBytes', 'database_size', 'databaseSize', 'size']
  for (const key of priority) {
    const found = findValue(value, [key])
    const parsed = numeric(found)
    if (parsed != null) return parsed
  }
  return null
}

function findValue(value, keys) {
  if (!value || typeof value !== 'object') return null
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) return value[key]
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') {
      const found = findValue(child, keys)
      if (found !== null && found !== undefined) return found
    }
  }
  return null
}

function numeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replaceAll(',', '').trim())
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function bytesToMb(bytes) {
  return round(bytes / 1024 / 1024, 2)
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
