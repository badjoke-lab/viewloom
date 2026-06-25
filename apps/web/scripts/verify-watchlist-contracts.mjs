import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const readWeb = (path) => readFileSync(resolve(webRoot, path), 'utf8')
const readRepo = (path) => readFileSync(resolve(repoRoot, path), 'utf8')

const labels = [
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
verifyGovernance()
verifyRoutes()
verifyStorageAndUrl()
verifyProviderRequests()
verifyChannelEntryPoint()
verifyRuntimePrivacy()
verifyCandidateLayer()
verifyNoServerExpansion()
verifyWorkflow()

console.log('Watchlist W4A executable contract closure verification passed.')
console.log('- W1 through W3C foundation verifiers passed')
console.log('- route, provider, request, privacy, Channel, candidate, and governance contracts passed')
console.log('- no Watchlist-specific server, binding, collector, cron, polling, or analytics-id path exists')

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
    assert.equal(
      result.status,
      0,
      `${script} failed.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
    )
  }
}

function verifyGovernance() {
  const spec = readRepo('docs/product/local-watchlist-spec.md')
  const plan = readRepo('docs/product/watchlist-v1-implementation-plan.md')
  const roadmap = readRepo('docs/product/current-roadmap.md')
  const schedule = readRepo('docs/product/current-schedule.md')
  const index = readRepo('docs/README.md')
  const note = readRepo('docs/work-in-progress/watchlist-v1-working-note.md')

  for (const fragment of [
    '/twitch/watchlist/',
    '/kick/watchlist/',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
    'saved ids, filter text, expanded state, and ordering are not serialized into the URL',
    'no channel id or local list contents are added to analytics URLs, canonical URLs, or share metadata',
    'No Watchlist-specific server API is required.',
    'no interval polling, background refresh, service worker monitoring, or page-hidden polling is allowed',
    'Watchlist is a secondary utility surface',
  ]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)

  for (const label of labels) assert.ok(spec.includes(label), `spec missing exact label: ${label}`)

  for (const fragment of [
    '## 11. W4A — executable contract closure',
    'Completed through PR #422',
    'a7324cea387db7477c01d97bf35b762a0bc8ea76',
    'apps/web/scripts/verify-watchlist-contracts.mjs',
    '.github/workflows/watchlist-contracts.yml',
    '## 12. W4B — complete local browser candidate QA',
    'State: completion candidate PR #423.',
    'viewloom-watchlist-local-browser-acceptance-v1',
    'W5A next after PR #423 merge report.',
  ]) assert.ok(plan.includes(fragment), `plan missing accepted/current state: ${fragment}`)

  for (const [path, source, fragments] of [
    ['docs/product/current-roadmap.md', roadmap, [
      'W4A  executable contract closure                   complete PR #422',
      'W4B  complete local browser candidate QA           completion candidate PR #423',
      'W5A  hosted preview-watchlist-v1 acceptance        next after merge report',
    ]],
    ['docs/product/current-schedule.md', schedule, [
      'Local Watchlist W4A                      complete through PR #422',
      'Local Watchlist W4B                      completion candidate PR #423',
      'Local Watchlist W5A                      next after PR #423 merge report',
    ]],
    ['docs/README.md', index, [
      'W4A complete PR #422',
      'W4B completion candidate PR #423',
      'W5A next after PR #423 merge report',
    ]],
    ['docs/work-in-progress/watchlist-v1-working-note.md', note, [
      'W4A contract closure             complete PR #422',
      'W4B browser candidate QA         completion candidate PR #423',
      'W5A hosted Preview               next after PR #423 merge report',
    ]],
  ]) {
    for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing current closure marker: ${fragment}`)
  }
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
    '?id=',
    '&id=',
    'data-watchlist-entry=',
    'data-channel-id=',
    'example_channel',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
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

  for (const label of labels) assert.ok(page.includes(label), `runtime missing exact label: ${label}`)
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
    'setInterval(',
    'navigator.serviceWorker',
    'serviceWorker.register',
    'indexedDB',
    'sessionStorage',
    'document.cookie',
    'navigator.sendBeacon',
    'trackEvent(',
    'gtag(',
    '/api/watchlist',
    'D1Database',
    'KVNamespace',
    'R2Bucket',
    'scheduled(',
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
    '@media (max-width: 980px)',
    '@media (max-width: 760px)',
    '@media (max-width: 430px)',
    '@media (prefers-contrast: more)',
    '@media (forced-colors: active)',
    '@media (prefers-reduced-motion: reduce)',
    'min-height: 44px',
    'min-height: 48px',
  ]) assert.ok(responsive.includes(fragment), `candidate responsive contract missing: ${fragment}`)

  for (const fragment of ['width: 1440', 'width: 820', 'watchlist-candidate-twitch-desktop-1440.png', 'watchlist-candidate-kick-desktop-1440-partial.png']) {
    assert.ok(desktop.includes(fragment), `desktop candidate gate missing: ${fragment}`)
  }
  for (const fragment of ['width: 390', 'width: 360', 'watchlist-candidate-kick-mobile-390-empty.png', 'watchlist-candidate-kick-mobile-360-storage-error.png', 'watchlist-candidate-kick-mobile-360-long-content.png']) {
    assert.ok(mobile.includes(fragment), `mobile candidate gate missing: ${fragment}`)
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

function verifyWorkflow() {
  const workflow = readRepo('.github/workflows/watchlist-contracts.yml')
  for (const fragment of [
    'name: Watchlist Contracts',
    'concurrency:',
    'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}',
    'cancel-in-progress: true',
    'Verify development policy',
    'Verify consolidated Watchlist contracts',
    'node scripts/verify-watchlist-contracts.mjs',
  ]) assert.ok(workflow.includes(fragment), `contract workflow missing: ${fragment}`)

  const packageSource = readWeb('package.json')
  assert.ok(packageSource.includes('"verify:watchlist-contracts": "node scripts/verify-watchlist-contracts.mjs"'), 'package command missing')

  const policy = readRepo('scripts/verify-development-policy.mjs')
  for (const fragment of [
    'docs/product/current-roadmap.md',
    'docs/product/current-schedule.md',
    'docs/product/local-watchlist-spec.md',
    'docs/product/watchlist-v1-implementation-plan.md',
    'docs/work-in-progress/watchlist-v1-working-note.md',
  ]) assert.ok(policy.includes(fragment), `Development policy lost Watchlist governance: ${fragment}`)
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
