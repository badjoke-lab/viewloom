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
  { route: '/ja/kick/', source: 'ja/kick/index.html', canonical: `${origin}/ja/kick/`, provider: 'kick', api: { path: '/api/kick-home', binding: 'DB_KICK_HOT' } },
  { route: '/ja/kick/heatmap/', source: 'ja/kick/heatmap/index.html', canonical: `${origin}/ja/kick/heatmap/`, provider: 'kick', api: { path: '/api/kick-heatmap', binding: 'DB_KICK_HOT' } },
]

const sitemap = readWeb('public/sitemap.xml')
const vite = readWeb('vite.config.ts')
const routeHelper = readWeb('src/i18n/route.ts')
const portalRuntime = readWeb('src/portal-page.ts')
const providerShell = readWeb('src/provider-home-shell.ts')
const providerMapEntry = readWeb('src/provider-home-stream-map-entry.ts')

for (const path of ['/', '/twitch/', '/twitch/heatmap/', '/kick/', '/kick/heatmap/']) {
  assert.match(routeHelper, new RegExp(`["']${escapeRegex(path)}["']`), `Japanese availability missing ${path}`)
}
for (const path of [
  '/twitch/day-flow/', '/twitch/battle-lines/', '/twitch/history/', '/twitch/map/', '/twitch/status/',
  '/kick/day-flow/', '/kick/battle-lines/', '/kick/history/', '/kick/map/', '/kick/status/',
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
  assert.match(home, /src=["']\/src\/provider-home\.ts["']/, `/ja/${provider}/: shared Provider Home runtime must be used`)
  assert.match(home, /src=["']\/src\/analytics\.ts["']/, `/ja/${provider}/: shared analytics runtime must be used`)
  assert.match(heatmap, /src=["']\/src\/live\/heatmap-current-shell-entry\.ts["']/, `/ja/${provider}/heatmap/: shared Heatmap runtime must be used`)
  assert.match(heatmap, /src=["']\/src\/analytics\.ts["']/, `/ja/${provider}/heatmap/: shared analytics runtime must be used`)
  assert.match(heatmap, /観測/, `/ja/${provider}/heatmap/: Japanese observation copy missing`)
  assert.doesNotMatch(heatmap, /href=["']\/ja\/(?:twitch|kick)\/(?:day-flow|battle-lines|history|map|status|watchlist|channel)\//, `/ja/${provider}/heatmap/: unreleased Japanese feature link exposed`)
}

const routeDocs = [
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
].flatMap((path) => JSON.parse(readRepo(path)).routes)
const inventoriedCandidates = routeDocs.filter((route) => route.route.startsWith('/ja/'))
assert.deepEqual(inventoriedCandidates.map((route) => route.route).sort(), candidates.map((item) => item.route).sort(), 'route inventory must contain exactly the five current Japanese candidates')
for (const candidate of candidates) {
  const route = inventoriedCandidates.find((item) => item.route === candidate.route)
  assert.ok(route, `${candidate.route}: inventory route missing`)
  assert.equal(route.robots, 'noindex,follow', `${candidate.route}: inventory robots mismatch`)
  assert.equal(route.sitemap, false, `${candidate.route}: inventory sitemap mismatch`)
  assert.equal(route.canonical, candidate.canonical, `${candidate.route}: inventory canonical mismatch`)
  if (candidate.api) assert.deepEqual(route.apis, [candidate.api], `${candidate.route}: provider API/binding ownership mismatch`)
}

console.log('Japanese localization candidate contract verified.')
console.log('- candidate routes: /ja/, /ja/twitch/, /ja/twitch/heatmap/, /ja/kick/, /ja/kick/heatmap/')
console.log('- robots: noindex,follow')
console.log('- sitemap/hreflang/public language switcher: disabled')
console.log('- Heatmap is localized; unreleased Japanese feature routes remain unavailable')
console.log('- Twitch/Kick Home and Heatmap API/D1 ownership remains provider-separated')

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
