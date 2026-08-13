import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contract = json('docs/audits/12a15-kick-history-category-aggregate-generator-contract.json')
const schemaAcceptance = json('docs/audits/12a14-kick-history-category-schema-final-acceptance.json')
const sql = read('workers/shared/history-category-aggregate-sql.ts')
const generator = read('workers/shared/history-category-aggregate.ts')
const probe = read('workers/history-category-aggregate-cost-probe/src/index.ts')
const wrangler = read('workers/history-category-aggregate-cost-probe/wrangler.kick.toml')
const kickEntry = read('workers/collector-kick/src/entry.ts')
const kickConfig = read('workers/collector-kick/wrangler.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a15-kick-history-category-aggregate-generator-contract-v1')
assert.equal(contract.status, 'dormant_package_candidate_no_production_execution')
assert.equal(contract.phase, '12A-15')
assert.equal(contract.trackingIssue, 846)
assert.equal(contract.provider, 'kick')
assert.equal(contract.acceptedAuthority.capacityDecisionPr, 830)
assert.equal(contract.acceptedAuthority.schemaBenchmarkPr, 832)
assert.equal(contract.acceptedAuthority.productionSchemaAcceptancePr, 845)
assert.equal(contract.acceptedAuthority.acceptedMainSha, 'ba5894ced1025bcb46ddd382eb29c3f2b76e057a')
assert.equal(schemaAcceptance.status, 'accepted')
assert.equal(schemaAcceptance.authorization.kickHistoryCategoryAggregateSchemaAccepted, true)
assert.equal(schemaAcceptance.authorization.aggregateGeneratorProductionEnablementAuthorized, false)

assert.equal(contract.generator.bucketMinutes, 5)
assert.equal(contract.generator.retentionDays, 180)
assert.equal(contract.generator.categoryRowCapPerDay, 300)
assert.equal(contract.generator.streamerCategoryRowCapPerDay, 1000)
assert.equal(contract.generator.maximumNormalStatementsAtTwoEligibleDaysPlusCleanup, 17)
assert.equal(contract.generator.newCron, false)
assert.equal(contract.generator.explicitStartDayRequired, true)
assert.equal(contract.generator.preActivationDaysEligible, false)
assert.equal(contract.generator.permanentRuntimeIntegrationIncluded, false)

