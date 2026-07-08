import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const fail = []
const check = (value, message) => { if (!value) fail.push(message) }
const load = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))
const exists = (path) => existsSync(join(root, path))

const manifest = load('docs/audits/public-surface-inventory.json')
check(manifest.schema === 'viewloom-public-surface-inventory-v1', 'manifest schema mismatch')
check(manifest.historical_next_branch === 'work-public-browser-audit', 'historical next branch changed')
check(manifest.source?.accepted_main_sha === '952f0008209363f4fd5b22587975ac247ee8d6f2', 'R12A accepted main SHA mismatch')
check(manifest.source?.production_acceptance === 'docs/audits/r12a-production-acceptance.json', 'R12A production evidence owner missing')
check(manifest.active_program === 'Phase 12 R12B Stripe and support-flow readiness', 'active program mismatch')
check(manifest.provider_invariants?.twitch_binding === 'DB_TWITCH_HOT', 'Twitch binding mismatch')
check(manifest.provider_invariants?.kick_binding === 'DB_KICK_HOT', 'Kick binding mismatch')
check(manifest.provider_invariants?.combined_totals_allowed === false, 'combined totals must remain forbidden')
check(manifest.provider_invariants?.combined_rankings_allowed === false, 'combined rankings must remain forbidden')
check(manifest.counts?.vite_html_inputs === 25, 'current inventory must own 25 Vite HTML routes')
check(manifest.counts?.inventory_entries === 26, 'current inventory must include 25 HTML routes plus explicit 404')
check(manifest.counts?.current_browser_scenarios === 100, 'current browser ownership must remain 100 scenarios')
check(manifest.counts?.public_readiness_configured_pages === manifest.counts?.vite_html_inputs, 'Public Readiness must own every Vite HTML route')
check(manifest.counts?.production_smoke_page_routes === manifest.counts?.vite_html_inputs, 'Production Smoke must own every Vite HTML route')

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

check(routes.length === manifest.counts?.inventory_entries, `expected ${manifest.counts?.inventory_entries} routes, found ${routes.length}`)
check(routes.filter((route) => route.source !== 'apps/web/public/404.html').length === manifest.counts?.vite_html_inputs, 'Vite route count mismatch')
check(new Set(routes.map((route) => route.id)).size === routes.length, 'duplicate route id')
check(new Set(routes.map((route) => route.route)).size === routes.length, 'duplicate route path')
check(routes.filter((route) => route.profile === 'watchlist').length === 2, 'both Watchlist routes must remain inventoried')
check(routes.filter((route) => route.profile === 'static_legal').length === 5, 'R12A must own five static legal routes')

const vite = readFileSync(join(root, 'apps/web/vite.config.ts'), 'utf8')
const sitemap = readFileSync(join(root, 'apps/web/public/sitemap.xml'), 'utf8')
const sitemapRoutes = new Set([...sitemap.matchAll(/<loc>https:\/\/vl\.badjoke-lab\.com([^<]*)<\/loc>/g)].map((match) => normalizeRoute(match[1] || '/')))

