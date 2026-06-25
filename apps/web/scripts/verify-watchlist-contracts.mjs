import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const readWeb = (path) => readFileSync(resolve(webRoot, path), 'utf8')
const readRepo = (path) => readFileSync(resolve(repoRoot, path), 'utf8')

const evidenceLabels = [
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
]

runFoundationVerifiers()
verifyCompletedGovernance()
verifyRoutes()
verifyStorageAndUrl()
verifyProviderRequests()
verifyChannelEntryPoint()
verifyRuntimePrivacy()
verifyCandidateLayer()
verifyAcceptanceLayers()
verifyNoServerExpansion()
verifyWorkflows()

console.log('Watchlist completed production contract verification passed.')
console.log('- W1 through W4B foundations and local browser regressions remain governed')
console.log('- W5A hosted Preview and W5B production acceptance are permanent operational gates')
console.log('- temporary Watchlist notes remain retired')
console.log('- no Watchlist-specific server, polling, per-channel request, or analytics-id path exists')

function runFoundationVerifiers() {
  for (const script of [
    'scripts/verify-watchlist-storage.mjs',
    'scripts/verify-watchlist-latest.mjs',
    'scripts/verify-watchlist-history.mjs',
    'scripts/verify-watchlist-page.mjs',
  ]) {
    const result = spawnSync(process.execPath, [script], {
      cwd: webRoot,
      encoding: 'utf8',
      env: process.env,
    })
    assert.equal(result.status, 0, `${script} failed.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`)
  }
}

function verifyCompletedGovernance() {
  const spec = readRepo('docs/product/local-watchlist-spec.md')
  const plan = readRepo('docs/product/watchlist-v1-implementation-plan.md')
  const roadmap = readRepo('docs/product/current-roadmap.md')
  const schedule = readRepo('docs/product/current-schedule.md')
  const index = readRepo('docs/README.md')
  const acceptance = readRepo('docs/operations/watchlist-production-acceptance-2026-06-25.md')

  for (const fragment of [
    'Status: accepted permanent product specification',
    'Version: 1.1',
    '/twitch/watchlist/',
    '/kick/watchlist/',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
    'saved ids, filter text, expanded state, and ordering are not serialized into the URL',
    'No Watchlist-specific server API is required or allowed for v1.',
    'no interval polling, background refresh, service worker monitoring, or page-hidden polling is allowed',
    'Watchlist is a secondary browser utility',
    'production acceptance run: 28166806560',
  ]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)
  for (const label of evidenceLabels) assert.ok(spec.includes(label), `spec missing exact label: ${label}`)

  for (const fragment of [
    'Status: completed implementation record',
    'Version: 2.0',
    'work-watchlist-w4-browser            complete PR #423',
    'work-watchlist-w5-hosted             complete PR #424',
    'work-watchlist-w5-production         completion PR #425',
    'viewloom-watchlist-local-browser-acceptance-v1',
    'viewloom-watchlist-hosted-preview-acceptance-v1',
    'viewloom-watchlist-production-acceptance-v1',
    '28166806560',
    'No additional Local Watchlist branch is scheduled.',
  ]) assert.ok(plan.includes(fragment), `plan missing completed state: ${fragment}`)

  for (const [path, source, fragments] of [
    ['docs/product/current-roadmap.md', roadmap, [
      'Local Watchlist v1 | W0–W5B complete through PR #425',
      'Phase 6 is complete after PR #425 merges',
      'viewloom-watchlist-production-acceptance-v1',
      'no next major feature is automatically approved',
    ]],
    ['docs/product/current-schedule.md', schedule, [
      'Local Watchlist W5A                      complete through PR #424',
      'Local Watchlist W5B                      completion PR #425',
      'Watchlist Production Acceptance',
      'Next major feature                        not selected',
    ]],
    ['docs/README.md', index, [
      'operations/watchlist-production-acceptance-2026-06-25.md',
      'W5A complete PR #424',
      'W5B completion PR #425',
      'There is no active Local Watchlist',
    ]],
    ['docs/operations/watchlist-production-acceptance-2026-06-25.md', acceptance, [
      'Status: completed permanent record',
      'f3e0ee8741e96015c5440df167574b8002fccc0d',
      'viewloom-watchlist-production-acceptance-v1',
      '28166806560',
      '7876704775',
      '6 / 6 pass',
      'DB_TWITCH_HOT -> vl_twitch_hot',
      'DB_KICK_HOT -> vl_kick_hot',
    ]],
  ]) {
    for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
  }

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
  ]) assert.equal(existsSync(resolve(repoRoot, path)), false, `retired temporary note remains: ${path}`)
}

