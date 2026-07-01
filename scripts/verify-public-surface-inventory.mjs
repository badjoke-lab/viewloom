import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const fail = []
const check = (value, message) => { if (!value) fail.push(message) }
const load = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'))
const exists = (path) => existsSync(join(root, path))

const manifestPath = 'docs/audits/public-surface-inventory.json'
const manifest = load(manifestPath)
check(manifest.schema === 'viewloom-public-surface-inventory-v1', 'manifest schema mismatch')
check(manifest.next_branch === 'work-public-browser-audit', 'historical next branch must remain work-public-browser-audit')
check(manifest.provider_invariants?.twitch_binding === 'DB_TWITCH_HOT', 'Twitch binding mismatch')
check(manifest.provider_invariants?.kick_binding === 'DB_KICK_HOT', 'Kick binding mismatch')
check(manifest.provider_invariants?.combined_totals_allowed === false, 'combined totals must remain forbidden')
check(manifest.provider_invariants?.combined_rankings_allowed === false, 'combined rankings must remain forbidden')
check(manifest.counts?.public_readiness_configured_pages === 20, 'Public Readiness must own 20 HTML routes')
check(manifest.counts?.production_smoke_page_routes === 20, 'Production Smoke must own 20 HTML routes')

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

const history = profiles.history
check(history?.assessment === 'known_p1_defects', 'historical History P1 profile assessment changed without profile migration')
check((history?.gaps?.length ?? 0) >= 5, 'historical History P1 profile gaps are incomplete')
const watchlist = profiles.watchlist
check(watchlist?.assessment === 'complete_for_v1_contract', 'Watchlist completion assessment changed')

const gaps = load(manifest.gap_file)
check(gaps.schema === 'viewloom-public-surface-gaps-v1', 'gap schema mismatch')
for (const route of ['/contact/', '/terms/', '/privacy/', '/refund-policy/', '/commercial-disclosure/']) {
  check(gaps.missing_surfaces?.some((item) => item.route === route && item.state === 'missing'), `missing surface not recorded: ${route}`)
}
for (const id of ['watchlist-public-readiness-omission', 'production-smoke-omissions']) {
  check(gaps.cross_route_gaps?.some((item) => item.id === id && item.state === 'resolved' && item.resolved_phase === 'U10F'), `U10F resolution not recorded: ${id}`)
}
check(gaps.cross_route_gaps?.some((item) => item.id === 'no-consolidated-public-browser-matrix'), 'historical browser matrix record missing')
check(gaps.cross_route_gaps?.some((item) => item.id === 'history-known-p1'), 'historical History record missing')
check(gaps.cross_route_gaps?.some((item) => item.id === 'policy-surfaces-missing' && item.state === 'open'), 'policy surface gap must remain open')

if (fail.length) {
  console.error('Public surface inventory verification failed:')
  fail.forEach((message) => console.error(`- ${message}`))
  process.exit(1)
}
console.log(`Public surface inventory verified: ${routes.length} routes, ${Object.keys(profiles).length} profiles, ${Object.keys(gates).length} gate groups.`)
console.log('- 20 Vite HTML inputs plus explicit 404 are owned')
console.log('- Public Readiness and Production Smoke each own all 20 HTML routes')
console.log('- Twitch and Kick bindings remain separate')
console.log('- U10F readiness ownership gaps are resolved; policy surfaces remain open')

function tag(html, name) { return html.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1]?.trim() ?? '' }
function attr(tagSource, name) { return tagSource.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))?.[1] ?? '' }
function meta(html, key, value) { return (html.match(/<meta\b[^>]*>/gi) ?? []).map((item) => ({ item, match: attr(item, key) })).find((item) => item.match.toLowerCase() === value.toLowerCase()) ? attr((html.match(/<meta\b[^>]*>/gi) ?? []).find((item) => attr(item, key).toLowerCase() === value.toLowerCase()) ?? '', 'content') : '' }
function link(html, rel) { return attr((html.match(/<link\b[^>]*>/gi) ?? []).find((item) => attr(item, 'rel').toLowerCase().split(/\s+/).includes(rel)) ?? '', 'href') }
function decode(value) { return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>') }
function normalizeRoute(value) { const clean = value.replace(/\/index\.html$/, '/'); return clean === '' || clean === '/' ? '/' : `/${clean.replace(/^\/+|\/+$/g, '')}/` }
