import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

for (const path of [
  'docs/audits/r12c3-release-candidate-contract.json',
  'docs/audits/r12c3-candidate-acceptance.json',
  'docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md',
  'docs/audits/phase12-release-acceptance.json',
  'docs/operations/phase12-release-acceptance-2026-07-09.md',
  'apps/web/support/index.html',
  'apps/web/public/sitemap.xml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
]) assert.equal(existsSync(path), true, `missing R12C-3 historical dependency: ${path}`)

const contract = json('docs/audits/r12c3-release-candidate-contract.json')
assert.equal(contract.schema, 'viewloom-r12c3-release-candidate-contract-v1')
assert.equal(contract.status, 'complete')
assert.equal(contract.result, 'pass')
assert.equal(contract.branch, 'work-release-r12c3-release-candidate-acceptance')
assert.equal(contract.baseMainSha, '13975969a077bbbf9979253e6ee4570b1e20aa4a')
assert.equal(contract.releaseOrigin, 'https://vl.badjoke-lab.com')
assert.equal(contract.candidateContract.htmlRoutes, 25)
assert.equal(contract.candidateContract.inventoryEntries, 26)
assert.equal(contract.candidateContract.browserViewports, 4)
assert.equal(contract.candidateContract.browserScenarios, 100)
assert.equal(contract.candidateContract.sitemapRoutes, 21)
assert.deepEqual(contract.candidateContract.providers, ['twitch', 'kick'])
assert.equal(contract.candidateContract.combinedTotalsAllowed, false)
assert.equal(contract.candidateContract.combinedRankingsAllowed, false)
assert.equal(contract.postmergeBoundary.closeoutSatisfied, true)

const candidate = json('docs/audits/r12c3-candidate-acceptance.json')
assert.equal(candidate.status, 'candidate_pass')
assert.equal(candidate.publicSurface.htmlRoutes, 25)
assert.equal(candidate.browser.scenarios, 100)
assert.equal(candidate.browser.violations, 0)
assert.equal(candidate.providerSeparation.combinedTotalsAllowed, false)
assert.equal(candidate.providerSeparation.combinedRankingsAllowed, false)
assert.equal(candidate.supportTransition.result, 'pass')
assert.equal(candidate.refundDisclosureConsistency.result, 'pass')

const release = json('docs/audits/phase12-release-acceptance.json')
assert.equal(release.status, 'complete')
assert.equal(release.result, 'pass')
assert.equal(release.expectedMainSha, '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8')
assert.equal(release.deployedSha, release.expectedMainSha)
assert.equal(release.deployment.matchesExpected, true)
assert.equal(release.counts.htmlRoutes, 25)
assert.equal(release.counts.statusApis, 2)
assert.equal(release.counts.sitemapRoutes, 21)
assert.equal(release.counts.launchAssets, 6)
assert.equal(release.counts.blockingAlerts, 0)
assert.deepEqual(release.failures, [])
assert.equal(release.nextWorkstream, 'Phase 12A Analytics Capture Foundation')

const support = read('apps/web/support/index.html')
assert.ok(support.includes('https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'))
assert.ok(support.includes('href="/refund-policy/"'))
assert.ok(support.includes('href="/commercial-disclosure/"'))
assert.ok(support.includes('href="/contact/"'))
assert.equal(/donat(e|ion)/i.test(support), false)

const sitemap = read('apps/web/public/sitemap.xml')
assert.equal((sitemap.match(/<url>/g) || []).length, 21)

const inventory = json('docs/audits/public-surface-inventory.json')
assert.equal(inventory.active_program, 'Phase 12A Analytics Capture Foundation')
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.provider_invariants.twitch_binding, 'DB_TWITCH_HOT')
assert.equal(inventory.provider_invariants.kick_binding, 'DB_KICK_HOT')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

assert.equal(existsSync('docs/work-in-progress/phase12-release-readiness.md'), false)
assert.equal(existsSync('.github/workflows/release-r12c3-release-candidate.yml'), false)

console.log(JSON.stringify({
  result: 'pass',
  schema: contract.schema,
  candidateStatus: candidate.status,
  productionReleaseStatus: release.status,
  deployedSha: release.deployedSha,
  htmlRoutes: release.counts.htmlRoutes,
  browserScenarios: candidate.browser.scenarios,
  nextWorkstream: release.nextWorkstream,
}, null, 2))
