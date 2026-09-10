import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const primaryOrigin = 'https://www.viewloom.net'
const legacyOrigins = ['https://vl.badjoke-lab.com', 'https://viewloom.net']
const check = (value, message) => { if (!value) failures.push(message) }
const load = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))
const exists = (path) => existsSync(join(root, path))
const normalizeOrigin = (source) => legacyOrigins.reduce((value, origin) => value.replaceAll(origin, primaryOrigin), source)

const manifest = load('docs/audits/public-surface-inventory.json')
check(manifest.schema === 'viewloom-public-surface-inventory-v1', 'manifest schema mismatch')
check(manifest.historical_next_branch === 'work-public-browser-audit', 'historical next branch changed')
check(manifest.source?.accepted_main_sha === '952f0008209363f4fd5b22587975ac247ee8d6f2', 'R12A accepted main SHA mismatch')
check(manifest.source?.production_acceptance === 'docs/audits/r12a-production-acceptance.json', 'R12A evidence owner missing')
check(manifest.source?.phase12_release_acceptance === 'docs/audits/phase12-release-acceptance.json', 'Phase 12 release evidence owner missing')
check(manifest.active_program === 'Phase 12A Analytics Capture Foundation', 'active program mismatch')
check(manifest.provider_invariants?.twitch_binding === 'DB_TWITCH_HOT', 'Twitch binding mismatch')
check(manifest.provider_invariants?.kick_binding === 'DB_KICK_HOT', 'Kick binding mismatch')
check(manifest.provider_invariants?.combined_totals_allowed === false, 'combined totals must remain forbidden')
check(manifest.provider_invariants?.combined_rankings_allowed === false, 'combined rankings must remain forbidden')
check(manifest.counts?.vite_html_inputs === 34, 'expected 34 Vite HTML routes')
check(manifest.counts?.inventory_entries === 35, 'expected 35 inventory entries')
check(manifest.counts?.indexable_routes === 23, 'expected 23 indexable routes')
check(manifest.counts?.noindex_routes === 11, 'expected 11 noindex routes')
check(manifest.counts?.current_browser_scenarios === 136, 'expected 136 current browser scenarios')
check(manifest.counts?.public_readiness_configured_pages === 34, 'Public Readiness route count mismatch')
check(manifest.counts?.production_smoke_page_routes === 34, 'Production Smoke route count mismatch')

const gates = {}
const profiles = {}
for (const path of manifest.profile_files ?? []) {
  check(exists(path), `missing profile file: ${path}`)
  if (!exists(path)) continue
  const doc = load(path)
  check(doc.schema === 'viewloom-public-surface-profiles-v1', `${path}: schema mismatch`)
  for (const [name, paths] of Object.entries(doc.gates ?? {})) {
    if (gates[name]) check(JSON.stringify(gates[name]) === JSON.stringify(paths), `gate definition differs: ${name}`)
    else gates[name] = paths
  }
  for (const [name, profile] of Object.entries(doc.profiles ?? {})) {
    check(!profiles[name], `duplicate profile: ${name}`)
    profiles[name] = profile
  }
}

const routes = []
for (const path of manifest.route_files ?? []) {
  check(exists(path), `missing route file: ${path}`)
  if (!exists(path)) continue
  const doc = load(path)
  check(doc.schema === 'viewloom-public-surface-routes-v1', `${path}: schema mismatch`)
  routes.push(...(doc.routes ?? []))
}

check(routes.length === 35, `expected 35 routes, found ${routes.length}`)
check(routes.filter((route) => route.source !== 'apps/web/public/404.html').length === 34, 'Vite route count mismatch')
check(new Set(routes.map((route) => route.id)).size === routes.length, 'duplicate route id')
check(new Set(routes.map((route) => route.route)).size === routes.length, 'duplicate route path')
check(routes.filter((route) => route.profile === 'watchlist').length === 2, 'both Watchlist routes must remain inventoried')
check(routes.filter((route) => route.profile === 'static_legal').length === 5, 'five static legal routes required')
check(routes.some((route) => route.id === 'twitch-map' && route.route === '/twitch/map/' && route.profile === 'stream_map'), 'public Twitch Stream Map must remain inventoried')
check(routes.some((route) => route.id === 'kick-map' && route.route === '/kick/map/' && route.profile === 'stream_map'), 'public Kick Stream Map must remain inventoried after K4 authorization')

