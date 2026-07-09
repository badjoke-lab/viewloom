import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const readJson = (path) => JSON.parse(read(path))
const mustInclude = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) {
    assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
  }
  return source
}

const contractPath = 'docs/audits/r12c3-release-candidate-contract.json'
const contract = readJson(contractPath)

assert.equal(contract.schema, 'viewloom-r12c3-release-candidate-contract-v1')
assert.equal(contract.phase, 'Phase 12')
assert.equal(contract.workstream, 'R12C-3')
assert.equal(contract.status, 'active')
assert.equal(contract.branch, 'work-release-r12c3-release-candidate-acceptance')
assert.equal(contract.baseMainSha, '13975969a077bbbf9979253e6ee4570b1e20aa4a')
assert.equal(contract.releaseOrigin, 'https://vl.badjoke-lab.com')

assert.deepEqual(contract.candidateContract, {
  htmlRoutes: 25,
  inventoryEntries: 26,
  browserViewports: 4,
  browserScenarios: 100,
  sitemapRoutes: 21,
  providers: ['twitch', 'kick'],
  combinedTotalsAllowed: false,
  combinedRankingsAllowed: false,
})

const requiredChecks = [
  'full_web_typecheck',
  'production_build',
  'public_surface_inventory',
  'public_readiness',
  'public_browser_audit_100_scenarios',
  'responsive_accessibility',
  'provider_separation',
  'legal_support_direct_links',
  'outbound_support_payment_links',
  'metadata_canonical_sitemap',
  'exact_production_sha_smoke',
]
assert.deepEqual(contract.requiredChecks, requiredChecks)
for (const check of requiredChecks) {
  assert.ok(contract.ownership[check], `missing ownership for ${check}`)
}
assert.equal(contract.ownership.full_web_typecheck.command, 'pnpm typecheck:web')
assert.equal(contract.ownership.production_build.command, 'pnpm build:web')
assert.equal(contract.ownership.public_browser_audit_100_scenarios.workflow, 'Public Browser Audit')
assert.equal(contract.ownership.responsive_accessibility.workflow, 'Quality U10E Responsive Accessibility')
assert.equal(contract.ownership.exact_production_sha_smoke.workflow, 'Production Smoke')
assert.equal(contract.postmergeBoundary.candidateMergeDoesNotCompletePhase12, true)
assert.equal(contract.postmergeBoundary.exactMainShaProductionSmokeRequired, true)
assert.equal(contract.postmergeBoundary.permanentReleaseAcceptanceRequired, true)
assert.equal(contract.postmergeBoundary.temporaryPhase12WorkingNoteMustBeRetired, true)
assert.equal(contract.postmergeBoundary.canonicalNextAfterCloseout, 'Phase 12A Analytics Capture Foundation')

for (const path of contract.permanentPrerequisites) {
  assert.equal(existsSync(path), true, `missing permanent prerequisite ${path}`)
}

const inventory = readJson('docs/audits/public-surface-inventory.json')
assert.equal(inventory.schema, 'viewloom-public-surface-inventory-v1')
assert.equal(inventory.counts.vite_html_inputs, contract.candidateContract.htmlRoutes)
assert.equal(inventory.counts.inventory_entries, contract.candidateContract.inventoryEntries)
assert.equal(inventory.counts.current_browser_required_viewports, contract.candidateContract.browserViewports)
assert.equal(inventory.counts.current_browser_scenarios, contract.candidateContract.browserScenarios)
assert.equal(inventory.counts.sitemap_routes, contract.candidateContract.sitemapRoutes)
assert.equal(inventory.provider_invariants.separate_routes, true)
assert.equal(inventory.provider_invariants.twitch_binding, 'DB_TWITCH_HOT')
assert.equal(inventory.provider_invariants.kick_binding, 'DB_KICK_HOT')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)
assert.equal(inventory.provider_invariants.coverage_claim, 'bounded observed data only')

const portalRoutes = readJson('docs/audits/public-surface-routes-portal.json')
assert.equal(portalRoutes.schema, 'viewloom-public-surface-routes-v1')
assert.equal(portalRoutes.group, 'portal')
const portalRouteMap = new Map(portalRoutes.routes.map((entry) => [entry.route, entry]))
for (const route of [
  '/support/',
  '/contact/',
  '/terms/',
  '/privacy/',
  '/refund-policy/',
  '/commercial-disclosure/',
]) {
  const entry = portalRouteMap.get(route)
  assert.ok(entry, `portal route inventory missing ${route}`)
  assert.equal(entry.provider, 'portal', `${route}: wrong provider`)
  assert.equal(entry.robots, 'index,follow', `${route}: wrong robots contract`)
  assert.equal(entry.sitemap, true, `${route}: missing sitemap ownership`)
  assert.equal(entry.canonical, `https://vl.badjoke-lab.com${route}`, `${route}: canonical mismatch`)
}

const support = mustInclude('apps/web/support/index.html', [
  '<link rel="canonical" href="https://vl.badjoke-lab.com/support/" />',
  'https://buy.stripe.com/',
  'target="_blank"',
  'rel="noreferrer"',
  'href="/refund-policy/"',
  'href="/commercial-disclosure/"',
  'href="/contact/"',
  'Payment processing takes place on a Stripe-hosted page.',
])
assert.equal(/donat(e|ion)/i.test(support), false, 'support page must not use donation framing')

