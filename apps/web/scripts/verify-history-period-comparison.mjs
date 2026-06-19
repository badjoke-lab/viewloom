import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const modelPath = 'functions/_history/model.ts'
const buildersPath = 'functions/_history/builders.ts'
const modelSource = read(modelPath)
const buildersSource = read(buildersPath)
const compiled = ts.transpileModule(modelSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const model = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const today = new Date().toISOString().slice(0, 10)
const day = (date, total, peak, coverageState = 'good', observedMinutes = 1440) => ({
  day: date,
  totalViewerMinutes: total,
  peakViewers: peak,
  peakStreamerName: null,
  observedStreamCount: 10,
  observedMinutes,
  coverageState,
  topStreamers: [],
  biggestRise: null,
})
const currentFrom = model.addDays(today, -6)
const previousFrom = model.addDays(currentFrom, -7)
const previousTo = model.addDays(currentFrom, -1)
const currentDaily = [
  ...Array.from({ length: 6 }, (_, index) => day(model.addDays(currentFrom, index), 2000 + index * 100, 500 + index * 10)),
  day(today, 9999, 999, 'partial', 300),
]
const previousDaily = Array.from({ length: 7 }, (_, index) => day(model.addDays(previousFrom, index), 1000 + index * 50, 400 + index * 5))
const period = { from: currentFrom, to: today, label: 'Last 7 days' }

const comparable = model.periodComparisonFor('twitch', period, currentDaily, previousDaily, true)
assert(comparable.state === 'comparable', 'Equal complete scopes must be comparable.')
assert(comparable.current.selectedDays === 6, 'Current in-progress day must be excluded.')
assert(comparable.previous.selectedDays === 6, 'Previous scope must be trimmed to the current completed-day count.')
assert(comparable.previous.from === model.addDays(previousFrom, 1) && comparable.previous.to === previousTo, 'Previous aligned dates are wrong.')
assert(comparable.current.totalViewerMinutes === 13500, 'Current total viewer-minutes are wrong.')
assert(comparable.previous.totalViewerMinutes === 7050, 'Previous aligned total viewer-minutes are wrong.')
const expectedViewerMinutesPct = (13500 - 7050) / 7050
assert(Math.abs(comparable.changes.totalViewerMinutes.pct - expectedViewerMinutesPct) < 1e-9, 'Viewer-minute percentage change is wrong.')
assert(comparable.providerSeparated === true && comparable.inProgressDayExcluded === true, 'Comparison truth metadata is missing.')

const partial = model.periodComparisonFor('kick', period, currentDaily, previousDaily.slice(0, 3), true)
assert(partial.state === 'partial', 'Unequal retained day counts must be partial.')
assert(partial.changes === null, 'Partial comparison must withhold percentage changes.')
assert(partial.reason.includes('6 and 3 selected days'), 'Partial comparison reason must disclose day-count mismatch.')

const unavailable = model.periodComparisonFor('twitch', period, currentDaily, [], false)
assert(unavailable.state === 'unavailable', 'Missing previous observations must be unavailable.')
assert(unavailable.changes === null, 'Unavailable comparison must not emit changes.')

for (const fragment of [
  'previousDaily: DailySummary[]',
  'periodComparisonFor(',
  "scope: 'completed_observed_days'",
  'providerSeparated: true',
  'inProgressDayExcluded: true',
  "state === 'comparable'",
  'periodComparison,',
  'period: periodComparison',
]) assert(modelSource.includes(fragment), `${modelPath}: missing ${fragment}`)

for (const fragment of [
  'const previousDaily = previousRows.map',
  'const previousDaily = [...previous.days.values()]',
  'previousDaily,',
  'rollupDaySummary(',
]) assert(buildersSource.includes(fragment), `${buildersPath}: missing ${fragment}`)

const twitchRoute = read('functions/api/history.ts')
const kickRoute = read('functions/api/kick-history.ts')
assert(twitchRoute.includes('previousPeriod(period.from, period.to)'), 'Twitch History must retain previous-period reads.')
assert(kickRoute.includes('previousPeriod(period.from, period.to)'), 'Kick History must retain previous-period reads.')
assert(twitchRoute.includes('DB_TWITCH_HOT') && !twitchRoute.includes('DB_KICK_HOT'), 'Twitch comparison storage separation failed.')
assert(kickRoute.includes('DB_KICK_HOT') && !kickRoute.includes('DB_TWITCH_HOT'), 'Kick comparison storage separation failed.')

const state = read('src/live/history-period-comparison-state.ts')
const renderer = read('src/live/history-period-comparison-render.ts')
const entry = read('src/live/history-period-comparison.ts')
const loader = read('src/live/history-battle-archive.ts')
const css = read('src/history-period-comparison.css')
for (const fragment of [
  'periodComparisonFromPayload(',
  'payload.periodComparison',
  'payload.comparison?.period',
  "url.pathname === '/api/history' || url.pathname === '/api/kick-history'",
]) assert(state.includes(fragment), `Period comparison state missing ${fragment}`)
for (const fragment of [
  'Previous period comparison',
  'Completed observed scope',
  'Current period vs immediately preceding period',
  'Viewer-minutes',
  'Peak viewers',
  'Average observed viewers',
  'Observed time',
  'Percentages withheld.',
  'Equal completed-day scopes with complete coverage.',
]) assert(renderer.includes(fragment), `Period comparison renderer missing ${fragment}`)
assert(entry.includes("import '../history-period-comparison.css'"), 'Period comparison CSS is not loaded.')
assert(entry.includes('installPeriodComparisonPayloadCapture(schedule)'), 'Period comparison payload capture is not wired.')
assert(loader.includes("import './history-period-comparison'"), 'Period comparison must load before the History fetch.')
assert(css.includes('.history-comparison-grid') && css.includes('@media(max-width:760px)'), 'Period comparison responsive styles are missing.')

const doc = read('docs/history-period-comparison-contract.md')
for (const fragment of [
  'immediately preceding period',
  'current in-progress UTC day is excluded',
  'same number of selected completed days',
  'Percentage changes are emitted only',
  'No provider totals are combined',
  'additional browser request',
]) assert(doc.includes(fragment), `Period comparison documentation missing: ${fragment}`)

if (failures.length) {
  console.error('History period comparison verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History period comparison verification passed.')
console.log('- current in-progress day is excluded')
console.log('- previous scope aligns to the selected completed-day count')
console.log('- partial or unavailable scopes withhold percentage changes')
console.log('- responsive UI and pre-fetch payload capture are wired')
console.log('- Twitch and Kick remain provider-separated')
