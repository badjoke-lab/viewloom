import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { basename, relative, resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const readWeb = (path) => readFileSync(resolve(webRoot, path), 'utf8')
const readRepo = (path) => readFileSync(resolve(repoRoot, path), 'utf8')

const exactLabels = [
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
verifyPermanentDocuments()
verifyRoutes()
verifyStorageAndUrlBoundary()
verifyProviderDataBoundary()
verifyChannelBoundary()
verifyRuntimePrivacyBoundary()
verifyCandidateBoundary()
verifyNoServerExpansion()
verifyWorkflowGovernance()

console.log('Watchlist W4A executable contract closure verification passed.')
console.log('- W1, W2A, W2B, W3A, W3B, and W3C executable foundations passed')
console.log('- route, SEO, privacy, provider, request, Channel, and candidate contracts are closed')
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

function verifyPermanentDocuments() {
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
  ]) assert.ok(spec.includes(fragment), `Local Watchlist specification missing: ${fragment}`)

  for (const label of exactLabels) {
    assert.ok(spec.includes(label), `Local Watchlist specification missing exact label: ${label}`)
  }

  for (const fragment of [
    '## 11. W4A — executable contract closure',
    'Branch: `work-watchlist-w4-contracts`',
    'completion candidate PR #422',
    'verify-watchlist-contracts.mjs',
    'watchlist-contracts.yml',
    'W4B  next after PR #422 merge report',
  ]) assert.ok(plan.includes(fragment), `Watchlist plan missing W4A state: ${fragment}`)

  for (const [path, source] of [
    ['docs/product/current-roadmap.md', roadmap],
    ['docs/product/current-schedule.md', schedule],
    ['docs/README.md', index],
    ['docs/work-in-progress/watchlist-v1-working-note.md', note],
  ]) {
    for (const fragment of [
      'W3C complete PR #421',
      'W4A completion candidate PR #422',
      'W4B next after PR #422 merge report',
    ]) assert.ok(source.includes(fragment), `${path} missing current W4A governance: ${fragment}`)
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
  const tabHrefs = [...tabs.matchAll(/href="([^"]+)"/g)].map((match) => match[1])

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
  ]) assert.ok(source.includes(fragment), `${provider} Watchlist route missing: ${fragment}`)

  assert.deepEqual(tabHrefs, [
    `/${provider}/heatmap/`,
    `/${provider}/day-flow/`,
    `/${provider}/battle-lines/`,
    `/${provider}/history/`,
    `/${provider}/status/`,
  ], `${provider} primary feature tabs changed`)
  assert.equal(/watchlist/i.test(tabs), false, `${provider} Watchlist entered primary tabs`)

  for (const forbidden of [
    '?id=',
    '&id=',
    'data-watchlist-entry=',
    'data-channel-id=',
    'example_channel',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
  ]) assert.equal(head.includes(forbidden), false, `${provider} metadata leaks local state: ${forbidden}`)

  assert.equal(source.includes(`href="/${provider}/watchlist/?`), false, `${provider} route serializes local state`)
  assert.equal(source.includes('data-copy-current-view'), false, `${provider} Watchlist exposes a share/copy-list action`)
  assert.equal(source.includes('method="get"'), false, `${provider} Watchlist exposes local ids through a GET form`)
}

function verifyStorageAndUrlBoundary() {
  const model = readWeb('src/live/watchlist/model.ts')
  const storage = readWeb('src/live/watchlist/storage.ts')
  const urlState = readWeb('src/live/watchlist/url-state.ts')

  for (const fragment of [
    "export const WATCHLIST_SCHEMA = 'viewloom-watchlist-v1'",
    'export const WATCHLIST_REVISION = 1',
    'export const WATCHLIST_MAX_ENTRIES = 50',
    'export const WATCHLIST_INITIAL_VISIBLE_ENTRIES = 12',
  ]) assert.ok(model.includes(fragment), `Watchlist model contract missing: ${fragment}`)

  assert.ok(storage.includes('return `viewloom.watchlist.${provider}.v1`'), 'Provider-versioned storage key function changed')
  assert.equal(storage.includes('viewloom.watchlist.v1'), false, 'Shared cross-provider Watchlist key introduced')

  for (const key of ['id', 'name', 'filter', 'saved', 'order', 'expanded']) {
    assert.ok(urlState.includes(`'${key}'`), `URL scrub list missing local-only key: ${key}`)
    assert.ok(urlState.includes('url.searchParams.delete(key)'), 'URL state no longer removes local-only keys')
  }
  assert.ok(urlState.includes("url.searchParams.set('period', '7d')"), '7d URL state missing')
  assert.ok(urlState.includes("url.searchParams.delete('period')"), '30d clean URL state missing')
  assert.equal(urlState.includes('channelId'), false, 'URL-state layer serializes a channel id')
}

