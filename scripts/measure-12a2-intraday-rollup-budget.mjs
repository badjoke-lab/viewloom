#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const output = resolve(process.argv[2] || 'artifacts/12a2-intraday-rollup-budget/evidence.json')
const benchmarkDays = 7
const projectionDays = 90
const safetyMarginPct = 20
const configs = {
  twitch: { cap: 600, rawPayloadMbAtRetention: 311.4, sourceMode: 'real' },
  kick: { cap: 200, rawPayloadMbAtRetention: 277.8, sourceMode: 'authenticated' },
}

try {
  execFileSync('sqlite3', ['--version'], { stdio: 'ignore' })
} catch {
  throw new Error('sqlite3 CLI is required for the 12A-2 local storage benchmark')
}

await mkdir(dirname(output), { recursive: true })
const root = mkdtempSync(join(tmpdir(), 'viewloom-12a2-'))

try {
  const providers = {}
  for (const [provider, config] of Object.entries(configs)) {
    providers[provider] = benchmarkProvider(provider, config)
  }

  const evidence = {
    schemaVersion: 'viewloom-12a2-intraday-rollup-budget-v1',
    workstream: '12A-2 compact intraday rollup design and migration',
    generatedAt: new Date().toISOString(),
    benchmark: {
      engine: sqliteVersion(),
      benchmarkDays,
      projectionDays,
      hourlyCellsPerSyntheticRow: 24,
      safetyMarginPct,
      measurementBoundary: 'Local SQLite file-size benchmark after VACUUM. It is a conservative schema/storage projection, not remote D1 database-size evidence or production D1 query timing evidence.',
    },
    providers,
    writes: {
      maximumRollupRowUpsertsPerDay: {
        twitch: 2400,
        kick: 800,
        combined: 3200,
      },
      maximumStatusRowUpsertsPerDay: {
        twitch: 4,
        kick: 4,
        combined: 8,
      },
      note: 'Projection assumes two existing refresh windows per day and today+yesterday refresh scope. These are design upper bounds, not current production D1 rows_written measurements.',
    },
    acceptance: {
      twitchProjected90dWithSafetyMbMax: 80,
      kickProjected90dWithSafetyMbMax: 30,
      twitchPayloadBaselinePlusProjectionWithSafetyMbMax: 400,
      kickPayloadBaselinePlusProjectionWithSafetyMbMax: 350,
      combinedProjectedRollupWithSafetyMbMax: 110,
      migrationAuthorized: false,
      remoteDatabaseSizeEvidenceRequiredBeforeApply: true,
    },
    limitations: [
      'The 12A-0 payload baseline measures retained payload bytes and is not equivalent to complete D1 database file size.',
      'Local SQLite page size and D1 internal storage accounting are not claimed to be identical.',
      'Production D1 rows_read, rows_written, and SQL duration must be measured in 12A-3.',
      'No category or exact-session fields are included in this design benchmark.',
    ],
  }

  await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  console.log(`12A-2 intraday rollup budget evidence written to ${output}`)
  for (const [provider, row] of Object.entries(providers)) {
    console.log(`${provider}: rows90d=${row.projectedRows90d} storage=${row.projectedStorageMb90d}MB safety=${row.projectedStorageMb90dWithSafety}MB baseline+safe=${row.payloadBaselinePlusProjectionWithSafetyMb}MB`)
  }
} finally {
  rmSync(root, { recursive: true, force: true })
}

function benchmarkProvider(provider, config) {
  const dbPath = join(root, `${provider}.sqlite`)
  execSql(dbPath, schemaSql())
  execSql(dbPath, 'VACUUM;')
  const emptyBytes = statSync(dbPath).size

  const insertPath = join(root, `${provider}-insert.sql`)
  writeFileSync(insertPath, insertSql(provider, config), 'utf8')
  execFileSync('sqlite3', [dbPath, `.read ${insertPath}`], { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 })
  execSql(dbPath, 'VACUUM;')
  const tableAndPrimaryBytes = statSync(dbPath).size

  execSql(dbPath, 'CREATE INDEX idx_intraday_streamer_day ON streamer_intraday_rollups(provider, streamer_id, day); VACUUM;')
  const totalBytes = statSync(dbPath).size

  const rowCount = Number(queryScalar(dbPath, 'SELECT COUNT(*) FROM streamer_intraday_rollups;'))
  const statusRows = Number(queryScalar(dbPath, 'SELECT COUNT(*) FROM intraday_rollup_status;'))
  const dataAndPrimaryKeyBytes = Math.max(0, tableAndPrimaryBytes - emptyBytes)
  const secondaryIndexBytes = Math.max(0, totalBytes - tableAndPrimaryBytes)
  const dataAndPrimaryKeyBytesPerRow = dataAndPrimaryKeyBytes / rowCount
  const secondaryIndexBytesPerRow = secondaryIndexBytes / rowCount
  const projectedRows90d = config.cap * projectionDays
  const projectedStorageBytes90d = (dataAndPrimaryKeyBytesPerRow + secondaryIndexBytesPerRow) * projectedRows90d
  const projectedStorageMb90d = bytesToMb(projectedStorageBytes90d)
  const projectedStorageMb90dWithSafety = round(projectedStorageMb90d * (1 + safetyMarginPct / 100), 2)
  const payloadBaselinePlusProjectionWithSafetyMb = round(config.rawPayloadMbAtRetention + projectedStorageMb90dWithSafety, 2)

  const lookupSql = `SELECT day, hourly_json, sample_count, observed_minutes FROM streamer_intraday_rollups WHERE provider='${provider}' AND streamer_id='${provider}-channel-00000000000000000001' AND day BETWEEN '2026-01-01' AND '2026-03-31' ORDER BY day;`
  const daySql = `SELECT streamer_id, daily_rank, hourly_json FROM streamer_intraday_rollups WHERE provider='${provider}' AND day='2026-01-07' ORDER BY daily_rank LIMIT ${config.cap};`

  return {
    retainedStreamerCapPerDay: config.cap,
    benchmarkRows: rowCount,
    benchmarkStatusRows: statusRows,
    emptyDbBytes: emptyBytes,
    dataAndPrimaryKeyBytes,
    secondaryIndexBytes,
    dataAndPrimaryKeyBytesPerRow: round(dataAndPrimaryKeyBytesPerRow, 2),
    secondaryIndexBytesPerRow: round(secondaryIndexBytesPerRow, 2),
    totalMeasuredBytesPerRollupRow: round(dataAndPrimaryKeyBytesPerRow + secondaryIndexBytesPerRow, 2),
    projectedRows90d,
    projectedStorageMb90d,
    projectedStorageMb90dWithSafety,
    rawPayloadMbAtRetentionBaseline: config.rawPayloadMbAtRetention,
    payloadBaselinePlusProjectionWithSafetyMb,
    queryPlans: {
      streamer90DayLookup: explainPlan(dbPath, lookupSql),
      providerDayLookup: explainPlan(dbPath, daySql),
    },
  }
}

