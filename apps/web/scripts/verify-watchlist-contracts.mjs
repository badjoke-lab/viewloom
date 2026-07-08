import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const readWeb = (path) => readFileSync(resolve(webRoot, path), 'utf8')
const readRepo = (path) => readFileSync(resolve(repoRoot, path), 'utf8')
const requireAll = (source, fragments, label) => {
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${label} missing: ${fragment}`)
}

for (const script of [
  'scripts/verify-watchlist-storage.mjs',
  'scripts/verify-watchlist-latest.mjs',
  'scripts/verify-watchlist-history.mjs',
  'scripts/verify-watchlist-page.mjs',
]) {
  const result = spawnSync(process.execPath, [script], { cwd: webRoot, encoding: 'utf8', env: process.env })
  assert.equal(result.status, 0, `${script} did not pass.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`)
}

verifyPermanentGovernance()
verifyRuntime()
verifyNoServerExpansion()
verifyWorkflowOwnership()

console.log('Watchlist completed production contract verification passed.')
console.log('- permanent specification, implementation record, and production evidence remain exact')
console.log('- current public route counts may grow without rewriting historical Watchlist evidence')
console.log('- both provider Watchlist routes remain in current route ownership')
console.log('- no Watchlist-specific server, polling, per-channel request, or analytics path exists')

function verifyPermanentGovernance() {
  const spec = readRepo('docs/product/local-watchlist-spec.md')
  const record = readRepo('docs/product/watchlist-v1-implementation-plan.md')
  const inventory = JSON.parse(readRepo('docs/audits/public-surface-inventory.json'))
  const twitchRoutes = JSON.parse(readRepo('docs/audits/public-surface-routes-twitch.json'))
  const kickRoutes = JSON.parse(readRepo('docs/audits/public-surface-routes-kick.json'))
  const acceptance = readRepo('docs/operations/watchlist-production-acceptance-2026-06-25.md')
  const index = readRepo('docs/README.md')

  requireAll(spec, [
    'Status: accepted permanent product specification',
    'Version: 1.1',
    '/twitch/watchlist/',
    '/kick/watchlist/',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
    'maximum entries: 50 per provider',
    'initial visible entries: 12',
    'No Watchlist-specific server API is required or allowed for v1.',
    'production acceptance run: 28166806560',
  ], 'Watchlist specification')

  for (const label of [
    'In latest observed set',
    'In latest available observed set',
    'Provider data is stale',
    'Not in latest observed set',
    'Not confirmed offline',
    'Latest observation unavailable',
    'Present in retained History result',
    'Not in retained History result',
    'No complete history is implied',
    'Retained History is partial',
    'Retained History unavailable',
  ]) assert.ok(spec.includes(label), `spec missing exact label: ${label}`)

  requireAll(record, [
    'Status: completed implementation record',
    'Version: 2.1',
    'work-watchlist-w4-browser            complete PR #423',
    'work-watchlist-w5-hosted             complete PR #424',
    'work-watchlist-w5-production         completion PR #425',
    'concurrent refresh click is deduplicated',
    'Back/Forward period restore from page memory',
    'viewloom-watchlist-local-browser-acceptance-v1',
    'viewloom-watchlist-hosted-preview-acceptance-v1',
    'viewloom-watchlist-production-acceptance-v1',
    'No additional Local Watchlist branch is scheduled.',
  ], 'Watchlist implementation record')

  assert.equal(inventory.schema, 'viewloom-public-surface-inventory-v1')
  assert.equal(inventory.counts.public_readiness_configured_pages, inventory.counts.vite_html_inputs)
  assert.equal(inventory.counts.production_smoke_page_routes, inventory.counts.vite_html_inputs)
  assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
  assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)
  assert.ok(twitchRoutes.routes.some((route) => route.route === '/twitch/watchlist/' && route.profile === 'watchlist'), 'current Twitch Watchlist route ownership missing')
  assert.ok(kickRoutes.routes.some((route) => route.route === '/kick/watchlist/' && route.profile === 'watchlist'), 'current Kick Watchlist route ownership missing')

  requireAll(acceptance, [
    'Status: completed permanent record',
    'f3e0ee8741e96015c5440df167574b8002fccc0d',
    'viewloom-watchlist-production-acceptance-v1',
    '28166806560',
    '7876704775',
    '6 / 6 pass',
    'DB_TWITCH_HOT -> vl_twitch_hot',
    'DB_KICK_HOT -> vl_kick_hot',
  ], 'production acceptance')

  requireAll(index, [
    'product/local-watchlist-spec.md',
    'product/watchlist-v1-implementation-plan.md',
    'operations/watchlist-production-acceptance-2026-06-25.md',
  ], 'documentation index')

  for (const path of [
    'docs/work-in-progress/watchlist-v1-working-note.md',
    'docs/work-in-progress/watchlist-w5a-hosted-preview-note.md',
    'docs/work-in-progress/watchlist-w5b-production-note.md',
  ]) assert.equal(existsSync(resolve(repoRoot, path)), false, `retired note remains: ${path}`)
}

function verifyRuntime() {
  const page = readWeb('src/live/watchlist-page.ts')
  const channel = readWeb('src/live/channel-watchlist.ts')
  const model = readWeb('src/live/watchlist/model.ts')
  const storage = readWeb('src/live/watchlist/storage.ts')
  const urlState = readWeb('src/live/watchlist/url-state.ts')
  const latest = readWeb('src/live/watchlist/latest-model.ts')
  const history = readWeb('src/live/watchlist/history-model.ts')
  const combined = readWeb('src/live/watchlist/combined-controller.ts')

  requireAll(model, [
    "export const WATCHLIST_SCHEMA = 'viewloom-watchlist-v1'",
    'export const WATCHLIST_REVISION = 1',
    'export const WATCHLIST_MAX_ENTRIES = 50',
    'export const WATCHLIST_INITIAL_VISIBLE_ENTRIES = 12',
  ], 'model')
  assert.ok(storage.includes('return `viewloom.watchlist.${provider}.v1`'))
  assert.equal(storage.includes('viewloom.watchlist.v1'), false)
  for (const key of ['id', 'name', 'filter', 'saved', 'order', 'expanded']) assert.ok(urlState.includes(`'${key}'`))
  assert.ok(latest.includes("provider === 'kick' ? '/api/kick-heatmap' : '/api/twitch-heatmap'"))
  assert.ok(history.includes("provider === 'kick' ? '/api/kick-history' : '/api/history'"))
  requireAll(combined, [
    'latest.refresh(entries)',
    'history.refresh(entries, period)',
    "history.getSnapshot(period) ? 'cache' : 'memory_only'",
    "latest.getSnapshot() ? 'cache' : 'memory_only'",
  ], 'combined controller')

  assert.equal((page.match(/\bfetch\s*\(/g) ?? []).length, 1)
  assert.match(page, /fetch\s*\(endpoint/)
  requireAll(page, [
    'dataController.initialLoad',
    'dataController.changePeriod',
    'dataController.refresh',
    'dataController.retryLatest',
    'dataController.retryHistory',
    'dataController.taskLocal',
    'Open Channel',
    'Open History',
    'Open Heatmap',
    'Not confirmed offline',
    'No complete history is implied',
  ], 'Watchlist page')
  requireAll(channel, [
    'Save to Watchlist',
    'Saved in Watchlist',
    'No data request was made.',
    'addStoredWatchlistEntry',
    'readWatchlistStorageEvent',
  ], 'Channel action')
  for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) {
    assert.equal(channel.includes(token), false, `Channel action contains ${token}`)
  }
}

function verifyNoServerExpansion() {
  for (const root of [resolve(webRoot, 'functions'), resolve(repoRoot, 'workers')]) {
    if (!existsSync(root)) continue
    for (const path of walkFiles(root)) {
      const source = readFileSync(path, 'utf8')
      const name = relative(repoRoot, path).replaceAll('\\', '/')
      assert.equal(/watchlist/i.test(name), false, `Watchlist server file introduced: ${name}`)
      assert.equal(source.includes('/api/watchlist'), false, `Watchlist endpoint introduced: ${name}`)
      assert.equal(source.includes('viewloom.watchlist.'), false, `Watchlist storage key leaked: ${name}`)
    }
  }
}

function verifyWorkflowOwnership() {
  for (const path of [
    '.github/workflows/watchlist-storage.yml',
    '.github/workflows/watchlist-latest.yml',
    '.github/workflows/watchlist-history.yml',
    '.github/workflows/watchlist-page.yml',
    '.github/workflows/watchlist-candidate.yml',
    '.github/workflows/watchlist-contracts.yml',
    '.github/workflows/watchlist-browser.yml',
    '.github/workflows/watchlist-hosted-preview.yml',
    '.github/workflows/watchlist-production-acceptance.yml',
  ]) {
    const source = readRepo(path)
    assert.ok(source.includes('concurrency:'), `${path}: concurrency missing`)
    assert.ok(source.includes('cancel-in-progress: true'), `${path}: cancellation missing`)
  }
}

function walkFiles(root) {
  const files = []
  for (const entry of readdirSync(root)) {
    if (['.git', 'node_modules', 'dist', '.wrangler'].includes(entry)) continue
    const path = resolve(root, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) files.push(...walkFiles(path))
    else if (stats.isFile() && /\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|toml|md|html|css|sql|py)$/i.test(entry)) files.push(path)
  }
  return files
}