function verifyProviderDataBoundary() {
  const page = readWeb('src/live/watchlist-page.ts')
  const latestModel = readWeb('src/live/watchlist/latest-model.ts')
  const historyModel = readWeb('src/live/watchlist/history-model.ts')
  const combinedController = readWeb('src/live/watchlist/combined-controller.ts')

  assert.ok(latestModel.includes("provider === 'kick' ? '/api/kick-heatmap' : '/api/twitch-heatmap'"), 'Latest endpoint provider mapping changed')
  assert.ok(historyModel.includes("provider === 'kick' ? '/api/kick-history' : '/api/history'"), 'History endpoint provider mapping changed')
  assert.ok(historyModel.includes('`?period=${period}&metric=viewer_minutes`'), 'History endpoint metric/period contract changed')

  assert.equal((page.match(/\bfetch\s*\(/g) ?? []).length, 1, 'Watchlist page must retain one generic request seam')
  assert.match(page, /fetch\s*\(endpoint/, 'Watchlist page request seam must use the injected endpoint')
  assert.ok(page.includes('if (!hasEntries)'), 'Empty Watchlist zero-request guard missing')
  assert.ok(page.includes("action === 'retry_latest'"), 'Latest-only retry action missing')
  assert.ok(page.includes("action === 'retry_history'"), 'History-only retry action missing')

  for (const fragment of [
    'latest.refresh(entries)',
    'history.refresh(entries, period)',
    "history.getSnapshot(period) ? 'cache' : 'memory_only'",
    "latest.getSnapshot() ? 'cache' : 'memory_only'",
  ]) assert.ok(combinedController.includes(fragment), `Combined request contract missing: ${fragment}`)

  for (const label of exactLabels) {
    assert.ok(page.includes(label), `Watchlist runtime missing exact evidence label: ${label}`)
  }

  assert.equal(page.includes('/api/watchlist'), false, 'Watchlist-specific API endpoint introduced')
  assert.equal(page.includes('Promise.all(documentState.entries'), false, 'Per-channel request loop introduced')
}

function verifyChannelBoundary() {
  const action = readWeb('src/live/channel-watchlist.ts')
  for (const route of ['twitch', 'kick']) {
    assert.ok(readWeb(`${route}/channel/index.html`).includes('/src/live/channel-watchlist.ts'), `${route} Channel route lost Watchlist entry point`)
  }

  for (const fragment of [
    'Save to Watchlist',
    'Saved in Watchlist',
    'No data request was made.',
    'addStoredWatchlistEntry',
    'readWatchlistStorageEvent',
  ]) assert.ok(action.includes(fragment), `Channel Watchlist contract missing: ${fragment}`)

  for (const forbidden of [
    'fetch(',
    'removeStoredWatchlistEntry',
    'setInterval(',
    'serviceWorker',
    'trackEvent(',
    'gtag(',
  ]) assert.equal(action.includes(forbidden), false, `Channel Watchlist action added forbidden behavior: ${forbidden}`)
}

function verifyRuntimePrivacyBoundary() {
  const runtimePaths = [
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

  for (const path of runtimePaths) {
    const source = readWeb(path)
    for (const token of forbidden) {
      assert.equal(source.includes(token), false, `${path} contains forbidden Watchlist behavior: ${token}`)
    }
  }

  const analytics = readWeb('src/analytics.ts')
  for (const token of ['localStorage', 'sessionStorage', 'searchParams', 'location.search', 'channelId']) {
    assert.equal(analytics.includes(token), false, `Generic analytics layer could capture Watchlist local ids: ${token}`)
  }
}

function verifyCandidateBoundary() {
  const focus = readWeb('src/live/watchlist-move-focus.ts')
  const base = readWeb('src/watchlist-candidate.css')
  const panels = readWeb('src/watchlist-candidate-panels.css')
  const responsive = readWeb('src/watchlist-candidate-responsive.css')
  const desktopGate = readWeb('scripts/watchlist-candidate-desktop.mjs')
  const mobileGate = readWeb('scripts/watchlist-candidate-mobile.mjs')

  for (const fragment of [
    "import '../watchlist-candidate.css'",
    "import '../watchlist-candidate-panels.css'",
    "import '../watchlist-candidate-responsive.css'",
  ]) assert.ok(focus.includes(fragment), `W3C style entry missing: ${fragment}`)

  for (const fragment of ['.watchlist-page .page-head', '.watchlist-controls', '.watchlist-feedback']) {
    assert.ok(base.includes(fragment), `W3C base candidate contract missing: ${fragment}`)
  }
  for (const fragment of ['.watchlist-card', '.watchlist-evidence-grid', '.watchlist-remove']) {
    assert.ok(panels.includes(fragment), `W3C panel contract missing: ${fragment}`)
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
  ]) assert.ok(responsive.includes(fragment), `W3C responsive contract missing: ${fragment}`)

  for (const fragment of [
    'width: 1440',
    'width: 820',
    'watchlist-candidate-twitch-desktop-1440.png',
    'watchlist-candidate-kick-desktop-1440-partial.png',
  ]) assert.ok(desktopGate.includes(fragment), `Desktop candidate gate missing: ${fragment}`)
  for (const fragment of [
    'width: 390',
    'width: 360',
    'watchlist-candidate-kick-mobile-390-empty.png',
    'watchlist-candidate-kick-mobile-360-storage-error.png',
    'watchlist-candidate-kick-mobile-360-long-content.png',
  ]) assert.ok(mobileGate.includes(fragment), `Mobile candidate gate missing: ${fragment}`)
}

function verifyNoServerExpansion() {
  for (const root of [
    resolve(webRoot, 'functions'),
    resolve(repoRoot, 'workers'),
  ]) {
    if (!existsSync(root)) continue
    for (const path of walkFiles(root)) {
      const normalized = relative(repoRoot, path).replaceAll('\\', '/')
      assert.equal(/watchlist/i.test(normalized), false, `Watchlist-specific server or collector file introduced: ${normalized}`)
      if (!isTextFile(path)) continue
      const source = readFileSync(path, 'utf8')
      assert.equal(source.includes('/api/watchlist'), false, `Watchlist-specific server endpoint introduced in ${normalized}`)
      assert.equal(source.includes('viewloom.watchlist.'), false, `Browser-local Watchlist key leaked into server code: ${normalized}`)
    }
  }

  for (const path of walkFiles(repoRoot)) {
    const normalized = relative(repoRoot, path).replaceAll('\\', '/')
    if (!/(?:^|\/)(?:wrangler[^/]*\.(?:toml|jsonc?)|pages[^/]*\.(?:toml|jsonc?)|cloudflare[^/]*\.(?:toml|jsonc?))$/i.test(normalized)) continue
    const source = readFileSync(path, 'utf8')
    assert.equal(/watchlist/i.test(source), false, `Watchlist-specific binding or deployment config introduced: ${normalized}`)
  }
}

function verifyWorkflowGovernance() {
  const workflow = readRepo('.github/workflows/watchlist-contracts.yml')
  for (const fragment of [
    'name: Watchlist Contracts',
    'concurrency:',
    'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}',
    'cancel-in-progress: true',
    'Verify development policy',
    'Verify consolidated Watchlist contracts',
    'node scripts/verify-watchlist-contracts.mjs',
  ]) assert.ok(workflow.includes(fragment), `Watchlist contract workflow missing: ${fragment}`)

  const packageSource = readWeb('package.json')
  assert.ok(packageSource.includes('"verify:watchlist-contracts": "node scripts/verify-watchlist-contracts.mjs"'), 'Watchlist contract package script missing')

  const policy = readRepo('scripts/verify-development-policy.mjs')
  for (const fragment of [
    'docs/product/current-roadmap.md',
    'docs/product/current-schedule.md',
    'docs/product/local-watchlist-spec.md',
    'docs/product/watchlist-v1-implementation-plan.md',
    'docs/work-in-progress/watchlist-v1-working-note.md',
  ]) assert.ok(policy.includes(fragment), `Development policy verifier lost Watchlist governance: ${fragment}`)
}

function section(source, start, end) {
  const from = source.indexOf(start)
  const to = source.indexOf(end)
  assert.ok(from >= 0 && to > from, `Missing section ${start}...${end}`)
  return source.slice(from, to + end.length)
}

function walkFiles(root) {
  if (!existsSync(root)) return []
  const output = []
  for (const entry of readdirSync(root)) {
    if (['.git', 'node_modules', 'dist', '.wrangler'].includes(entry)) continue
    const path = resolve(root, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) output.push(...walkFiles(path))
    else if (stats.isFile()) output.push(path)
  }
  return output
}

function isTextFile(path) {
  return /\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|toml|md|html|css|sql|py)$/i.test(basename(path))
}
