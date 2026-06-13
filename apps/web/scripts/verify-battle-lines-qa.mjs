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
const contractPath = 'docs/battle-lines-qa-contract.md'

for (const path of [...battlePages, entryPath, contractPath]) requireFile(path)

for (const path of battlePages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, '/src/live/battle-lines-current-shell-entry.ts')
  requireFragment(path, source, 'class="battle-stage"')
  requireFragment(path, source, 'data-battle-summary')
  requireFragment(path, source, 'data-battle-feed')
  requireFragment(path, source, 'data-battle-metric="viewers"')
  requireFragment(path, source, 'data-battle-refresh')
  requireFragment(path, source, '<strong>Selection</strong>')
  requireFragment(path, source, '.battle-legend__item')
  requireFragment(path, source, '.battle-cursor line')
  requireFragment(path, source, '.event-item')
  forbidPattern(path, source, 'static legacy Battle Lines SVG', /<svg viewBox="0 0 1210 560"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
  forbidPattern(path, source, 'old primary battle shell heading', /<strong>Primary battle<\/strong>/)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  requireFragment(entryPath, source, "provider === 'kick' ? '/api/kick-battle-lines' : '/api/battle-lines'")
  requireFragment(entryPath, source, 'data-battle-metric')
  requireFragment(entryPath, source, 'data-battle-refresh')
  requireFragment(entryPath, source, 'cache: \'no-store\'')
  requireFragment(entryPath, source, 'renderLoading()')
  requireFragment(entryPath, source, 'renderSummary(payload)')
  requireFragment(entryPath, source, 'renderChart(payload)')
  requireFragment(entryPath, source, 'renderFeed(payload)')
  requireFragment(entryPath, source, 'renderError(')
  requireFragment(entryPath, source, 'selectedLineId')
  requireFragment(entryPath, source, 'selectedPointIndex')
  requireFragment(entryPath, source, 'data-battle-chart')
  requireFragment(entryPath, source, 'data-battle-line')
  requireFragment(entryPath, source, 'data-battle-legend')
  requireFragment(entryPath, source, 'bindChartInteraction(payload')
  requireFragment(entryPath, source, 'bindLegendInteraction(payload)')
  requireFragment(entryPath, source, 'bindLineInteraction(payload)')
  requireFragment(entryPath, source, "chart.addEventListener('click'")
  requireFragment(entryPath, source, 'battle-cursor')
  requireFragment(entryPath, source, 'Selected stream')
  requireFragment(entryPath, source, 'Nearest line')
  requireFragment(entryPath, source, 'dedupeEvents(')
  requireFragment(entryPath, source, 'isObservedPoint')
  requireFragment(entryPath, source, 'missing')
  requireFragment(entryPath, source, 'offline')
  requireFragment(entryPath, source, 'not_observed')
  forbidPattern(entryPath, source, 'app-root rewrite renderer', /document\.querySelector<HTMLElement>\('\#app'\)/)
  forbidPattern(entryPath, source, 'old concatenated text legend', /<span><i style="background:/)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'current-shell live entry')
  requireFragment(contractPath, source, 'static SVG-only Battle Lines chart')
  requireFragment(contractPath, source, 'not-observed points must not be connected')
}

if (failures.length > 0) {
  console.error('ViewLoom Battle Lines QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Battle Lines QA verification passed for ${battlePages.length} selectable Battle Lines pages.`)
