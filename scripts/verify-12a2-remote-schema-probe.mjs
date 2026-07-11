#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('apps/web/functions/api/schema-audit.ts', 'utf8')
const contract = JSON.parse(readFileSync('docs/audits/12a2-remote-schema-probe-contract.json', 'utf8'))

assert.equal(contract.schemaVersion, 'viewloom-12a2-remote-schema-probe-contract-v1')
assert.equal(contract.workstream, '12A-2 remote schema apply and verification gate')
assert.equal(contract.route, '/api/schema-audit')
assert.equal(contract.readOnly, true)
assert.equal(contract.providerSeparated, true)
assert.equal(contract.queriesPerProvider, 1)
assert.equal(contract.querySource, 'sqlite_master')
assert.equal(contract.rawSqlReturned, false)
assert.deepEqual(contract.acceptance.providers, ['twitch', 'kick'])
assert.equal(contract.acceptance.expectedObjectCount, 3)
assert.equal(contract.acceptance.rowsWrittenMustBe, 0)
assert.equal(contract.acceptance.schemaCompleteRequiredBeforeGeneration, true)
assert.equal(contract.acceptance.definitionMatchesRequired, true)
assert.equal(contract.scope.migrationApplyIncluded, false)
assert.equal(contract.scope.backfillIncluded, false)
assert.equal(contract.scope.generationIncluded, false)
assert.equal(contract.scope.retentionChanged, false)
assert.equal(contract.scope.cronAdded, false)

assert.equal(contract.expectedObjects.length, 3)
assert.deepEqual(contract.expectedObjects, [
  { type: 'table', name: 'streamer_intraday_rollups' },
  { type: 'index', name: 'idx_intraday_streamer_day' },
  { type: 'table', name: 'intraday_rollup_status' },
])

for (const fragment of [
  "audit('twitch', env.DB_TWITCH_HOT)",
  "audit('kick', env.DB_KICK_HOT)",
  'FROM sqlite_master',
  'WHERE name IN (?, ?, ?)',
  '.run<SchemaRow>()',
  'schemaComplete:',
  'definitionMatches',
  'rowsWritten:',
  "mode: 'read-only-schema-probe'",
]) assert.ok(source.includes(fragment), `schema-audit source missing: ${fragment}`)

const preparedQueries = [...source.matchAll(/db\.prepare\(`([\s\S]*?)`\)/g)].map((match) => match[1])
assert.equal(preparedQueries.length, 1, 'schema-audit must contain exactly one prepared SQL template')
const preparedSql = preparedQueries[0]
assert.match(preparedSql, /^\s*SELECT\b/i, 'schema-audit SQL must be SELECT-only')
assert.match(preparedSql, /FROM\s+sqlite_master/i, 'schema-audit SQL must read sqlite_master')

for (const forbidden of [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bREPLACE\b/i,
  /\bCREATE\s+TABLE\b/i,
  /\bCREATE\s+INDEX\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bTRIGGER\b/i,
]) assert.equal(forbidden.test(preparedSql), false, `schema-audit prepared SQL contains forbidden write/DDL token: ${forbidden}`)

assert.equal(source.includes('sql: observed?.sql'), false, 'schema-audit must not return raw SQL definitions')
assert.equal(source.includes('sql: normalizedSql'), false, 'schema-audit must not return normalized SQL definitions')

console.log('12A-2 remote schema probe verification passed.')
console.log('- provider-separated read-only sqlite_master probe')
console.log('- one prepared SELECT query per provider')
console.log('- raw SQL definitions are not returned')
console.log('- prepared SQL contains no write or DDL statements')
