#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const inputDir = resolve(process.argv[2] || 'artifacts/12a2-remote-d1-size/raw')
const outputPath = resolve(process.argv[3] || 'artifacts/12a2-remote-d1-size/evidence.json')
const budget = JSON.parse(readFileSync('docs/audits/12a2-intraday-rollup-budget-evidence.json', 'utf8'))

const configs = {
  twitch: {
    databaseName: 'vl_twitch_hot',
    infoFile: 'twitch-info.json',
    safeRollupProjectionMb: budget.providers.twitch.projectedStorageMb90dWithSafety,
  },
  kick: {
    databaseName: 'vl_kick_hot',
    infoFile: 'kick-info.json',
    safeRollupProjectionMb: budget.providers.kick.projectedStorageMb90dWithSafety,
  },
}

const providers = {}
for (const [provider, config] of Object.entries(configs)) {
  const raw = parseJson(`${inputDir}/${config.infoFile}`)
  const info = unwrap(raw)
  const currentSizeBytes = findSizeBytes(info)
  if (!Number.isFinite(currentSizeBytes) || currentSizeBytes < 0) {
    throw new Error(`${provider}: unable to locate current database size in Wrangler d1 info JSON`)
  }
  const currentSizeMb = bytesToMb(currentSizeBytes)
  const projectedSizeMbWithSafety = round(currentSizeMb + config.safeRollupProjectionMb, 2)
  const maximumDatabaseMb = 500
  const operationalCeilingMb = 450
  providers[provider] = {
    databaseName: config.databaseName,
    databaseId: text(findValue(info, ['uuid', 'id', 'database_id', 'databaseId'])),
    currentSizeBytes,
    currentSizeMb,
    safeRollupProjectionMb: config.safeRollupProjectionMb,
    projectedSizeMbWithSafety,
    maximumDatabaseMb,
    operationalCeilingMb,
    projectedHeadroomMb: round(maximumDatabaseMb - projectedSizeMbWithSafety, 2),
    projectedUtilizationPct: round((projectedSizeMbWithSafety / maximumDatabaseMb) * 100, 2),
    perDatabaseGatePass: projectedSizeMbWithSafety <= operationalCeilingMb,
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

const accountCurrentSizeMb = bytesToMb(accountCurrentSizeBytes)
const combinedSafeRollupProjectionMb = round(
  providers.twitch.safeRollupProjectionMb + providers.kick.safeRollupProjectionMb,
  2,
)
const accountProjectedSizeMbWithSafety = round(accountCurrentSizeMb + combinedSafeRollupProjectionMb, 2)
const maximumAccountStorageMb = 5120
const accountOperationalCeilingMb = 4608

const evidence = {
  schemaVersion: 'viewloom-12a2-remote-d1-size-gate-v1',
  workstream: '12A-2 compact intraday rollup design and migration',
  generatedAt: new Date().toISOString(),
  evidenceMode: 'wrangler-d1-info-json',
  sourceCommandContract: {
    providerInfo: 'wrangler d1 info [NAME] --json',
    accountList: 'wrangler d1 list --json',
    rawAccountDatabaseNamesPersisted: false,
  },
  platformLimits: {
    maximumDatabaseMb: 500,
    maximumAccountStorageMb: 5120,
    perDatabaseOperationalCeilingMb: 450,
    accountOperationalCeilingMb: 4608,
  },
  providers,
  account: {
    databaseCount: list.length,
    sizedDatabaseCount: accountSizedDatabaseCount,
    currentSizeBytes: accountCurrentSizeBytes,
    currentSizeMb: accountCurrentSizeMb,
    combinedSafeRollupProjectionMb,
    projectedSizeMbWithSafety: accountProjectedSizeMbWithSafety,
    maximumAccountStorageMb,
    operationalCeilingMb: accountOperationalCeilingMb,
    projectedHeadroomMb: round(maximumAccountStorageMb - accountProjectedSizeMbWithSafety, 2),
    projectedUtilizationPct: round((accountProjectedSizeMbWithSafety / maximumAccountStorageMb) * 100, 2),
    accountGatePass: accountProjectedSizeMbWithSafety <= accountOperationalCeilingMb,
  },
  gate: {
    twitchPass: providers.twitch.perDatabaseGatePass,
    kickPass: providers.kick.perDatabaseGatePass,
    accountPass: accountProjectedSizeMbWithSafety <= accountOperationalCeilingMb,
    migrationStorageGatePass:
      providers.twitch.perDatabaseGatePass
      && providers.kick.perDatabaseGatePass
      && accountProjectedSizeMbWithSafety <= accountOperationalCeilingMb,
    migrationAuthorizedByThisEvidenceAlone: false,
  },
  privacy: {
    unrelatedDatabaseNamesIncluded: false,
    secretsIncluded: false,
    accountIdIncluded: false,
  },
  limitations: [
    'Database sizes are point-in-time Wrangler control-plane observations.',
    'The safe rollup projection is added to current database size and does not model unrelated future growth.',
    'Passing the storage gate does not deploy the migration or authorize runtime generation.',
  ],
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
console.log(`12A-2 remote D1 size evidence written to ${outputPath}`)
for (const [provider, row] of Object.entries(providers)) {
  console.log(`${provider}: current=${row.currentSizeMb}MB projected=${row.projectedSizeMbWithSafety}MB pass=${row.perDatabaseGatePass}`)
}
console.log(`account: current=${accountCurrentSizeMb}MB projected=${accountProjectedSizeMbWithSafety}MB pass=${evidence.account.accountGatePass}`)
console.log(`migrationStorageGatePass=${evidence.gate.migrationStorageGatePass}`)

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

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function bytesToMb(bytes) {
  return round(bytes / 1024 / 1024, 2)
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