function verifyRoutes() {
  verifyRoute('twitch', 'Twitch')
  verifyRoute('kick', 'Kick')
}

function verifyRoute(provider, providerName) {
  const source = readWeb(`${provider}/watchlist/index.html`)
  const canonical = `https://vl.badjoke-lab.com/${provider}/watchlist/`
  const head = section(source, '<head>', '</head>')
  const tabs = source.match(/<nav class="feature-tabs"[\s\S]*?<\/nav>/)?.[0] ?? ''
  const hrefs = [...tabs.matchAll(/href="([^"]+)"/g)].map((match) => match[1])

  for (const fragment of [
    `<title>${providerName} Local Watchlist — ViewLoom</title>`,
    '<meta name="robots" content="noindex,follow" />',
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `data-provider="${provider}"`,
    'Saved only in this browser',
    'Nothing is uploaded to a ViewLoom account.',
    'Absence from an observed result is not proof that a channel is offline.',
    '/src/live/watchlist-page.ts',
    '/src/live/watchlist-move-focus.ts',
  ]) assert.ok(source.includes(fragment), `${provider} route missing: ${fragment}`)

  assert.deepEqual(hrefs, [
    `/${provider}/heatmap/`,
    `/${provider}/day-flow/`,
    `/${provider}/battle-lines/`,
    `/${provider}/history/`,
    `/${provider}/status/`,
  ], `${provider} primary tabs changed`)
  assert.equal(/watchlist/i.test(tabs), false, `${provider} Watchlist entered primary tabs`)

  for (const token of [
    '?id=', '&id=', 'data-watchlist-entry=', 'data-channel-id=', 'example_channel',
    'viewloom.watchlist.twitch.v1', 'viewloom.watchlist.kick.v1',
  ]) assert.equal(head.includes(token), false, `${provider} metadata leaks local state: ${token}`)

  assert.equal(source.includes(`href="/${provider}/watchlist/?`), false, `${provider} route serializes local state`)
  assert.equal(source.includes('data-copy-current-view'), false, `${provider} route exposes share/copy-list behavior`)
  assert.equal(source.includes('method="get"'), false, `${provider} route exposes local ids through GET`)
}

function verifyStorageAndUrl() {
  const model = readWeb('src/live/watchlist/model.ts')
  const storage = readWeb('src/live/watchlist/storage.ts')
  const urlState = readWeb('src/live/watchlist/url-state.ts')

  for (const fragment of [
    "export const WATCHLIST_SCHEMA = 'viewloom-watchlist-v1'",
    'export const WATCHLIST_REVISION = 1',
    'export const WATCHLIST_MAX_ENTRIES = 50',
    'export const WATCHLIST_INITIAL_VISIBLE_ENTRIES = 12',
  ]) assert.ok(model.includes(fragment), `model missing: ${fragment}`)

  assert.ok(storage.includes('return `viewloom.watchlist.${provider}.v1`'), 'versioned provider key function changed')
  assert.equal(storage.includes('viewloom.watchlist.v1'), false, 'shared Watchlist key introduced')

  for (const key of ['id', 'name', 'filter', 'saved', 'order', 'expanded']) {
    assert.ok(urlState.includes(`'${key}'`), `URL scrub list missing: ${key}`)
  }
  assert.ok(urlState.includes('url.searchParams.delete(key)'), 'local-only query keys are not removed')
  assert.ok(urlState.includes("url.searchParams.set('period', '7d')"), '7d URL state missing')
  assert.ok(urlState.includes("url.searchParams.delete('period')"), '30d clean URL state missing')
  assert.equal(urlState.includes('channelId'), false, 'URL-state layer serializes channel ids')
}

