#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const origin = process.env.VIEWLOOM_PRODUCTION_ORIGIN || 'https://vl.badjoke-lab.com'
const url = `${origin.replace(/\/$/, '')}/api/schema-audit`
const output = resolve(process.argv[2] || 'artifacts/12a2-remote-schema/evidence.json')

const response = await fetch(url, {
  headers: { accept: 'application/json', 'cache-control': 'no-cache' },
})
if (!response.ok) throw new Error(`schema audit request failed: ${response.status}`)
const audit = await response.json()

if (audit.mode !== 'read-only-schema-probe') {
  throw new Error(`production endpoint does not expose the expected schema probe mode: ${audit.mode ?? 'missing'}`)
}
if (Number(audit.expectedObjectCount) !== 3) {
  throw new Error(`unexpected schema object count: ${audit.expectedObjectCount}`)
}

const providers = {}
for (const provider of ['twitch', 'kick']) {
  const source = audit.providers?.find((item) => item?.provider === provider)
  if (!source) throw new Error(`${provider}: provider schema audit missing`)
  if (Number(source.expectedObjectCount) !== 3) throw new Error(`${provider}: expectedObjectCount mismatch`)
  if (Number(source.auditQuery?.rowsWritten) !== 0) throw new Error(`${provider}: schema audit wrote rows`)

  const objects = Array.isArray(source.objects) ? source.objects : []
  const expectedNames = [
    'streamer_intraday_rollups',
    'idx_intraday_streamer_day',
    'intraday_rollup_status',
  ]
  for (const name of expectedNames) {
    if (!objects.some((object) => object?.name === name)) throw new Error(`${provider}: missing object result ${name}`)
  }

  providers[provider] = {
    schemaComplete: source.schemaComplete === true,
    observedObjectCount: Number(source.observedObjectCount ?? 0),
    expectedObjectCount: Number(source.expectedObjectCount ?? 0),
    objects: objects.map((object) => ({
      type: object.type,
      name: object.name,
      present: object.present === true,
      observedType: object.observedType ?? null,
      definitionMatches: object.definitionMatches === true,
    })),
    auditQuery: {
      rowsRead: Number(source.auditQuery?.rowsRead ?? 0),
      rowsWritten: Number(source.auditQuery?.rowsWritten ?? 0),
      sqlDurationMs: Number(source.auditQuery?.sqlDurationMs ?? 0),
      databaseSizeBytes: Number(source.auditQuery?.databaseSizeBytes ?? 0),
    },
  }
}

const remoteSchemaGatePass = providers.twitch.schemaComplete && providers.kick.schemaComplete
const blockers = ['account_aggregate_storage_unmeasured']
if (!remoteSchemaGatePass) blockers.unshift('remote_schema_not_applied')

const evidence = {
  schemaVersion: 'viewloom-12a2-remote-schema-production-evidence-v1',
  workstream: '12A-2 remote schema apply and verification gate',
  observedAt: new Date().toISOString(),
  productionGeneratedAt: audit.generatedAt,
  source: {
    origin,
    path: '/api/schema-audit',
    mode: audit.mode,
    querySource: 'sqlite_master',
    readOnly: true,
  },
  providers,
  gate: {
    twitchRemoteSchemaComplete: providers.twitch.schemaComplete,
    kickRemoteSchemaComplete: providers.kick.schemaComplete,
    remoteSchemaGatePass,
    accountAggregateMeasured: false,
    generationStorageGatePass: false,
    generationAuthorizedByThisEvidenceAlone: false,
    blockers,
  },
  boundary: {
    migrationApplyPerformedByProbe: false,
    backfillPerformedByProbe: false,
    generationStartedByProbe: false,
    rawSqlDefinitionsPersisted: false,
  },
}

await mkdir(dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

console.log(`12A-2 remote schema evidence written to ${output}`)
for (const [provider, row] of Object.entries(providers)) {
  console.log(`${provider}: schemaComplete=${row.schemaComplete} observed=${row.observedObjectCount}/${row.expectedObjectCount}`)
}
console.log(`remoteSchemaGatePass=${remoteSchemaGatePass}`)
console.log(`blockers=${blockers.join(',')}`)
