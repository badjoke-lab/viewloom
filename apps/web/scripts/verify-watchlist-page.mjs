import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const twitch = read('twitch/watchlist/index.html')
const kick = read('kick/watchlist/index.html')
const controller = read('src/live/watchlist-page.ts')
const styles = read('src/watchlist-page.css')
const homeShell = read('src/provider-home-shell.ts')
const homeStyles = read('src/provider-watchlist-link.css')
const vite = read('vite.config.ts')

verifyRoute(twitch, 'twitch', 'Twitch')
verifyRoute(kick, 'kick', 'Kick')
verifyController()
verifyProviderHome()
verifyBuildInputs()
verifyStyles()

console.log('Watchlist W3A route and storage-first shell verification passed.')

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
    'No channels saved in this browser.',
    `Add a ${name} channel id or URL to create this local Watchlist.`,
    'Nothing is uploaded to a ViewLoom account.',
    'Storage unavailable or corrupted',
    'Reset local Watchlist',
    'No complete history is implied.',
    '/src/live/watchlist-page.ts',
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
    'WATCHLIST_INITIAL_VISIBLE_ENTRIES',
    'Already saved.',
    'Watchlist limit reached.',
    'Changes cannot be saved in this browser.',
    'Some invalid saved entries were removed.',
    'No live or offline conclusion is shown.',
    'No complete history is implied.',
  ]) assert.ok(controller.includes(fragment), `watchlist-page.ts missing: ${fragment}`)

  for (const forbidden of [
    '/api/twitch-heatmap',
    '/api/kick-heatmap',
    '/api/history',
    '/api/kick-history',
    'createWatchlistCombinedController',
    'setInterval(',
    'serviceWorker',
  ]) assert.equal(controller.includes(forbidden), false, `W3A controller contains forbidden data behavior: ${forbidden}`)

  assert.doesNotMatch(controller, /\bfetch\s*\(/, 'W3A controller must not issue feature-data requests.')
  assert.equal(controller.includes('gtag('), false, 'W3A controller must not send saved ids to analytics.')
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
}