function verifyProviderRequests() {
  const page = readWeb('src/live/watchlist-page.ts')
  const latestModel = readWeb('src/live/watchlist/latest-model.ts')
  const historyModel = readWeb('src/live/watchlist/history-model.ts')
  const combined = readWeb('src/live/watchlist/combined-controller.ts')

  assert.ok(latestModel.includes("provider === 'kick' ? '/api/kick-heatmap' : '/api/twitch-heatmap'"), 'latest endpoint provider mapping changed')
  assert.ok(historyModel.includes("provider === 'kick' ? '/api/kick-history' : '/api/history'"), 'History endpoint provider mapping changed')
  assert.ok(historyModel.includes('return `${base}?period=${period}&metric=viewer_minutes`'), 'History period/metric endpoint changed')

  assert.equal((page.match(/\bfetch\s*\(/g) ?? []).length, 1, 'Watchlist page must retain one generic fetch seam')
  assert.match(page, /fetch\s*\(endpoint/, 'generic fetch seam no longer uses injected endpoint')
  assert.ok(page.includes('if (!hasEntries)'), 'empty-list zero-request guard missing')
  assert.ok(page.includes("action === 'retry_latest'"), 'latest-only retry missing')
  assert.ok(page.includes("action === 'retry_history'"), 'History-only retry missing')

  for (const fragment of [
    'latest.refresh(entries)',
    'history.refresh(entries, period)',
    "history.getSnapshot(period) ? 'cache' : 'memory_only'",
    "latest.getSnapshot() ? 'cache' : 'memory_only'",
  ]) assert.ok(combined.includes(fragment), `combined request contract missing: ${fragment}`)

  for (const label of evidenceLabels) assert.ok(page.includes(label), `runtime missing exact label: ${label}`)
  assert.equal(page.includes('/api/watchlist'), false, 'Watchlist-specific API endpoint introduced')
  assert.equal(page.includes('Promise.all(documentState.entries'), false, 'per-channel request loop introduced')
}

function verifyChannelEntryPoint() {
  const action = readWeb('src/live/channel-watchlist.ts')
  for (const provider of ['twitch', 'kick']) {
    assert.ok(readWeb(`${provider}/channel/index.html`).includes('/src/live/channel-watchlist.ts'), `${provider} Channel lost Watchlist action`)
  }
  for (const fragment of [
    'Save to Watchlist',
    'Saved in Watchlist',
    'No data request was made.',
    'addStoredWatchlistEntry',
    'readWatchlistStorageEvent',
  ]) assert.ok(action.includes(fragment), `Channel action missing: ${fragment}`)
  for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'trackEvent(', 'gtag(']) {
    assert.equal(action.includes(token), false, `Channel action contains forbidden behavior: ${token}`)
  }
}

function verifyRuntimePrivacy() {
  const paths = [
    ...walkFiles(resolve(webRoot, 'src/live/watchlist')).map((path) => relative(webRoot, path)),
    'src/live/watchlist-page.ts',
    'src/live/watchlist-move-focus.ts',
    'src/live/channel-watchlist.ts',
  ]
  const forbidden = [
    'setInterval(', 'navigator.serviceWorker', 'serviceWorker.register', 'indexedDB',
    'sessionStorage', 'document.cookie', 'navigator.sendBeacon', 'trackEvent(', 'gtag(',
    '/api/watchlist', 'D1Database', 'KVNamespace', 'R2Bucket', 'scheduled(',
  ]
  for (const path of paths) {
    const source = readWeb(path)
    for (const token of forbidden) assert.equal(source.includes(token), false, `${path} contains forbidden behavior: ${token}`)
  }

  const analytics = readWeb('src/analytics.ts')
  for (const token of ['localStorage', 'sessionStorage', 'searchParams', 'location.search', 'channelId']) {
    assert.equal(analytics.includes(token), false, `generic analytics could capture a local id: ${token}`)
  }
}

