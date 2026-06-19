import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const helperPath = 'functions/_history-peak-archive.ts'
const middlewarePath = 'functions/_middleware.ts'
const helperSource = read(helperPath)
const middleware = read(middlewarePath)
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const helper = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const today = new Date().toISOString().slice(0, 10)
const sample = {
  daily: [
    {
      day: '2026-06-17',
      peakTime: '2026-06-17T12:35:00Z',
      peakViewers: 9000,
      peakStreamerId: 'alpha',
      peakStreamerName: 'Alpha',
      peakCategory: 'Just Chatting',
      coverageState: 'good',
    },
    {
      day: '2026-06-16',
      peakTime: '2026-06-15T23:59:00Z',
      peakViewers: 12000,
      peakStreamerName: 'Beta',
      coverageState: 'partial',
    },
    {
      day: '2026-06-15',
      peakViewers: 5000,
      peakStreamerName: 'Gamma',
      coverageState: 'missing',
    },
    {
      day: today,
      peakViewers: 20000,
      peakStreamerName: 'Current',
      coverageState: 'partial',
    },
    {
      day: '2026-06-14',
      peakViewers: 0,
      coverageState: 'good',
    },
  ],
}

const result = helper.historyPeakArchiveFromPayload(sample)
const entries = result.peakArchive
const meta = result.peakArchiveMeta
assert(helper.HISTORY_PEAK_ARCHIVE_LIMIT === 30, 'Peak archive limit must remain 30.')
assert(entries.length === 2, 'Peak archive must exclude missing, zero, and in-progress days.')
assert(entries[0].day === '2026-06-16' && entries[0].peakViewers === 12000, 'Peak archive order is wrong.')
assert(entries[0].timestamp === null && entries[0].timestampPrecision === 'day', 'Mismatched timestamps must fall back to day precision.')
assert(entries[1].day === '2026-06-17' && entries[1].timestamp === '2026-06-17T12:35:00.000Z', 'Valid exact timestamp was not normalized.')
assert(entries[1].category === 'Just Chatting' && entries[1].streamer === 'Alpha', 'Optional peak context was not retained.')
assert(entries.every((entry, index) => entry.rank === index + 1), 'Peak ranks are not sequential.')
assert(meta.sourcePopulation === 'daily', 'Peak source population changed.')
assert(meta.limit === 30 && meta.bounded === true, 'Peak archive bounds are missing.')
assert(meta.providerSeparated === true && meta.inProgressDayExcluded === true, 'Peak archive separation metadata is missing.')
assert(meta.exactTimestampCount === 1 && meta.categoryCount === 1, 'Peak context counts are wrong.')

const many = helper.historyPeakArchiveFromPayload({
  daily: Array.from({ length: 35 }, (_, index) => ({
    day: `2026-05-${String(index + 1).padStart(2, '0')}`,
    peakViewers: 10000 - index,
    coverageState: 'good',
  })),
})
assert(many.peakArchive.length <= 30, 'Peak archive must remain bounded to 30 entries.')

for (const fragment of [
  'HISTORY_PEAK_ARCHIVE_LIMIT = 30',
  "sourcePopulation: 'daily'",
  'providerSeparated: true',
  'inProgressDayExcluded: true',
  "timestampPrecision: timestamp ? 'minute' : 'day'",
  "headers.delete('content-length')",
]) assert(helperSource.includes(fragment), `${helperPath}: missing ${fragment}`)

for (const fragment of [
  "import { enrichHistoryPeakArchive } from './_history-peak-archive'",
  'const dailyResponse = await enrichHistoryStreamerDailyStats(response)',
  'const rankedResponse = await enrichHistoryRankings(dailyResponse)',
  'const peakResponse = await enrichHistoryPeakArchive(rankedResponse)',
  "pathname.endsWith('/kick-history')",
]) assert(middleware.includes(fragment), `${middlewarePath}: missing ${fragment}`)
assert(middleware.indexOf('enrichHistoryStreamerDailyStats(response)') < middleware.indexOf('enrichHistoryRankings(dailyResponse)'), 'Daily stats must run before rankings.')
assert(middleware.indexOf('enrichHistoryRankings(dailyResponse)') < middleware.indexOf('enrichHistoryPeakArchive(rankedResponse)'), 'Peak archive must run after rankings.')
assert(!middleware.includes("'/api/kick-history'"), 'Kick History must remain outside the Twitch coverage route set.')

const state = read('src/live/history-peak-archive-state.ts')
const renderer = read('src/live/history-peak-archive-render.ts')
const entry = read('src/live/history-peak-archive.ts')
const defaultDay = read('src/live/history-default-day.ts')
const css = read('src/history-peak-archive.css')
for (const fragment of [
  'peakArchiveEntries(',
  'payload.peakArchive',
  "timestampPrecision: validTimestamp(day.peakTime, day.day) ? 'minute' : 'day'",
  '.slice(0, 30)',
]) assert(state.includes(fragment), `Peak archive state missing ${fragment}`)
for (const fragment of [
  'Peak archive',
  'Completed observed days',
  'Day only',
  'Unavailable',
  '/day-flow/',
  '/battle-lines/',
  'Show all',
  'data-history-peak-day',
]) assert(renderer.includes(fragment), `Peak archive renderer missing ${fragment}`)
assert(entry.includes("import '../history-peak-archive.css'"), 'Peak archive CSS is not loaded.')
assert(entry.includes('installPeakArchivePayloadCapture(schedule)'), 'Peak archive payload capture is not wired.')
assert(defaultDay.includes("import './history-peak-archive'"), 'Peak archive must load before the current-shell History fetch.')
assert(css.includes('.history-peak-events__grid') && css.includes('@media(max-width:760px)'), 'Peak archive responsive styles are missing.')

const twitchRoute = read('functions/api/history.ts')
const kickRoute = read('functions/api/kick-history.ts')
assert(twitchRoute.includes('DB_TWITCH_HOT') && !twitchRoute.includes('DB_KICK_HOT'), 'Twitch History storage separation failed.')
assert(kickRoute.includes('DB_KICK_HOT') && !kickRoute.includes('DB_TWITCH_HOT'), 'Kick History storage separation failed.')

const doc = read('docs/history-peak-archive-contract.md')
for (const fragment of [
  'bounded `peakArchive`',
  'capped at 30',
  'current in-progress day and missing days are excluded',
  '`Day only`',
  'does not guess missing values',
  'No cross-platform peak rank is produced',
  'no database migration',
  'extra browser request',
]) assert(doc.includes(fragment), `Peak archive documentation missing: ${fragment}`)

if (failures.length) {
  console.error('History peak archive verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History peak archive verification passed.')
console.log('- completed observed days are ranked by peak viewers')
console.log('- the archive is bounded to 30 and excludes the in-progress day')
console.log('- unavailable timestamp/category fields remain explicit')
console.log('- Twitch and Kick remain provider-separated')
