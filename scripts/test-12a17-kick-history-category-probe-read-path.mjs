import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const probe = read('workers/history-category-aggregate-cost-probe/src/index.ts')
const generator = read('workers/shared/history-category-aggregate.ts')

const count = (text, fragment) => text.split(fragment).length - 1
const section = (text, start, end) => {
  const from = text.indexOf(start)
  assert.notEqual(from, -1, `section start missing: ${start}`)
  const to = text.indexOf(end, from + start.length)
  assert.notEqual(to, -1, `section end missing: ${end}`)
  return text.slice(from, to)
}

assert.equal(probe.includes('precheckKickHistoryCategoryDay'), false, 'probe must not run a second raw category precheck')
assert.equal(count(probe, 'await refreshKickHistoryCategoryAggregateDay(db, day, { startDay: day })'), 1)

const refresh = section(
  generator,
  'export async function refreshKickHistoryCategoryAggregateDay(',
  'export async function cleanupKickHistoryCategoryProbeDay(',
)
assert.equal(count(refresh, 'precheckKickHistoryCategoryDay(db, day)'), 1, 'generator must own exactly one raw precheck')
assert.ok(
  refresh.indexOf('const precheck = await precheckKickHistoryCategoryDay(db, day)')
    < refresh.indexOf('const pendingResult = await upsertStatus('),
  'raw category precheck must remain before refresh_pending write',
)
assert.equal(count(refresh, 'HISTORY_CATEGORY_INSERT_DAILY_SQL'), 1)
assert.equal(count(refresh, 'HISTORY_CATEGORY_INSERT_STREAMER_DAILY_SQL'), 1)

const cheapPre = section(probe, 'async function inspectPreconditions(', 'async function inspectAggregateState(')
assert.equal(cheapPre.includes('precheckKickHistoryCategoryDay'), false)
assert.equal(cheapPre.includes('payload_json'), false)
assert.equal(cheapPre.includes('json_each'), false)
assert.ok(cheapPre.includes("WHERE provider = 'kick'"))
assert.ok(cheapPre.includes("WHERE provider != 'kick'"))

const aggregateInspect = section(probe, 'async function inspectAggregateState(', 'function authorized(')
assert.equal(aggregateInspect.includes('minute_snapshots'), false, 'during/post inspection must not read minute_snapshots')
assert.equal(aggregateInspect.includes('payload_json'), false)
assert.equal(aggregateInspect.includes('json_each'), false)
assert.ok(aggregateInspect.includes('history_category_daily'))
assert.ok(aggregateInspect.includes('history_category_streamer_daily'))
assert.ok(aggregateInspect.includes('history_category_day_status'))

assert.ok(probe.includes('categoryMetadataComplete:'))
assert.ok(probe.includes('operation?.precheck.categoryMissingItems'))
assert.ok(probe.includes('operation?.precheck.candidateCategoryRows'))
assert.ok(probe.includes('operation?.precheck.candidateStreamerCategoryRows'))
assert.ok(probe.includes('rawCategoryQueryPaths: 3'))
assert.ok(probe.includes('generatorPrecheck: 1'))
assert.ok(probe.includes('categoryDailyInsert: 1'))
assert.ok(probe.includes('streamerCategoryDailyInsert: 1'))
assert.ok(probe.includes('preInspect: 0'))
assert.ok(probe.includes('duringInspect: 0'))
assert.ok(probe.includes('postInspect: 0'))

const historicalRawPaths = 8
const candidateRawPaths = 3
const report = {
  historicalRawCategoryQueryPaths: historicalRawPaths,
  candidateRawCategoryQueryPaths: candidateRawPaths,
  rawCategoryPathReductionCount: historicalRawPaths - candidateRawPaths,
  rawCategoryPathReductionPct: ((historicalRawPaths - candidateRawPaths) / historicalRawPaths) * 100,
  permanentGeneratorPrecheckCount: count(refresh, 'precheckKickHistoryCategoryDay(db, day)'),
  probeDirectPrecheckCount: count(probe, 'precheckKickHistoryCategoryDay'),
  aggregateInsertRawPaths: 2,
  duringPostMinuteSnapshotReads: 0,
  productionExecutionAuthorized: false,
}
assert.equal(report.rawCategoryPathReductionPct, 62.5)
console.log(JSON.stringify(report, null, 2))