function verifyCandidateLayer() {
  const focus = readWeb('src/live/watchlist-move-focus.ts')
  const base = readWeb('src/watchlist-candidate.css')
  const panels = readWeb('src/watchlist-candidate-panels.css')
  const responsive = readWeb('src/watchlist-candidate-responsive.css')
  const desktop = readWeb('scripts/watchlist-candidate-desktop.mjs')
  const mobile = readWeb('scripts/watchlist-candidate-mobile.mjs')

  for (const fragment of [
    "import '../watchlist-candidate.css'",
    "import '../watchlist-candidate-panels.css'",
    "import '../watchlist-candidate-responsive.css'",
  ]) assert.ok(focus.includes(fragment), `candidate style entry missing: ${fragment}`)

  for (const fragment of ['.watchlist-page .page-head', '.watchlist-controls', '.watchlist-feedback']) {
    assert.ok(base.includes(fragment), `candidate base missing: ${fragment}`)
  }
  for (const fragment of ['.watchlist-card', '.watchlist-evidence-grid', '.watchlist-remove']) {
    assert.ok(panels.includes(fragment), `candidate panels missing: ${fragment}`)
  }
  for (const fragment of [
    '@media (max-width: 980px)', '@media (max-width: 760px)', '@media (max-width: 430px)',
    '@media (prefers-contrast: more)', '@media (forced-colors: active)',
    '@media (prefers-reduced-motion: reduce)', 'min-height: 44px', 'min-height: 48px',
  ]) assert.ok(responsive.includes(fragment), `candidate responsive contract missing: ${fragment}`)

  for (const fragment of ['width: 1440', 'width: 820', 'watchlist-candidate-twitch-desktop-1440.png', 'watchlist-candidate-kick-desktop-1440-partial.png']) {
    assert.ok(desktop.includes(fragment), `desktop candidate gate missing: ${fragment}`)
  }
  for (const fragment of ['width: 390', 'width: 360', 'watchlist-candidate-kick-mobile-390-empty.png', 'watchlist-candidate-kick-mobile-360-storage-error.png', 'watchlist-candidate-kick-mobile-360-long-content.png']) {
    assert.ok(mobile.includes(fragment), `mobile candidate gate missing: ${fragment}`)
  }
}

function verifyAcceptanceLayers() {
  const browser = readWeb('scripts/watchlist-browser-acceptance.mjs')
  const hosted = readWeb('scripts/watchlist-cloudflare-preview.mjs')
  const production = readWeb('scripts/watchlist-production-acceptance.mjs')
  const hostedWorkflow = readRepo('.github/workflows/watchlist-hosted-preview.yml')
  const productionWorkflow = readRepo('.github/workflows/watchlist-production-acceptance.yml')

  for (const fragment of [
    'viewloom-watchlist-local-browser-acceptance-v1',
    'verifyTwitchIntegratedDesktop',
    'verifyKickTabletAndChannel',
    'verifyKickMobile',
    'verifyStorageUnavailable',
  ]) assert.ok(browser.includes(fragment), `local browser acceptance missing: ${fragment}`)

  for (const fragment of [
    'viewloom-watchlist-hosted-preview-acceptance-v1',
    'preview-watchlist-v1',
    'c75b4549bb50d7eb54c0135874dba63db0b7cc69',
    'DB_TWITCH_HOT', 'vl_twitch_hot', 'DB_KICK_HOT', 'vl_kick_hot',
    'verifyWatchlist', 'verifyChannelSave', 'Retained History is partial',
  ]) assert.ok(hosted.includes(fragment), `hosted acceptance missing: ${fragment}`)

  for (const fragment of [
    'viewloom-watchlist-production-acceptance-v1',
    'f3e0ee8741e96015c5440df167574b8002fccc0d',
    "collectorState === 'ok'",
    "collectorState === 'snapshot_available'",
    'verifyHome', 'verifyWatchlist', 'verifyChannelSave',
    'twitch-home-entry-production',
    'kick-home-entry-production',
    'additionalRequestsOnSave',
  ]) assert.ok(production.includes(fragment), `production acceptance missing: ${fragment}`)

  for (const [name, source, fragments] of [
    ['hosted workflow', hostedWorkflow, [
      'name: Watchlist Hosted Preview',
      'WATCHLIST_EXPECTED_BRANCH: preview-watchlist-v1',
      'Run W5A hosted Preview acceptance',
      'watchlist-w5a-hosted-preview',
    ]],
    ['production workflow', productionWorkflow, [
      'name: Watchlist Production Acceptance',
      'WATCHLIST_EXPECTED_BRANCH: main',
      'Run W5B production acceptance',
      'Verify production evidence',
      "assert.equal(evidence.providers.kick.collectorState, 'snapshot_available')",
      'watchlist-w5b-production-acceptance',
    ]],
  ]) {
    for (const fragment of fragments) assert.ok(source.includes(fragment), `${name} missing: ${fragment}`)
  }
}