const sitemap = read('apps/web/public/sitemap.xml')
const sitemapRouteCount = (sitemap.match(/<url>/g) || []).length
assert.equal(sitemapRouteCount, contract.candidateContract.sitemapRoutes)
for (const route of [
  '/', '/about/', '/support/', '/contact/', '/terms/', '/privacy/',
  '/refund-policy/', '/commercial-disclosure/',
  '/twitch/', '/twitch/heatmap/', '/twitch/day-flow/', '/twitch/battle-lines/', '/twitch/history/', '/twitch/status/',
  '/kick/', '/kick/heatmap/', '/kick/day-flow/', '/kick/battle-lines/', '/kick/history/', '/kick/status/',
]) {
  assert.ok(sitemap.includes(`<loc>https://vl.badjoke-lab.com${route}</loc>`), `sitemap missing ${route}`)
}

mustInclude('.github/workflows/public-browser-audit.yml', [
  '25 routes x 4 required widths = 100 scenarios',
  'Typecheck web application',
  'Build web application',
  'Run current candidate public browser matrix',
  'Verify current candidate browser evidence',
  'node scripts/public-current-browser-audit.mjs',
  'node scripts/verify-public-current-browser-audit.mjs',
])

mustInclude('.github/workflows/public-readiness-audit.yml', [
  'pnpm build:web',
  'node scripts/public-readiness-audit.mjs',
  'Verify linked changelog data',
  'Verify explicit not-found page',
  'Verify deployment metadata',
])

const productionSmoke = mustInclude('.github/workflows/production-smoke.yml', [
  'name: Production Smoke',
  'expected="$GITHUB_SHA"',
  'deployment.json?attempt=$attempt',
  'deployed" = "$expected"',
  'environment" = "production"',
  'branch" = "main"',
  "test \"${#routes[@]}\" = '25'",
  '.storage.binding == "DB_TWITCH_HOT"',
  '.storage.database == "vl_twitch_hot"',
  '.storage.binding == "DB_KICK_HOT"',
  '.storage.database == "vl_kick_hot"',
  'sourceMode == "real"',
  'sourceMode == "authenticated"',
  'freshness.isStale == false',
  'Verify explicit not-found behavior',
])
assert.ok(productionSmoke.includes('Repository-owned HTML routes: 25 checked'))
assert.ok(productionSmoke.includes('Separate D1 bindings: checked'))
assert.ok(productionSmoke.includes('Collector freshness: checked'))

const r12a = readJson('docs/audits/r12a-production-acceptance.json')
assert.equal(r12a.status, 'complete')
assert.equal(r12a.result, 'pass')
assert.equal(r12a.expected_main_sha, r12a.deployed_sha)
assert.equal(r12a.counts.html_routes, 25)
assert.equal(r12a.counts.provider_crossing_failures, 0)
assert.equal(r12a.counts.blocking_alerts, 0)

const r12b = readJson('docs/audits/r12b-evidence-and-configuration-audit.json')
assert.equal(r12b.status, 'complete')
assert.equal(r12b.workstream, 'R12B-0')
assert.equal(r12b.completion_gate.r12b_0_complete, true)
assert.equal(r12b.consistency_review.unsupported_dashboard_state_claims_detected, false)
assert.equal(r12b.consistency_review.charitable_donation_wording_detected, false)

const r12c0 = readJson('docs/audits/r12c0-message-inventory.json')
assert.equal(r12c0.status, 'complete')
assert.equal(r12c0.workstream, 'R12C-0')
assert.equal(r12c0.completion.r12c0_complete, true)

const r12c1 = readJson('docs/audits/r12c1-launch-copy-package.json')
assert.equal(r12c1.schema, 'viewloom-r12c1-launch-copy-package-v1')
assert.equal(r12c1.status, 'complete')
assert.equal(r12c1.feature_roles.length, 7)
assert.equal(r12c1.faq.length, 12)
assert.equal(r12c1.completion.r12c1_complete, true)

const r12c2Capture = readJson('docs/audits/r12c2-launch-assets-capture.json')
assert.equal(r12c2Capture.schema, 'viewloom-r12c2-launch-assets-capture-v1')
assert.equal(r12c2Capture.result, 'pass')
assert.equal(r12c2Capture.assets.length, 6)
assert.equal(r12c2Capture.violations.length, 0)

const r12c2Manifest = readJson('docs/audits/r12c2-launch-asset-manifest.json')
assert.equal(r12c2Manifest.schema, 'viewloom-r12c2-launch-asset-manifest-v1')
assert.equal(r12c2Manifest.assetCount, 6)
assert.equal(r12c2Manifest.assets.length, 6)
assert.equal(r12c2Manifest.capture.result, 'pass')
assert.equal(r12c2Manifest.packageVerification.result, 'pass')

for (const path of [
  'README.md',
  'docs/README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/work-in-progress/phase12-release-readiness.md',
]) {
  mustInclude(path, [
    'R12C-2',
    'complete',
    'R12C-3',
    'active',
    'work-release-r12c3-release-candidate-acceptance',
  ])
}

console.log(JSON.stringify({
  result: 'pass',
  schema: contract.schema,
  branch: contract.branch,
  baseMainSha: contract.baseMainSha,
  requiredChecks: contract.requiredChecks.length,
  htmlRoutes: contract.candidateContract.htmlRoutes,
  browserScenarios: contract.candidateContract.browserScenarios,
  sitemapRoutes: contract.candidateContract.sitemapRoutes,
  postmergeExactShaSmokeRequired: contract.postmergeBoundary.exactMainShaProductionSmokeRequired,
}, null, 2))
