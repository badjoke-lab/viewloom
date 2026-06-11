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
const contractPath = 'docs/history-qa-contract.md'

for (const path of [...historyPages, entryPath, contractPath]) requireFile(path)

for (const path of historyPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, '/src/live/history-current-shell-entry.ts')
  requireFragment(path, source, 'class="history-stage"')
  requireFragment(path, source, 'data-history-summary')
  requireFragment(path, source, 'data-history-notes')
  requireFragment(path, source, 'class="metric-ledger')
  forbidPattern(path, source, 'static legacy History SVG', /<svg viewBox="0 0 1210 560"/)
  forbidPattern(path, source, 'static Stream demo rows', /Stream A|Stream B|Stream C/)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  requireFragment(entryPath, source, "provider === 'kick' ? '/api/kick-history' : '/api/history'")
  requireFragment(entryPath, source, 'period=30d')
  requireFragment(entryPath, source, 'cache: \'no-store\'')
  requireFragment(entryPath, source, 'renderSummary(payload')
  requireFragment(entryPath, source, 'renderChart(payload')
  requireFragment(entryPath, source, 'renderTable(payload')
  requireFragment(entryPath, source, 'renderNotes(payload')
  requireFragment(entryPath, source, 'renderError(')
  requireFragment(entryPath, source, 'No retained history rollup is available yet.')
  forbidPattern(entryPath, source, 'app-root rewrite renderer', /document\.querySelector<HTMLElement>\('\#app'\)/)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'current-shell live entry')
  requireFragment(contractPath, source, 'static SVG-only History charts')
  requireFragment(contractPath, source, '`Stream A` demo rows')
}

if (failures.length > 0) {
  console.error('ViewLoom History QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom History QA verification passed for ${historyPages.length} History pages.`)