const japaneseCandidates = routes.filter((route) => route.route.startsWith('/ja/'))
const expectedJapaneseCandidates = [
  '/ja/',
  '/ja/twitch/',
  '/ja/kick/',
  '/ja/twitch/heatmap/',
  '/ja/kick/heatmap/',
  '/ja/twitch/day-flow/',
  '/ja/kick/day-flow/',
]
check(japaneseCandidates.length === expectedJapaneseCandidates.length, `expected ${expectedJapaneseCandidates.length} Japanese candidate routes, found ${japaneseCandidates.length}`)
for (const expected of expectedJapaneseCandidates) {
  const candidate = japaneseCandidates.find((route) => route.route === expected)
  check(candidate, `Japanese candidate route missing: ${expected}`)
  if (!candidate) continue
  check(candidate.robots === 'noindex,follow', `${expected}: Japanese candidate must remain noindex,follow before J10`)
  check(candidate.sitemap === false, `${expected}: Japanese candidate must remain outside sitemap before J10`)
  check(candidate.canonical === `${primaryOrigin}${expected}`, `${expected}: Japanese candidate must self-canonicalize`)
}
const jaTwitch = japaneseCandidates.find((route) => route.route === '/ja/twitch/')
const jaKick = japaneseCandidates.find((route) => route.route === '/ja/kick/')
const jaTwitchHeatmap = japaneseCandidates.find((route) => route.route === '/ja/twitch/heatmap/')
const jaKickHeatmap = japaneseCandidates.find((route) => route.route === '/ja/kick/heatmap/')
const jaTwitchDayFlow = japaneseCandidates.find((route) => route.route === '/ja/twitch/day-flow/')
const jaKickDayFlow = japaneseCandidates.find((route) => route.route === '/ja/kick/day-flow/')
check(jaTwitch?.apis?.length === 1 && jaTwitch.apis[0].path === '/api/twitch-home' && jaTwitch.apis[0].binding === 'DB_TWITCH_HOT', 'Japanese Twitch Home must reuse the Twitch Home API/binding')
check(jaKick?.apis?.length === 1 && jaKick.apis[0].path === '/api/kick-home' && jaKick.apis[0].binding === 'DB_KICK_HOT', 'Japanese Kick Home must reuse the Kick Home API/binding')
check(jaTwitchHeatmap?.apis?.length === 1 && jaTwitchHeatmap.apis[0].path === '/api/twitch-heatmap' && jaTwitchHeatmap.apis[0].binding === 'DB_TWITCH_HOT', 'Japanese Twitch Heatmap must reuse the Twitch Heatmap API/binding')
check(jaKickHeatmap?.apis?.length === 1 && jaKickHeatmap.apis[0].path === '/api/kick-heatmap' && jaKickHeatmap.apis[0].binding === 'DB_KICK_HOT', 'Japanese Kick Heatmap must reuse the Kick Heatmap API/binding')
check(jaTwitchDayFlow?.apis?.length === 1 && jaTwitchDayFlow.apis[0].path === '/api/day-flow' && jaTwitchDayFlow.apis[0].binding === 'DB_TWITCH_HOT', 'Japanese Twitch Day Flow must reuse the Twitch Day Flow API/binding')
check(jaKickDayFlow?.apis?.length === 1 && jaKickDayFlow.apis[0].path === '/api/kick-day-flow' && jaKickDayFlow.apis[0].binding === 'DB_KICK_HOT', 'Japanese Kick Day Flow must reuse the Kick Day Flow API/binding')

const vite = readFileSync(join(root, 'apps/web/vite.config.ts'), 'utf8')
const sitemap = readFileSync(join(root, 'apps/web/public/sitemap.xml'), 'utf8')
const sitemapRoutes = new Set([...sitemap.matchAll(/<loc>https:\/\/www\.viewloom\.net([^<]*)<\/loc>/g)].map((match) => normalizeRoute(match[1] || '/')))

