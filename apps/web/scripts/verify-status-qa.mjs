import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Status QA file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing required Status QA fragment: ${fragment}`)
}

function forbidPattern(path, source, label, pattern) {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden Status regression: ${label}`)
}

const statusPages = ['twitch/status/index.html', 'kick/status/index.html']
const entryPath = 'src/live/status-current-shell-entry.ts'
const contractPath = 'docs/status-qa-contract.md'

for (const path of [...statusPages, entryPath, contractPath]) requireFile(path)

for (const path of statusPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, '/src/live/status-current-shell-entry.ts')
  requireFragment(path, source, 'class="status-board"')
  requireFragment(path, source, 'class="metric-ledger"')
  requireFragment(path, source, 'State definitions')
  requireFragment(path, source, 'Fresh is shown only when returned by the live status API')
  requireFragment(path, source, 'Empty means the real pipeline returned no qualifying streams')
  forbidPattern(path, source, 'shell placeholder claim', /Shell ready for real data/i)
  forbidPattern(path, source, 'hard-coded Fresh state cell', />\s*Fresh\s*</)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  requireFragment(entryPath, source, "provider === 'kick' ? '/api/kick-status' : '/api/twitch-status'")
  requireFragment(entryPath, source, "cache: 'no-store'")
  requireFragment(entryPath, source, 'renderFacts(payload)')
  requireFragment(entryPath, source, 'renderBoard(payload)')
  requireFragment(entryPath, source, 'renderFeatures(payload)')
  requireFragment(entryPath, source, 'renderError(')
  requireFragment(entryPath, source, '.status-board .status-cell strong')
  requireFragment(entryPath, source, '.metric-ledger tbody')
  forbidPattern(entryPath, source, 'app-root rewrite renderer', /document\.querySelector<HTMLElement>\('\#app'\)/)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'current-shell live entry')
  requireFragment(contractPath, source, 'hard-coded demo freshness')
}

if (failures.length > 0) {
  console.error('ViewLoom Status QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Status QA verification passed for ${statusPages.length} Status pages.`)