function verifyNoServerExpansion() {
  for (const root of [resolve(webRoot, 'functions'), resolve(repoRoot, 'workers')]) {
    if (!existsSync(root)) continue
    for (const path of walkFiles(root)) {
      const normalized = relative(repoRoot, path).replaceAll('\\', '/')
      assert.equal(/watchlist/i.test(normalized), false, `Watchlist-specific server/collector file introduced: ${normalized}`)
      if (!isText(path)) continue
      const source = readFileSync(path, 'utf8')
      assert.equal(source.includes('/api/watchlist'), false, `Watchlist-specific endpoint introduced: ${normalized}`)
      assert.equal(source.includes('viewloom.watchlist.'), false, `browser-local key leaked into server code: ${normalized}`)
    }
  }
}

function verifyWorkflows() {
  const workflows = [
    '.github/workflows/watchlist-storage.yml',
    '.github/workflows/watchlist-latest.yml',
    '.github/workflows/watchlist-history.yml',
    '.github/workflows/watchlist-page.yml',
    '.github/workflows/watchlist-candidate.yml',
    '.github/workflows/watchlist-contracts.yml',
    '.github/workflows/watchlist-browser.yml',
    '.github/workflows/watchlist-hosted-preview.yml',
    '.github/workflows/watchlist-production-acceptance.yml',
  ]
  for (const path of workflows) {
    const source = readRepo(path)
    assert.ok(source.includes('concurrency:'), `${path} concurrency missing`)
    assert.ok(source.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}'), `${path} concurrency group changed`)
    assert.ok(source.includes('cancel-in-progress: true'), `${path} does not cancel obsolete runs`)
  }

  const contractWorkflow = readRepo('.github/workflows/watchlist-contracts.yml')
  for (const fragment of [
    'name: Watchlist Contracts',
    'Verify development policy',
    'Verify consolidated Watchlist contracts',
    'node scripts/verify-watchlist-contracts.mjs',
  ]) assert.ok(contractWorkflow.includes(fragment), `contract workflow missing: ${fragment}`)

  const packageSource = readWeb('package.json')
  assert.ok(packageSource.includes('"verify:watchlist-contracts": "node scripts/verify-watchlist-contracts.mjs"'), 'package command missing')
}

function section(source, start, end) {
  const from = source.indexOf(start)
  const to = source.indexOf(end)
  assert.ok(from >= 0 && to > from, `missing section ${start}...${end}`)
  return source.slice(from, to + end.length)
}

function walkFiles(root) {
  if (!existsSync(root)) return []
  const files = []
  for (const entry of readdirSync(root)) {
    if (['.git', 'node_modules', 'dist', '.wrangler'].includes(entry)) continue
    const path = resolve(root, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) files.push(...walkFiles(path))
    else if (stats.isFile()) files.push(path)
  }
  return files
}

function isText(path) {
  return /\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|toml|md|html|css|sql|py)$/i.test(basename(path))
}
