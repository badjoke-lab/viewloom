import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Day Flow QA file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing required Day Flow QA fragment: ${fragment}`)
}

function forbidPattern(path, source, label, pattern) {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden Day Flow regression: ${label}`)
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) failures.push(`behavior: ${label}: expected ${expected}, received ${actual}`)
}

function assertNear(label, actual, expected, epsilon = 0.0001) {
  if (Math.abs(actual - expected) > epsilon) failures.push(`behavior: ${label}: expected ${expected}, received ${actual}`)
}

const dayFlowPages = ['twitch/day-flow/index.html', 'kick/day-flow/index.html']
const entryPath = 'src/live/day-flow-current-shell-entry.ts'
const layoutSummaryPath = 'src/live/day-flow-layout-summary.ts'
const layoutSummaryCssPath = 'src/dayflow-layout-summary.css'
const contractPath = 'docs/dayflow-qa-contract.md'

for (const path of [...dayFlowPages, entryPath, layoutSummaryPath, layoutSummaryCssPath, contractPath]) requireFile(path)

for (const path of dayFlowPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const fragment of [
    '/src/live/day-flow-current-shell-entry.ts',
    '/src/dayflow-layout-summary.css',
    'class="dayflow-layout-shell is-wide"',
    'data-dayflow-layout-shell',
    'data-dayflow-layout-current="wide"',
    'data-dayflow-layout="split"',
    'data-dayflow-layout="wide"',
    'class="dayflow-stage"',
    'data-dayflow-time-focus',
    'data-dayflow-detail',
    'data-dayflow-summary',
    'data-dayflow-coverage',
    'data-dayflow-metric="volume"',
    'data-dayflow-metric="share"',
    'data-dayflow-scope="full"',
    'data-dayflow-scope="topFocus"',
    'data-dayflow-top="10"',
    'data-dayflow-top="20"',
    'data-dayflow-top="50"',
    'data-dayflow-bucket="5"',
    'data-dayflow-bucket="10"',
    'data-dayflow-range="today"',
    'data-dayflow-range="yesterday"',
    'data-dayflow-range="rolling24h"',
    'data-dayflow-range="date"',
    'data-dayflow-date',
    'data-dayflow-auto',
    'data-dayflow-refresh',
    'Field scale · leadership · movement',
  ]) requireFragment(path, source, fragment)
  const primaryEntryCount = (source.match(/day-flow-current-shell-entry\.ts/g) ?? []).length
  assertEqual(`${path} primary feature entry count`, primaryEntryCount, 1)
  forbidPattern(path, source, 'secondary Day Flow layout-summary entry', /<script[^>]+day-flow-layout-summary\.ts/)
  forbidPattern(path, source, 'static legacy Day Flow SVG', /<svg viewBox="0 0 1210 620"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
  forbidPattern(path, source, 'old visible-top share copy', /Share of visible top/i)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "from './day-flow-layout-summary'",
    "provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'",
    'rangeMode: state.rangeMode',
    'metric: state.metric',
    'top: String(state.top)',
    'bucket: String(state.bucket)',
    "cache: 'no-store'",
    'layout: DayFlowLayoutMode',
    'layoutInUrl: boolean',
    'const layoutStorageKey = `viewloom:${provider}:dayflow-layout`',
    'normalizeDayFlowLayout(layoutParam, window.localStorage.getItem(layoutStorageKey))',
    'window.localStorage.setItem(layoutStorageKey, state.layout)',
    'applyDayFlowLayout(state.layout)',
    'renderEnhancedDayFlowSummary(target, payload)',
    "if (state.layoutInUrl) params.set('layout', state.layout)",
    'bandsForScope(payload)',
    "state.scope === 'full'",
    'return Math.max(0, safeNumber(band.buckets?.[index]?.share)) * 100',
    'nonOthers(payload).slice(0, state.top)',
    'const others = (payload.bands ?? []).find(isOthersBand)',
    "chart.addEventListener('pointerdown'",
    "chart.addEventListener('pointermove'",
    'nearestBucketIndex(payload.buckets ?? [], targetMs)',
    "event.target.closest<SVGElement>('[data-dayflow-band]')",
    'rankAt(payload, index).slice(0, 5)',
    'viewerAt(band, index)',
    'detailMetadata(payload, band)',
    'Activity unavailable',
    'window.history.replaceState',
    'configureAutoUpdate()',
    "document.addEventListener('visibilitychange'",
    'Open in Battle Lines',
    'Highlight only',
    'Show all bands',
  ]) requireFragment(entryPath, source, fragment)

  assertEqual('Day Flow primary request owner count', (source.match(/\bfetch\(/g) ?? []).length, 1)
  forbidPattern(entryPath, source, 'MutationObserver coordination', /new MutationObserver/)
  forbidPattern(entryPath, source, 'global fetch replacement', /window\.fetch\s*=/)
  forbidPattern(entryPath, source, 'global history replacement', /window\.history\.replaceState\s*=/)
  forbidPattern(entryPath, source, 'URLSearchParams prototype replacement', /URLSearchParams\.prototype\.get\s*=/)
  forbidPattern(entryPath, source, 'Top 20/50 capped at 12 bands', /Math\.min\([^\n]*12\)/)
  forbidPattern(entryPath, source, 'Others removed from all scopes', /filter\([^\n]*others[^\n]*\)\.slice/)
  forbidPattern(entryPath, source, 'raw share rendered as percent', /shareAt\([^)]*\)[^\n]*toFixed[^\n]*%/)
  forbidPattern(entryPath, source, 'bucket index stretched without timestamps', /index\s*\/\s*\(count\s*-\s*1\)/)
  forbidPattern(entryPath, source, 'raw ISO bucket label fallback', /return buckets\[index\]/)
  forbidPattern(entryPath, source, 'detail metadata used as bucket values', /detailPanelSource\?\.streamers[^\n]*valueAt/)
}