for (const fragment of [
  "json_extract(s.payload_json, '$.categoryContractVersion')",
  "json_type(\n      s.payload_json,\n      '$.categoryRefs['",
  "category_ref_type = 'integer'",
  'candidate_category_rows',
  'candidate_streamer_category_rows',
  'category_missing_items',
  'snapshot_category AS (',
  'SUM(viewers) AS snapshot_viewers',
  'MAX(snapshot_viewers) AS peak_viewers',
  'SUM(snapshot_viewers * ?) AS total_viewer_minutes',
  'SUM(viewers * ?) AS viewer_minutes',
  'MAX(viewers) AS peak_viewers',
  'COUNT(*) * ? AS observed_minutes',
  'DELETE FROM history_category_daily',
  'DELETE FROM history_category_streamer_daily',
  'DELETE FROM history_category_day_status',
]) assert.ok(sql.includes(fragment), `aggregate SQL missing: ${fragment}`)
assert.equal(/ROW_NUMBER\s*\(|LIMIT\s+\d+/i.test(sql), false, 'History category aggregate SQL must not pre-rank or Top-K contributors')

for (const fragment of [
  "export const HISTORY_CATEGORY_RETENTION_DAYS = 180",
  "export const HISTORY_CATEGORY_ROW_CAP = 300",
  "export const HISTORY_CATEGORY_STREAMER_ROW_CAP = 1000",
  "export const HISTORY_CATEGORY_MAX_NORMAL_STATEMENTS = 17",
  "const PROVIDER = 'kick' as const",
  'shouldRunIntradayGeneration(now)',
  "targetDays(now).filter((day) => day >= config.startDay)",
  "return 'unavailable_no_category_data'",
  "return 'unavailable_missing_category'",
  "return 'unavailable_overflow'",
  "'refresh_pending'",
  "'unavailable_generation_mismatch'",
  "precheck.sourceSnapshots >= 240 ? 'observed' : 'partial'",
  "db.prepare('DELETE FROM history_category_daily WHERE provider = ? AND day = ?')",
  "db.prepare('DELETE FROM history_category_streamer_daily WHERE provider = ? AND day = ?')",
  'generatedCategoryRows !== precheck.candidateCategoryRows',
  'generatedStreamerCategoryRows !== precheck.candidateStreamerCategoryRows',
  "const boundary = `-${HISTORY_CATEGORY_RETENTION_DAYS} days`",
]) assert.ok(generator.includes(fragment), `generator safety/semantics missing: ${fragment}`)
assert.equal(generator.includes("provider: 'twitch'"), false)
assert.equal(generator.includes('CATEGORY_CAPTURE_ENABLED'), false)

assert.equal(contract.semantics.topKStored, false)
assert.equal(contract.semantics.rankingDuringGeneration, false)
assert.equal(contract.semantics.latestCategoryBackProjection, false)
assert.equal(contract.semantics.nameOnlyIdentity, false)
assert.equal(contract.semantics.missingAsZero, false)
assert.equal(contract.replacementSafety.pendingStatusWrittenBeforeReplacement, true)
assert.equal(contract.replacementSafety.postWriteCandidateCountCheck, true)
assert.equal(contract.replacementSafety.partialAggregateExposureAuthorized, false)

for (const fragment of [
  "const CONFIRMATION = 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE'",
  "url.pathname === '/inspect'",
  "url.pathname === '/probe'",
  "day !== new Date().toISOString().slice(0, 10)",
  "error: 'probe_day_must_equal_current_utc_day'",
  'targetAggregateRowsZero: pre.aggregateRows.total === 0',
  'categoryMetadataComplete:',
  'refreshKickHistoryCategoryAggregateDay(db, day, { startDay: day })',
  'cleanupKickHistoryCategoryProbeDay(db, day)',
  'postTargetRowsZero: post.aggregateRows.total === 0',
  'permanentGeneratorStillDisabled: true',
  'productionExecutionAuthorizedByPackage: false',
  'newCron: false',
  'backfill: false',
  'twitchOperationAvailable: false',
]) assert.ok(probe.includes(fragment), `cost probe boundary missing: ${fragment}`)
assert.equal(/scheduled\s*\(/.test(probe), false, 'cost probe must not expose scheduled handler')
assert.equal(probe.includes('/collect'), false, 'cost probe must not expose collector route')

assert.ok(wrangler.includes('name = "viewloom-history-category-aggregate-cost-probe-kick"'))
assert.ok(wrangler.includes('database_name = "vl_kick_hot"'))
assert.equal(wrangler.includes('vl_twitch_hot'), false)
assert.equal(wrangler.includes('[triggers]'), false)

for (const [key, expected] of Object.entries({
  temporaryCostProbeProductionExecutionAuthorized: false,
  permanentGeneratorEnablementAuthorized: false,
  collectorIntegrationAuthorized: false,
  collectorDeploymentAuthorized: false,
  newCronAuthorized: false,
  backfillAuthorized: false,
  rawRetentionChangeAuthorized: false,
  historyApiCategoryAuthorized: false,
  historyCategoryUiAuthorized: false,
  publicCutoverAuthorized: false,
  twitchRolloutAuthorized: false,
  crossProviderBehaviorAuthorized: false,
})) assert.equal(contract.authorization[key], expected, `${key} boundary mismatch`)

assert.equal(kickEntry.includes('maybeGenerateKickHistoryCategoryAggregates'), false, 'dormant package must not wire generator into collector')
assert.equal(kickConfig.includes('HISTORY_CATEGORY'), false, 'dormant package must not commit generator runtime config')
assert.equal(kickConfig.includes('crons = ["*/5 * * * *"]'), true, 'existing Kick cadence must remain unchanged')

for (const key of [
  'categorySwitching',
  'concurrentCategoryPeakNotSumOfStreamerPeaks',
  'viewerMinutes',
  'streamerCategoryPeakAndObservedMinutes',
  'providerIsolation',
  'integerCategoryRefType',
  'missingCategoryMetadata',
  'wrongCategoryContract',
  'partialSnapshotCoverage',
  'categoryOverflow301',
  'streamerCategoryOverflow1001',
  'idempotentReplacement',
  'startDayBoundary',
  'maintenanceWindowReuse',
  'retention180Days',
]) assert.equal(contract.deterministicFixtures[key], true, `fixture contract missing: ${key}`)

console.log('Kick History category aggregate generator package verified: observation-time provider-scoped membership, exact concurrent category peaks, no Top-K, fail-close missing/overflow handling, explicit forward-only start boundary, 180-day retention, and dormant current-day-only cost probe.')
