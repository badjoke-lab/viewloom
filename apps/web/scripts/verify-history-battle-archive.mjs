import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const helperPath = 'functions/_history-battle-archive.ts'
const middlewarePath = 'functions/_middleware.ts'
const helperSource = read(helperPath)
const middleware = read(middlewarePath)
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const helper = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const today = new Date().toISOString().slice(0, 10)
const stream = (streamerId, viewerMinutes, observedMinutes = 120, peakViewers = Math.round(viewerMinutes / 10)) => ({
  streamerId,
  displayName: streamerId.toUpperCase(),
  viewerMinutes,
  observedMinutes,
  peakViewers,
})
const sample = {
  daily: [
    {
      day: '2026-06-17',
      coverageState: 'good',
      topStreamers: [stream('alpha', 1000), stream('beta', 950), stream('gamma', 500)],
    },
    {
      day: '2026-06-16',
      coverageState: 'partial',
      topStreamers: [stream('delta', 1500), stream('epsilon', 1490), stream('zeta', 100)],
    },
    {
      day: '2026-06-15',
      coverageState: 'missing',
      topStreamers: [stream('missing-a', 1000), stream('missing-b', 999)],
    },
    {
      day: today,
      coverageState: 'partial',
      topStreamers: [stream('current-a', 2000), stream('current-b', 1999)],
    },
    {
      day: '2026-06-14',
      coverageState: 'good',
      topStreamers: [stream('weak-a', 1000, 30), stream('weak-b', 999, 30)],
    },
  ],
}

const result = helper.historyBattleArchiveFromPayload(sample)
const entries = result.battleArchive
const meta = result.battleArchiveMeta
assert(helper.HISTORY_BATTLE_ARCHIVE_LIMIT === 30, 'Battle archive limit must remain 30.')
assert(helper.HISTORY_BATTLE_CANDIDATE_LIMIT === 5, 'Daily battle candidate limit must remain 5.')
assert(helper.HISTORY_BATTLE_MIN_OBSERVED_MINUTES === 60, 'Battle observed-minute baseline must remain 60.')
assert(entries.length === 2, 'Battle archive must exclude missing, current, and insufficient days.')
assert(entries[0].day === '2026-06-16', 'The closest relevant daily pair should rank first.')
assert(entries[0].streamerAId === 'delta' && entries[0].streamerBId === 'epsilon', 'Daily pair selection is wrong.')
assert(entries[0].timestamp === null && entries[0].timestampPrecision === 'day', 'Battle archive must stay day-precision only.')
assert(entries[0].exactEventTimeAvailable === false && entries[0].reversalCount === null, 'Battle archive inferred unsupported event evidence.')
assert(entries.every((entry, index) => entry.rank === index + 1), 'Battle archive ranks are not sequential.')
assert(meta.sourcePopulation === 'daily.topStreamers', 'Battle archive source population changed.')
assert(meta.archiveBasis === 'daily_aggregate_pair', 'Battle archive basis changed.')
assert(meta.limit === 30 && meta.bounded === true, 'Battle archive bounds are missing.')
assert(meta.providerSeparated === true && meta.inProgressDayExcluded === true, 'Battle archive separation metadata is missing.')
assert(meta.exactEventTimesAvailable === false && meta.inferredReversals === false, 'Battle archive truth metadata is wrong.')

const many = helper.historyBattleArchiveFromPayload({
  daily: Array.from({ length: 35 }, (_, index) => ({
    day: `2026-05-${String(index + 1).padStart(2, '0')}`,
    coverageState: 'good',
    topStreamers: [stream(`a-${index}`, 1000), stream(`b-${index}`, 900 + index)],
  })),
})
assert(many.battleArchive.length <= 30, 'Battle archive must remain bounded to 30 entries.')

