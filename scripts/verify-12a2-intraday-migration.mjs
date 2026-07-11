#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const migrationPath = process.argv[2] || 'db/d1/004_intraday_rollups.sql'
const sql = readFileSync(migrationPath, 'utf8')
const design = JSON.parse(readFileSync('docs/audits/12a2-intraday-rollup-design-contract.json', 'utf8'))
const state = JSON.parse(readFileSync('docs/audits/12a2-current-gate-state.json', 'utf8'))

assert.equal(design.schemaVersion, 'viewloom-12a2-intraday-rollup-design-v1')
assert.equal(design.model.primaryTable, 'streamer_intraday_rollups')
assert.equal(design.model.statusTable, 'intraday_rollup_status')
assert.deepEqual(design.model.primaryKey, ['provider', 'day', 'streamer_id'])
assert.deepEqual(design.model.secondaryIndex, ['provider', 'streamer_id', 'day'])

assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v2')
assert.equal(state.status, 'schema_migration_authorized_generation_blocked')
assert.equal(state.bindingSizeGate.schemaMigrationGatePass, true)
assert.equal(state.migration.status, 'authorized_not_started')
assert.equal(state.migration.authorized, true)
assert.equal(state.migration.dataBackfillAllowed, false)
assert.equal(state.migration.runtimeGenerationStarted, false)
assert.equal(state.generation.authorized, false)

for (const fragment of [
  'CREATE TABLE IF NOT EXISTS streamer_intraday_rollups',
  'PRIMARY KEY (provider, day, streamer_id)',
  'CREATE INDEX IF NOT EXISTS idx_intraday_streamer_day',
  'ON streamer_intraday_rollups (provider, streamer_id, day)',
  'CREATE TABLE IF NOT EXISTS intraday_rollup_status',
  'PRIMARY KEY (provider, day)',
  "contract_version TEXT NOT NULL DEFAULT 'analytics-source-v1'",
  "hourly_json TEXT NOT NULL DEFAULT '[]'",
]) assert.ok(sql.includes(fragment), `migration missing: ${fragment}`)

for (const forbidden of [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bREPLACE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bTRIGGER\b/i,
  /\bminute_snapshots\b/i,
  /\bdaily_rollups\b/i,
  /\bcategory_/i,
  /\bprovider_started_at\b/i,
]) assert.equal(forbidden.test(stripComments(sql)), false, `forbidden migration token: ${forbidden}`)

const root = mkdtempSync(join(tmpdir(), 'viewloom-12a2-migration-'))
const dbPath = join(root, 'migration.sqlite')
try {
  execFileSync('sqlite3', [dbPath], { input: sql, encoding: 'utf8' })
  execFileSync('sqlite3', [dbPath], { input: sql, encoding: 'utf8' })

  const tables = rows(dbPath, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
  assert.deepEqual(tables, ['intraday_rollup_status', 'streamer_intraday_rollups'])

  const indexes = rows(dbPath, "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_autoindex_%' ORDER BY name;")
  assert.deepEqual(indexes, ['idx_intraday_streamer_day'])

  const primaryColumns = pragmaColumns(dbPath, 'streamer_intraday_rollups')
  assert.deepEqual(primaryColumns.map((row) => row.name), [
    'provider',
    'day',
    'streamer_id',
    'display_name',
    'daily_rank',
    'total_viewer_minutes',
    'peak_viewers',
    'sample_count',
    'observed_minutes',
    'hourly_json',
    'selection_state',
    'source_mode',
    'contract_version',
    'updated_at',
  ])
  assert.deepEqual(primaryColumns.filter((row) => row.pk > 0).sort((a, b) => a.pk - b.pk).map((row) => row.name), ['provider', 'day', 'streamer_id'])

  const statusColumns = pragmaColumns(dbPath, 'intraday_rollup_status')
  assert.deepEqual(statusColumns.map((row) => row.name), [
    'provider',
    'day',
    'candidate_streamers',
    'retained_streamers',
    'retained_streamer_cap',
    'source_snapshots',
    'selection_state',
    'coverage_state',
    'source_mode',
    'contract_version',
    'refreshed_at',
  ])
  assert.deepEqual(statusColumns.filter((row) => row.pk > 0).sort((a, b) => a.pk - b.pk).map((row) => row.name), ['provider', 'day'])

  const indexColumns = rows(dbPath, "SELECT name FROM pragma_index_info('idx_intraday_streamer_day') ORDER BY seqno;")
  assert.deepEqual(indexColumns, ['provider', 'streamer_id', 'day'])

  assert.equal(Number(scalar(dbPath, 'SELECT COUNT(*) FROM streamer_intraday_rollups;')), 0)
  assert.equal(Number(scalar(dbPath, 'SELECT COUNT(*) FROM intraday_rollup_status;')), 0)
} finally {
  rmSync(root, { recursive: true, force: true })
}

console.log('12A-2 intraday migration verification passed.')
console.log('- accepted schema contract preserved')
console.log('- migration is idempotent')
console.log('- tables and index exist with expected columns')
console.log('- no rows are inserted')
console.log('- generation remains unauthorized')

function stripComments(source) {
  return source.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}

function rows(dbPath, query) {
  const output = execFileSync('sqlite3', ['-noheader', dbPath, query], { encoding: 'utf8' }).trim()
  return output ? output.split('\n') : []
}

function scalar(dbPath, query) {
  return execFileSync('sqlite3', ['-noheader', dbPath, query], { encoding: 'utf8' }).trim()
}

function pragmaColumns(dbPath, table) {
  const output = execFileSync('sqlite3', ['-json', dbPath, `PRAGMA table_info(${table});`], { encoding: 'utf8' }).trim()
  return JSON.parse(output || '[]').map((row) => ({ name: row.name, pk: Number(row.pk) }))
}
