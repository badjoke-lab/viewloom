import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Battle Lines QA file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing required Battle Lines QA fragment: ${fragment}`)
}

function forbidPattern(path, source, label, pattern) {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden Battle Lines regression: ${label}`)
}

const battlePages = ['twitch/battle-lines/index.html', 'kick/battle-lines/index.html']
const entryPath = 'src/live/battle-lines-current-shell-entry.ts'
const stylePath = 'src/live/battle-lines-wide.css'
const contractPath = 'docs/battle-lines-qa-contract.md'

for (const path of [...battlePages, entryPath, stylePath, contractPath]) requireFile(path)

for (const path of battlePages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const fragment of [
    '/src/live/battle-lines-current-shell-entry.ts',
    '/src/live/battle-lines-wide.css',
    'class="battle-stage"',
    'data-battle-primary',
    'data-battle-inspector',
    'data-battle-reversals',
    'data-battle-secondary',
    'data-battle-feed',
    'data-battle-coverage',
    'data-battle-range="today"',
    'data-battle-range="yesterday"',
    'data-battle-date',
    'data-battle-metric="viewers"',
    'data-battle-metric="indexed"',
    'data-battle-top="3"',
    'data-battle-top="5"',
    'data-battle-top="10"',
    'data-battle-bucket="5m"',
    'data-battle-bucket="10m"',
    'data-battle-recommended',
    'data-battle-latest',
    'data-battle-refresh',
  ]) requireFragment(path, source, fragment)
  forbidPattern(path, source, 'obsolete Split layout', /layout-split/)
  forbidPattern(path, source, 'static legacy Battle Lines SVG', /<svg viewBox="0 0 1210 560"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "provider === 'kick' ? '/api/kick-battle-lines' : '/api/battle-lines'",
    'cache: \'no-store\'',
    'renderPrimary(payload)',
    'renderChart(payload)',
    'renderInspector(payload)',
    'renderReversals(payload)',
    'renderSecondary(payload)',
    'renderFeed(payload)',
    'renderCoverage(payload)',
    'selectedBattleId',
    'selectedLineId',
    'selectedIndex',
    'manualBattle',
    'followLatest',
    'data-battle-chart',
    'data-battle-line-select',
    'data-battle-event-index',
    'lineSegments(',
    'gapBand(',
    'chart.addEventListener(\'pointerdown\'',
    "event.key === 'ArrowLeft'",
    "event.key === 'ArrowRight'",
    "event.key === 'Home'",
    "event.key === 'End'",
    'history.replaceState',
    'window.setInterval',
    'missing',
    'offline',
    'not_observed',
  ]) requireFragment(entryPath, source, fragment)
  forbidPattern(entryPath, source, 'per-line point deletion before comparison', /\.filter\(isObservedPoint\)/)
  forbidPattern(entryPath, source, 'app-root rewrite renderer', /document\.querySelector<HTMLElement>\('\#app'\)/)
  forbidPattern(entryPath, source, 'old selected-stream inspector', /Selected stream|Nearest line/)
}

if (existsSync(join(root, stylePath))) {
  const source = read(stylePath)
  for (const fragment of ['.battle-controls', '.battle-primary', '.battle-chart-wrap', '.battle-gap-band', '.battle-inspector', '.reversal-strip', '.secondary-grid', '.event-feed', '@media(max-width:760px)']) requireFragment(stylePath, source, fragment)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of ['Wide-first rivalry workspace', 'shared UTC bucket timeline', 'not-observed points must not be connected', 'selected-time cursor', 'Reversal strip', 'Secondary battles']) requireFragment(contractPath, source, fragment)
}

if (failures.length > 0) {
  console.error('ViewLoom Battle Lines QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Battle Lines QA verification passed for ${battlePages.length} Wide rivalry workspaces.`)
