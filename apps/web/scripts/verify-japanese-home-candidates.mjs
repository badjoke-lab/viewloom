import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const readWeb = (path) => readFileSync(resolve(webRoot, path), 'utf8')
const readRepo = (path) => readFileSync(resolve(repoRoot, path), 'utf8')
const origin = 'https://www.viewloom.net'

const candidates = [
  { route: '/ja/', source: 'ja/index.html', canonical: `${origin}/ja/`, provider: 'portal', api: null },
  { route: '/ja/twitch/', source: 'ja/twitch/index.html', canonical: `${origin}/ja/twitch/`, provider: 'twitch', api: { path: '/api/twitch-home', binding: 'DB_TWITCH_HOT' } },
  { route: '/ja/twitch/heatmap/', source: 'ja/twitch/heatmap/index.html', canonical: `${origin}/ja/twitch/heatmap/`, provider: 'twitch', api: { path: '/api/twitch-heatmap', binding: 'DB_TWITCH_HOT' } },
  { route: '/ja/twitch/day-flow/', source: 'ja/twitch/day-flow/index.html', canonical: `${origin}/ja/twitch/day-flow/`, provider: 'twitch', api: { path: '/api/day-flow', binding: 'DB_TWITCH_HOT' } },
  { route: '/ja/twitch/battle-lines/', source: 'ja/twitch/battle-lines/index.html', canonical: `${origin}/ja/twitch/battle-lines/`, provider: 'twitch', api: { path: '/api/battle-lines', binding: 'DB_TWITCH_HOT' } },
  { route: '/ja/twitch/history/', source: 'ja/twitch/history/index.html', canonical: `${origin}/ja/twitch/history/`, provider: 'twitch', api: { path: '/api/history', binding: 'DB_TWITCH_HOT' } },
  { route: '/ja/twitch/map/', source: 'ja/twitch/map/index.html', canonical: `${origin}/ja/twitch/map/`, provider: 'twitch', api: { path: '/api/twitch-stream-map', binding: 'DB_TWITCH_HOT' } },
  { route: '/ja/kick/', source: 'ja/kick/index.html', canonical: `${origin}/ja/kick/`, provider: 'kick', api: { path: '/api/kick-home', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/heatmap/', source: 'ja/kick/heatmap/index.html', canonical: `${origin}/ja/kick/heatmap/`, provider: 'kick', api: { path: '/api/kick-heatmap', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/day-flow/', source: 'ja/kick/day-flow/index.html', canonical: `${origin}/ja/kick/day-flow/`, provider: 'kick', api: { path: '/api/kick-day-flow', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/battle-lines/', source: 'ja/kick/battle-lines/index.html', canonical: `${origin}/ja/kick/battle-lines/`, provider: 'kick', api: { path: '/api/kick-battle-lines', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/history/', source: 'ja/kick/history/index.html', canonical: `${origin}/ja/kick/history/`, provider: 'kick', api: { path: '/api/kick-history', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/map/', source: 'ja/kick/map/index.html', canonical: `${origin}/ja/kick/map/`, provider: 'kick', api: { path: '/api/kick-stream-map', binding: 'DB_KICK_HOT' } },
]

const sitemap = readWeb('public/sitemap.xml')
const vite = readWeb('vite.config.ts')
const routeHelper = readWeb('src/i18n/route.ts')
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

for (const path of [
  '/',
  '/twitch/', '/twitch/heatmap/', '/twitch/day-flow/', '/twitch/battle-lines/', '/twitch/history/', '/twitch/map/',
  '/kick/', '/kick/heatmap/', '/kick/day-flow/', '/kick/battle-lines/', '/kick/history/', '/kick/map/',
]) {
  assert.match(routeHelper, new RegExp(`["']${escapeRegex(path)}["']`), `Japanese availability missing ${path}`)
}
for (const path of [
  '/twitch/status/', '/twitch/channel/', '/twitch/watchlist/',
  '/kick/status/', '/kick/channel/', '/kick/watchlist/',
]) {
  assert.doesNotMatch(routeHelper, new RegExp(`["']${escapeRegex(path)}["']`), `unreleased Japanese utility route exposed: ${path}`)
}
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

const jaPortal = readWeb('ja/index.html')
assert.match(jaPortal, /src=["']\/src\/portal-page\.ts["']/, '/ja/: shared Portal runtime must be used')
assert.match(portalRuntime, /type Platform\s*=\s*'twitch'\s*\|\s*'kick'/, 'Portal runtime must retain separate Twitch/Kick platform ownership')
assert.match(portalRuntime, /fetch\(`\/api\/\$\{platform\}-home`/, 'Portal runtime must reuse the existing provider Home API family')
assert.doesNotMatch(portalRuntime, /\/api\/ja(?:\/|-)/i, 'Portal runtime must not introduce localized API paths')
assert.match(jaPortal, /href=["']\/ja\/twitch\//, '/ja/: localized Twitch Home link missing')
assert.match(jaPortal, /href=["']\/ja\/kick\//, '/ja/: localized Kick Home link missing')

for (const provider of ['twitch', 'kick']) {
  const home = readWeb(`ja/${provider}/index.html`)
  const heatmap = readWeb(`ja/${provider}/heatmap/index.html`)
  const dayFlow = readWeb(`ja/${provider}/day-flow/index.html`)
  const battleLines = readWeb(`ja/${provider}/battle-lines/index.html`)
  const history = readWeb(`ja/${provider}/history/index.html`)
  const map = readWeb(`ja/${provider}/map/index.html`)

  assert.match(home, /src=["']\/src\/provider-home\.ts["']/, `/ja/${provider}/: shared Provider Home runtime must be used`)
  assert.match(home, /src=["']\/src\/analytics\.ts["']/, `/ja/${provider}/: shared analytics runtime must be used`)

  assert.match(heatmap, /観測/, `/ja/${provider}/heatmap/: Japanese observation copy missing`)
  assert.match(dayFlow, /UTC/, `/ja/${provider}/day-flow/: explicit UTC semantics copy missing`)
  assert.match(battleLines, /UTC/, `/ja/${provider}/battle-lines/: explicit UTC semantics copy missing`)
  assert.match(history, /UTC/, `/ja/${provider}/history/: explicit UTC semantics copy missing`)

  assert.match(map, /Stream Map/, `/ja/${provider}/map/: stable Stream Map feature name missing`)
  assert.match(map, /Current \/ IRL/, `/ja/${provider}/map/: Current / IRL boundary copy missing`)
  assert.match(map, /src=["']\/src\/features\/twitch-stream-map\/stream-map-ja-presentation\.ts["']/, `/ja/${provider}/map/: Japanese Map presentation adapter missing`)
  assert.match(map, /href=["']\/ja\/(?:twitch|kick)\//, `/ja/${provider}/map/: localized provider navigation missing`)
  assert.doesNotMatch(map, new RegExp(`href=["']/ja/${provider}/(?:status|watchlist|channel)/`), `/ja/${provider}/map/: unreleased Japanese utility link exposed`)
  assert.doesNotMatch(map, /\/api\/ja(?:\/|-)/i, `/ja/${provider}/map/: localized Map API path forbidden`)
  if (provider === 'twitch') {
    assert.match(map, /src=["']\/src\/features\/twitch-stream-map\/maplibre-bootstrap\.ts["']/, 'Japanese Twitch Map must reuse the shared Twitch Map bootstrap')
    assert.match(map, /承認済み/, 'Japanese Twitch Map evidence copy missing')
  } else {
    assert.match(map, /src=["']\/src\/features\/kick-stream-map\/public-entry\.ts["']/, 'Japanese Kick Map must reuse the shared Kick Map entry')
    assert.match(map, /レビュー済み/, 'Japanese Kick Map reviewed-geography copy missing')
    assert.match(map, /data-kick-geography=["']country["'][^>]*>Country</, 'Kick Country bootstrap label must remain runtime-compatible before the JA adapter runs')
    assert.match(map, /data-kick-geography=["']city["'][^>]*>City</, 'Kick City bootstrap label must remain runtime-compatible before the JA adapter runs')
  }
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

assert.match(jaMapPresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/, 'Japanese Stream Map presentation must be locale-gated')
assert.match(jaMapPresentation, /RAW_TEXT_ANCESTORS/, 'Japanese Stream Map presentation must explicitly protect raw data labels')
assert.match(jaMapPresentation, /\.stream-map-stream-row__head a/, 'Japanese Stream Map must protect raw streamer identities')
assert.match(jaMapPresentation, /\.stream-map-country-row strong/, 'Japanese Stream Map must protect raw country/city names')
assert.match(jaMapPresentation, /\[data-population-category\] option:not/, 'Japanese Stream Map must protect raw category names')
assert.match(jaMapPresentation, /Current \/ IRL/, 'Japanese Stream Map Current / IRL copy missing')
assert.doesNotMatch(jaMapPresentation, /\/api\//, 'Japanese Stream Map presentation must not own API paths')
assert.doesNotMatch(jaMapPresentation, /\bfetch\(/, 'Japanese Stream Map presentation must not own network requests')
assert.match(twitchMapBootstrap, /import\('\.\/geography-ui-bootstrap'\)/, 'Twitch Map geography controller must remain shared')
assert.match(twitchMapBootstrap, /import\('\.\/stream-map-entry'\)/, 'Twitch Map renderer/controller must remain shared')
assert.match(twitchMapController, /new URL\('\/api\/twitch-stream-map'/, 'Twitch Map API ownership must remain in the shared controller')
assert.match(twitchGeographyController, /request\.pathname === '\/api\/twitch-stream-map'/, 'Twitch geography mode API adapter must remain shared')
assert.match(kickMapEntry, /import '\.\/public-kc5-entry'/, 'Kick Map must reuse the KC5 public runtime')
assert.match(kickMapController, /'\/api\/kick-stream-map\?geography=city'/, 'Kick City API ownership must remain in the shared runtime')
assert.match(kickMapController, /'\/api\/kick-stream-map'/, 'Kick Country API ownership must remain in the shared runtime')
assert.doesNotMatch(twitchMapController, /\/ja\//, 'Twitch Map runtime must remain locale-neutral')
assert.doesNotMatch(kickMapController, /\/ja\//, 'Kick Map runtime must remain locale-neutral')

const routeDocs = [
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
].flatMap((path) => JSON.parse(readRepo(path)).routes)
const inventoriedCandidates = routeDocs.filter((route) => route.route.startsWith('/ja/'))
assert.deepEqual(inventoriedCandidates.map((route) => route.route).sort(), candidates.map((item) => item.route).sort(), 'route inventory must contain exactly the thirteen current Japanese candidates')
for (const candidate of candidates) {
  const route = inventoriedCandidates.find((item) => item.route === candidate.route)
  assert.ok(route, `${candidate.route}: inventory route missing`)
  assert.equal(route.robots, 'noindex,follow', `${candidate.route}: inventory robots mismatch`)
  assert.equal(route.sitemap, false, `${candidate.route}: inventory sitemap mismatch`)
  assert.equal(route.canonical, candidate.canonical, `${candidate.route}: inventory canonical mismatch`)
  if (candidate.api) assert.deepEqual(route.apis, [candidate.api], `${candidate.route}: provider API/binding ownership mismatch`)
}

console.log('Japanese localization candidate contract verified.')
console.log('- candidate routes: /ja/, Twitch/Kick Home, Heatmap, Day Flow, Battle Lines, History, and Stream Map')
console.log('- robots: noindex,follow; sitemap/hreflang/public language switcher: disabled')
console.log('- Stream Map reuses existing Twitch/Kick geography runtimes and provider-separated APIs')
console.log('- Japanese Map presentation owns no fetch/API path and preserves raw streamer/geography/category labels')
console.log('- Country/City/Base City/Current semantics and creator-coordinate boundaries remain unchanged')
console.log('- Status, Channel, and Watchlist remain unreleased Japanese utility routes')

function attr(source, name) {
  return source.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? ''
}
function meta(html, key, value) {
  const item = (html.match(/<meta\b[^>]*>/gi) ?? []).find((entry) => attr(entry, key).toLowerCase() === value.toLowerCase()) ?? ''
  return attr(item, 'content')
}
function link(html, rel) {
  const item = (html.match(/<link\b[^>]*>/gi) ?? []).find((entry) => attr(entry, 'rel').toLowerCase().split(/\s+/).includes(rel)) ?? ''
  return attr(item, 'href')
}
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
