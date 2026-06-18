import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const helperPath = 'functions/_history-additional-rankings.ts'
const middlewarePath = 'functions/_middleware.ts'
const helperSource = read(helperPath)
const middleware = read(middlewarePath)
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const helper = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const candidate = (id, values) => ({
  streamerId: id,
  displayName: id.toUpperCase(),
  viewerMinutes: 0,
  peakViewers: 0,
  avgViewers: 0,
  observedMinutes: 0,
  rankByViewerMinutes: 0,
  rankByPeak: 0,
  changePct: null,
  changeAbs: null,
  comparisonState: 'insufficient',
  ...values,
})

const sample = {
  topStreamers: [
    candidate('alpha', {
      viewerMinutes: 1000,
      peakViewers: 100,
      avgViewers: 50,
      observedMinutes: 500,
      changePct: 0.2,
      changeAbs: 200,
      comparisonState: 'comparable',
    }),
    candidate('beta', {
      viewerMinutes: 900,
      peakViewers: 200,
      avgViewers: 100,
      observedMinutes: 200,
      changePct: 0.5,
      changeAbs: 300,
      comparisonState: 'comparable',
    }),
    candidate('gamma', {
      viewerMinutes: 800,
      peakViewers: 150,
      avgViewers: 80,
      observedMinutes: 400,
      comparisonState: 'new',
    }),
    candidate('delta', {
      viewerMinutes: 700,
      peakViewers: 50,
      avgViewers: 200,
      observedMinutes: 360,
      changePct: -0.1,
      changeAbs: -80,
      comparisonState: 'comparable',
    }),
  ],
}

const result = helper.historyRankingsFromPayload(sample)
const rankings = result.rankings
const meta = result.rankingsMeta

assert(rankings.viewerMinutes.map((row) => row.streamerId).join(',') === 'alpha,beta,gamma,delta', 'Viewer-minutes ranking order is wrong.')
assert(rankings.peakViewers.map((row) => row.streamerId).join(',') === 'beta,gamma,alpha,delta', 'Peak-viewers ranking order is wrong.')
assert(rankings.averageViewers.map((row) => row.streamerId).join(',') === 'delta,gamma,alpha', 'Average-viewers ranking or 360-minute baseline is wrong.')
assert(!rankings.averageViewers.some((row) => row.streamerId === 'beta'), 'Average-viewers ranking accepted a weak observed-time baseline.')
assert(rankings.observedMinutes.map((row) => row.streamerId).join(',') === 'alpha,gamma,delta,beta', 'Observed-time ranking order is wrong.')
assert(rankings.rising.map((row) => row.streamerId).join(',') === 'beta,alpha', 'Rising ranking must include only comparable positive changes.')
assert(rankings.viewerMinutes.every((row, index) => row.rank === index + 1), 'Ranking positions are not sequential.')
assert(rankings.rising[0].rankingMetric === 'rising' && rankings.rising[0].metricValue === 0.5, 'Rising ranking metric metadata is wrong.')
assert(meta.sourcePopulation === 'topStreamers', 'Ranking source population changed.')
assert(meta.candidateLimit === 50 && meta.limitPerRanking === 50, 'Ranking limits must remain 50.')
assert(meta.averageMinimumObservedMinutes === 360, 'Average-viewers observed-time baseline changed.')
assert(meta.bounded === true && meta.providerSeparated === true, 'Bounded provider separation metadata is missing.')
assert(meta.risingRequiresComparableBaseline === true, 'Rising baseline requirement is missing.')
assert(meta.inProgressDayExcluded === true, 'Completed-period scope metadata is missing.')

const bounded = helper.historyRankingsFromPayload({
  topStreamers: Array.from({ length: 60 }, (_, index) => candidate(`stream-${index}`, {
    viewerMinutes: 1000 - index,
    peakViewers: 1000 - index,
    avgViewers: 1000 - index,
    observedMinutes: 500,
  })),
})
assert(bounded.rankings.viewerMinutes.length === 50, 'Viewer-minutes ranking must remain bounded to 50 candidates.')
assert(bounded.rankings.peakViewers.length === 50, 'Peak-viewers ranking must remain bounded to 50 candidates.')
assert(bounded.rankings.averageViewers.length === 50, 'Average-viewers ranking must remain bounded to 50 candidates.')
assert(bounded.rankings.observedMinutes.length === 50, 'Observed-time ranking must remain bounded to 50 candidates.')
assert(bounded.rankingsMeta.candidateCount === 50, 'Candidate count must reflect the bounded source population.')

