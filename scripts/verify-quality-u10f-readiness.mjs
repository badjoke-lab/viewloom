import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/audits/cross-site-quality-u10f-readiness.json',
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
assert.equal(existsSync(join(root, 'docs/work-in-progress/u10f-readiness.md')), false, 'temporary U10F working note remains')

const record = JSON.parse(read('docs/audits/cross-site-quality-u10f-readiness.json'))
assert.equal(record.schema, 'viewloom-cross-site-quality-u10f-readiness-v1')
assert.equal(record.phase, 'U10F')
assert.equal(record.status, 'complete')
assert.equal(record.implementation_pr, 468)
assert.equal(record.implementation_head, 'cf655ace5f61e9b70552afefcd26ddceda76a253')
assert.equal(record.merge_commit, '5884c2335a66b4fdf9acf5223a4d3843eaafadb1')
assert.equal(record.canonical_closeout_pr, 469)
assert.deepEqual(record.scope.providers, ['twitch', 'kick'])
assert.equal(record.scope.public_readiness_routes, 20)
assert.equal(record.scope.production_smoke_routes, 20)
assert.equal(record.scope.channel_missing_id_routes, 2)
assert.deepEqual(record.scope.viewports, [1440, 820, 390, 360])
assert.equal(record.scope.total_browser_scenarios, 8)
assert.equal(record.readiness_contract.route_inventory_is_authority, true)
assert.equal(record.readiness_contract.separate_manual_provider_array, false)
assert.equal(record.readiness_contract.watchlist_routes_required, 2)
assert.equal(record.readiness_contract.production_smoke_route_count_asserted, 20)
assert.equal(record.readiness_contract.provider_status_checks_retained, true)
assert.equal(record.readiness_contract.separate_d1_binding_checks_retained, true)
assert.equal(record.readiness_contract.collector_freshness_checks_retained, true)
assert.equal(record.readiness_contract.explicit_404_checks_retained, true)
assert.equal(record.readiness_contract.production_acceptance_claimed, false)
assert.equal(record.readiness_contract.production_acceptance_owner, 'U10H')
assert.equal(record.channel_entry_contract.history_requests_without_channel_id, 0)
assert.equal(record.channel_entry_contract.primary_actions_per_route, 1)
assert.equal(record.channel_entry_contract.provider_safe_history_action, true)
assert.equal(record.channel_entry_contract.irrelevant_regions_hidden, true)
assert.equal(record.channel_entry_contract.irrelevant_regions_inert, true)
assert.equal(record.channel_entry_contract.important_action_floor_px, 48)
assert.equal(record.channel_entry_contract.page_horizontal_overflow_px, 0)
assert.equal(record.channel_entry_contract.visible_focus_required, true)
assert.equal(record.browser_evidence.run_id, 28519749704)
assert.equal(record.browser_evidence.artifact_id, 8010896825)
assert.equal(record.browser_evidence.artifact_digest, 'sha256:e56238d94c0fa08a6e02a782ad58bce6e4a90d7233f9c2ac7e74677cfa2e0240')
assert.equal(record.browser_evidence.result, 'pass')
assert.equal(record.browser_evidence.scenarios, 8)
for (const key of ['history_request_failures', 'provider_crossing_failures', 'primary_action_count_failures', 'important_action_failures', 'focus_failures', 'hidden_region_failures', 'inert_region_failures', 'horizontal_overflow_failures']) {
  assert.equal(record.browser_evidence[key], 0, `U10F browser failure count changed: ${key}`)
}
assert.equal(record.verification.result, 'pass')
assert.equal(record.boundary.provider_separation_required, true)
for (const key of ['api_change_authorized', 'storage_change_authorized', 'binding_change_authorized', 'collector_change_authorized', 'cron_change_authorized', 'retention_change_authorized', 'output_schema_change_authorized', 'localization_runtime_change_authorized', 'provider_combination_authorized', 'channel_search_authorized']) {
  assert.equal(record.boundary[key], false, `U10F boundary changed: ${key}`)
}
assert.equal(record.exact_next_branch, 'work-quality-u10g-architecture')
assert.equal(record.next_branch_created, false)

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
  "schema: 'viewloom-public-readiness-v1'",
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
  ['README.md', ['Phase 10 U10F readiness               complete PR #468', 'U10F canonical closeout               complete PR #469', 'Active implementation branch          none', 'Exact next implementation branch      work-quality-u10g-architecture']],
  ['docs/README.md', ['Phase 10 U10F readiness                          complete PR #468', 'U10F canonical closeout                          complete PR #469', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-u10g-architecture']],
  ['AGENTS.md', ['U10F implementation complete PR #468', 'U10F closeout complete PR #469', 'Active implementation branch: none', 'Exact next branch: work-quality-u10g-architecture']],
  ['CONTRIBUTING.md', ['Phase 10 U10F readiness complete through PR #468', 'U10F canonical closeout complete through PR #469', 'Active implementation branch: none', 'Exact next implementation branch: work-quality-u10g-architecture']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10F readiness complete PR #468', 'U10F canonical closeout complete PR #469', 'Active implementation branch: none', 'Exact next branch: work-quality-u10g-architecture']],
  ['docs/product/current-schedule.md', ['U10F readiness complete PR #468', 'U10F closeout complete PR #469', 'Active branch: none', 'Next branch: work-quality-u10g-architecture', 'U10F production acceptance: not claimed; owned by U10H']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10G architecture exact next', 'Current implementation branch: none', 'Exact next implementation branch: `work-quality-u10g-architecture`', 'Completed U10F canonical closeout: PR #469']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: none', 'Completed phase: U10F through PR #468', 'Completed canonical closeout: U10F through PR #469', 'Exact next branch: `work-quality-u10g-architecture`']],
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

console.log('Completed U10F public readiness verification passed.')
console.log('- permanent U10F evidence replaces the temporary working note')
console.log('- Public Readiness and Production Smoke each own 20 routes')
console.log('- Channel missing-id entry retains zero History requests and one provider-safe action')
console.log('- production acceptance remains owned by U10H')
