import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const readWeb = (path) => readFileSync(resolve(webRoot, path), 'utf8')
const readRepo = (path) => readFileSync(resolve(repoRoot, path), 'utf8')
const origin = 'https://www.viewloom.net'

const candidates = [
  { route: '/ja/', source: 'ja/index.html', canonical: `${origin}/ja/`, provider: 'portal', apis: [{ path: '/api/twitch-home', binding: 'DB_TWITCH_HOT' }, { path: '/api/kick-home', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/about/', source: 'ja/about/index.html', canonical: `${origin}/ja/about/`, provider: 'portal', apis: [] },
  { route: '/ja/support/', source: 'ja/support/index.html', canonical: `${origin}/ja/support/`, provider: 'portal', apis: [] },
  { route: '/ja/contact/', source: 'ja/contact/index.html', canonical: `${origin}/ja/contact/`, provider: 'portal', apis: [] },
  { route: '/ja/changelog/', source: 'ja/changelog/index.html', canonical: `${origin}/ja/changelog/`, provider: 'portal', apis: [{ path: '/data/changelog.json', binding: 'static' }] },
  { route: '/ja/twitch/', source: 'ja/twitch/index.html', canonical: `${origin}/ja/twitch/`, provider: 'twitch', apis: [{ path: '/api/twitch-home', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/twitch/heatmap/', source: 'ja/twitch/heatmap/index.html', canonical: `${origin}/ja/twitch/heatmap/`, provider: 'twitch', apis: [{ path: '/api/twitch-heatmap', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/twitch/day-flow/', source: 'ja/twitch/day-flow/index.html', canonical: `${origin}/ja/twitch/day-flow/`, provider: 'twitch', apis: [{ path: '/api/day-flow', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/twitch/battle-lines/', source: 'ja/twitch/battle-lines/index.html', canonical: `${origin}/ja/twitch/battle-lines/`, provider: 'twitch', apis: [{ path: '/api/battle-lines', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/twitch/history/', source: 'ja/twitch/history/index.html', canonical: `${origin}/ja/twitch/history/`, provider: 'twitch', apis: [{ path: '/api/history', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/twitch/map/', source: 'ja/twitch/map/index.html', canonical: `${origin}/ja/twitch/map/`, provider: 'twitch', apis: [{ path: '/api/twitch-stream-map', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/twitch/status/', source: 'ja/twitch/status/index.html', canonical: `${origin}/ja/twitch/status/`, provider: 'twitch', apis: [{ path: '/api/twitch-status', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/twitch/channel/', source: 'ja/twitch/channel/index.html', canonical: `${origin}/ja/twitch/channel/`, provider: 'twitch', apis: [{ path: '/api/history', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/twitch/watchlist/', source: 'ja/twitch/watchlist/index.html', canonical: `${origin}/ja/twitch/watchlist/`, provider: 'twitch', apis: [{ path: '/api/twitch-heatmap', binding: 'DB_TWITCH_HOT' }, { path: '/api/history', binding: 'DB_TWITCH_HOT' }] },
  { route: '/ja/kick/', source: 'ja/kick/index.html', canonical: `${origin}/ja/kick/`, provider: 'kick', apis: [{ path: '/api/kick-home', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/kick/heatmap/', source: 'ja/kick/heatmap/index.html', canonical: `${origin}/ja/kick/heatmap/`, provider: 'kick', apis: [{ path: '/api/kick-heatmap', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/kick/day-flow/', source: 'ja/kick/day-flow/index.html', canonical: `${origin}/ja/kick/day-flow/`, provider: 'kick', apis: [{ path: '/api/kick-day-flow', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/kick/battle-lines/', source: 'ja/kick/battle-lines/index.html', canonical: `${origin}/ja/kick/battle-lines/`, provider: 'kick', apis: [{ path: '/api/kick-battle-lines', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/kick/history/', source: 'ja/kick/history/index.html', canonical: `${origin}/ja/kick/history/`, provider: 'kick', apis: [{ path: '/api/kick-history', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/kick/map/', source: 'ja/kick/map/index.html', canonical: `${origin}/ja/kick/map/`, provider: 'kick', apis: [{ path: '/api/kick-stream-map', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/kick/status/', source: 'ja/kick/status/index.html', canonical: `${origin}/ja/kick/status/`, provider: 'kick', apis: [{ path: '/api/kick-status', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/kick/channel/', source: 'ja/kick/channel/index.html', canonical: `${origin}/ja/kick/channel/`, provider: 'kick', apis: [{ path: '/api/kick-history', binding: 'DB_KICK_HOT' }] },
  { route: '/ja/kick/watchlist/', source: 'ja/kick/watchlist/index.html', canonical: `${origin}/ja/kick/watchlist/`, provider: 'kick', apis: [{ path: '/api/kick-heatmap', binding: 'DB_KICK_HOT' }, { path: '/api/kick-history', binding: 'DB_KICK_HOT' }] },
]

const sitemap = readWeb('public/sitemap.xml')
const vite = readWeb('vite.config.ts')
const routeHelper = readWeb('src/i18n/route.ts')
const staticPageRuntime = readWeb('src/static-page.ts')
const changelogRuntime = readWeb('src/changelog-page.ts')
const portalRuntime = readWeb('src/portal-page.ts')
const providerShell = readWeb('src/provider-home-shell.ts')
const providerMapEntry = readWeb('src/provider-home-stream-map-entry.ts')
const jaDayFlowPresentation = readWeb('src/live/day-flow-ja-presentation.ts')
const jaTwitchDayFlowEntry = readWeb('src/live/day-flow-ja-twitch-entry.ts')
const jaKickDayFlowEntry = readWeb('src/live/day-flow-ja-kick-entry.ts')
const sharedDayFlowController = readWeb('src/live/day-flow-current-shell-entry.ts')
const jaBattlePresentation = readWeb('src/live/battle-lines-ja-presentation.ts')
const jaBattleSplitLabels = readWeb('src/live/battle-lines-ja-split-labels.ts')
const jaTwitchBattleEntry = readWeb('src/live/battle-lines-ja-twitch-entry.ts')
const jaKickBattleEntry = readWeb('src/live/battle-lines-ja-kick-entry.ts')
const sharedBattleController = readWeb('src/live/battle-lines-current-shell-entry.ts')
const jaHistoryPresentation = readWeb('src/live/history-ja-presentation.ts')
const jaTwitchHistoryEntry = readWeb('src/live/history-ja-twitch-entry.ts')
const jaKickHistoryEntry = readWeb('src/live/history-ja-kick-entry.ts')
const sharedHistoryController = readWeb('src/live/history-current-shell-entry.ts')
const jaMapPresentation = readWeb('src/features/twitch-stream-map/stream-map-ja-presentation.ts')
const twitchMapBootstrap = readWeb('src/features/twitch-stream-map/maplibre-bootstrap.ts')
const twitchMapController = readWeb('src/features/twitch-stream-map/stream-map-entry.ts')
const twitchGeographyController = readWeb('src/features/twitch-stream-map/geography-ui-bootstrap.ts')
const kickMapEntry = readWeb('src/features/kick-stream-map/public-entry.ts')
const kickMapController = readWeb('src/features/kick-stream-map/public-kc5-entry.ts')
const jaStatusPresentation = readWeb('src/live/status-ja-presentation.ts')
const sharedStatusController = readWeb('src/live/status-current-shell-entry.ts')
const jaChannelPresentation = readWeb('src/live/channel-ja-presentation.ts')
const sharedChannelController = readWeb('src/live/channel-profile.ts')
const channelUrlState = readWeb('src/live/channel/url-state.ts')
const jaWatchlistPresentation = readWeb('src/live/watchlist-ja-presentation.ts')
const sharedWatchlistRuntime = readWeb('src/live/watchlist-page.ts')
const watchlistStorage = readWeb('src/live/watchlist/storage.ts')

for (const path of [
  '/', '/about/', '/support/', '/contact/', '/changelog/',
  '/twitch/', '/twitch/heatmap/', '/twitch/day-flow/', '/twitch/battle-lines/', '/twitch/history/', '/twitch/map/', '/twitch/status/', '/twitch/channel/', '/twitch/watchlist/',
  '/kick/', '/kick/heatmap/', '/kick/day-flow/', '/kick/battle-lines/', '/kick/history/', '/kick/map/', '/kick/status/', '/kick/channel/', '/kick/watchlist/',
]) assert.match(routeHelper, new RegExp(`["']${escapeRegex(path)}["']`), `Japanese availability missing ${path}`)
for (const path of ['/terms/', '/privacy/', '/refund-policy/', '/commercial-disclosure/']) assert.doesNotMatch(routeHelper, new RegExp(`["']${escapeRegex(path)}["']`), `J7b-only Japanese legal route exposed early: ${path}`)
assert.match(routeHelper, /export function localizeAvailableHref\(/, 'availability-aware locale route helper missing')
assert.match(providerShell, /localizeAvailableHref/, 'Provider Home shell must use availability-aware route localization')
assert.doesNotMatch(providerShell, /const base\s*=\s*localizeHref/, 'Provider Home shell must not build Japanese feature URLs from a localized base')
assert.match(providerMapEntry, /localizeAvailableHref\('\/twitch\/map\/'/, 'Provider Home Stream Map entry must route through availability-aware localization')

for (const candidate of candidates) {
  const html = readWeb(candidate.source)
  assert.match(html, /<html\b[^>]*\blang=["']ja["']/i, `${candidate.route}: html lang must be ja`)
  assert.equal(meta(html, 'name', 'robots').toLowerCase(), 'noindex,follow', `${candidate.route}: robots must remain noindex,follow before J10`)
  assert.equal(link(html, 'canonical'), candidate.canonical, `${candidate.route}: canonical must self-reference`)
  assert.doesNotMatch(html, /hreflang=/i, `${candidate.route}: hreflang must remain absent before J10`)
  assert.doesNotMatch(html, /data-language-switch|class=["'][^"']*language-switch/i, `${candidate.route}: public language switcher must remain absent before J10`)
  assert.doesNotMatch(html, /\/api\/ja(?:\/|-)/i, `${candidate.route}: localized API path is forbidden`)
  assert.match(vite, new RegExp(`["']${escapeRegex(candidate.source)}["']`), `${candidate.route}: candidate must be a Vite HTML input`)
  assert.equal(sitemap.includes(`<loc>${candidate.canonical}</loc>`), false, `${candidate.route}: candidate must remain outside sitemap before J10`)
}

for (const path of ['ja/about/index.html', 'ja/support/index.html', 'ja/contact/index.html']) {
  const html = readWeb(path)
  assert.match(html, /src=["']\/src\/static-page\.ts["']/, `${path}: shared static-page runtime missing`)
}
assert.match(staticPageRuntime, /installSharedShell\(\)/, 'static pages must keep the shared locale-aware shell')
const jaChangelog = readWeb('ja/changelog/index.html')
assert.match(jaChangelog, /src=["']\/src\/changelog-page\.ts["']/, 'Japanese Changelog must reuse shared runtime')
assert.match(jaChangelog, /href=["']\/data\/changelog\.json["']/, 'Japanese Changelog must expose the same reviewed JSON source')
assert.match(changelogRuntime, /localeFromPathname/, 'shared Changelog runtime must be locale-aware')
assert.match(changelogRuntime, /fetch\('\/data\/changelog\.json'/, 'Changelog data ownership must remain on the existing JSON source')
assert.equal((changelogRuntime.match(/\bfetch\(/g) ?? []).length, 1, 'Changelog must keep one data request owner')
assert.match(changelogRuntime, /JAPANESE_ENTRY_COPY/, 'Japanese reviewed milestone presentation map missing')
assert.doesNotMatch(changelogRuntime, /\/data\/ja|\/ja\/data/i, 'localized Changelog data feed is forbidden')

const jaPortal = readWeb('ja/index.html')
assert.match(jaPortal, /src=["']\/src\/portal-page\.ts["']/, '/ja/: shared Portal runtime must be used')
assert.match(portalRuntime, /type Platform\s*=\s*'twitch'\s*\|\s*'kick'/, 'Portal runtime must retain separate Twitch/Kick platform ownership')
assert.match(portalRuntime, /fetch\(`\/api\/\$\{platform\}-home`/, 'Portal runtime must reuse existing provider Home APIs')
assert.doesNotMatch(portalRuntime, /\/api\/ja(?:\/|-)/i, 'Portal runtime must not introduce localized API paths')

for (const provider of ['twitch', 'kick']) {
  const home = readWeb(`ja/${provider}/index.html`)
  const heatmap = readWeb(`ja/${provider}/heatmap/index.html`)
  const dayFlow = readWeb(`ja/${provider}/day-flow/index.html`)
  const battleLines = readWeb(`ja/${provider}/battle-lines/index.html`)
  const history = readWeb(`ja/${provider}/history/index.html`)
  const map = readWeb(`ja/${provider}/map/index.html`)
  const status = readWeb(`ja/${provider}/status/index.html`)
  const channel = readWeb(`ja/${provider}/channel/index.html`)
  const watchlist = readWeb(`ja/${provider}/watchlist/index.html`)
  assert.match(home, /src=["']\/src\/provider-home\.ts["']/, `/ja/${provider}/: shared Provider Home runtime must be used`)
  assert.match(heatmap, /観測/, `/ja/${provider}/heatmap/: Japanese observation copy missing`)
  assert.match(dayFlow, /UTC/, `/ja/${provider}/day-flow/: explicit UTC semantics copy missing`)
  assert.match(battleLines, /UTC/, `/ja/${provider}/battle-lines/: explicit UTC semantics copy missing`)
  assert.match(history, /UTC/, `/ja/${provider}/history/: explicit UTC semantics copy missing`)
  assert.match(map, /Stream Map/, `/ja/${provider}/map/: stable Stream Map feature name missing`)
  assert.match(map, /Current \/ IRL/, `/ja/${provider}/map/: Current / IRL boundary copy missing`)
  assert.match(status, /src=["']\/src\/live\/status-ja-presentation\.ts["']/, `/ja/${provider}/status/: Japanese Status presentation adapter missing`)
  assert.match(status, /src=["']\/src\/live\/status-current-shell-entry\.ts["']/, `/ja/${provider}/status/: shared Status runtime must be used`)
  assert.match(channel, /src=["']\/src\/live\/channel-ja-presentation\.ts["']/, `/ja/${provider}/channel/: Japanese Channel presentation adapter missing`)
  assert.match(channel, /src=["']\/src\/live\/channel-profile\.ts["']/, `/ja/${provider}/channel/: shared Channel runtime missing`)
  assert.match(watchlist, /src=["']\/src\/live\/watchlist-ja-presentation\.ts["']/, `/ja/${provider}/watchlist/: Japanese Watchlist presentation adapter missing`)
  assert.match(watchlist, /src=["']\/src\/live\/watchlist-page\.ts["']/, `/ja/${provider}/watchlist/: shared Watchlist runtime missing`)
  assert.match(watchlist, /このブラウザだけに保存/, `/ja/${provider}/watchlist/: Japanese browser-local copy missing`)
  assert.match(watchlist, /data-watchlist-storage-key/, `/ja/${provider}/watchlist/: provider-specific storage key surface missing`)
}

assert.match(jaTwitchDayFlowEntry, /import '\.\/day-flow-ja-presentation'/)
assert.match(jaTwitchDayFlowEntry, /import '\.\/day-flow-twitch-entry'/)
assert.match(jaKickDayFlowEntry, /import '\.\/day-flow-ja-presentation'/)
assert.match(jaKickDayFlowEntry, /import '\.\/day-flow-kick-entry'/)
assert.match(jaDayFlowPresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/)
assert.doesNotMatch(jaDayFlowPresentation, /\/api\//)
assert.match(sharedDayFlowController, /provider === 'kick' \? '\/api\/kick-day-flow' : '\/api\/day-flow'/)
for (const [provider, entry] of [['twitch', jaTwitchBattleEntry], ['kick', jaKickBattleEntry]]) {
  assert.match(entry, /import '\.\/battle-lines-ja-presentation'/, `Japanese ${provider} Battle Lines presentation adapter missing`)
  assert.match(entry, /import '\.\/battle-lines-current-shell-entry'/, `Japanese ${provider} Battle Lines shared controller missing`)
}
assert.match(jaBattlePresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/)
assert.match(jaBattlePresentation, /RAW_TEXT_ANCESTORS/)
assert.doesNotMatch(jaBattlePresentation, /\/api\//)
assert.match(jaBattleSplitLabels, /localeFromPathname\(window\.location\.pathname\) === 'ja'/)
assert.doesNotMatch(jaBattleSplitLabels, /\/api\//)
assert.match(sharedBattleController, /provider === 'kick' \? '\/api\/kick-battle-lines' : '\/api\/battle-lines'/)
for (const [provider, entry] of [['twitch', jaTwitchHistoryEntry], ['kick', jaKickHistoryEntry]]) {
  assert.match(entry, /import '\.\/history-ja-presentation'/, `Japanese ${provider} History presentation adapter missing`)
  assert.match(entry, /import '\.\/history-current-shell-entry'/, `Japanese ${provider} History shared controller missing`)
}
assert.match(jaHistoryPresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/)
assert.match(jaHistoryPresentation, /RAW_TEXT_ANCESTORS/)
assert.doesNotMatch(jaHistoryPresentation, /\/api\//)
assert.doesNotMatch(jaHistoryPresentation, /\bfetch\(/)
assert.match(sharedHistoryController, /provider === 'kick' \? '\/api\/kick-history' : '\/api\/history'/)
assert.match(jaMapPresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/)
assert.match(jaMapPresentation, /RAW_TEXT_ANCESTORS/)
assert.doesNotMatch(jaMapPresentation, /\/api\//)
assert.doesNotMatch(jaMapPresentation, /\bfetch\(/)
assert.match(twitchMapBootstrap, /import\('\.\/geography-ui-bootstrap'\)/)
assert.match(twitchMapBootstrap, /import\('\.\/stream-map-entry'\)/)
assert.match(twitchMapController, /new URL\('\/api\/twitch-stream-map'/)
assert.match(twitchGeographyController, /request\.pathname === '\/api\/twitch-stream-map'/)
assert.match(kickMapEntry, /import '\.\/public-kc5-entry'/)
assert.match(kickMapController, /'\/api\/kick-stream-map\?geography=city'/)
assert.match(kickMapController, /'\/api\/kick-stream-map'/)
assert.doesNotMatch(twitchMapController, /\/ja\//)
assert.doesNotMatch(kickMapController, /\/ja\//)
assert.match(jaStatusPresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/)
assert.match(jaStatusPresentation, /RAW_ANCESTORS/)
assert.doesNotMatch(jaStatusPresentation, /\/api\//)
assert.doesNotMatch(jaStatusPresentation, /\bfetch\(/)
assert.match(sharedStatusController, /provider === 'kick' \? '\/api\/kick-status' : '\/api\/twitch-status'/)
assert.equal((sharedStatusController.match(/\bfetch\(/g) ?? []).length, 1)
assert.match(jaChannelPresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/)
assert.match(jaChannelPresentation, /RAW_ANCESTORS/)
assert.doesNotMatch(jaChannelPresentation, /\/api\//)
assert.doesNotMatch(jaChannelPresentation, /\bfetch\(/)
assert.match(sharedChannelController, /provider === 'kick' \? '\/api\/kick-history' : '\/api\/history'/)
assert.equal((sharedChannelController.match(/\bfetch\(/g) ?? []).length, 1)
assert.match(channelUrlState, /const url = new URL\(currentUrl\)/)
assert.match(channelUrlState, /return `\$\{url\.pathname\}/)
assert.match(jaWatchlistPresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/)
assert.match(jaWatchlistPresentation, /RAW_ANCESTORS/)
assert.match(jaWatchlistPresentation, /localizeAvailableHref/)
assert.doesNotMatch(jaWatchlistPresentation, /\/api\//)
assert.doesNotMatch(jaWatchlistPresentation, /\bfetch\(/)
assert.match(sharedWatchlistRuntime, /createWatchlistCombinedController/)
assert.match(sharedWatchlistRuntime, /function requestProviderData\(/)
assert.equal((sharedWatchlistRuntime.match(/\bfetch\(/g) ?? []).length, 1)
assert.match(watchlistStorage, /viewloom\.watchlist\./)
assert.doesNotMatch(sharedWatchlistRuntime, /\/ja\/api|\/api\/ja/i)

const routeDocs = ['docs/audits/public-surface-routes-portal.json', 'docs/audits/public-surface-routes-twitch.json', 'docs/audits/public-surface-routes-kick.json'].flatMap((path) => JSON.parse(readRepo(path)).routes)
const inventoriedCandidates = routeDocs.filter((route) => route.route.startsWith('/ja/'))
assert.deepEqual(inventoriedCandidates.map((route) => route.route).sort(), candidates.map((item) => item.route).sort(), 'route inventory must contain exactly the twenty-three current Japanese candidates')
for (const candidate of candidates) {
  const route = inventoriedCandidates.find((item) => item.route === candidate.route)
  assert.ok(route, `${candidate.route}: inventory route missing`)
  assert.equal(route.robots, 'noindex,follow', `${candidate.route}: inventory robots mismatch`)
  assert.equal(route.sitemap, false, `${candidate.route}: inventory sitemap mismatch`)
  assert.equal(route.canonical, candidate.canonical, `${candidate.route}: inventory canonical mismatch`)
  assert.deepEqual(route.apis ?? [], candidate.apis, `${candidate.route}: provider API/binding ownership mismatch`)
}

console.log('Japanese localization candidate contract verified.')
console.log('- candidate routes: /ja/, About, Support, Contact, Changelog, and Twitch/Kick product surfaces through Local Watchlist')
console.log('- robots: noindex,follow; sitemap/hreflang/public language switcher: disabled')
console.log('- J7a static pages reuse the shared static-page shell; Changelog reuses one /data/changelog.json request owner')
console.log('- Terms, Privacy, Refund Policy, and Commercial Disclosure remain English-only until J7b')
console.log('- J7a informational candidate coverage is implemented; public exposure remains gated by J10')

function attr(source, name) { return source.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '' }
function meta(html, key, value) { const item = (html.match(/<meta\b[^>]*>/gi) ?? []).find((entry) => attr(entry, key).toLowerCase() === value.toLowerCase()) ?? ''; return attr(item, 'content') }
function link(html, rel) { const item = (html.match(/<link\b[^>]*>/gi) ?? []).find((entry) => attr(entry, 'rel').toLowerCase().split(/\s+/).includes(rel)) ?? ''; return attr(item, 'href') }
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
