import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const check = (value, message) => { if (!value) failures.push(message) }
const load = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))
const exists = (path) => existsSync(join(root, path))

const manifest = load('docs/audits/public-surface-inventory.json')
check(manifest.schema === 'viewloom-public-surface-inventory-v1', 'manifest schema mismatch')
check(manifest.version === 6, 'inventory version mismatch')
check(manifest.historical_next_branch === 'work-public-browser-audit', 'historical next branch changed')
check(manifest.source?.accepted_main_sha === '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8', 'Phase 12 accepted main SHA mismatch')
check(manifest.source?.production_acceptance === 'docs/audits/phase12-release-acceptance.json', 'Phase 12 evidence owner missing')
check(manifest.source?.historical_r12a_acceptance === 'docs/audits/r12a-production-acceptance.json', 'historical R12A evidence owner missing')
check(manifest.active_program === 'Phase 12A Analytics Capture Foundation', 'active program mismatch')
check(manifest.provider_invariants?.twitch_binding === 'DB_TWITCH_HOT', 'Twitch binding mismatch')
check(manifest.provider_invariants?.kick_binding === 'DB_KICK_HOT', 'Kick binding mismatch')
check(manifest.provider_invariants?.combined_totals_allowed === false, 'combined totals must remain forbidden')
check(manifest.provider_invariants?.combined_rankings_allowed === false, 'combined rankings must remain forbidden')
check(manifest.counts?.vite_html_inputs === 25, 'expected 25 Vite HTML routes')
check(manifest.counts?.inventory_entries === 26, 'expected 26 inventory entries')
check(manifest.counts?.current_browser_required_viewports === 4, 'expected 4 browser viewports')
check(manifest.counts?.current_browser_scenarios === 100, 'expected 100 current browser scenarios')
check(manifest.counts?.public_readiness_configured_pages === 25, 'Public Readiness route count mismatch')
check(manifest.counts?.production_smoke_page_routes === 25, 'Production Smoke route count mismatch')

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

check(routes.length === 26, `expected 26 routes, found ${routes.length}`)
check(routes.filter((route) => route.source !== 'apps/web/public/404.html').length === 25, 'Vite route count mismatch')
check(new Set(routes.map((route) => route.id)).size === routes.length, 'duplicate route id')
check(new Set(routes.map((route) => route.route)).size === routes.length, 'duplicate route path')
check(routes.filter((route) => route.profile === 'watchlist').length === 2, 'both Watchlist routes must remain inventoried')
check(routes.filter((route) => route.profile === 'static_legal').length === 5, 'five static legal routes required')

const vite = readFileSync(join(root, 'apps/web/vite.config.ts'), 'utf8')
const sitemap = readFileSync(join(root, 'apps/web/public/sitemap.xml'), 'utf8')
const sitemapRoutes = new Set([...sitemap.matchAll(/<loc>https:\/\/vl\.badjoke-lab\.com([^<]*)<\/loc>/g)].map((match) => normalizeRoute(match[1] || '/')))

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
    const html = readFileSync(join(root, route.source), 'utf8')
    check(decode(tag(html, 'title')) === route.title, `${route.id}: title mismatch`)
    check(link(html, 'canonical') === route.canonical, `${route.id}: canonical mismatch`)
    const robots = meta(html, 'name', 'robots') || 'index,follow'
    check(robots.toLowerCase() === route.robots, `${route.id}: robots mismatch`)
    check(route.sitemap === sitemapRoutes.has(route.route), `${route.id}: sitemap mismatch`)
  }
  for (const api of route.apis ?? []) {
    if (route.provider === 'twitch') check(api.binding === 'DB_TWITCH_HOT' && !api.path.includes('kick'), `${route.id}: Twitch API boundary mismatch`)
    if (route.provider === 'kick') check(api.binding === 'DB_KICK_HOT' && api.path.includes('kick'), `${route.id}: Kick API boundary mismatch`)
  }
}

check(sitemapRoutes.size === 21, `expected 21 sitemap routes, found ${sitemapRoutes.size}`)
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

const phase12 = load('docs/audits/phase12-release-acceptance.json')
check(phase12.status === 'complete' && phase12.result === 'pass', 'Phase 12 production acceptance must remain complete')
check(phase12.productionAcceptance?.targetMainSha === manifest.source.accepted_main_sha, 'inventory and Phase 12 accepted SHA mismatch')
check(phase12.productionAcceptance?.deployedSha === manifest.source.accepted_main_sha, 'Phase 12 deployed SHA mismatch')
check(phase12.productionAcceptance?.publicRoutesChecked === 25, 'Phase 12 route count mismatch')
check(phase12.productionAcceptance?.providerCrossingFailures === 0, 'Phase 12 provider crossing failure')
check(phase12.productionAcceptance?.monitoring?.blockingAlerts === 0, 'Phase 12 blocking alert')

const r12a = load('docs/audits/r12a-production-acceptance.json')
check(r12a.status === 'complete' && r12a.result === 'pass', 'historical R12A production acceptance must remain complete')
check(r12a.expected_main_sha === r12a.deployed_sha, 'historical R12A expected/deployed SHA mismatch')

if (failures.length) {
  console.error('Public surface inventory verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Public surface inventory verified: ${routes.length} routes, ${Object.keys(profiles).length} profiles, ${Object.keys(gates).length} gate groups.`)
console.log('- active program is Phase 12A Analytics Capture Foundation')
console.log('- 25 HTML routes plus explicit 404 remain owned')
console.log('- Phase 12 exact-SHA production acceptance owns current public-surface acceptance')
console.log('- five R12A legal/support routes remain resolved and historically preserved')
console.log('- Twitch and Kick bindings remain separate')
console.log('- historical P8B and R12A evidence remain locked separately')

function tag(html, name) { return html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim() ?? '' }
function attr(source, name) { return source.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '' }
function meta(html, key, value) { const item = (html.match(/<meta\b[^>]*>/gi) ?? []).find((entry) => attr(entry, key).toLowerCase() === value.toLowerCase()) ?? ''; return attr(item, 'content') }
function link(html, rel) { return attr((html.match(/<link\b[^>]*>/gi) ?? []).find((item) => attr(item, 'rel').toLowerCase().split(/\s+/).includes(rel)) ?? '', 'href') }
function decode(value) { return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>') }
function normalizeRoute(value) { const clean = value.replace(/\/index\.html$/, '/'); return clean === '' || clean === '/' ? '/' : `/${clean.replace(/^\/+|\/+$/g, '')}/` }
