import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const twitch = read('twitch/watchlist/index.html')
const kick = read('kick/watchlist/index.html')
const twitchChannel = read('twitch/channel/index.html')
const kickChannel = read('kick/channel/index.html')
const controller = read('src/live/watchlist-page.ts')
const combinedController = read('src/live/watchlist/combined-controller.ts')
const channelAction = read('src/live/channel-watchlist.ts')
const focusHelper = read('src/live/watchlist-move-focus.ts')
const styles = read('src/watchlist-page.css')
const evidenceStyles = read('src/watchlist-evidence.css')
const touchStyles = read('src/watchlist-touch.css')
const channelStyles = read('src/channel-watchlist.css')
const homeShell = read('src/provider-home-shell.ts')
const homeStyles = read('src/provider-watchlist-link.css')
const vite = read('vite.config.ts')

verifyRoute(twitch, 'twitch', 'Twitch')
verifyRoute(kick, 'kick', 'Kick')
verifyController()
verifyCombinedController()
verifyChannelAction()
verifyFocusHelper()
verifyProviderHome()
verifyBuildInputs()
verifyStyles()

console.log('Watchlist W3B evidence UI and Channel entry-point verification passed.')

function verifyRoute(source, provider, name) {
  const canonical = `https://vl.badjoke-lab.com/${provider}/watchlist/`
  const expectedTabs = [
    `/${provider}/heatmap/`,
    `/${provider}/day-flow/`,
    `/${provider}/battle-lines/`,
    `/${provider}/history/`,
    `/${provider}/status/`,
  ]

  for (const fragment of [
    `<title>${name} Local Watchlist — ViewLoom</title>`,
    '<meta name="robots" content="noindex,follow" />',
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `data-provider="${provider}"`,
    `${name.toUpperCase()} DATA · LOCAL WATCHLIST`,
    'Saved only in this browser',
    'Absence from an observed result is not proof that a channel is offline.',
    `viewloom.watchlist.${provider}.v1`,
    `${name} channel id or ${name} URL`,
    'Last 7 days',
    'Last 30 days',
    'Refresh data',
    'Retry latest',
    'Retry History',
    'data-watchlist-latest-source',
    'data-watchlist-history-source',
    'data-watchlist-request-fact',
    'No channels saved in this browser.',
    `Add a ${name} channel id or URL to create this local Watchlist.`,
    'Nothing is uploaded to a ViewLoom account.',
    'Storage unavailable or corrupted',
    'Reset local Watchlist',
    'no complete history is implied.',
    '/src/live/watchlist-page.ts',
    '/src/live/watchlist-move-focus.ts',
    '/src/analytics.ts',
  ]) assert.ok(source.includes(fragment), `${provider} route missing: ${fragment}`)

  const head = source.slice(source.indexOf('<head>'), source.indexOf('</head>'))
  assert.equal(head.includes('?id='), false, `${provider} metadata contains a saved id query.`)
  assert.equal(head.includes('example_channel'), false, `${provider} metadata contains an example saved id.`)

  const tabs = source.match(/<nav class="feature-tabs"[\s\S]*?<\/nav>/)?.[0] ?? ''
  const tabHrefs = [...tabs.matchAll(/href="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(tabHrefs, expectedTabs, `${provider} primary feature tab order changed.`)
  assert.equal(/watchlist/i.test(tabs), false, `${provider} Watchlist was inserted into primary tabs.`)
  assert.equal(source.includes(`href="/${provider}/watchlist/?`), false, `${provider} canonical route serializes local state.`)
}

function verifyController() {
  for (const fragment of [
    "import '../watchlist-page.css'",
    "from './watchlist/storage'",
    "from './watchlist/url-state'",
    "from './watchlist/combined-controller'",
    'createWatchlistCombinedController',
    'readWatchlistStorage(storage, provider)',
    'addStoredWatchlistEntry',
    'removeStoredWatchlistEntry',
    'moveStoredWatchlistEntry',
    'clearStoredWatchlist',
    'resetStoredWatchlist',
    'readWatchlistStorageEvent',
    'window.history.pushState',
    "window.addEventListener('popstate'",
    "window.addEventListener('storage'",
    'dataController.initialLoad',
    'dataController.changePeriod',
    'dataController.refresh',
    'dataController.retryLatest',
    'dataController.retryHistory',
    'dataController.taskLocal',
    'WATCHLIST_INITIAL_VISIBLE_ENTRIES',
    'Already saved.',
    'Watchlist limit reached.',
    'Changes cannot be saved in this browser.',
    'Some invalid saved entries were removed.',
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
    'Open Channel',
    'Open History',
    'Open Heatmap',
  ]) assert.ok(controller.includes(fragment), `watchlist-page.ts missing: ${fragment}`)

  assert.match(controller, /\bfetch\s*\(endpoint/, 'W3B controller must use the injected provider endpoint.')
  assert.equal((controller.match(/\bfetch\s*\(/g) ?? []).length, 1, 'W3B page must have exactly one generic request seam.')
  for (const forbidden of [
    'setInterval(',
    'serviceWorker',
    'gtag(',
    'fetch(`/${provider}/channel',
  ]) assert.equal(controller.includes(forbidden), false, `W3B controller contains forbidden behavior: ${forbidden}`)
}

function verifyCombinedController() {
  for (const fragment of [
    "| 'retry_latest'",
    "| 'retry_history'",
    'retryLatest(',
    'retryHistory(',
    'latest.refresh(entries)',
    'history.refresh(entries, period)',
    "history.getSnapshot(period) ? 'cache' : 'memory_only'",
    "latest.getSnapshot() ? 'cache' : 'memory_only'",
  ]) assert.ok(combinedController.includes(fragment), `combined-controller.ts missing W3B retry contract: ${fragment}`)
}

function verifyChannelAction() {
  for (const source of [twitchChannel, kickChannel]) {
    assert.ok(source.includes('/src/live/channel-watchlist.ts'), 'Channel route does not load the Watchlist action.')
  }

  for (const fragment of [
    "import '../channel-watchlist.css'",
    'normalizeStoredChannelId',
    'parseChannelState',
    'readWatchlistStorage(storage, provider)',
    'readWatchlistStorageEvent',
    'addStoredWatchlistEntry',
    'Save to Watchlist',
    'Saved in Watchlist',
    'Watchlist unavailable',
    'No data request was made.',
    "window.addEventListener('storage'",
    "window.addEventListener('popstate'",
  ]) assert.ok(channelAction.includes(fragment), `channel-watchlist.ts missing: ${fragment}`)

  for (const forbidden of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) {
    assert.equal(channelAction.includes(forbidden), false, `Channel Watchlist action contains forbidden behavior: ${forbidden}`)
  }
  assert.ok(channelStyles.includes('.channel-watchlist-action'), 'Channel Watchlist styles are missing.')
  assert.ok(channelStyles.includes('min-height: 48px'), 'Channel Watchlist mobile target is below 48px.')
}

function verifyFocusHelper() {
  for (const fragment of [
    "import '../watchlist-touch.css'",
    "import '../watchlist-evidence.css'",
    'MutationObserver',
    'data-watchlist-action="move-up"',
    'data-watchlist-action="move-down"',
    'requestAnimationFrame',
    "document.body.dataset.watchlistFocusReady = 'true'",
  ]) assert.ok(focusHelper.includes(fragment), `Watchlist focus helper missing: ${fragment}`)
}

function verifyProviderHome() {
  const featurePosition = homeShell.indexOf('<section class="feature-directory"')
  const utilityPosition = homeShell.indexOf('<section class="provider-utility"')
  assert.ok(featurePosition >= 0, 'Provider Home feature directory is missing.')
  assert.ok(utilityPosition > featurePosition, 'Provider Home utility must follow the core feature directory.')

  for (const fragment of [
    'Local Watchlist',
    'Saved channels in this browser.',
    '${base}watchlist/',
    'provider-utility__item',
  ]) assert.ok(homeShell.includes(fragment), `Provider Home utility missing: ${fragment}`)

  assert.equal(homeShell.includes('Watchlist count'), false, 'Provider Home must not display a cross-provider count.')
  assert.ok(homeStyles.includes('.provider-utility__item'), 'Provider Home utility styles are missing.')
}

function verifyBuildInputs() {
  assert.ok(vite.includes("twitchWatchlist: 'twitch/watchlist/index.html'"), 'Twitch Watchlist build input is missing.')
  assert.ok(vite.includes("kickWatchlist: 'kick/watchlist/index.html'"), 'Kick Watchlist build input is missing.')
  assert.equal(vite.includes('watchlistFocusPlugin'), false, 'Watchlist focus must use the explicit route script entry.')
}

function verifyStyles() {
  for (const fragment of [
    '.watchlist-page',
    '.watchlist-controls',
    '.watchlist-feedback-grid',
    '.watchlist-list',
    '.watchlist-card',
    '.watchlist-evidence-grid',
    '.watchlist-storage-error',
    '@media (max-width: 760px)',
    '@media (prefers-reduced-motion: reduce)',
    'overflow-wrap: anywhere',
    'min-height: 48px',
  ]) assert.ok(styles.includes(fragment), `Watchlist styles missing: ${fragment}`)

  for (const fragment of [
    '.watchlist-evidence--present',
    '.watchlist-evidence--stale',
    '.watchlist-evidence--partial',
    '.watchlist-evidence--absent',
    '.watchlist-evidence--unavailable',
    '.watchlist-evidence-facts',
    '.watchlist-retry',
    'overflow-wrap: anywhere',
  ]) assert.ok(evidenceStyles.includes(fragment), `Watchlist evidence styles missing: ${fragment}`)

  assert.ok(touchStyles.includes('.watchlist-add-row .button'), 'Watchlist mobile add target selector is missing.')
  assert.ok(touchStyles.includes('min-height: 44px'), 'Watchlist mobile add target is below 44px.')
}
