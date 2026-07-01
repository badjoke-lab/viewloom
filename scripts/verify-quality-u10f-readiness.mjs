import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/work-in-progress/u10f-readiness.md',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
  'apps/web/scripts/public-readiness-audit.mjs',
  'apps/web/scripts/quality-u10f-readiness-browser.mjs',
  'apps/web/src/live/channel-profile.ts',
  'apps/web/src/channel-profile.css',
  'apps/web/twitch/channel/index.html',
  'apps/web/kick/channel/index.html',
  'scripts/verify-quality-u10f-readiness.mjs',
  'scripts/verify-quality-u10f-browser-evidence.mjs',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/quality-u10f-readiness.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

const note = read('docs/work-in-progress/u10f-readiness.md')
for (const fragment of [
  'Status: active',
  'work-quality-u10f-readiness',
  'work-quality-u10g-architecture',
  'all 20 repository-owned HTML routes',
  'Production Smoke owns 20 repository-owned HTML routes',
  'Missing-id entry makes zero Twitch or Kick History requests.',
  'APIs, D1 schemas, bindings, collectors, cron, retention, output schemas, localization runtime, and provider separation remain unchanged.',
]) assert.ok(note.includes(fragment), `U10F note missing ${fragment}`)

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.schema, 'viewloom-public-surface-inventory-v1')
assert.equal(inventory.counts.vite_html_inputs, 20)
assert.equal(inventory.counts.inventory_entries, 21)
assert.equal(inventory.counts.public_readiness_configured_pages, 20)
assert.equal(inventory.counts.production_smoke_page_routes, 20)
assert.equal(inventory.provider_invariants.separate_routes, true)
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const routeFiles = inventory.route_files
const routes = routeFiles.flatMap((path) => JSON.parse(read(path)).routes).filter((route) => route.route !== '*')
assert.equal(routes.length, 20)
assert.equal(routes.filter((route) => route.profile === 'watchlist').length, 2)
for (const route of ['/twitch/watchlist/', '/kick/watchlist/', '/twitch/channel/', '/kick/channel/']) {
  assert.ok(routes.some((item) => item.route === route), `public route inventory missing ${route}`)
}

const readiness = read('apps/web/scripts/public-readiness-audit.mjs')
for (const fragment of [
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
  ".filter((route) => route.route !== '*')",
  "watchlist_pages: pages.filter((page) => page.profile === 'watchlist').length",
  'separate_manual_provider_array: false',
]) assert.ok(readiness.includes(fragment), `public readiness ownership missing ${fragment}`)
assert.equal(readiness.includes('function providerPages'), false, 'manual public readiness provider array remains')

const smoke = read('.github/workflows/production-smoke.yml')
const smokeRoutes = [
  '/', '/about/', '/support/', '/changelog/',
  '/twitch/', '/twitch/heatmap/', '/twitch/day-flow/', '/twitch/battle-lines/', '/twitch/history/', '/twitch/channel/', '/twitch/watchlist/', '/twitch/status/',
  '/kick/', '/kick/heatmap/', '/kick/day-flow/', '/kick/battle-lines/', '/kick/history/', '/kick/channel/', '/kick/watchlist/', '/kick/status/',
]
for (const route of smokeRoutes) assert.ok(smoke.includes(`'${route}'`), `Production Smoke missing ${route}`)
assert.ok(smoke.includes('test "${#routes[@]}" = \'20\''), 'Production Smoke route count assertion missing')
for (const fragment of ['DB_TWITCH_HOT', 'DB_KICK_HOT', 'data-viewloom-not-found="v1"', 'cancel-in-progress: true']) {
  assert.ok(smoke.includes(fragment), `Production Smoke lost ${fragment}`)
}

