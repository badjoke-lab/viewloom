import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contract = json('docs/audits/kick-stream-map-k4-cutover-contract-2026-09-06.json')
const preactivation = json('docs/audits/kick-stream-map-k4-preactivation-readiness-2026-09-06.json')
const adapterSource = read('apps/web/functions/api/kick-stream-map-public-adapter-core.mjs')
const runtimeSource = read('apps/web/functions/api/kick-stream-map-country-runtime-core.mjs')
const routeSource = read('apps/web/functions/api/kick-stream-map.ts')
const viteSource = read('apps/web/vite.config.ts')
const providerHomeSource = read('apps/web/src/provider-home-shell.ts')
const sitemapSource = read('apps/web/public/sitemap.xml')
const kickRoutes = json('docs/audits/public-surface-routes-kick.json')
const inventory = json('docs/audits/public-surface-inventory.json')

assert.equal(contract.schemaVersion, 'viewloom-kick-stream-map-k4-cutover-contract-v0.1')
assert.equal(contract.status, 'frozen_not_authorized')
assert.equal(contract.provider, 'kick')
assert.equal(contract.geography, 'country')
assert.equal(contract.auditedMain, '2e169faef9052c3c6e5ec3e768cec01b6de1a878')
assert.equal(contract.authorization.k4PublicActivationAuthorized, false)
assert.equal(contract.authorization.thisContractAuthorizesActivation, false)
for (const [key, value] of Object.entries(contract.authorization)) {
  assert.equal(value, false, `${key} must remain false in the pre-cutover contract`)
}

assert.equal(preactivation.status, 'prerequisites_complete_activation_not_authorized')
assert.deepEqual(preactivation.currentGate.blockers, ['public_country_activation_not_authorized'])
assert.equal(preactivation.currentGate.publicKickMapPage, 'absent')
assert.equal(preactivation.currentGate.productionViteInput, 'absent')

assert.equal(existsSync('apps/web/kick/map'), false)
assert.equal(existsSync('apps/web/kick/map/index.html'), false)
assert.equal(existsSync('apps/web/src/features/kick-stream-map/public-entry.ts'), false)
assert.equal(viteSource.includes("kickMap: 'kick/map/index.html'"), false)
assert.equal(sitemapSource.includes('https://www.viewloom.net/kick/map/'), false)
assert.equal(providerHomeSource.includes("'Stream Map'"), false)
assert.equal(adapterSource.includes('publicActivationAuthorized: false'), true)
assert.equal(runtimeSource.includes("'public_country_activation_not_authorized'"), true)
assert.equal(routeSource.includes('buildKickStreamMapCountryRuntime'), true)

const routeList = Array.isArray(kickRoutes.routes) ? kickRoutes.routes : []
assert.equal(routeList.some((route) => route?.path === '/kick/map/'), false)
assert.equal(inventory.counts.vite_html_inputs, 26)
assert.equal(inventory.counts.inventory_entries, 27)
assert.equal(inventory.counts.indexable_routes, 22)
assert.equal(inventory.counts.sitemap_routes, 22)
assert.equal(inventory.counts.current_browser_required_viewports, 4)
assert.equal(inventory.counts.current_browser_scenarios, 104)

const requiredRuntimePaths = contract.requiredRuntimeChanges.map((row) => row.path)
assert.deepEqual(requiredRuntimePaths, [
  'apps/web/functions/api/kick-stream-map-public-adapter-core.mjs',
  'apps/web/functions/api/kick-stream-map-country-runtime-core.mjs',
  'apps/web/functions/api/kick-stream-map.ts',
])

const requiredPublicSurfacePaths = contract.requiredPublicSurfaceChanges.map((row) => row.path)
assert.deepEqual(requiredPublicSurfacePaths, [
  'apps/web/kick/map/index.html',
  'apps/web/src/features/kick-stream-map/public-entry.ts',
  'apps/web/vite.config.ts',
  'apps/web/src/provider-home-shell.ts',
  'apps/web/public/sitemap.xml',
])

const acceptancePaths = contract.requiredAcceptanceAndInventoryChanges.map((row) => row.path)
for (const required of [
  'scripts/verify-kick-stream-map-country-public-readiness.mjs',
  'scripts/verify-kick-stream-map-k4-preactivation-readiness.mjs',
  '.github/workflows/kick-stream-map-country-public-readiness.yml',
  '.github/workflows/kick-stream-map-production-api-smoke.yml',
  'docs/audits/public-surface-routes-kick.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-profiles-analysis.json',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
  'scripts/verify-public-current-browser-audit.mjs',
  '.github/workflows/production-smoke.yml',
]) {
  assert.ok(acceptancePaths.includes(required), `missing K4 acceptance path: ${required}`)
}

const allAllowedPaths = [
  ...requiredRuntimePaths,
  ...requiredPublicSurfacePaths,
  ...acceptancePaths,
]
for (const prefix of contract.forbiddenMutationPrefixes) {
  assert.equal(allAllowedPaths.some((path) => path.startsWith(prefix)), false, `K4 cutover list must not include ${prefix}`)
}
for (const path of contract.forbiddenMutationExactPaths) {
  assert.equal(allAllowedPaths.includes(path), false, `K4 cutover list must not include ${path}`)
}

assert.deepEqual(contract.expectedPublicInventoryAfterCutover, {
  viteHtmlInputs: 27,
  inventoryEntriesIncluding404: 28,
  indexableRoutes: 23,
  sitemapRoutes: 23,
  browserViewports: 4,
  browserScenarios: 108,
})

assert.deepEqual(contract.postCutoverRequiredInvariants, {
  provider: 'kick',
  stableIdentity: 'broadcaster_user_id',
  slugIsStableIdentity: false,
  stableIdentityPublished: false,
  twitchEvidenceReuseAllowed: false,
  providerAggregationAllowed: false,
  cityInferenceAllowed: false,
  currentLocationPromotionAllowed: false,
  creatorCoordinatesAllowed: false,
  demoGeographyAllowed: false,
  reconciliationRequired: true,
})

assert.deepEqual(contract.currentPreactivationState, {
  publicActivationAuthorized: false,
  publicKickMapPage: 'absent',
  productionViteInput: 'absent',
  publicKickMapSitemapEntry: 'absent',
  publicKickMapProviderHomeTarget: 'absent',
  blocker: 'public_country_activation_not_authorized',
})

console.log(JSON.stringify({
  ok: true,
  schemaVersion: contract.schemaVersion,
  requiredRuntimeChanges: requiredRuntimePaths.length,
  requiredPublicSurfaceChanges: requiredPublicSurfacePaths.length,
  requiredAcceptanceAndInventoryChanges: acceptancePaths.length,
  expectedPublicInventoryAfterCutover: contract.expectedPublicInventoryAfterCutover,
  currentBlocker: contract.currentPreactivationState.blocker,
  k4Authorized: contract.authorization.k4PublicActivationAuthorized,
}, null, 2))
