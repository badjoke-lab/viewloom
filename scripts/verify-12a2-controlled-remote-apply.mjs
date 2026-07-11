#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migrationSql = readFileSync('db/d1/004_intraday_rollups.sql', 'utf8')
const sharedSource = readFileSync('workers/shared/intraday-schema.ts', 'utf8')
const twitchEntry = readFileSync('workers/collector-twitch/src/entry.ts', 'utf8')
const kickEntry = readFileSync('workers/collector-kick/src/entry.ts', 'utf8')
const twitchWrangler = readFileSync('workers/collector-twitch/wrangler.toml', 'utf8')
const kickWrangler = readFileSync('workers/collector-kick/wrangler.toml', 'utf8')
const contract = JSON.parse(readFileSync('docs/audits/12a2-controlled-remote-apply-contract.json', 'utf8'))

assert.equal(contract.schemaVersion, 'viewloom-12a2-controlled-remote-apply-contract-v1')
assert.equal(contract.workstream, '12A-2 controlled remote schema apply and verification')
assert.equal(contract.acceptedMigrationFile, 'db/d1/004_intraday_rollups.sql')
assert.equal(contract.sharedBootstrapModule, 'workers/shared/intraday-schema.ts')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.schedule.newCronAdded, false)
assert.equal(contract.schedule.existingCollectorCron, '*/5 * * * *')
assert.deepEqual(contract.schedule.maintenanceWindowsUtc, ['00:20-00:24', '12:20-12:24'])
assert.equal(contract.schedule.maximumBootstrapAttemptsPerProviderPerDay, 2)
assert.equal(contract.bootstrap.preflightReadOnlyProbe, true)
assert.equal(contract.bootstrap.preflightObjectCount, 3)
assert.equal(contract.bootstrap.ddlStatementCount, 3)
assert.equal(contract.bootstrap.ddlMustMatchAcceptedMigration, true)
assert.equal(contract.bootstrap.idempotent, true)
assert.equal(contract.bootstrap.skipDdlWhenAllObjectsPresent, true)
assert.equal(contract.bootstrap.failureContained, true)
assert.equal(contract.bootstrap.collectorResultPreserved, true)
assert.equal(contract.scope.backfillIncluded, false)
assert.equal(contract.scope.generationIncluded, false)
assert.equal(contract.scope.retentionChanged, false)
assert.equal(contract.scope.categoryCaptureIncluded, false)
assert.equal(contract.scope.providerStartedAtIncluded, false)
assert.equal(contract.scope.exactSessionFieldsIncluded, false)
assert.equal(contract.scope.crossProviderAnalyticsIncluded, false)
assert.equal(contract.deploymentBoundary.repositoryMergeDoesNotClaimWorkerDeployment, true)
assert.equal(contract.deploymentBoundary.productionSchemaEvidenceRequiredAfterDeploy, true)
assert.equal(contract.deploymentBoundary.generationMustRemainDisabled, true)

const migrationStatements = splitStatements(stripSqlComments(migrationSql)).map(normalizeSql)
assert.equal(migrationStatements.length, 3, 'accepted migration must contain exactly three SQL statements')

const arrayBody = sharedSource.match(/INTRADAY_SCHEMA_STATEMENTS\s*=\s*\[([\s\S]*?)\]\s*as const/)
assert.ok(arrayBody, 'shared bootstrap DDL array missing')
const bootstrapStatements = [...arrayBody[1].matchAll(/`([\s\S]*?)`/g)].map((match) => normalizeSql(match[1]))
assert.equal(bootstrapStatements.length, 3, 'bootstrap must contain exactly three DDL statements')
assert.deepEqual(bootstrapStatements, migrationStatements, 'bootstrap DDL must exactly match accepted migration after normalization')

for (const fragment of [
  'SELECT COUNT(*) AS count',
  'FROM sqlite_master',
  'WHERE name IN (?, ?, ?)',
  'observedObjectCount === EXPECTED_SCHEMA_OBJECTS.length',
  'db.batch(INTRADAY_SCHEMA_STATEMENTS.map((statement) => db.prepare(statement)))',
  'return (hour === 0 || hour === 12) && minute >= 20 && minute < 25',
  'catch (error)',
]) assert.ok(sharedSource.includes(fragment), `shared bootstrap missing: ${fragment}`)

for (const [provider, source, binding] of [
  ['twitch', twitchEntry, 'DB_TWITCH_HOT'],
  ['kick', kickEntry, 'DB_KICK_HOT'],
]) {
  assert.ok(source.includes("import collector from './index'"), `${provider}: collector delegation missing`)
  assert.ok(source.includes("import { maybeApplyIntradaySchema } from '../../shared/intraday-schema'"), `${provider}: bootstrap import missing`)
  assert.ok(source.includes(`maybeApplyIntradaySchema(env.${binding})`), `${provider}: provider binding bootstrap missing`)
  assert.ok(source.includes(`provider: '${provider}'`), `${provider}: provider log marker missing`)
  assert.ok(source.includes('try {'), `${provider}: scheduled try block missing`)
  assert.ok(source.includes('finally {'), `${provider}: scheduled finally block missing`)
  const collectAt = source.indexOf('await collector.scheduled(event, env)')
  const bootstrapAt = source.indexOf(`await maybeApplyIntradaySchema(env.${binding})`)
  assert.ok(collectAt >= 0 && bootstrapAt > collectAt, `${provider}: bootstrap must follow collector scheduled invocation`)
}

assert.match(twitchWrangler, /^main = "src\/entry\.ts"$/m)
assert.match(kickWrangler, /^main = "src\/entry\.ts"$/m)
assert.match(twitchWrangler, /^crons = \["\*\/5 \* \* \* \*"\]$/m)
assert.match(kickWrangler, /^crons = \["\*\/5 \* \* \* \*"\]$/m)
assert.match(twitchWrangler, /binding = "DB_TWITCH_HOT"/)
assert.match(kickWrangler, /binding = "DB_KICK_HOT"/)

const executableBootstrap = sharedSource
  .replace(/INTRADAY_SCHEMA_STATEMENTS\s*=\s*\[[\s\S]*?\]\s*as const/, '')
for (const forbidden of [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bREPLACE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bTRIGGER\b/i,
]) assert.equal(forbidden.test(executableBootstrap), false, `bootstrap control flow contains forbidden DML/DDL outside accepted statement array: ${forbidden}`)

console.log('12A-2 controlled remote apply verification passed.')
console.log('- shared bootstrap DDL exactly matches accepted migration')
console.log('- provider bindings remain separate')
console.log('- existing collector cron unchanged')
console.log('- maintenance windows bounded to two attempts per provider per day')
console.log('- collection delegation precedes contained schema bootstrap')
console.log('- generation and backfill remain absent')

function stripSqlComments(source) {
  return source.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
}

function splitStatements(source) {
  return source.split(';').map((statement) => statement.trim()).filter(Boolean)
}

function normalizeSql(source) {
  return source
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim()
}
