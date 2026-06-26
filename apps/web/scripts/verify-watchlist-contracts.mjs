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

verifyGovernance()
verifyRuntime()
verifyCandidate()
verifyAcceptance()
verifyNoServerExpansion()
verifyWorkflows()

console.log('Watchlist completed production contract verification passed.')
console.log('- W1 through W5B behavior and acceptance remain governed')
console.log('- P9H1 closeout does not weaken Watchlist contracts')
console.log('- temporary Watchlist notes remain retired')
console.log('- no Watchlist-specific server, polling, per-channel request, or analytics path exists')

function verifyGovernance() {
  const spec = readRepo('docs/product/local-watchlist-spec.md')
  const record = readRepo('docs/product/watchlist-v1-implementation-plan.md')
  const roadmap = readRepo('docs/product/current-roadmap.md')
  const schedule = readRepo('docs/product/current-schedule.md')
  const program = readRepo('docs/product/post-watchlist-program-plan.md')
  const index = readRepo('docs/README.md')
  const inventory = readRepo('docs/audits/public-surface-inventory.json')
  const acceptance = readRepo('docs/operations/watchlist-production-acceptance-2026-06-25.md')

  requireAll(spec, [
    'Status: accepted permanent product specification', 'Version: 1.1',
    '/twitch/watchlist/', '/kick/watchlist/',
    'viewloom.watchlist.twitch.v1', 'viewloom.watchlist.kick.v1',
    'maximum entries: 50 per provider', 'initial visible entries: 12',
    'No Watchlist-specific server API is required or allowed for v1.',
    'production acceptance run: 28166806560',
  ], 'Watchlist specification')
  for (const label of [
    'In latest observed set', 'In latest available observed set', 'Provider data is stale',
    'Not in latest observed set', 'Not confirmed offline', 'Latest observation unavailable',
    'Present in retained History result', 'Not in retained History result',
    'No complete history is implied', 'Retained History is partial', 'Retained History unavailable',
  ]) assert.ok(spec.includes(label), `spec missing exact label: ${label}`)

  requireAll(record, [
    'Status: completed implementation record', 'Version: 2.1',
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

  requireAll(roadmap, [
    'Local Watchlist v1 is complete through PR #425.',
    'Phase 8 P8B   complete PR #428',
    'Phase 9 P9H1  complete PR #434',
    'Active implementation branch: none',
    'work-history-ui-h2-chart',
    'No Phase 16 feature is approved.',
  ], 'roadmap')
  requireAll(schedule, [
    'P9H1 History metric synchronization      complete PR #434',
    'Active implementation branch             none',
    'Exact next branch                        work-history-ui-h2-chart',
    'P9H2 branch created                      no',
  ], 'schedule')
  requireAll(program, [
    'Status: active source-of-truth program plan', 'Version: 2.3',
    'Current implementation branch: none',
    'Completed metric synchronization: PR #434',
    '| 9 | P9H1 | complete PR #434',
    'Exact next implementation branch after explicit continuation: `work-history-ui-h2-chart`',
    'Phase 16 begins only after one candidate is separately approved',
  ], 'program')
  requireAll(index, [
    'product/local-watchlist-spec.md', 'product/watchlist-v1-implementation-plan.md',
    'operations/watchlist-production-acceptance-2026-06-25.md',
    'Phase 6  Local Watchlist v1', 'P9H1     metric execution repair',
    'work-history-ui-h2-chart',
  ], 'documentation index')
  requireAll(inventory, [
    'viewloom-public-surface-inventory-v1', '"vite_html_inputs": 20',
    '"inventory_entries": 21', '"next_branch": "work-public-browser-audit"',
  ], 'historical inventory')
  requireAll(acceptance, [
    'Status: completed permanent record', 'f3e0ee8741e96015c5440df167574b8002fccc0d',
    'viewloom-watchlist-production-acceptance-v1', '28166806560', '7876704775',
    '6 / 6 pass', 'DB_TWITCH_HOT -> vl_twitch_hot', 'DB_KICK_HOT -> vl_kick_hot',
  ], 'production acceptance')

  for (const path of [
    'docs/work-in-progress/watchlist-v1-working-note.md',
    'docs/work-in-progress/watchlist-w5a-hosted-preview-note.md',
    'docs/work-in-progress/watchlist-w5b-production-note.md',
    'docs/work-in-progress/watchlist-w5b-production-note-copy.md',
    'docs/work-in-progress/watchlist-w5b-production-note-copy-2.md',
    'docs/work-in-progress/watchlist-w5b-production-note-copy-3.md',
    'docs/work-in-progress/watchlist-w5b-production-note-copy-4.md',
    'docs/work-in-progress/watchlist-w5b-production-note-copy-5.md',
    'docs/work-in-progress/watchlist-w5b-production-note-copy-6.md',
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
    'latest.refresh(entries)', 'history.refresh(entries, period)',
    "history.getSnapshot(period) ? 'cache' : 'memory_only'",
    "latest.getSnapshot() ? 'cache' : 'memory_only'",
  ], 'combined controller')

  assert.equal((page.match(/\bfetch\s*\(/g) ?? []).length, 1)
  assert.match(page, /fetch\s*\(endpoint/)
  requireAll(page, [
    'dataController.initialLoad', 'dataController.changePeriod', 'dataController.refresh',
    'dataController.retryLatest', 'dataController.retryHistory', 'dataController.taskLocal',
    'Open Channel', 'Open History', 'Open Heatmap', 'Not confirmed offline',
    'No complete history is implied',
  ], 'Watchlist page')
  requireAll(channel, [
    'Save to Watchlist', 'Saved in Watchlist', 'No data request was made.',
    'addStoredWatchlistEntry', 'readWatchlistStorageEvent',
  ], 'Channel action')
  for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) {
    assert.equal(channel.includes(token), false, `Channel action contains ${token}`)
  }

  for (const path of [
    ...walkFiles(resolve(webRoot, 'src/live/watchlist')),
    resolve(webRoot, 'src/live/watchlist-page.ts'),
    resolve(webRoot, 'src/live/watchlist-move-focus.ts'),
    resolve(webRoot, 'src/live/channel-watchlist.ts'),
  ]) {
    const source = readFileSync(path, 'utf8')
    for (const token of [
      'setInterval(', 'navigator.serviceWorker', 'serviceWorker.register', 'sessionStorage',
      'indexedDB', 'document.cookie', 'navigator.sendBeacon', 'trackEvent(', 'gtag(',
      '/api/watchlist', 'D1Database', 'KVNamespace', 'R2Bucket', 'scheduled(',
    ]) assert.equal(source.includes(token), false, `${relative(webRoot, path)} contains ${token}`)
  }
}

function verifyCandidate() {
  requireAll(readWeb('src/live/watchlist-move-focus.ts'), [
    "import '../watchlist-candidate.css'", "import '../watchlist-candidate-panels.css'",
    "import '../watchlist-candidate-responsive.css'",
  ], 'candidate style entry')
  requireAll(readWeb('src/watchlist-candidate-responsive.css'), [
    '@media (max-width: 980px)', '@media (max-width: 760px)', '@media (max-width: 430px)',
    '@media (prefers-reduced-motion: reduce)', '@media (prefers-contrast: more)',
    '@media (forced-colors: active)', 'min-height: 44px', 'min-height: 48px',
  ], 'responsive contract')
  requireAll(readWeb('scripts/watchlist-candidate-desktop.mjs'), ['width: 1440', 'width: 820'], 'desktop gate')
  requireAll(readWeb('scripts/watchlist-candidate-mobile.mjs'), ['width: 390', 'width: 360'], 'mobile gate')
}

function verifyAcceptance() {
  requireAll(readWeb('scripts/watchlist-browser-acceptance.mjs'), [
    'viewloom-watchlist-local-browser-acceptance-v1', 'verifyTwitchIntegratedDesktop',
    'verifyKickTabletAndChannel', 'verifyKickMobile', 'verifyStorageUnavailable',
  ], 'local acceptance')
  requireAll(readWeb('scripts/watchlist-cloudflare-preview.mjs'), [
    'viewloom-watchlist-hosted-preview-acceptance-v1', 'preview-watchlist-v1',
    'c75b4549bb50d7eb54c0135874dba63db0b7cc69', 'DB_TWITCH_HOT', 'DB_KICK_HOT',
    'verifyWatchlist', 'verifyChannelSave',
  ], 'hosted acceptance')
  requireAll(readWeb('scripts/watchlist-production-acceptance.mjs'), [
    'viewloom-watchlist-production-acceptance-v1', 'f3e0ee8741e96015c5440df167574b8002fccc0d',
    "collectorState === 'ok'", "collectorState === 'snapshot_available'",
    'verifyHome', 'verifyWatchlist', 'verifyChannelSave', 'additionalRequestsOnSave',
  ], 'production acceptance')
}

function verifyNoServerExpansion() {
  for (const root of [resolve(webRoot, 'functions'), resolve(repoRoot, 'workers')]) {
    if (!existsSync(root)) continue
    for (const path of walkFiles(root)) {
      const normalized = relative(repoRoot, path).replaceAll('\\', '/')
      const source = readFileSync(path, 'utf8')
      assert.equal(/watchlist/i.test(normalized), false, `server file introduced: ${normalized}`)
      assert.equal(source.includes('/api/watchlist'), false, `endpoint introduced: ${normalized}`)
      assert.equal(source.includes('viewloom.watchlist.'), false, `storage key leaked: ${normalized}`)
    }
  }
}

function verifyWorkflows() {
  const workflows = [
    '.github/workflows/watchlist-storage.yml', '.github/workflows/watchlist-latest.yml',
    '.github/workflows/watchlist-history.yml', '.github/workflows/watchlist-page.yml',
    '.github/workflows/watchlist-candidate.yml', '.github/workflows/watchlist-contracts.yml',
    '.github/workflows/watchlist-browser.yml', '.github/workflows/watchlist-hosted-preview.yml',
    '.github/workflows/watchlist-production-acceptance.yml',
  ]
  for (const path of workflows) requireAll(readRepo(path), [
    'concurrency:', 'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}',
    'cancel-in-progress: true',
  ], path)
  requireAll(readRepo('.github/workflows/watchlist-production-acceptance.yml'), [
    'name: Watchlist Production Acceptance', 'WATCHLIST_EXPECTED_BRANCH: main',
    'Run W5B production acceptance', 'Verify production evidence',
    "assert.equal(evidence.providers.kick.collectorState, 'snapshot_available')",
    'watchlist-w5b-production-acceptance',
  ], 'production workflow')
}

function walkFiles(root) {
  if (!existsSync(root)) return []
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
