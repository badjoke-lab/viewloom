#!/usr/bin/env node

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-migration-runtime-contract.json'))

for (const path of [
  'db/d1/005_category_capture.sql',
  'workers/shared/category-capture.ts',
  'workers/shared/category-intraday-sql.ts',
  'workers/shared/category-intraday-rollup.ts',
  'workers/collector-twitch/src/index-category.ts',
  'workers/collector-twitch/src/index.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/index-category.ts',
  'workers/collector-kick/src/index.ts',
  'workers/collector-kick/src/entry.ts',
  'workers/collector-kick/src/official-livestreams.ts',
  'scripts/test-12a4-category-migration-runtime.py',
]) assert.equal(existsSync(path), true, `missing category implementation file: ${path}`)

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-migration-runtime-contract-v1')
assert.equal(contract.status, 'implemented_candidate')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.acceptedInputs.sourceAuditPr, 513)
assert.equal(contract.acceptedInputs.storageDesignPr, 514)
assert.equal(contract.acceptedInputs.storageCloseoutPr, 515)
assert.equal(contract.acceptedInputs.categoryContractVersion, 'category-source-v1')
assert.equal(contract.acceptedInputs.selectedStorageModel, 'embedded_hourly')
assert.equal(contract.migration.path, 'db/d1/005_category_capture.sql')
assert.equal(contract.migration.repositoryCandidateImplemented, true)
assert.equal(contract.migration.remoteApplied, false)
assert.equal(contract.migration.automaticProductionBootstrapAdded, false)
assert.equal(contract.migration.controlledApplyRequired, true)
assert.equal(contract.migration.newCategoryIndex, false)
assert.equal(contract.runtime.flag, 'CATEGORY_CAPTURE_ENABLED')
assert.equal(contract.runtime.defaultEnabled, false)
assert.equal(contract.runtime.committedWranglerValue, false)
assert.equal(contract.runtime.productionCaptureStarted, false)
assert.equal(contract.runtime.dictionary.statementsPerCollectionWhenEnabled, 1)
assert.equal(contract.runtime.dictionary.setBased, true)
assert.equal(contract.runtime.dictionary.unchangedNameWriteAllowed, false)
assert.equal(contract.runtime.dictionary.failureChangesCollectorSuccess, false)
assert.equal(contract.runtime.twitch.providerIdPath, 'game_id')
assert.equal(contract.runtime.twitch.namePath, 'game_name')
assert.equal(contract.runtime.twitch.boundedWindow, 300)
assert.equal(contract.runtime.kick.providerIdPath, 'category.id')
assert.equal(contract.runtime.kick.namePath, 'category.name')
assert.equal(contract.runtime.kick.boundedWindow, 100)
assert.equal(contract.runtime.kick.alternateSourcesCanApproveOrPopulatePrimaryContract, false)
assert.equal(contract.rollup.providerSeparated, true)
assert.equal(contract.rollup.hourBuckets, 24)
assert.equal(contract.rollup.generatorMaximumQueries, 12)
assert.equal(contract.rollup.additionalGeneratorStatements, 0)
assert.equal(contract.rollup.retentionDays, 90)
assert.equal(contract.rollup.exactCategorySwitchTimeClaimAllowed, false)
assert.equal(contract.rollup.exactSessionClaimAllowed, false)
assert.deepEqual(contract.rollup.categoryHourlyJsonKeys, ['v', 'c', 'r', 's', 'm', 'o', 'x'])
assert.deepEqual(contract.coverageStates, [
  'observed',
  'missing_from_source',
  'not_in_bounded_window',
  'partial_source_coverage',
  'stale',
  'unavailable',
])
assert.equal(contract.nextGate.productionExecutionCostProbeRequired, true)
assert.equal(contract.nextGate.remoteMigrationApplyAuthorized, false)
assert.equal(contract.nextGate.runtimeCaptureEnablementAuthorized, false)
for (const value of Object.values(contract.boundaries)) assert.equal(value, false)