for (const fragment of [
  'HISTORY_BATTLE_ARCHIVE_LIMIT = 30',
  'HISTORY_BATTLE_CANDIDATE_LIMIT = 5',
  'HISTORY_BATTLE_MIN_OBSERVED_MINUTES = 60',
  "sourcePopulation: 'daily.topStreamers'",
  "archiveBasis: 'daily_aggregate_pair'",
  'providerSeparated: true',
  'inProgressDayExcluded: true',
  'exactEventTimesAvailable: false',
  'inferredReversals: false',
  "headers.delete('content-length')",
]) assert(helperSource.includes(fragment), `${helperPath}: missing ${fragment}`)

for (const fragment of [
  "import { enrichHistoryBattleArchive } from './_history-battle-archive'",
  'const dailyResponse = await enrichHistoryStreamerDailyStats(response)',
  'const rankedResponse = await enrichHistoryRankings(dailyResponse)',
  'const peakResponse = await enrichHistoryPeakArchive(rankedResponse)',
  'return enrichHistoryBattleArchive(peakResponse)',
  "pathname.endsWith('/kick-history')",
]) assert(middleware.includes(fragment), `${middlewarePath}: missing ${fragment}`)
assert(middleware.indexOf('enrichHistoryRankings(dailyResponse)') < middleware.indexOf('enrichHistoryPeakArchive(rankedResponse)'), 'Peak archive must run after rankings.')
assert(middleware.indexOf('enrichHistoryPeakArchive(rankedResponse)') < middleware.indexOf('enrichHistoryBattleArchive(peakResponse)'), 'Battle archive must run after peak archive.')
assert(!middleware.includes("'/api/kick-history'"), 'Kick History must remain outside the Twitch coverage route set.')

const state = read('src/live/history-battle-archive-state.ts')
const renderer = read('src/live/history-battle-archive-render.ts')
const entry = read('src/live/history-battle-archive.ts')
const defaultDay = read('src/live/history-default-day.ts')
const css = read('src/history-battle-archive.css')
for (const fragment of [
  'battleArchiveEntries(',
  'payload.battleArchive',
  "timestampPrecision: 'day'",
  "archiveBasis: 'daily_aggregate_pair'",
  '.slice(0, LIMIT)',
]) assert(state.includes(fragment), `Battle archive state missing ${fragment}`)
for (const fragment of [
  'Battle archive',
  'Closest completed-day matchups',
  'Daily aggregates',
  'Day only',
  'No reversal or exact event time inferred.',
  '/battle-lines/',
  'Show all',
  'data-history-battle-day',
]) assert(renderer.includes(fragment), `Battle archive renderer missing ${fragment}`)
assert(entry.includes("import '../history-battle-archive.css'"), 'Battle archive CSS is not loaded.')
assert(entry.includes('installBattleArchivePayloadCapture(schedule)'), 'Battle archive payload capture is not wired.')
assert(defaultDay.includes("import './history-battle-archive'"), 'Battle archive must load before the current-shell History fetch.')
assert(css.includes('.history-battle-archive__grid') && css.includes('@media(max-width:760px)'), 'Battle archive responsive styles are missing.')

const twitchRoute = read('functions/api/history.ts')
const kickRoute = read('functions/api/kick-history.ts')
assert(twitchRoute.includes('DB_TWITCH_HOT') && !twitchRoute.includes('DB_KICK_HOT'), 'Twitch History storage separation failed.')
assert(kickRoute.includes('DB_KICK_HOT') && !kickRoute.includes('DB_TWITCH_HOT'), 'Kick History storage separation failed.')

const doc = read('docs/history-battle-archive-contract.md')
for (const fragment of [
  '`battleArchive` is generated',
  'capped at 30',
  'not evidence of a minute-level lead change',
  'day precision',
  'No combined archive',
  'No database table',
  'additional browser request',
]) assert(doc.includes(fragment), `Battle archive documentation missing: ${fragment}`)

if (failures.length) {
  console.error('History battle archive verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History battle archive verification passed.')
console.log('- completed observed days expose one bounded daily aggregate pair')
console.log('- exact event times and reversals are not inferred')
console.log('- the archive is capped at 30 and excludes the in-progress day')
console.log('- Twitch and Kick remain provider-separated')
