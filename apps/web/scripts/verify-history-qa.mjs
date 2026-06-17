import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required History QA file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing required History QA fragment: ${fragment}`)
}

function forbidPattern(path, source, label, pattern) {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden History regression: ${label}`)
}

const historyPages = ['twitch/history/index.html', 'kick/history/index.html']
const entryPath = 'src/live/history-current-shell-entry.ts'
const dayLinkBridgePath = 'src/navigation/history-day-link-bridge.ts'
const stylePath = 'src/history-page.css'
const contractPath = 'docs/history-qa-contract.md'
const apiPaths = ['functions/api/history.ts', 'functions/api/kick-history.ts']
const sharedPaths = ['functions/_history/model.ts', 'functions/_history/builders.ts']

for (const path of [...historyPages, entryPath, dayLinkBridgePath, stylePath, contractPath, ...apiPaths, ...sharedPaths]) requireFile(path)

for (const path of historyPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  const title = path.startsWith('twitch/')
    ? 'History & Trends for Twitch live streams | ViewLoom'
    : 'History & Trends for Kick live streams | ViewLoom'
  for (const fragment of [
    '/src/live/history-current-shell-entry.ts',
    '/src/navigation/history-day-link-bridge.ts',
    '/src/history-page.css',
    `<title>${title}</title>`,
    'History &amp; Trends',
    'data-history-period="7d"',
    'data-history-period="30d"',
    'data-history-period="custom"',
    'data-history-metric="viewer_minutes"',
    'data-history-metric="peak_viewers"',
    'data-history-selected-day',
    'data-history-daily-archive',
    'data-history-notes',
    'data-history-columns',
    '<small>Source</small>',
    'class="metric-ledger',
  ]) requireFragment(path, source, fragment)
  forbidPattern(path, source, 'static legacy History SVG', /<svg viewBox="0 0 1210 560"/)
  forbidPattern(path, source, 'static Stream demo rows', /Stream A|Stream B|Stream C/)
  forbidPattern(path, source, 'internal read path label', /<small>Read path<\/small>/)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "provider === 'kick' ? '/api/kick-history' : '/api/history'",
    'new AbortController()',
    'new URLSearchParams(window.location.search)',
    "params.get('day')",
    "params.set('day', pageState.selectedDay)",
    'data-history-period',
    'data-history-metric',
    'renderSummary(payload',
    'renderChart(payload',
    'renderSelectedDay(',
    'renderRanking(',
    'renderDailyArchive(',
    'renderCoverage(',
    'Open Day Flow',
    'Open Battle Lines',
    'Custom ranges are limited to 90 days.',
  ]) requireFragment(entryPath, source, fragment)
  forbidPattern(entryPath, source, 'fixed 30-day-only fetch', /fetch\(`\$\{endpoint\}\?period=30d/)
  forbidPattern(entryPath, source, 'app-root rewrite renderer', /document\.querySelector<HTMLElement>\('\#app'\)/)
}

if (existsSync(join(root, dayLinkBridgePath))) {
  const source = read(dayLinkBridgePath)
  for (const fragment of [
    'historyDayLinks(',
    'rangeMode=date&date=',
    'range=date&date=',
    'rewriteHistoryDayLinks(',
    'new MutationObserver(',
    "document.body.dataset.provider === 'kick'",
  ]) requireFragment(dayLinkBridgePath, source, fragment)
  forbidPattern(dayLinkBridgePath, source, 'cross-provider combined History link', /\/twitch\/.*\/kick\/|\/kick\/.*\/twitch\//)
}

for (const path of apiPaths.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const fragment of [
    'previousPeriod(',
    'fromRollups(',
    'fromRaw(',
    'buildPayload(',
    'validateRequestedRange(',
    'isCalendarDay(',
    "'invalid_range'",
    'History custom range is limited to 90 days in v1.',
  ]) requireFragment(path, source, fragment)
}

if (existsSync(join(root, sharedPaths[0]))) {
  const source = read(sharedPaths[0])
  for (const fragment of [
    "comparisonState: 'comparable' | 'new' | 'insufficient'",
    'biggestRise(',
    'peakDayViewerMinutes',
    'affectedDays',
    'expectedMinutesForDay(',
    'previousPeriod(',
    "source: allDemo ? 'demo' : 'real'",
    "coverage.state === 'good' ? 'fresh' : 'partial'",
  ]) requireFragment(sharedPaths[0], source, fragment)
}

if (existsSync(join(root, sharedPaths[1]))) {
  const source = read(sharedPaths[1])
  for (const fragment of [
    'sampleWeightMinutes(',
    'peakStreamerViewers',
    'topStreamers',
    'DAILY_BASELINE_MINUTES',
    'PERIOD_BASELINE_MINUTES',
  ]) requireFragment(sharedPaths[1], source, fragment)
}

if (existsSync(join(root, stylePath))) {
  const source = read(stylePath)
  for (const fragment of [
    '.history-streamer-cards',
    '@media(max-width:760px)',
    '.history-day-column.is-selected',
    '[data-history-columns]{grid-template-columns:1fr}',
    '.history-stage{position:relative',
    '.history-stage svg{display:block;width:100%',
  ]) requireFragment(stylePath, source, fragment)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    'Last 7 days, Last 30 days, and Custom range',
    'Selected day',
    'Daily archive',
    'fixed `period=30d` fetch',
    'invalid custom ranges return HTTP 400',
    'Fresh / Partial / Empty / Demo / Error',
    'Real / Demo',
  ]) requireFragment(contractPath, source, fragment)
}

if (failures.length > 0) {
  console.error('ViewLoom History QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom History QA verification passed for ${historyPages.length} History pages.`)