const migration = read('db/d1/005_category_capture.sql')
for (const fragment of [
  'CREATE TABLE IF NOT EXISTS provider_category_dictionary',
  'PRIMARY KEY (provider, category_id)',
  'ADD COLUMN category_hourly_json',
  'ADD COLUMN category_observed_samples',
  'ADD COLUMN category_missing_samples',
  'ADD COLUMN category_contract_version',
  'ADD COLUMN category_observed_streamers',
  'ADD COLUMN category_coverage_state',
  'Do not apply to production',
  'PRAGMA table_info',
]) assert.ok(migration.includes(fragment), `migration missing: ${fragment}`)
for (const forbidden of [
  'CREATE INDEX',
  'wrangler d1 execute',
  'INSERT INTO minute_snapshots',
  'UPDATE minute_snapshots',
  'DELETE FROM minute_snapshots',
]) assert.equal(migration.includes(forbidden), false, `migration contains forbidden operation: ${forbidden}`)

const capture = read('workers/shared/category-capture.ts')
for (const fragment of [
  "CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  "value?.trim().toLowerCase() === 'true'",
  'categoryIds',
  'categoryRefs',
  'stripCategorySourceFields',
  'CATEGORY_DICTIONARY_UPSERT_SQL',
  'FROM json_each(?)',
  'ON CONFLICT(provider, category_id)',
  'WHERE provider_category_dictionary.category_name != excluded.category_name',
]) assert.ok(capture.includes(fragment), `category capture missing: ${fragment}`)
assert.equal((capture.match(/INSERT INTO provider_category_dictionary/g) ?? []).length, 1)

const categorySql = read('workers/shared/category-intraday-sql.ts')
for (const fragment of [
  'CATEGORY_PRECHECK_SQL',
  'CATEGORY_UPSERT_STREAMER_ROLLUPS_SQL',
  'CATEGORY_STATUS_UPSERT_SQL',
  'WITH RECURSIVE',
  'WHERE hour < 23',
  "'v', 1",
  "'c', json(",
  "'r', json(",
  "'s', json(",
  "'m', json(",
  "'o', COALESCE",
  "'x', COALESCE",
  'ORDER BY sample_count DESC, viewer_minutes DESC, category_id ASC',
]) assert.ok(categorySql.includes(fragment), `category intraday SQL missing: ${fragment}`)
assert.equal(categorySql.includes('CREATE INDEX'), false)

