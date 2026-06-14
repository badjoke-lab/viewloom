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
const stylePath = 'src/history-page.css'
const contractPath = 'docs/history-qa-contract.md'
const apiPaths = ['functions/api/history.ts', 'functions/api/kick-history.ts']
const sharedPaths = ['functions/_history/model.ts', 'functions/_history/builders.ts']

for (const path of [...historyPages, entryPath, stylePath, contractPath, ...apiPaths, ...sharedPaths]) requireFile(path)

for (const path of historyPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const fragment of [
    '/src/live/history-current-shell-entry.ts',
    '/src/history-page.css',
    'History &amp; Trends',
    'data-history-period="7d"',
    'data-history-period="30d"',
    'data-history-period="custom"',
    'data-history-metric="viewer_minutes"',
    'data-history-metric="peak_viewers"',
    'data-history-selected-day',
    'data-history-daily-archive',
    'data-history-notes',
    'class="metric-ledger',
  ]) requireFragment(path, source, fragment)
  forbidPattern(path, source, 'static legacy History SVG', /<svg viewBox="0 0 1210 560"/)
  forbidPattern(path, source, 'static Stream demo rows', /Stream A|Stream B|Stream C/)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "provider === 'kick' ? '/api/kick-history' : '/api/history'",
    'new AbortController()',
    'new URLSearchParams(window.location.search)',
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

for (const path of apiPaths.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const fragment of [
    'previousPeriod(',
    'fromRollups(',
    'fromRaw(',
    'buildPayload(',
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
  requireFragment(stylePath, source, '.history-streamer-cards')
  requireFragment(stylePath, source, '@media(max-width:760px)')
  requireFragment(stylePath, source, '.history-day-column.is-selected')
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'Last 7 days, Last 30 days, and Custom range')
  requireFragment(contractPath, source, 'Selected day')
  requireFragment(contractPath, source, 'Daily archive')
  requireFragment(contractPath, source, 'fixed `period=30d` fetch')
}

if (failures.length > 0) {
  console.error('ViewLoom History QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom History QA verification passed for ${historyPages.length} History pages.`)