for (const route of routes) {
  check(exists(route.source), `${route.id}: source missing: ${route.source}`)
  const profile = profiles[route.profile]
  check(profile, `${route.id}: unknown profile ${route.profile}`)
  if (!profile) continue
  check(Array.isArray(profile.owner) && profile.owner.length > 0, `${route.id}: owner missing`)
  check(Array.isArray(profile.states) && profile.states.length > 0, `${route.id}: states missing`)
  check(Array.isArray(profile.gaps), `${route.id}: acceptance gaps missing`)
  for (const owner of profile.owner) check(exists(owner), `${route.id}: owner path missing: ${owner}`)
  for (const gate of profile.gates ?? []) {
    check(Array.isArray(gates[gate]), `${route.id}: unknown gate ${gate}`)
    for (const path of gates[gate] ?? []) check(exists(path), `${route.id}: gate path missing: ${path}`)
  }

  if (route.route !== '*') {
    const relativeSource = route.source.replace(/^apps\/web\//, '')
    check(vite.includes(`'${relativeSource}'`) || vite.includes(`"${relativeSource}"`), `${route.id}: source is not a Vite input`)
    const html = readFileSync(join(root, route.source), 'utf8')
    check(decode(tag(html, 'title')) === route.title, `${route.id}: title mismatch`)
    check(link(html, 'canonical') === route.canonical, `${route.id}: canonical mismatch`)
    const robots = meta(html, 'name', 'robots') || 'index,follow'
    check(robots.toLowerCase() === route.robots, `${route.id}: robots mismatch`)
    check(route.sitemap === sitemapRoutes.has(route.route), `${route.id}: sitemap flag mismatch`)
  }

  for (const api of route.apis ?? []) {
    if (route.provider === 'twitch') check(api.binding === 'DB_TWITCH_HOT', `${route.id}: Twitch API uses wrong binding`)
    if (route.provider === 'kick') check(api.binding === 'DB_KICK_HOT', `${route.id}: Kick API uses wrong binding`)
    if (route.provider === 'twitch') check(!api.path.includes('kick'), `${route.id}: Twitch route references Kick API`)
    if (route.provider === 'kick') check(api.path.includes('kick'), `${route.id}: Kick route references non-Kick API`)
  }
}

check(sitemapRoutes.size === manifest.counts?.sitemap_routes, `expected ${manifest.counts?.sitemap_routes} sitemap routes, found ${sitemapRoutes.size}`)
check(routes.filter((route) => route.route !== '*' && route.sitemap === true).length === manifest.counts?.indexable_routes, 'indexable route count mismatch')
check(routes.filter((route) => route.route !== '*' && route.robots === 'noindex,follow').length === manifest.counts?.noindex_routes, 'noindex route count mismatch')

const history = profiles.history
check(history?.assessment === 'known_p1_defects', 'historical History P1 profile assessment changed without profile migration')
check((history?.gaps?.length ?? 0) >= 5, 'historical History P1 profile gaps are incomplete')
check(profiles.watchlist?.assessment === 'complete_for_v1_contract', 'Watchlist completion assessment changed')
check(profiles.static_legal?.assessment === 'complete_current_contract', 'R12A static legal profile must be production accepted')
check((profiles.static_legal?.gaps?.length ?? -1) === 0, 'R12A static legal profile must have no remaining acceptance gap')

const gaps = load(manifest.gap_file)
check(gaps.schema === 'viewloom-public-surface-gaps-v1', 'gap schema mismatch')
check(gaps.missing_surfaces?.length === 0, 'current missing surfaces must remain empty')
check(gaps.candidate_surfaces?.length === 0, 'R12A candidate surfaces must be cleared after production acceptance')
for (const route of ['/contact/', '/terms/', '/privacy/', '/refund-policy/', '/commercial-disclosure/']) {
  check(gaps.resolved_surfaces?.some((item) => item.route === route && item.state === 'resolved'), `resolved R12A surface not recorded: ${route}`)
}
check(gaps.historical_missing_surface_baseline?.count === 5, 'historical P8B missing-surface baseline count changed')
check(gaps.cross_route_gaps?.some((item) => item.id === 'watchlist-public-readiness-omission' && item.state === 'resolved'), 'Watchlist readiness resolution missing')
check(gaps.cross_route_gaps?.some((item) => item.id === 'production-smoke-omissions' && item.state === 'resolved'), 'Production Smoke resolution missing')
check(gaps.cross_route_gaps?.some((item) => item.id === 'policy-surfaces-missing' && item.state === 'resolved' && item.resolved_phase === 'R12A'), 'R12A policy surface gap must be resolved')

const r12a = load('docs/audits/r12a-production-acceptance.json')
check(r12a.schema === 'viewloom-r12a-production-acceptance-v1', 'R12A acceptance schema mismatch')
check(r12a.status === 'complete' && r12a.result === 'pass', 'R12A production acceptance did not pass')
check(r12a.expected_main_sha === r12a.deployed_sha, 'R12A expected/deployed SHA mismatch')
check(r12a.expected_main_sha === '952f0008209363f4fd5b22587975ac247ee8d6f2', 'R12A accepted SHA changed')
check(r12a.counts?.html_routes === 25, 'R12A production route count mismatch')
check(r12a.counts?.provider_crossing_failures === 0, 'R12A provider crossing failure')
check(r12a.counts?.blocking_alerts === 0, 'R12A blocking monitoring alert')

if (fail.length) {
  console.error('Public surface inventory verification failed:')
  fail.forEach((message) => console.error(`- ${message}`))
  process.exit(1)
}
console.log(`Public surface inventory verified: ${routes.length} routes, ${Object.keys(profiles).length} profiles, ${Object.keys(gates).length} gate groups.`)
console.log('- 25 Vite HTML inputs plus explicit 404 are owned')
console.log('- Public Readiness and Production Smoke each own all 25 HTML routes')
console.log('- five R12A legal/support routes are production accepted and resolved')
console.log('- Twitch and Kick bindings remain separate')
console.log('- historical P8B missing-surface evidence remains locked separately')

function tag(html, name) { return html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim() ?? '' }
function attr(tagSource, name) { return tagSource.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '' }
function meta(html, key, value) { return (html.match(/<meta\b[^>]*>/gi) ?? []).map((item) => ({ item, match: attr(item, key) })).find((item) => item.match.toLowerCase() === value.toLowerCase()) ? attr((html.match(/<meta\b[^>]*>/gi) ?? []).find((item) => attr(item, key).toLowerCase() === value.toLowerCase()) ?? '', 'content') : '' }
function link(html, rel) { return attr((html.match(/<link\b[^>]*>/gi) ?? []).find((item) => attr(item, 'rel').toLowerCase().split(/\s+/).includes(rel)) ?? '', 'href') }
function decode(value) { return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>') }
function normalizeRoute(value) { const clean = value.replace(/\/index\.html$/, '/'); return clean === '' || clean === '/' ? '/' : `/${clean.replace(/^\/+|\/+$/g, '')}/` }
