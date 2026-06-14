import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFragment = (path, source, fragment) => {
  if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`)
}

const pages = ['twitch/history/index.html', 'kick/history/index.html']
for (const path of pages) {
  if (!existsSync(join(root, path))) {
    failures.push(`${path}: missing`)
    continue
  }
  const source = read(path)
  const title = path.startsWith('twitch/')
    ? 'History & Trends for Twitch live streams | ViewLoom'
    : 'History & Trends for Kick live streams | ViewLoom'
  for (const fragment of [
    `<title>${title}</title>`,
    '<small>Source</small>',
    '/src/live/history-usability-pass.ts',
    'data-history-period="7d"',
    'data-history-period="30d"',
    'data-history-period="custom"',
    'data-history-metric="viewer_minutes"',
    'data-history-metric="peak_viewers"',
    'data-history-selected-day',
    'data-history-daily-archive',
    'data-history-columns',
    'data-history-coverage-summary',
    'data-history-chart-legend',
    'data-history-archive-toolbar',
    'data-history-archive-toggle',
    'data-history-limit="10" aria-pressed="true"',
    'Completed-day ranking',
  ]) requireFragment(path, source, fragment)
}

for (const path of ['functions/api/history.ts', 'functions/api/kick-history.ts']) {
  const source = read(path)
  for (const fragment of [
    'validateRequestedRange(',
    'isCalendarDay(',
    "'invalid_range'",
    'History custom range is limited to 90 days in v1.',
  ]) requireFragment(path, source, fragment)
}

const model = read('functions/_history/model.ts')
for (const fragment of [
  "source: allDemo ? 'demo' : 'real'",
  "coverage.state === 'good' ? 'fresh' : 'partial'",
  "comparisonState: 'comparable' | 'new' | 'insufficient'",
  'comparisonAvailable: boolean',
  'previousPeriodAvailable = true',
  "!previousPeriodAvailable",
  'fillMissingDays(period, built.daily)',
  "coverageState: 'missing'",
  'inProgressDates:',
  'partialDates:',
  'missingDates:',
  'PERIOD_BASELINE_MINUTES = 360',
  'stream.viewerMinutes * 0.2',
  'summaryScope:',
]) requireFragment('functions/_history/model.ts', model, fragment)

const builders = read('functions/_history/builders.ts')
for (const fragment of [
  'const completedRows = rows.filter((row) => row.day < today)',
  'comparisonAvailable = completedPreviousRows.some',
  'comparisonAvailable = previousRows.length > 0',
  'streamsFromRawDays(',
  'completedCurrentStreams',
]) requireFragment('functions/_history/builders.ts', builders, fragment)

const shim = read('src/live/history-usability-pass.ts')
for (const fragment of [
  "import '../history-clarity-hotfix.css'",
  "import './history-clarity-hotfix'",
  "import './history-clarity-compat'",
  "import './history-usability'",
  "import './history-number-format'",
  "import './history-default-day'",
]) requireFragment('src/live/history-usability-pass.ts', shim, fragment)

const clarity = read('src/live/history-clarity-hotfix.ts')
for (const fragment of [
  'normalizePayload(',
  'recalculateCoverage(',
  'enumerateDays(from, to)',
  "comparisonState: 'insufficient'",
  "setText(headers[6], 'Vs previous')",
  "setText(label, 'Tracked streams (max)')",
  "setText(riseStrong, 'No baseline')",
  "data-history-clarity-filter=",
  "filterButton('missing'",
  "coverageRow('Missing'",
  'feedback.hidden = true',
]) requireFragment('src/live/history-clarity-hotfix.ts', clarity, fragment)

const clarityCss = read('src/history-clarity-hotfix.css')
for (const fragment of [
  '.history-peak-archive--aligned',
  'th:nth-child(3)',
  'text-align:right',
  '.history-y-label',
  '.history-bar--missing',
  '[data-history-clarity-state="missing"]',
  '.history-coverage-breakdown',
]) requireFragment('src/history-clarity-hotfix.css', clarityCss, fragment)

const compatibility = read('src/live/history-clarity-compat.ts')
requireFragment('src/live/history-clarity-compat.ts', compatibility, "setAttribute('data-history-archive-toggle', '')")

const usability = read('src/live/history-usability.ts')
for (const fragment of [
  "initialParams.set('limit', '10')",
  'selectLatestCompletedDay(',
  'Today is still in progress.',
  'history-bar--in-progress',
  'Low baseline',
  'index < 9',
  'Show all ${matchingCount} days',
  'observer.disconnect()',
]) requireFragment('src/live/history-usability.ts', usability, fragment)

const defaultDay = read('src/live/history-default-day.ts')
for (const fragment of [
  'startedWithExplicitDay',
  "card.dataset.historyArchiveState === 'complete'",
  "target.closest('[data-history-period],[data-history-metric],[data-history-apply-range]')",
  "chartDay.dispatchEvent(new MouseEvent('click', { bubbles: true }))",
]) requireFragment('src/live/history-default-day.ts', defaultDay, fragment)

const numberFormat = read('src/live/history-number-format.ts')
for (const fragment of [
  "notation: 'compact'",
  '[data-history-daily-archive] .day-card > strong',
  '[data-history-selected-day] .history-selected-top strong',
  '.history-peak-archive tbody td:nth-child(3)',
  'node.dataset.historyExactValue = exact',
]) requireFragment('src/live/history-number-format.ts', numberFormat, fragment)

const style = read('src/history-page.css')
for (const fragment of [
  '[data-history-columns]{grid-template-columns:1fr}',
  '.history-stage{position:relative',
  '.history-stage svg{display:block;width:100%',
  '.history-day-column.is-selected',
  '.history-bar--in-progress',
  '.history-coverage-summary',
  '.history-chart-legend',
  '.day-card[hidden]',
]) requireFragment('src/history-page.css', style, fragment)

if (failures.length) {
  console.error('History repair QA failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('History repair QA passed.')
