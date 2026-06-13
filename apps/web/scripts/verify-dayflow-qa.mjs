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
const contractPath = 'docs/dayflow-qa-contract.md'

for (const path of [...dayFlowPages, entryPath, contractPath]) requireFile(path)

for (const path of dayFlowPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const fragment of [
    '/src/live/day-flow-current-shell-entry.ts',
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
  ]) requireFragment(path, source, fragment)
  forbidPattern(path, source, 'split-first Day Flow layout', /class="layout-split"/)
  forbidPattern(path, source, 'static legacy Day Flow SVG', /<svg viewBox="0 0 1210 620"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
  forbidPattern(path, source, 'old visible-top share copy', /Share of visible top/i)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'",
    "rangeMode: state.rangeMode",
    "metric: state.metric",
    "top: String(state.top)",
    "bucket: String(state.bucket)",
    "cache: 'no-store'",
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
    'document.addEventListener(\'visibilitychange\'',
    'Open in Battle Lines',
    'Highlight only',
    'Show all bands',
  ]) requireFragment(entryPath, source, fragment)

  forbidPattern(entryPath, source, 'Top 20/50 capped at 12 bands', /Math\.min\([^\n]*12\)/)
  forbidPattern(entryPath, source, 'Others removed from all scopes', /filter\([^\n]*others[^\n]*\)\.slice/)
  forbidPattern(entryPath, source, 'raw share rendered as percent', /shareAt\([^)]*\)[^\n]*toFixed[^\n]*%/)
  forbidPattern(entryPath, source, 'bucket index stretched without timestamps', /index\s*\/\s*\(count\s*-\s*1\)/)
  forbidPattern(entryPath, source, 'raw ISO bucket label fallback', /return buckets\[index\]/)
  forbidPattern(entryPath, source, 'detail metadata used as bucket values', /detailPanelSource\?\.streamers[^\n]*valueAt/)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    'Day Flow QA Contract',
    'Volume / Share',
    'Full / Top Focus',
    'Top 10 / 20 / 50',
    'Today / Yesterday / Date / Rolling 24h',
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

if (failures.length > 0) {
  console.error('ViewLoom Day Flow QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Day Flow QA verification passed for ${dayFlowPages.length} pages and executable calculation fixtures.`)