for (const [provider, path] of [['twitch', 'apps/web/twitch/channel/index.html'], ['kick', 'apps/web/kick/channel/index.html']]) {
  const html = read(path)
  const providerName = provider === 'kick' ? 'Kick' : 'Twitch'
  for (const fragment of [
    'data-channel-entry="loading"',
    'data-channel-missing-entry hidden',
    'data-channel-missing-action',
    `href="/${provider}/history/">Open ${providerName} History`,
    'data-channel-requires-id',
  ]) assert.ok(html.includes(fragment), `${path}: missing ${fragment}`)
  const other = provider === 'twitch' ? '/kick/history/' : '/twitch/history/'
  const missingEntry = html.match(/<section class="surface channel-missing-entry"[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.equal(missingEntry.includes(other), false, `${path}: missing entry crosses provider`)
  assert.equal((missingEntry.match(/<(?:a|button|input|select|textarea)\b/g) ?? []).length, 1, `${path}: missing entry must contain one action`)
}

const channel = read('apps/web/src/live/channel-profile.ts')
for (const fragment of [
  'if (!state.channelId) return renderMissingId()',
  'setChannelEntryMode(true)',
  'setChannelEntryMode(false)',
  "document.body.dataset.channelEntry = missing ? 'missing-id' : 'ready'",
  "node.setAttribute('inert', '')",
  "node.setAttribute('aria-hidden', 'true')",
  "Select a ${providerName} channel from History",
]) assert.ok(channel.includes(fragment), `Channel missing-id ownership missing ${fragment}`)

const css = read('apps/web/src/channel-profile.css')
for (const fragment of [
  '.channel-missing-entry',
  'min-height:48px',
  'body[data-channel-entry="missing-id"] [data-channel-requires-id]{display:none!important}',
]) assert.ok(css.includes(fragment), `Channel missing-id CSS missing ${fragment}`)

const browser = read('apps/web/scripts/quality-u10f-readiness-browser.mjs')
for (const fragment of [
  "schema: 'viewloom-quality-u10f-readiness-browser-v1'",
  '{ width: 1440', '{ width: 820', '{ width: 390', '{ width: 360',
  "for (const provider of ['twitch', 'kick'])",
  'assert.equal(evidence.scenarios.length, 8)',
  'assert.equal(calls.twitchHistory, 0',
  'assert.equal(calls.kickHistory, 0',
  'assert.equal(state.missingActionCount, 1',
  'assert.ok(state.actionHeight >= 48',
  'assert.equal(state.visibleRequiresId, 0',
]) assert.ok(browser.includes(fragment), `U10F browser acceptance missing ${fragment}`)

for (const [path, fragments] of [
  ['README.md', ['Phase 10 U10F readiness               active', 'Active implementation branch          work-quality-u10f-readiness', 'Exact next branch after U10F          work-quality-u10g-architecture']],
  ['docs/README.md', ['Phase 10 U10F readiness                          active', 'Active implementation branch                    work-quality-u10f-readiness', 'Exact next implementation branch                work-quality-u10g-architecture']],
  ['AGENTS.md', ['U10F readiness active', 'Active implementation branch: work-quality-u10f-readiness', 'Exact next branch: work-quality-u10g-architecture']],
  ['CONTRIBUTING.md', ['Phase 10 U10F readiness active', 'Active implementation branch: work-quality-u10f-readiness', 'Exact next implementation branch: work-quality-u10g-architecture']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10F readiness active', 'Active implementation branch: work-quality-u10f-readiness', 'Exact next branch: work-quality-u10g-architecture']],
  ['docs/product/current-schedule.md', ['U10F readiness active', 'Active branch: work-quality-u10f-readiness', 'Next branch: work-quality-u10g-architecture', 'U10F missing-id browser scenarios: 8']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10F readiness', 'Current implementation branch: `work-quality-u10f-readiness`', 'Exact next implementation branch: `work-quality-u10g-architecture`']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: `work-quality-u10f-readiness`', 'Active phase: U10F public readiness and Channel entry', 'Exact next branch: `work-quality-u10g-architecture`']],
]) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const workflow = read('.github/workflows/quality-u10f-readiness.yml')
for (const fragment of [
  'name: Quality U10F Public Readiness',
  'Verify U10F repository contract',
  'Run Public Readiness audit',
  'Run U10F browser acceptance',
  'Verify U10F browser evidence',
  'cancel-in-progress: true',
]) assert.ok(workflow.includes(fragment), `U10F workflow missing ${fragment}`)

console.log('U10F public readiness repository verification passed.')
console.log('- Public Readiness derives 20 routes from the route inventory')
console.log('- Production Smoke owns 20 repository HTML routes')
console.log('- Channel missing-id entry has one provider-safe action and zero History requests')
