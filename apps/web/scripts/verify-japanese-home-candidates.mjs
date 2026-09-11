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
  { route: '/ja/kick/', source: 'ja/kick/index.html', canonical: `${origin}/ja/kick/`, provider: 'kick', api: { path: '/api/kick-home', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/heatmap/', source: 'ja/kick/heatmap/index.html', canonical: `${origin}/ja/kick/heatmap/`, provider: 'kick', api: { path: '/api/kick-heatmap', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/day-flow/', source: 'ja/kick/day-flow/index.html', canonical: `${origin}/ja/kick/day-flow/`, provider: 'kick', api: { path: '/api/kick-day-flow', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/battle-lines/', source: 'ja/kick/battle-lines/index.html', canonical: `${origin}/ja/kick/battle-lines/`, provider: 'kick', api: { path: '/api/kick-battle-lines', binding: 'DB_KICK_HOT' } },
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

for (const path of [
  '/',
  '/twitch/', '/twitch/heatmap/', '/twitch/day-flow/', '/twitch/battle-lines/',
  '/kick/', '/kick/heatmap/', '/kick/day-flow/', '/kick/battle-lines/',
]) {
  assert.match(routeHelper, new RegExp(`["']${escapeRegex(path)}["']`), `Japanese availability missing ${path}`)
}
for (const path of [
  '/twitch/history/', '/twitch/map/', '/twitch/status/',
  '/kick/history/', '/kick/map/', '/kick/status/',
]) {
  assert.doesNotMatch(routeHelper, new RegExp(`["']${escapeRegex(path)}["']`), `unreleased Japanese feature availability exposed: ${path}`)
}
assert.match(routeHelper, /export function localizeAvailableHref\(/, 'availability-aware locale route helper missing')
assert.match(providerShell, /localizeAvailableHref/, 'Provider Home shell must use availability-aware route localization')
assert.doesNotMatch(providerShell, /const base\s*=\s*localizeHref/, 'Provider Home shell must not build Japanese feature URLs from a localized base')
assert.match(providerMapEntry, /localizeAvailableHref/, 'Provider Home Stream Map entry must use availability-aware route localization')

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

  assert.match(home, /src=["']\/src\/provider-home\.ts["']/, `/ja/${provider}/: shared Provider Home runtime must be used`)
  assert.match(home, /src=["']\/src\/analytics\.ts["']/, `/ja/${provider}/: shared analytics runtime must be used`)

  assert.match(heatmap, /src=["']\/src\/live\/heatmap-current-shell-entry\.ts["']/, `/ja/${provider}/heatmap/: shared Heatmap runtime must be used`)
  assert.match(heatmap, /src=["']\/src\/analytics\.ts["']/, `/ja/${provider}/heatmap/: shared analytics runtime must be used`)
  assert.match(heatmap, /観測/, `/ja/${provider}/heatmap/: Japanese observation copy missing`)
  assert.match(heatmap, new RegExp(`href=["']/ja/${provider}/day-flow/["']`), `/ja/${provider}/heatmap/: localized Day Flow link missing`)
  assert.doesNotMatch(heatmap, new RegExp(`href=["']/ja/${provider}/(?:history|map|status|watchlist|channel)/`), `/ja/${provider}/heatmap/: unreleased Japanese feature link exposed`)

  const expectedDayFlowEntry = provider === 'twitch' ? 'day-flow-ja-twitch-entry.ts' : 'day-flow-ja-kick-entry.ts'
  assert.match(dayFlow, new RegExp(`src=["']/src/live/${escapeRegex(expectedDayFlowEntry)}["']`), `/ja/${provider}/day-flow/: Japanese presentation entry missing`)
  assert.match(dayFlow, /src=["']\/src\/analytics\.ts["']/, `/ja/${provider}/day-flow/: shared analytics runtime must be used`)
  assert.match(dayFlow, /UTC/, `/ja/${provider}/day-flow/: explicit UTC semantics copy missing`)
  assert.match(dayFlow, new RegExp(`href=["']/ja/${provider}/heatmap/["']`), `/ja/${provider}/day-flow/: localized Heatmap link missing`)
  assert.match(dayFlow, new RegExp(`href=["']/ja/${provider}/battle-lines/["']`), `/ja/${provider}/day-flow/: localized Battle Lines link missing`)
  assert.doesNotMatch(dayFlow, new RegExp(`href=["']/ja/${provider}/(?:history|map|status|watchlist|channel)/`), `/ja/${provider}/day-flow/: unreleased Japanese feature link exposed`)

  const expectedBattleEntry = provider === 'twitch' ? 'battle-lines-ja-twitch-entry.ts' : 'battle-lines-ja-kick-entry.ts'
  assert.match(battleLines, new RegExp(`src=["']/src/live/${escapeRegex(expectedBattleEntry)}["']`), `/ja/${provider}/battle-lines/: Japanese presentation entry missing`)
  assert.match(battleLines, /src=["']\/src\/analytics\.ts["']/, `/ja/${provider}/battle-lines/: shared analytics runtime must be used`)
  assert.match(battleLines, /UTC/, `/ja/${provider}/battle-lines/: explicit UTC semantics copy missing`)
  assert.match(battleLines, new RegExp(`href=["']/ja/${provider}/heatmap/["']`), `/ja/${provider}/battle-lines/: localized Heatmap link missing`)
  assert.match(battleLines, new RegExp(`href=["']/ja/${provider}/day-flow/["']`), `/ja/${provider}/battle-lines/: localized Day Flow link missing`)
  assert.match(battleLines, new RegExp(`href=["']/ja/${provider}/battle-lines/["']`), `/ja/${provider}/battle-lines/: localized Battle Lines self-link missing`)
  assert.doesNotMatch(battleLines, new RegExp(`href=["']/ja/${provider}/(?:history|map|status|watchlist|channel)/`), `/ja/${provider}/battle-lines/: unreleased Japanese feature link exposed`)
}

assert.match(jaTwitchDayFlowEntry, /import '\.\/day-flow-ja-presentation'/, 'Japanese Twitch Day Flow must install the shared Japanese presentation adapter')
assert.match(jaTwitchDayFlowEntry, /import '\.\/day-flow-twitch-entry'/, 'Japanese Twitch Day Flow must reuse the Twitch Day Flow entry')
assert.match(jaKickDayFlowEntry, /import '\.\/day-flow-ja-presentation'/, 'Japanese Kick Day Flow must install the shared Japanese presentation adapter')
assert.match(jaKickDayFlowEntry, /import '\.\/day-flow-kick-entry'/, 'Japanese Kick Day Flow must reuse the Kick Day Flow entry')
assert.match(jaDayFlowPresentation, /localeFromPathname/, 'Japanese Day Flow presentation must be locale-gated')
assert.match(jaDayFlowPresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/, 'Japanese Day Flow presentation must activate only on Japanese routes')
assert.match(jaDayFlowPresentation, /観測範囲/, 'Japanese Day Flow presentation must contain localized observation copy')
assert.match(jaDayFlowPresentation, /カテゴリ/, 'Japanese Day Flow presentation must contain localized category chrome')
assert.doesNotMatch(jaDayFlowPresentation, /\/api\//, 'Japanese Day Flow presentation must not own or rewrite API paths')
assert.match(sharedDayFlowController, /provider === 'kick' \? '\/api\/kick-day-flow' : '\/api\/day-flow'/, 'Day Flow API ownership must remain in the shared controller')
assert.equal((sharedDayFlowController.match(/\bfetch\(/g) ?? []).length, 1, 'Day Flow feature request must remain single-owner')

for (const [provider, entry] of [['twitch', jaTwitchBattleEntry], ['kick', jaKickBattleEntry]]) {
  assert.match(entry, /import '\.\/battle-lines-ja-presentation'/, `Japanese ${provider} Battle Lines must install the shared Japanese presentation adapter`)
  assert.match(entry, /import '\.\/battle-lines-ja-split-labels'/, `Japanese ${provider} Battle Lines must install Japanese Split labels`)
  assert.match(entry, /import '\.\/battle-lines-current-shell-entry'/, `Japanese ${provider} Battle Lines must reuse the shared Battle Lines controller`)
}
assert.match(jaBattlePresentation, /localeFromPathname/, 'Japanese Battle Lines presentation must be locale-gated')
assert.match(jaBattlePresentation, /localeFromPathname\(window\.location\.pathname\) === 'ja'/, 'Japanese Battle Lines presentation must activate only on Japanese routes')
assert.match(jaBattlePresentation, /観測範囲/, 'Japanese Battle Lines presentation must contain localized observation copy')
assert.match(jaBattlePresentation, /時刻インスペクター/, 'Japanese Battle Lines presentation must contain localized inspector chrome')
assert.match(jaBattlePresentation, /逆転/, 'Japanese Battle Lines presentation must contain localized reversal chrome')
assert.match(jaBattlePresentation, /RAW_TEXT_ANCESTORS/, 'Japanese Battle Lines presentation must explicitly protect raw stream/event text')
assert.match(jaBattlePresentation, /\.battle-primary__identity h2/, 'Japanese Battle Lines presentation must protect raw selected stream identity')
assert.match(jaBattlePresentation, /\[data-battle-feed\] p/, 'Japanese Battle Lines presentation must protect raw event summaries')
assert.match(jaBattlePresentation, /\.battle-split-event span/, 'Japanese Battle Lines presentation must protect raw Split event summaries')
assert.doesNotMatch(jaBattlePresentation, /\/api\//, 'Japanese Battle Lines presentation must not own or rewrite API paths')
assert.match(jaBattleSplitLabels, /localeFromPathname\(window\.location\.pathname\) === 'ja'/, 'Japanese Battle Lines Split labels must activate only on Japanese routes')
assert.match(jaBattleSplitLabels, /\.battle-split-value small/, 'Japanese Battle Lines Split labels must target presentation labels only')
assert.doesNotMatch(jaBattleSplitLabels, /\/api\//, 'Japanese Battle Lines Split labels must not own or rewrite API paths')
assert.match(sharedBattleController, /provider === 'kick' \? '\/api\/kick-battle-lines' : '\/api\/battle-lines'/, 'Battle Lines API ownership must remain in the shared controller')

const routeDocs = [
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
].flatMap((path) => JSON.parse(readRepo(path)).routes)
const inventoriedCandidates = routeDocs.filter((route) => route.route.startsWith('/ja/'))
assert.deepEqual(inventoriedCandidates.map((route) => route.route).sort(), candidates.map((item) => item.route).sort(), 'route inventory must contain exactly the nine current Japanese candidates')
for (const candidate of candidates) {
  const route = inventoriedCandidates.find((item) => item.route === candidate.route)
  assert.ok(route, `${candidate.route}: inventory route missing`)
  assert.equal(route.robots, 'noindex,follow', `${candidate.route}: inventory robots mismatch`)
  assert.equal(route.sitemap, false, `${candidate.route}: inventory sitemap mismatch`)
  assert.equal(route.canonical, candidate.canonical, `${candidate.route}: inventory canonical mismatch`)
  if (candidate.api) assert.deepEqual(route.apis, [candidate.api], `${candidate.route}: provider API/binding ownership mismatch`)
}

console.log('Japanese localization candidate contract verified.')
console.log('- candidate routes: /ja/, Twitch/Kick Home, Heatmap, Day Flow, and Battle Lines')
console.log('- robots: noindex,follow')
console.log('- sitemap/hreflang/public language switcher: disabled')
console.log('- Heatmap, Day Flow, and Battle Lines are localized; later Japanese feature routes remain unavailable')
console.log('- Day Flow and Battle Lines keep shared provider controllers and UTC semantics')
console.log('- Battle Lines preserves raw stream identities and event text while localizing presentation chrome')
console.log('- Twitch/Kick Home, Heatmap, Day Flow, and Battle Lines API/D1 ownership remains provider-separated')

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
