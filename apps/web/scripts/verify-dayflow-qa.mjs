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

const dayFlowPages = ['twitch/day-flow/index.html', 'kick/day-flow/index.html']
const entryPath = 'src/live/day-flow-current-shell-entry.ts'
const contractPath = 'docs/dayflow-qa-contract.md'

for (const path of [...dayFlowPages, entryPath, contractPath]) requireFile(path)

for (const path of dayFlowPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, '/src/live/day-flow-current-shell-entry.ts')
  requireFragment(path, source, 'class="dayflow-stage"')
  requireFragment(path, source, 'data-dayflow-inspector')
  requireFragment(path, source, 'data-dayflow-metric="volume"')
  requireFragment(path, source, 'data-dayflow-metric="share"')
  requireFragment(path, source, 'data-dayflow-top="20"')
  requireFragment(path, source, 'data-dayflow-refresh')
  forbidPattern(path, source, 'static legacy Day Flow SVG', /<svg viewBox="0 0 1210 620"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  requireFragment(entryPath, source, "provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'")
  requireFragment(entryPath, source, 'data-dayflow-metric')
  requireFragment(entryPath, source, 'data-dayflow-top')
  requireFragment(entryPath, source, 'data-dayflow-refresh')
  requireFragment(entryPath, source, 'cache: \'no-store\'')
  requireFragment(entryPath, source, 'renderLoading()')
  requireFragment(entryPath, source, 'renderChart(payload)')
  requireFragment(entryPath, source, 'renderInspector(payload)')
  requireFragment(entryPath, source, 'renderError(')
  forbidPattern(entryPath, source, 'app-root rewrite renderer', /document\.querySelector<HTMLElement>\('\#app'\)/)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'current-shell live entry')
  requireFragment(contractPath, source, 'static SVG-only Day Flow chart')
}

if (failures.length > 0) {
  console.error('ViewLoom Day Flow QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Day Flow QA verification passed for ${dayFlowPages.length} Day Flow pages.`)
