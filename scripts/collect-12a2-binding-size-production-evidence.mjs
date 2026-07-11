#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const origin = process.env.VIEWLOOM_PRODUCTION_ORIGIN || 'https://vl.badjoke-lab.com'
const url = `${origin.replace(/\/$/, '')}/api/data-audit`
const output = resolve(process.argv[2] || 'artifacts/12a2-binding-size/evidence.json')
const budget = JSON.parse(readFileSync('docs/audits/12a2-intraday-rollup-budget-evidence.json', 'utf8'))

const response = await fetch(url, { headers: { accept: 'application/json', 'cache-control': 'no-cache' } })
if (!response.ok) throw new Error(`data audit request failed: ${response.status}`)
const audit = await response.json()

if (audit.databaseSizeEvidence !== 'd1_result_meta_size_after') {
  throw new Error(`production endpoint does not expose binding-size evidence yet: ${audit.databaseSizeEvidence ?? 'missing'}`)
}

const config = {
  twitch: { safeRollupProjectionMb: budget.providers.twitch.projectedStorageMb90dWithSafety },
  kick: { safeRollupProjectionMb: budget.providers.kick.projectedStorageMb90dWithSafety },
}

const providers = {}
for (const provider of ['twitch', 'kick']) {
  const source = audit.providers?.find((item) => item?.provider === provider)
  if (!source) throw new Error(`${provider}: provider audit missing`)
  if (source.databaseSizeEvidence !== 'd1_result_meta_size_after') throw new Error(`${provider}: evidence marker mismatch`)
  if (!(Number(source.databaseSizeBytes) > 0)) throw new Error(`${provider}: databaseSizeBytes must be positive`)
  if (!(Number(source.databaseSizeMb) > 0)) throw new Error(`${provider}: databaseSizeMb must be positive`)
  if (Number(source.auditQuery?.rowsWritten) !== 0) throw new Error(`${provider}: audit query wrote rows`)

  const currentSizeMb = round(Number(source.databaseSizeBytes) / 1024 / 1024, 2)
  const safeRollupProjectionMb = config[provider].safeRollupProjectionMb
  const projectedSizeMbWithSafety = round(currentSizeMb + safeRollupProjectionMb, 2)
  const maximumDatabaseMb = 500
  const operationalCeilingMb = 450

  providers[provider] = {
    databaseSizeEvidence: source.databaseSizeEvidence,
    currentSizeBytes: Number(source.databaseSizeBytes),
    currentSizeMb,
    safeRollupProjectionMb,
    projectedSizeMbWithSafety,
    maximumDatabaseMb,
    operationalCeilingMb,
    projectedHeadroomMb: round(maximumDatabaseMb - projectedSizeMbWithSafety, 2),
    projectedUtilizationPct: round((projectedSizeMbWithSafety / maximumDatabaseMb) * 100, 2),
    providerMigrationGatePass: projectedSizeMbWithSafety <= operationalCeilingMb,
    auditQuery: {
      rowsRead: Number(source.auditQuery?.rowsRead ?? 0),
      rowsWritten: Number(source.auditQuery?.rowsWritten ?? 0),
      sqlDurationMs: Number(source.auditQuery?.sqlDurationMs ?? 0),
    },
  }
}

const evidence = {
  schemaVersion: 'viewloom-12a2-binding-size-production-evidence-v1',
  workstream: '12A-2 compact intraday rollup design and migration',
  observedAt: new Date().toISOString(),
  productionGeneratedAt: audit.generatedAt,
  source: {
    origin,
    path: '/api/data-audit',
    mode: audit.mode,
    evidenceField: 'D1Result.meta.size_after',
  },
  providers,
  gate: {
    twitchProviderPass: providers.twitch.providerMigrationGatePass,
    kickProviderPass: providers.kick.providerMigrationGatePass,
    schemaMigrationGatePass: providers.twitch.providerMigrationGatePass && providers.kick.providerMigrationGatePass,
    accountAggregateMeasured: false,
    generationStorageGatePass: false,
    generationAuthorizedByThisEvidenceAlone: false,
  },
  boundary: {
    schemaMigrationMeaning: 'provider database headroom is sufficient for the accepted compact-rollup projection under the 450 MB operational ceiling',
    generationMeaning: 'not authorized because account-wide D1 aggregate storage remains unmeasured',
    migrationAppliesData: false,
    migrationStartsGeneration: false,
  },
}

await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
console.log(`12A-2 binding-size production evidence written to ${output}`)
for (const [provider, row] of Object.entries(providers)) {
  console.log(`${provider}: current=${row.currentSizeMb}MB projected=${row.projectedSizeMbWithSafety}MB pass=${row.providerMigrationGatePass}`)
}
console.log(`schemaMigrationGatePass=${evidence.gate.schemaMigrationGatePass}`)
console.log('generationStorageGatePass=false')

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