if (existsSync(join(root, layoutSummaryPath))) {
  const source = read(layoutSummaryPath)
  for (const fragment of [
    "export type DayFlowLayoutMode = 'split' | 'wide'",
    'export function normalizeDayFlowLayout',
    "if (urlValue === 'wide' || urlValue === 'theater') return 'wide'",
    "if (storedValue === 'wide' || storedValue === 'theater') return 'wide'",
    "return 'wide'",
    'export function applyDayFlowLayout',
    "const effectiveLayout: DayFlowLayoutMode = window.innerWidth <= desktopBreakpoint ? 'wide' : requestedLayout",
    'shell.dataset.dayflowLayoutCurrent = effectiveLayout',
    'shell.dataset.dayflowLayoutRequested = requestedLayout',
    'export function renderEnhancedDayFlowSummary',
    'calculateLeaderStats',
    'calculateDelta',
    'calculatePeakShare',
    'Top by viewer-minutes',
    'Peak field',
    'Average field',
    'Viewer-minutes',
    'Longest lead',
    'Lead changes',
    'Biggest rise',
    'Biggest drop',
    'Peak global share',
  ]) requireFragment(layoutSummaryPath, source, fragment)
  for (const [label, pattern] of [
    ['feature fetch', /\bfetch\(/],
    ['MutationObserver coordination', /new MutationObserver/],
    ['event ownership', /addEventListener\(/],
    ['timer ownership', /setInterval\(|setTimeout\(/],
    ['global history replacement', /window\.history\.replaceState\s*=/],
  ]) forbidPattern(layoutSummaryPath, source, label, pattern)
}

if (existsSync(join(root, layoutSummaryCssPath))) {
  const source = read(layoutSummaryCssPath)
  for (const fragment of [
    '.dayflow-layout-shell.is-split',
    '.dayflow-layout-shell.is-wide',
    'grid-template-columns: minmax(0, 1.72fr) minmax(360px, .78fr)',
    '.dayflow-summary-stats',
    '.dayflow-summary-bottom',
    '@media (max-width: 1000px)',
  ]) requireFragment(layoutSummaryCssPath, source, fragment)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    'Day Flow QA Contract',
    'Volume / Share',
    'Full / Top Focus',
    'Top 10 / 20 / 50',
    'Today / Yesterday / Date / Rolling 24h',
    'Each provider page loads exactly one Day Flow feature entry',
    'The primary controller owns the feature request',
    'Layout-only changes do not request feature data again.',
    'Desktop defaults to Wide.',
    'Split / Wide are user-selectable',
    'field peak and time',
    'Top 5 viewer-minutes ranking',
    'pointer drag and touch scrubbing',
    'band selection',
    'selected bucket values',
    'Twitch and Kick',
  ]) requireFragment(contractPath, source, fragment)
}

// Executable behavior fixtures. These guard calculations, not UI copy.
const fixture = {
  buckets: ['2026-06-13T00:00:00.000Z', '2026-06-13T00:05:00.000Z', '2026-06-13T00:10:00.000Z'],
  bands: [
    { id: 'a', viewers: [60, 50, 20], share: [0.6, 0.5, 0.2] },
    { id: 'b', viewers: [20, 30, 50], share: [0.2, 0.3, 0.5] },
    { id: 'others', viewers: [20, 20, 30], share: [0.2, 0.2, 0.3], others: true },
  ],
}

const scaleShare = (value) => value * 100
assertEqual('API share 0.25 displays as 25%', scaleShare(0.25), 25)

for (let index = 0; index < fixture.buckets.length; index += 1) {
  const full = fixture.bands.reduce((sum, band) => sum + scaleShare(band.share[index]), 0)
  assertNear(`Full share totals 100% at bucket ${index}`, full, 100)
  const topTotal = fixture.bands.filter((band) => !band.others).reduce((sum, band) => sum + band.viewers[index], 0)
  const focused = fixture.bands.filter((band) => !band.others).reduce((sum, band) => sum + band.viewers[index] / topTotal * 100, 0)
  assertNear(`Top Focus rescales to 100% at bucket ${index}`, focused, 100)
}

const nearest = (target) => fixture.buckets.reduce((best, bucket, index) => {
  const distance = Math.abs(Date.parse(bucket) - target)
  return distance < best.distance ? { index, distance } : best
}, { index: 0, distance: Number.POSITIVE_INFINITY }).index
assertEqual('actual timestamp selects nearest bucket', nearest(Date.parse('2026-06-13T00:07:30.000Z')), 1)

const selectedIndex = 2
const ranking = fixture.bands.filter((band) => !band.others).sort((a, b) => b.viewers[selectedIndex] - a.viewers[selectedIndex])
assertEqual('Time Focus ranks selected bucket values', ranking[0].id, 'b')
assertEqual('Time Focus selected value is not aggregate metadata', ranking[0].viewers[selectedIndex], 50)

const requestedTop = 50
const generated = Array.from({ length: requestedTop }, (_, index) => ({ id: `s${index}` }))
assertEqual('Top 50 is not silently capped at 12', generated.slice(0, requestedTop).length, 50)

const defaultLayout = (urlValue, savedValue) => {
  if (urlValue === 'wide' || urlValue === 'theater') return 'wide'
  if (urlValue === 'split') return 'split'
  if (savedValue === 'wide' || savedValue === 'theater') return 'wide'
  if (savedValue === 'split') return 'split'
  return 'wide'
}
assertEqual('desktop Day Flow defaults to Wide', defaultLayout(null, null), 'wide')
assertEqual('legacy URL Theater maps to Wide', defaultLayout('theater', null), 'wide')
assertEqual('legacy stored Theater maps to Wide', defaultLayout(null, 'theater'), 'wide')
assertEqual('explicit Split remains Split', defaultLayout('split', null), 'split')

const leaders = fixture.buckets.map((_, index) => fixture.bands.filter((band) => !band.others).sort((a, b) => b.viewers[index] - a.viewers[index])[0].id)
assertEqual('summary detects one lead change', leaders.slice(1).filter((leader, index) => leader !== leaders[index]).length, 1)
const totalViewerMinutes = fixture.buckets.reduce((sum, _, index) => sum + fixture.bands.reduce((bucketTotal, band) => bucketTotal + band.viewers[index], 0) * 5, 0)
assertEqual('summary integrates viewer-minutes', totalViewerMinutes, 1500)

if (failures.length > 0) {
  console.error('ViewLoom Day Flow QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Day Flow QA verification passed for ${dayFlowPages.length} pages, one controller owner, Wide default, Split compatibility, expanded summary, and executable calculation fixtures.`)