const categoryRollup = read('workers/shared/category-intraday-rollup.ts')
for (const fragment of [
  'const MAX_GENERATOR_QUERIES = 12',
  'for (const day of targetDays(now))',
  'const writeResults = await db.batch([',
  'CATEGORY_UPSERT_STREAMER_ROLLUPS_SQL',
  'CATEGORY_STATUS_UPSERT_SQL',
  'maximumQueries: MAX_GENERATOR_QUERIES',
  "reason: 'outside_maintenance_window'",
]) assert.ok(categoryRollup.includes(fragment), `category generator missing: ${fragment}`)
assert.equal(categoryRollup.includes('SELECT\n      category_observed_samples'), false, 'category generator must not add a post-write result query')
assert.equal((categoryRollup.match(/db\.prepare\(/g) ?? []).length, 7, 'category generator static prepare budget changed')

const twitch = read('workers/collector-twitch/src/index-category.ts')
for (const fragment of [
  'game_id?: string',
  'game_name?: string',
  'categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)',
  'encodeCategorySnapshot(input.items, input.hasMore)',
  'stripCategorySourceFields(input.items)',
  '...encoded.payloadFields',
  'writeCategoryDictionary(',
  'dictionary: { error: sanitizeCategoryError(error) }',
  "unixepoch('now', '-30 days')",
  "unixepoch('now', '-180 days')",
]) assert.ok(twitch.includes(fragment), `Twitch category collector missing: ${fragment}`)
assert.ok(twitch.indexOf('await env.DB_TWITCH_HOT.batch([') < twitch.indexOf('writeCategoryDictionary('), 'Twitch core snapshot write must precede dictionary write')

const kick = read('workers/collector-kick/src/index-category.ts')
for (const fragment of [
  'categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)',
  "collectorMeta.sourceMode === 'official-livestreams'",
  'encodeCategorySnapshot(items, !acceptedPrimarySource)',
  'stripCategorySourceFields(items)',
  '...encoded.payloadFields',
  'writeCategoryDictionary(',
  'dictionary: { error: sanitizeCategoryError(error) }',
  "unixepoch('now', '-60 days')",
  "unixepoch('now', '-180 days')",
]) assert.ok(kick.includes(fragment), `Kick category collector missing: ${fragment}`)
assert.ok(kick.indexOf('await env.DB_KICK_HOT.prepare(`') < kick.indexOf('writeCategoryDictionary('), 'Kick core snapshot write must precede dictionary write')

const kickOfficial = read('workers/collector-kick/src/official-livestreams.ts')
for (const fragment of [
  'categoryProviderId?: string | null',
  'categoryName?: string | null',
  'const category = asRecord(raw.category)',
  'const categoryProviderId = asIdentifier(category?.id)',
  'const categoryName = asText(category?.name)',
]) assert.ok(kickOfficial.includes(fragment), `Kick primary source parser missing: ${fragment}`)

const twitchIndex = read('workers/collector-twitch/src/index.ts')
const kickIndex = read('workers/collector-kick/src/index.ts')
assert.equal(twitchIndex.trim(), "export { default } from './index-category'")
assert.equal(kickIndex.trim(), "export { default } from './index-category'")

for (const [provider, entryPath] of [
  ['twitch', 'workers/collector-twitch/src/entry.ts'],
  ['kick', 'workers/collector-kick/src/entry.ts'],
]) {
  const entry = read(entryPath)
  assert.ok(entry.includes("import collector from './index'"), `${provider}: accepted collector delegation missing`)
  assert.ok(entry.includes('categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)'), `${provider}: disabled flag routing missing`)
  assert.ok(entry.includes('categoryEnabled && generationConfig.enabled'), `${provider}: category generator gate missing`)
  assert.ok(entry.includes('maybeGenerateIntradayRollups'), `${provider}: legacy disabled path missing`)
}

for (const path of [
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
]) {
  const source = read(path)
  const active = source.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'))
  assert.equal(active.some((line) => /^CATEGORY_CAPTURE_ENABLED\s*=/.test(line)), false, `${path}: production category flag committed`)
  assert.ok(source.includes('crons = ["*/5 * * * *"]'), `${path}: 5-minute cron changed`)
}

const schemaBootstrap = read('workers/shared/intraday-schema.ts')
for (const forbidden of [
  '005_category_capture.sql',
  'provider_category_dictionary',
  'category_hourly_json',
  'CATEGORY_CAPTURE_ENABLED',
]) assert.equal(schemaBootstrap.includes(forbidden), false, `production schema bootstrap changed: ${forbidden}`)

const fixture = read('scripts/test-12a4-category-migration-runtime.py')
for (const fragment of [
  'apply_migration_idempotently',
  'unchanged_changes == 0',
  'provider_category_dictionary',
  'len(payload["r"]) == 24',
  'before_rows == after_rows',
]) assert.ok(fixture.includes(fragment), `local fixture missing: ${fragment}`)

const serialized = [migration, capture, categorySql, categoryRollup, twitch, kick].join('\n')
for (const forbidden of [
  'wrangler d1 execute',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'combined-provider category ranking',
]) assert.equal(serialized.includes(forbidden), false, `implementation contains forbidden content: ${forbidden}`)

console.log('12A-4 category migration and disabled runtime verification passed.')
console.log('- repository migration candidate implemented but not applied remotely')
console.log('- category capture flag remains absent from production Wrangler configs')
console.log('- Twitch and Kick source, dictionary, raw payload, and rollup contracts remain separate')
console.log('- category-aware intraday generator remains within twelve queries')
console.log('- production execution-cost probe remains required before enablement')
