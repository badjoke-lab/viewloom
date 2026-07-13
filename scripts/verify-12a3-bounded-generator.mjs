#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const contract = JSON.parse(read('docs/audits/12a3-bounded-generator-contract.json'))
const state = JSON.parse(read('docs/audits/12a2-current-gate-state.json'))
const enablement = JSON.parse(read('docs/audits/12a3-generator-enablement-evidence.json'))
const postmerge = JSON.parse(read('docs/audits/12a3-postmerge-acceptance-evidence.json'))
const shared = read('workers/shared/intraday-rollup.ts')
const twitchEntry = read('workers/collector-twitch/src/entry.ts')
const kickEntry = read('workers/collector-kick/src/entry.ts')
const twitchWrangler = read('workers/collector-twitch/wrangler.toml')
const kickWrangler = read('workers/collector-kick/wrangler.toml')

// Historical PR #509 implementation contract remains immutable.
assert.equal(contract.schemaVersion, 'viewloom-12a3-bounded-generator-contract-v1')
assert.equal(contract.workstream, '12A-3 bounded production generator implementation')
assert.equal(contract.status, 'implementation_candidate')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.runtime.sharedModule, 'workers/shared/intraday-rollup.ts')
assert.equal(contract.runtime.enableFlag, 'INTRADAY_GENERATION_ENABLED')
assert.equal(contract.runtime.enabledValue, 'true')
assert.equal(contract.runtime.defaultEnabled, false)
assert.equal(contract.runtime.wranglerFlagPresent, false)
assert.equal(contract.runtime.productionGenerationStartedByMerge, false)
assert.equal(contract.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(contract.providers.twitch.streamerCap, 600)
assert.equal(contract.providers.kick.binding, 'DB_KICK_HOT')
assert.equal(contract.providers.kick.streamerCap, 200)
assert.equal(contract.schedule.existingCron, '*/5 * * * *')
assert.equal(contract.schedule.newCronAdded, false)
assert.deepEqual(contract.schedule.maintenanceWindowsUtc, ['00:20-00:24', '12:20-12:24'])
assert.deepEqual(contract.schedule.targetDays, ['today_utc', 'yesterday_utc'])
assert.equal(contract.schedule.intradayRetentionDays, 90)
assert.equal(contract.queryBudget.maximumGeneratorQueriesPerInvocation, 12)
assert.equal(contract.queryBudget.perStreamerD1CallsAllowed, false)
assert.equal(contract.queryBudget.setBasedSqlRequired, true)
assert.equal(contract.transaction.api, 'D1Database.batch')
assert.equal(contract.transaction.statementsPerDay, 4)
assert.equal(contract.transaction.idempotent, true)
assert.equal(contract.transaction.staleRowsRemoved, true)
assert.equal(contract.transaction.failureRollbackRequired, true)
assert.equal(contract.source.table, 'minute_snapshots')
assert.equal(contract.source.sourceRowsModified, false)
assert.equal(contract.source.noSourceDayPreserved, true)
assert.equal(contract.failureContainment.collectorRunsFirst, true)
assert.equal(contract.failureContainment.generatorRunsInFinally, true)
assert.equal(contract.failureContainment.generatorErrorsReturnedNotThrown, true)
assert.equal(contract.failureContainment.collectorOutcomeChanged, false)
for (const value of Object.values(contract.scope)) assert.equal(value, false)

// Current accepted state reflects PR #510 enablement and PR #511 accumulation.
assert.equal(state.generation.status, 'enabled_and_accumulating')
assert.equal(state.generation.authorized, true)
assert.equal(state.generation.runtimeGenerationStarted, true)
assert.equal(state.generation.providerSeparated, true)
assert.equal(state.generation.newCronAdded, false)
assert.equal(state.generation.backfillPerformed, false)
assert.equal(state.generationEnablement.pr, 510)
assert.equal(state.postMergeAccumulation.pr, 511)
assert.equal(state.postMergeAccumulation.postMergeAccumulationPass, true)
assert.equal(enablement.status, 'accepted')
assert.equal(enablement.acceptanceIdentity.pr, 510)
assert.equal(enablement.providerSeparated, true)
assert.equal(postmerge.status, 'accepted')
assert.equal(postmerge.gate.postMergeAccumulationPass, true)
assert.equal(postmerge.providers.twitch.providerGatePass, true)
assert.equal(postmerge.providers.kick.providerGatePass, true)

for (const fragment of [
  'const INTRADAY_RETENTION_DAYS = 90',
  'const MAX_GENERATOR_QUERIES = 12',
  "return value?.trim().toLowerCase() === 'true'",
  'return (hour === 0 || hour === 12) && minute >= 20 && minute < 25',
  'return [today, dayString(yesterdayDate)]',
  "selection_state = 'refresh_pending'",
  "'complete_within_daily_cap'",
  "'capped_at_daily_limit'",
  'source_mode',
  'coverageState',
  'DELETE FROM streamer_intraday_rollups',
  'DELETE FROM intraday_rollup_status',
  "date('now', ?)",
  'error: sanitizeError(error)',
]) assert.ok(shared.includes(fragment), `shared generator missing: ${fragment}`)

const writeBatch = shared.match(/const writeResults = await db\.batch\(\[([\s\S]*?)\n  \]\)/)
assert.ok(writeBatch, 'transactional provider-day write batch missing')
assert.equal((writeBatch[1].match(/db\.prepare\(/g) ?? []).length, 4, 'provider-day write batch must contain exactly four D1 statements')
assert.ok(writeBatch[1].includes('UPSERT_STREAMER_ROLLUPS_SQL'), 'set-based streamer upsert missing from batch')

const retentionBatch = shared.match(/const results = await db\.batch\(\[([\s\S]*?)\n  \]\)\n  return \{ attempted: true/)
assert.ok(retentionBatch, 'retention cleanup batch missing')
assert.equal((retentionBatch[1].match(/db\.prepare\(/g) ?? []).length, 2, 'retention cleanup must contain exactly two statements')

assert.equal(/for\s*\([^)]*streamer[^)]*\)[\s\S]{0,300}db\.(?:prepare|batch)/i.test(shared), false, 'per-streamer D1 calls are forbidden')
assert.equal(/(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+|FROM\s+)?minute_snapshots/i.test(shared), false, 'generator must not modify minute_snapshots')
assert.equal(/(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+|FROM\s+)?daily_rollups/i.test(shared), false, 'generator must not modify daily_rollups')
assert.equal(shared.includes('wrangler d1 execute'), false, 'direct D1 execute is forbidden')
assert.equal(shared.includes('export default'), false, 'shared generator must not expose a public Worker route')
assert.equal(shared.includes('async fetch('), false, 'shared generator must not expose fetch')
assert.equal(shared.includes('async scheduled('), false, 'shared generator must not own a cron handler')

for (const [provider, source, binding, cap, worker] of [
  ['twitch', twitchEntry, 'DB_TWITCH_HOT', 600, 'viewloom-collector-twitch'],
  ['kick', kickEntry, 'DB_KICK_HOT', 200, 'viewloom-collector-kick'],
]) {
  assert.ok(source.includes("import collector from './index'"), `${provider}: collector delegation missing`)
  assert.ok(source.includes("from '../../shared/intraday-rollup'"), `${provider}: shared generator import missing`)
  assert.ok(source.includes('INTRADAY_GENERATION_ENABLED?: string'), `${provider}: optional enable flag missing`)
  assert.ok(source.includes(`provider: '${provider}' as const`), `${provider}: provider config missing`)
  assert.ok(source.includes(`streamerCap: ${cap}`), `${provider}: cap mismatch`)
  assert.ok(source.includes('bucketMinutes: 5'), `${provider}: bucket contract missing`)
  assert.ok(source.includes('enabled: intradayGenerationEnabled(env.INTRADAY_GENERATION_ENABLED)'), `${provider}: enable gate missing`)
  assert.ok(source.includes(`maybeGenerateIntradayRollups(env.${binding}, generationConfig)`), `${provider}: accepted legacy generator path missing`)
  assert.ok(source.includes("'intraday_rollup_generation'"), `${provider}: legacy observability event missing`)
  assert.ok(source.includes(`worker: '${worker}'`), `${provider}: worker log identity missing`)

  const collectorAt = source.indexOf('await collector.scheduled(event, env)')
  const finallyAt = source.indexOf('finally {')
  const schemaAt = source.indexOf('await maybeApplyIntradaySchema')
  const generatorAt = source.indexOf(`await maybeGenerateIntradayRollups(env.${binding}, generationConfig)`)
  assert.ok(collectorAt >= 0 && finallyAt > collectorAt, `${provider}: collector must run before finally`)
  assert.ok(schemaAt > finallyAt && generatorAt > schemaAt, `${provider}: schema then legacy generator order invalid`)
}

for (const [provider, source] of [
  ['twitch', twitchWrangler],
  ['kick', kickWrangler],
]) {
  assert.match(source, /^crons = \["\*\/5 \* \* \* \*"\]$/m, `${provider}: existing cron changed`)
  assert.match(source, /^INTRADAY_GENERATION_ENABLED = "true"$/m, `${provider}: accepted generation enablement missing`)
  assert.equal(/^CATEGORY_CAPTURE_ENABLED\s*=/m.test(source), false, `${provider}: category capture must remain disabled`)
}

console.log('12A-3 bounded generator static verification passed.')
console.log('- historical PR #509 implementation contract remains unchanged')
console.log('- PR #510 generation enablement and PR #511 accumulation are accepted')
console.log('- provider-specific caps and D1 bindings remain separate')
console.log('- existing maintenance windows, 12-query budget, and cron are unchanged')
console.log('- disabled category path preserves the accepted legacy generator')
console.log('- no per-streamer D1 calls, backfill, or source-table mutation')