function schemaSql() {
  return `
PRAGMA journal_mode=OFF;
PRAGMA synchronous=OFF;
CREATE TABLE streamer_intraday_rollups (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  streamer_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  daily_rank INTEGER NOT NULL,
  total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  observed_minutes INTEGER NOT NULL DEFAULT 0,
  hourly_json TEXT NOT NULL DEFAULT '[]',
  selection_state TEXT NOT NULL DEFAULT 'complete_within_daily_cap',
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL DEFAULT 'analytics-source-v1',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (provider, day, streamer_id)
);
CREATE TABLE intraday_rollup_status (
  provider TEXT NOT NULL,
  day TEXT NOT NULL,
  candidate_streamers INTEGER NOT NULL,
  retained_streamers INTEGER NOT NULL,
  retained_streamer_cap INTEGER NOT NULL,
  source_snapshots INTEGER NOT NULL,
  selection_state TEXT NOT NULL,
  coverage_state TEXT NOT NULL,
  source_mode TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  refreshed_at TEXT NOT NULL,
  PRIMARY KEY (provider, day)
);
`
}

function insertSql(provider, config) {
  const rows = ['BEGIN;']
  const hourly = compactHourlyJson()
  for (let dayIndex = 0; dayIndex < benchmarkDays; dayIndex += 1) {
    const day = isoDay(dayIndex)
    for (let rank = 1; rank <= config.cap; rank += 1) {
      const id = `${provider}-channel-${String(rank).padStart(20, '0')}`
      const displayName = `${provider.toUpperCase()} Representative Display Name ${String(rank).padStart(8, '0')}`
      rows.push(`INSERT INTO streamer_intraday_rollups VALUES (${sql(provider)},${sql(day)},${sql(id)},${sql(displayName)},${rank},1440000,120000,288,1440,${sql(hourly)},'daily_cap_truncated',${sql(config.sourceMode)},'analytics-source-v1','2026-07-11T00:00:00.000Z');`)
    }
    rows.push(`INSERT INTO intraday_rollup_status VALUES (${sql(provider)},${sql(day)},${config.cap * 2},${config.cap},${config.cap},288,'daily_cap_truncated','good',${sql(config.sourceMode)},'analytics-source-v1','2026-07-11T00:00:00.000Z');`)
  }
  rows.push('COMMIT;')
  return `${rows.join('\n')}\n`
}

function compactHourlyJson() {
  const cells = []
  for (let hour = 0; hour < 24; hour += 1) {
    cells.push([hour, 60000 + hour * 1000, 1200 + hour * 25, 12, 60, 900 + hour * 10, 1050 + hour * 10])
  }
  return JSON.stringify(cells)
}

function isoDay(dayIndex) {
  const date = new Date('2026-01-01T00:00:00.000Z')
  date.setUTCDate(date.getUTCDate() + dayIndex)
  return date.toISOString().slice(0, 10)
}

function explainPlan(dbPath, sql) {
  const output = execFileSync('sqlite3', [dbPath, `EXPLAIN QUERY PLAN ${sql}`], { encoding: 'utf8' }).trim()
  return output.split('\n').filter(Boolean)
}

function queryScalar(dbPath, sql) {
  return execFileSync('sqlite3', [dbPath, sql], { encoding: 'utf8' }).trim()
}

function execSql(dbPath, sql) {
  execFileSync('sqlite3', [dbPath, sql], { stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 })
}

function sqliteVersion() {
  return execFileSync('sqlite3', ['--version'], { encoding: 'utf8' }).trim()
}

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function bytesToMb(bytes) {
  return round(bytes / 1024 / 1024, 2)
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