for (const route of routes) {
  check(exists(route.source), `${route.id}: source missing ${route.source}`)
  const profile = profiles[route.profile]
  check(profile, `${route.id}: unknown profile ${route.profile}`)
  if (!profile) continue
  for (const owner of profile.owner ?? []) check(exists(owner), `${route.id}: owner missing ${owner}`)
  for (const gate of profile.gates ?? []) {
    check(Array.isArray(gates[gate]), `${route.id}: unknown gate ${gate}`)
    for (const path of gates[gate] ?? []) check(exists(path), `${route.id}: gate path missing ${path}`)
  }
  if (route.route !== '*') {
    const relative = route.source.replace(/^apps\/web\//, '')
    check(vite.includes(`'${relative}'`) || vite.includes(`"${relative}"`), `${route.id}: not a Vite input`)
    const html = normalizeOrigin(readFileSync(join(root, route.source), 'utf8'))
    check(decode(tag(html, 'title')) === route.title, `${route.id}: title mismatch`)
    check(link(html, 'canonical') === route.canonical, `${route.id}: canonical mismatch`)
    const robots = meta(html, 'name', 'robots') || 'index,follow'
    check(robots.toLowerCase() === route.robots, `${route.id}: robots mismatch`)
    check(route.sitemap === sitemapRoutes.has(route.route), `${route.id}: sitemap mismatch`)
    if (route.route.startsWith('/ja/')) {
      check(attr(html.match(/<html\b[^>]*>/i)?.[0] ?? '', 'lang') === 'ja', `${route.id}: html lang must be ja`)
      check(!/hreflang=/i.test(html), `${route.id}: hreflang must remain hidden before J10`)
    }
  }
  for (const api of route.apis ?? []) {
    if (route.provider === 'twitch') check(api.binding === 'DB_TWITCH_HOT' && !api.path.includes('kick'), `${route.id}: Twitch API boundary mismatch`)
    if (route.provider === 'kick') check(api.binding === 'DB_KICK_HOT' && api.path.includes('kick'), `${route.id}: Kick API boundary mismatch`)
  }
}

check(sitemapRoutes.size === 23, `expected 23 sitemap routes, found ${sitemapRoutes.size}`)
check(![...sitemapRoutes].some((route) => route.startsWith('/ja/')), 'Japanese candidates must remain absent from sitemap before J10')
check(profiles.history?.assessment === 'known_p1_defects', 'historical History profile changed')
check(profiles.watchlist?.assessment === 'complete_for_v1_contract', 'Watchlist assessment changed')
check(profiles.static_legal?.assessment === 'complete_current_contract', 'static_legal must remain accepted')
check((profiles.static_legal?.gaps?.length ?? -1) === 0, 'static_legal gaps must remain empty')

const gaps = load(manifest.gap_file)
check(gaps.missing_surfaces?.length === 0, 'missing surfaces must remain empty')
check(gaps.candidate_surfaces?.length === 0, 'candidate surfaces must remain empty')
check(gaps.resolved_surfaces?.length === 5, 'five resolved R12A surfaces required')
check(gaps.historical_missing_surface_baseline?.count === 5, 'historical P8B missing count changed')
check(gaps.cross_route_gaps?.some((item) => item.id === 'policy-surfaces-missing' && item.state === 'resolved'), 'policy surface gap must remain resolved')

const r12a = load('docs/audits/r12a-production-acceptance.json')
check(r12a.status === 'complete' && r12a.result === 'pass', 'R12A production acceptance must remain complete')
check(r12a.expected_main_sha === r12a.deployed_sha, 'R12A expected/deployed SHA mismatch')
check(r12a.counts?.html_routes === 25, 'historical R12A route count mismatch')
check(r12a.counts?.provider_crossing_failures === 0, 'R12A provider crossing failure')
check(r12a.counts?.blocking_alerts === 0, 'R12A blocking alert')

const phase12 = load('docs/audits/phase12-release-acceptance.json')
check(phase12.status === 'complete' && phase12.result === 'pass', 'Phase 12 release acceptance must be complete')
check(phase12.expectedMainSha === phase12.deployedSha, 'Phase 12 expected/deployed SHA mismatch')
check(phase12.counts?.htmlRoutes === 25, 'historical Phase 12 route count mismatch')
check(phase12.counts?.statusApis === 2, 'Phase 12 status API count mismatch')
check(phase12.counts?.sitemapRoutes === 21, 'historical Phase 12 sitemap count mismatch')
check(phase12.counts?.launchAssets === 6, 'Phase 12 launch asset count mismatch')
check(phase12.counts?.blockingAlerts === 0, 'Phase 12 blocking alert')

if (failures.length) {
  console.error('Public surface inventory verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Public surface inventory verified: ${routes.length} routes, ${Object.keys(profiles).length} profiles, ${Object.keys(gates).length} gate groups.`)
console.log('- active program is Phase 12A Analytics Capture Foundation')
console.log('- current candidate build: 34 HTML routes plus explicit 404')
console.log('- seven Japanese candidates remain noindex, self-canonical, and outside sitemap/hreflang before J10')
console.log('- Japanese Twitch/Kick Heatmap and Day Flow candidates reuse their provider-specific APIs and bindings')
console.log('- historical Phase 12 exact-SHA production acceptance remains preserved at its accepted route counts')
console.log('- five R12A legal/support routes remain production accepted and resolved')
console.log('- Twitch and Kick bindings remain separate')
console.log('- public Twitch and Kick Stream Maps are inventoried')
console.log('- historical P8B evidence remains locked separately')
console.log(`- primary public origin is ${primaryOrigin}`)

function tag(html, name) { return html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim() ?? '' }
function attr(source, name) { return source.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '' }
function meta(html, key, value) { const item = (html.match(/<meta\b[^>]*>/gi) ?? []).find((entry) => attr(entry, key).toLowerCase() === value.toLowerCase()) ?? ''; return attr(item, 'content') }
function link(html, rel) { return attr((html.match(/<link\b[^>]*>/gi) ?? []).find((item) => attr(item, 'rel').toLowerCase().split(/\s+/).includes(rel)) ?? '', 'href') }
function decode(value) { return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>') }
function normalizeRoute(value) { const clean = value.replace(/\/index\.html$/, '/'); return clean === '' || clean === '/' ? '/' : `/${clean.replace(/^\/+|\/+$/g, '')}/` }