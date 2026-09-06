import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contract = json('docs/audits/kick-stream-map-k4-cutover-contract-2026-09-06.json')
const preactivation = json('docs/audits/kick-stream-map-k4-preactivation-readiness-2026-09-06.json')
const adapterSource = read('apps/web/functions/api/kick-stream-map-public-adapter-core.mjs')
const runtimeSource = read('apps/web/functions/api/kick-stream-map-country-runtime-core.mjs')
const routeSource = read('apps/web/functions/api/kick-stream-map.ts')
const publicEntrySource = read('apps/web/src/features/kick-stream-map/public-entry.ts')
const publicPageSource = read('apps/web/kick/map/index.html')
const viteSource = read('apps/web/vite.config.ts')
const providerHomeSource = read('apps/web/src/provider-home-shell.ts')
const sitemapSource = read('apps/web/public/sitemap.xml')
const browserAuditSource = read('apps/web/scripts/public-current-browser-audit.mjs')
const kickRoutes = json('docs/audits/public-surface-routes-kick.json')
const inventory = json('docs/audits/public-surface-inventory.json')

// The frozen contract remains historical evidence and did not itself authorize
// activation. A separate explicit authorization was supplied after it was
// accepted; this verifier checks the resulting cutover against that contract.
assert.equal(contract.schemaVersion, 'viewloom-kick-stream-map-k4-cutover-contract-v0.1')
assert.equal(contract.status, 'frozen_not_authorized')
assert.equal(contract.provider, 'kick')
assert.equal(contract.geography, 'country')
assert.equal(contract.auditedMain, '2e169faef9052c3c6e5ec3e768cec01b6de1a878')
assert.equal(contract.authorization.k4PublicActivationAuthorized, false)
assert.equal(contract.authorization.thisContractAuthorizesActivation, false)
for (const [key, value] of Object.entries(contract.authorization)) {
  assert.equal(value, false, `${key} historical contract authorization changed`)
}

assert.equal(preactivation.status, 'prerequisites_complete_activation_not_authorized')
assert.deepEqual(preactivation.currentGate.blockers, ['public_country_activation_not_authorized'])
assert.equal(preactivation.currentGate.publicKickMapPage, 'absent')
assert.equal(preactivation.currentGate.productionViteInput, 'absent')

assert.equal(existsSync('apps/web/kick/map/index.html'), true)
assert.equal(existsSync('apps/web/src/features/kick-stream-map/public-entry.ts'), true)
assert.equal(viteSource.includes("kickMap: 'kick/map/index.html'"), true)
assert.equal(sitemapSource.includes('https://www.viewloom.net/kick/map/'), true)
assert.equal(providerHomeSource.includes("'Stream Map'"), true)
assert.equal(providerHomeSource.includes("'map'"), true)
assert.equal(adapterSource.includes('publicActivationAuthorized = false'), true)
assert.equal(adapterSource.includes('publicActivationAuthorized: activationAuthorized'), true)
assert.equal(runtimeSource.includes("...(!activationAuthorized ? ['public_country_activation_not_authorized'] : [])"), true)
assert.equal(runtimeSource.includes('stableIdentityPublished: false'), true)
assert.equal(routeSource.includes('const K4_PUBLIC_ACTIVATION_AUTHORIZED = true'), true)
assert.ok((routeSource.match(/publicActivationAuthorized: K4_PUBLIC_ACTIVATION_AUTHORIZED/g)?.length ?? 0) >= 3)
assert.equal(publicEntrySource.includes("fetch('/api/kick-stream-map'"), true)
assert.equal(publicEntrySource.includes("buildKickCountryPreviewModel(payload, { allowGeography: readiness.canRenderCountryGeography })"), true)
assert.equal(publicPageSource.includes('data-kick-map-public'), true)
assert.equal(publicPageSource.includes('https://www.viewloom.net/kick/map/'), true)
assert.equal(browserAuditSource.includes('Kick Home missing authorized /kick/map/ entry'), true)

const routeList = Array.isArray(kickRoutes.routes) ? kickRoutes.routes : []
assert.equal(routeList.some((route) => route?.id === 'kick-map' && route?.route === '/kick/map/' && route?.profile === 'stream_map'), true)
assert.equal(inventory.counts.vite_html_inputs, 27)
assert.equal(inventory.counts.inventory_entries, 28)
assert.equal(inventory.counts.indexable_routes, 23)
assert.equal(inventory.counts.sitemap_routes, 23)
assert.equal(inventory.counts.current_browser_required_viewports, 4)
assert.equal(inventory.counts.current_browser_scenarios, 108)

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
  historicalContractAuthorized: contract.authorization.k4PublicActivationAuthorized,
  currentK4Authorized: true,
  requiredRuntimeChanges: requiredRuntimePaths.length,
  requiredPublicSurfaceChanges: requiredPublicSurfacePaths.length,
  requiredAcceptanceAndInventoryChanges: acceptancePaths.length,
  operationalAcceptanceAmendment: 'apps/web/scripts/public-current-browser-audit.mjs',
  expectedPublicInventoryAfterCutover: contract.expectedPublicInventoryAfterCutover,
  stableIdentityPublished: false,
}, null, 2))
