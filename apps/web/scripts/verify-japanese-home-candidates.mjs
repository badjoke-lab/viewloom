import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const readWeb = (path) => readFileSync(resolve(webRoot, path), 'utf8')
const readRepo = (path) => readFileSync(resolve(repoRoot, path), 'utf8')
const origin = 'https://www.viewloom.net'

const candidates = [
  { route: '/ja/', source: 'ja/index.html', canonical: `${origin}/ja/`, provider: 'portal' },
  { route: '/ja/twitch/', source: 'ja/twitch/index.html', canonical: `${origin}/ja/twitch/`, provider: 'twitch' },
  { route: '/ja/kick/', source: 'ja/kick/index.html', canonical: `${origin}/ja/kick/`, provider: 'kick' },
]

const sitemap = readWeb('public/sitemap.xml')
const vite = readWeb('vite.config.ts')
const routeHelper = readWeb('src/i18n/route.ts')
const portalRuntime = readWeb('src/portal-page.ts')
const providerShell = readWeb('src/provider-home-shell.ts')
const providerMapEntry = readWeb('src/provider-home-stream-map-entry.ts')

assert.match(routeHelper, /const JAPANESE_AVAILABLE_PATHNAMES = new Set\(\[\s*'\/'\s*,\s*'\/twitch\/'\s*,\s*'\/kick\/'\s*,?\s*\]\)/s, 'J3 Japanese availability must contain only Portal/Twitch/Kick Home paths')
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
assert.doesNotMatch(jaPortal, /href=["']\/ja\/(?:twitch|kick)\/(?:heatmap|day-flow|battle-lines|history|map|status|watchlist|channel)\//, '/ja/: unreleased Japanese feature link exposed')

for (const provider of ['twitch', 'kick']) {
  const html = readWeb(`ja/${provider}/index.html`)
  assert.match(html, /src=["']\/src\/provider-home\.ts["']/, `/ja/${provider}/: shared Provider Home runtime must be used`)
  assert.match(html, /src=["']\/src\/analytics\.ts["']/, `/ja/${provider}/: shared analytics runtime must be used`)
}

const routeDocs = [
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
].flatMap((path) => JSON.parse(readRepo(path)).routes)
const inventoriedCandidates = routeDocs.filter((route) => route.route.startsWith('/ja/'))
assert.deepEqual(inventoriedCandidates.map((route) => route.route).sort(), candidates.map((item) => item.route).sort(), 'route inventory must contain exactly the three J3 Japanese candidates')
for (const route of inventoriedCandidates) {
  assert.equal(route.robots, 'noindex,follow', `${route.route}: inventory robots mismatch`)
  assert.equal(route.sitemap, false, `${route.route}: inventory sitemap mismatch`)
  assert.equal(route.canonical, `${origin}${route.route}`, `${route.route}: inventory canonical mismatch`)
}

const twitch = inventoriedCandidates.find((route) => route.route === '/ja/twitch/')
assert.deepEqual(twitch?.apis, [{ path: '/api/twitch-home', binding: 'DB_TWITCH_HOT' }], 'Japanese Twitch Home must reuse Twitch Home API/binding')
const kick = inventoriedCandidates.find((route) => route.route === '/ja/kick/')
assert.deepEqual(kick?.apis, [{ path: '/api/kick-home', binding: 'DB_KICK_HOT' }], 'Japanese Kick Home must reuse Kick Home API/binding')

console.log('Japanese Home candidate contract verified.')
console.log('- candidate routes: /ja/, /ja/twitch/, /ja/kick/')
console.log('- robots: noindex,follow')
console.log('- sitemap/hreflang/public language switcher: disabled')
console.log('- unreleased Japanese feature links: blocked by availability-aware routing')
console.log('- Twitch/Kick API and D1 binding ownership: unchanged')

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
