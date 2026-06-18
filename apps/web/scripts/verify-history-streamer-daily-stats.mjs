import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const helperPath = 'functions/_history-streamer-daily-stats.ts'
const middlewarePath = 'functions/_middleware.ts'
const helperSource = read(helperPath)
const middleware = read(middlewarePath)
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const helper = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const sample = {
  daily: [
    {
      day: '2026-06-16',
      coverageState: 'good',
      topStreamers: [
        {
          streamerId: 'alpha',
          displayName: 'Alpha',
          viewerMinutes: 120000,
          peakViewers: 900,
          avgViewers: 500,
          observedMinutes: 240,
          rankByViewerMinutes: 1,
          rankByPeak: 2,
          changePct: 0.2,
          changeAbs: 20000,
          comparisonState: 'comparable',
        },
      ],
    },
    {
      day: '2026-06-17',
      coverageState: 'partial',
      topStreamers: [
        {
          streamerId: 'beta',
          displayName: 'Beta',
          viewerMinutes: '80000',
          peakViewers: '700',
          avgViewers: '400',
          observedMinutes: '200',
          rankByViewerMinutes: '1',
          rankByPeak: '1',
          changePct: null,
          changeAbs: null,
          comparisonState: 'new',
        },
      ],
    },
    {
      day: '2026-06-18',
      coverageState: 'missing',
      topStreamers: [],
    },
  ],
}

const stats = helper.streamerDailyStatsFromPayload(sample)
assert(helper.STREAMER_DAILY_STATS_LIMIT_PER_DAY === 10, 'Daily stats limit must be 10.')
assert(stats.length === 2, 'Missing or empty days must not create streamer records.')
assert(stats[0].day === '2026-06-16' && stats[0].coverageState === 'good', 'Day and coverage state were not copied.')
assert(stats[0].streamerId === 'alpha' && stats[0].viewerMinutes === 120000, 'Numeric streamer fields were not preserved.')
assert(stats[0].comparisonState === 'comparable' && stats[0].changePct === 0.2, 'Comparison fields were not preserved.')
assert(stats[1].day === '2026-06-17' && stats[1].coverageState === 'partial', 'Partial day state was not copied.')
assert(stats[1].viewerMinutes === 80000 && stats[1].peakViewers === 700, 'Numeric strings were not normalized.')
assert(stats[1].comparisonState === 'new', 'New comparison state was not preserved.')

const overLimit = helper.streamerDailyStatsFromPayload({
  daily: [{
    day: '2026-06-15',
    coverageState: 'demo',
    topStreamers: Array.from({ length: 14 }, (_, index) => ({
      streamerId: `stream-${index}`,
      displayName: `Stream ${index}`,
      viewerMinutes: 100 - index,
      comparisonState: 'insufficient',
    })),
  }],
})
assert(overLimit.length === 10, 'Daily stats must remain bounded to Top 10.')
assert(overLimit.every((row) => row.coverageState === 'demo'), 'Demo coverage state must be retained.')

for (const fragment of [
  "rankingBasis: 'viewer_minutes'",
  'limitPerDay: STREAMER_DAILY_STATS_LIMIT_PER_DAY',
  'bounded: true',
  'includesDayOverDayComparison: true',
  'providerSeparated: true',
  "source: 'daily.topStreamers'",
  'streamerDailyStats,',
  'headers.delete(\'content-length\')',
]) assert(helperSource.includes(fragment), `${helperPath}: missing ${fragment}`)

assert(middleware.includes("import { enrichHistoryStreamerDailyStats } from './_history-streamer-daily-stats'"), `${middlewarePath}: History stats helper import is missing.`)
assert(middleware.includes("'/api/history'"), `${middlewarePath}: Twitch History route is missing.`)
assert(middleware.includes("pathname.endsWith('/kick-history')"), `${middlewarePath}: Kick History stats route is missing.`)
assert(middleware.includes('enrichTwitchFeatureResponse(env, response)'), `${middlewarePath}: Twitch coverage must run before History stats.`)
assert(middleware.includes('enrichHistoryStreamerDailyStats(coveredResponse)'), `${middlewarePath}: Twitch History stats enrichment is missing.`)
assert(middleware.includes('enrichHistoryStreamerDailyStats(response)'), `${middlewarePath}: Kick History stats enrichment is missing.`)
assert(!middleware.includes("'/api/kick-history'"), `${middlewarePath}: Kick History must not enter the root coverage route set.`)

const twitchRoute = read('functions/api/history.ts')
const kickRoute = read('functions/api/kick-history.ts')
for (const [label, route] of [['Twitch', twitchRoute], ['Kick', kickRoute]]) {
  assert(route.includes('buildPayload('), `${label} History must retain the shared payload builder.`)
  assert(route.includes('fromRollups('), `${label} History must retain the daily rollup path.`)
  assert(route.includes('fromRaw('), `${label} History must retain the raw fallback path.`)
}
assert(twitchRoute.includes('DB_TWITCH_HOT') && !twitchRoute.includes('DB_KICK_HOT'), 'Twitch History storage separation failed.')
assert(kickRoute.includes('DB_KICK_HOT') && !kickRoute.includes('DB_TWITCH_HOT'), 'Kick History storage separation failed.')

const doc = read('docs/history-streamer-daily-stats-contract.md')
for (const fragment of [
  'limitPerDay = 10',
  'bounded = true',
  'providerSeparated = true',
  'No new database table, migration, cron, or collector job is introduced',
  'daily[].topStreamers',
  'Twitch and Kick History responses receive the same field shape, but their records are never combined',
]) assert(doc.includes(fragment), `History daily stats documentation missing: ${fragment}`)

if (failures.length) {
  console.error('History streamer daily stats verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History streamer daily stats verification passed.')
console.log('- Twitch and Kick expose the same bounded Top 10-per-day field shape')
console.log('- rollup and raw History paths remain unchanged')
console.log('- coverage routing and provider storage remain separated')