for (const fragment of [
  "viewerMinutes: rank(candidates, 'viewer_minutes')",
  "peakViewers: rank(candidates, 'peak_viewers')",
  "averageViewers: rank(candidates, 'avg_viewers')",
  "observedMinutes: rank(candidates, 'observed_minutes')",
  "rising: rank(candidates, 'rising')",
  "sourcePopulation: 'topStreamers'",
  'candidateLimit: CANDIDATE_LIMIT',
  'averageMinimumObservedMinutes: AVERAGE_MINIMUM_OBSERVED_MINUTES',
  'risingRequiresComparableBaseline: true',
  'providerSeparated: true',
  "headers.delete('content-length')",
]) assert(helperSource.includes(fragment), `${helperPath}: missing ${fragment}`)

for (const fragment of [
  "import { enrichHistoryAdditionalRankings } from './_history-additional-rankings'",
  'enrichHistoryResponse(coveredResponse)',
  "pathname.endsWith('/kick-history')",
  'const dailyResponse = await enrichHistoryStreamerDailyStats(response)',
  'return enrichHistoryAdditionalRankings(dailyResponse)',
]) assert(middleware.includes(fragment), `${middlewarePath}: missing ${fragment}`)
assert(middleware.indexOf('enrichHistoryStreamerDailyStats(response)') < middleware.indexOf('enrichHistoryAdditionalRankings(dailyResponse)'), 'Daily stats must run before additional rankings.')
assert(!middleware.includes("'/api/kick-history'"), 'Kick History must remain outside the root Twitch coverage route set.')

const controls = read('src/live/history-additional-rankings-controls.ts')
const state = read('src/live/history-additional-rankings-state.ts')
const renderer = read('src/live/history-additional-rankings-render.ts')
const entry = read('src/live/history-additional-rankings.ts')
const defaultDay = read('src/live/history-default-day.ts')
for (const fragment of ["'avg_viewers'", "'observed_minutes'", "'rising'", 'Average viewers', 'Observed time', 'Rising']) {
  assert(controls.includes(fragment), `History ranking controls missing ${fragment}`)
}
for (const fragment of [
  "['viewer_minutes', 'peak_viewers', 'avg_viewers', 'observed_minutes', 'rising']",
  "payload.rankings?.averageViewers",
  "payload.rankings?.observedMinutes",
  "payload.rankings?.rising",
  'window.setTimeout(() => setRankingSort(currentSort), 0)',
]) assert(state.includes(fragment), `History ranking state missing ${fragment}`)
assert(renderer.includes('renderAdditionalRanking('), 'History ranking renderer entry is missing.')
assert(renderer.includes('No comparable positive risers are available for this period.'), 'Rising empty state is missing.')
assert(entry.includes('installRankingControls(schedule)') && entry.includes('installRankingPayloadCapture(schedule)'), 'History ranking runtime is not wired.')
assert(defaultDay.startsWith("import './history-additional-rankings'"), 'History ranking runtime must load before the current-shell History fetch.')

const copyEntry = read('src/navigation/copy-current-view.ts')
const copyImpl = read('src/navigation/copy-current-view-impl.ts')
assert(copyEntry.includes("from './copy-current-view-impl'"), 'Copy current view public entry is not wired to the implementation.')
for (const sort of ['viewer_minutes', 'peak_viewers', 'avg_viewers', 'observed_minutes', 'rising']) {
  assert(copyImpl.includes(`'${sort}'`), `Copy current view does not preserve ${sort}.`)
}
assert(copyImpl.includes('HISTORY_SORTS.has(sort)'), 'History share-link sort normalization is missing.')

const twitchRoute = read('functions/api/history.ts')
const kickRoute = read('functions/api/kick-history.ts')
assert(twitchRoute.includes('DB_TWITCH_HOT') && !twitchRoute.includes('DB_KICK_HOT'), 'Twitch History storage separation failed.')
assert(kickRoute.includes('DB_KICK_HOT') && !kickRoute.includes('DB_TWITCH_HOT'), 'Kick History storage separation failed.')

const doc = read('docs/history-additional-rankings-contract.md')
for (const fragment of [
  'viewerMinutes',
  'peakViewers',
  'averageViewers',
  'observedMinutes',
  'rising',
  'capped at 50 records',
  'not provider-wide rankings',
  'at least 360 observed minutes',
  'No cross-platform totals, ranks, or averages are produced',
  'No database table, migration, cron, or collector job is added',
]) assert(doc.includes(fragment), `History additional rankings documentation missing: ${fragment}`)

if (failures.length) {
  console.error('History additional rankings verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History additional rankings verification passed.')
console.log('- five bounded ranking views use the existing Top 50 candidate population')
console.log('- average and rising eligibility rules are explicit')
console.log('- Twitch and Kick remain provider-separated')
console.log('- UI and share links preserve all five sort modes')
