import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const roadmap = read('docs/product/current-roadmap.md')
const schedule = read('docs/product/current-schedule.md')
const program = read('docs/product/post-watchlist-program-plan.md')

for (const [path, source] of [
  ['roadmap', roadmap],
  ['schedule', schedule],
  ['program', program],
]) {
  for (const fragment of [
    'Phase 12A Analytics Capture Foundation',
    'PR #513',
    'category source audit',
    'storage design',
    'runtime capture',
    'Phase 15',
    'Phase 16',
  ]) assert.ok(source.includes(fragment), `${path} missing ${fragment}`)

  assert.equal(source.includes('Current workstream: 12A-0 current data and capacity baseline'), false, `${path}: stale 12A-0 current state`)
  assert.equal(source.includes('work-analytics-12a0-capacity-baseline'), false, `${path}: stale next branch`)
  assert.equal(source.includes('Production generation started no'), false, `${path}: stale generation state`)
}

assert.ok(roadmap.includes('12A-4 category source audit accepted PR #513'))
assert.ok(roadmap.includes('Current workstream 12A-4 provider-specific category storage design and budget gate'))
assert.ok(schedule.includes('12A-4-1 category storage design and budget gate       current'))
assert.ok(program.includes('Current workstream: 12A-4 provider-specific category storage design and budget gate'))

const messageInventory = JSON.parse(read('docs/audits/r12c0-message-inventory.json'))
assert.equal(messageInventory.status, 'complete')
assert.equal(messageInventory.workstream, 'R12C-0')
assert.equal(messageInventory.completion.r12c0_complete, true)

const launchPackage = JSON.parse(read('docs/audits/r12c1-launch-copy-package.json'))
assert.equal(launchPackage.status, 'complete')
assert.equal(launchPackage.workstream, 'R12C-1')
assert.equal(launchPackage.completion.r12c1_complete, true)
assert.equal(launchPackage.faq.length, 12)

const assetCapture = JSON.parse(read('docs/audits/r12c2-launch-assets-capture.json'))
assert.equal(assetCapture.schema, 'viewloom-r12c2-launch-assets-capture-v1')
assert.equal(assetCapture.phase, 'Phase 12')
assert.equal(assetCapture.workstream, 'R12C-2')
assert.equal(assetCapture.result, 'pass')
assert.equal(assetCapture.assets.length, 6)
assert.equal(assetCapture.violations.length, 0)

const assetManifest = JSON.parse(read('docs/audits/r12c2-launch-asset-manifest.json'))
assert.equal(assetManifest.schema, 'viewloom-r12c2-launch-asset-manifest-v1')
assert.equal(assetManifest.phase, 'Phase 12')
assert.equal(assetManifest.workstream, 'R12C-2')
assert.equal(assetManifest.capture.result, 'pass')
assert.equal(assetManifest.packageVerification.result, 'pass')
assert.equal(assetManifest.assetCount, 6)
assert.equal(assetManifest.assets.length, 6)

const candidate = JSON.parse(read('docs/audits/r12c3-candidate-acceptance.json'))
assert.equal(candidate.schema, 'viewloom-r12c3-candidate-acceptance-v1')
assert.equal(candidate.phase, 'Phase 12')
assert.equal(candidate.workstream, 'R12C-3')
assert.equal(candidate.status, 'candidate_pass')
assert.equal(candidate.browser.scenarios, 100)
assert.equal(candidate.browser.violations, 0)

const phase12 = JSON.parse(read('docs/audits/phase12-release-acceptance.json'))
assert.equal(phase12.schema, 'viewloom-phase12-release-acceptance-v1')
assert.equal(phase12.status, 'complete')
assert.equal(phase12.result, 'pass')
assert.equal(phase12.expectedMainSha, phase12.deployedSha)
assert.equal(phase12.counts.htmlRoutes, 25)
assert.equal(phase12.counts.statusApis, 2)
assert.equal(phase12.counts.sitemapRoutes, 21)
assert.equal(phase12.counts.launchAssets, 6)
assert.equal(phase12.counts.blockingAlerts, 0)
assert.equal(phase12.nextWorkstream, 'Phase 12A Analytics Capture Foundation')

const r12a = JSON.parse(read('docs/audits/r12a-production-acceptance.json'))
assert.equal(r12a.status, 'complete')
assert.equal(r12a.result, 'pass')
assert.equal(r12a.expected_main_sha, r12a.deployed_sha)
assert.equal(r12a.counts.html_routes, 25)
assert.equal(r12a.counts.provider_crossing_failures, 0)
assert.equal(r12a.counts.blocking_alerts, 0)

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.current_browser_required_viewports, 4)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.active_program, 'Phase 12A Analytics Capture Foundation')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const state = JSON.parse(read('docs/audits/12a2-current-gate-state.json'))
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v10')
assert.equal(state.status, '12a4_category_sources_accepted_storage_design_current')
assert.equal(state.generation.runtimeGenerationStarted, true)
assert.equal(state.categorySourceAudit.pr, 513)
assert.equal(state.categorySourceAudit.storageDesignAuthorized, true)
assert.equal(state.categorySourceAudit.runtimeCaptureAuthorized, false)
assert.equal(state.currentWorkstream.phase, '12A-4')
assert.equal(state.currentWorkstream.name, 'provider-specific category storage design and budget gate')
assert.equal(state.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(state.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(state.categoryCapture.combinedProviderRankingAllowed, false)

console.log('Current public-state handoff verification passed.')
console.log('- Phase 12 release evidence remains complete')
console.log('- Phase 12A intraday generation is enabled and accumulating')
console.log('- 12A-4 provider-specific category source audit accepted PR #513')
console.log('- current workstream is the category storage design and budget gate')
console.log('- runtime category capture remains disabled')
console.log('- current inventory owns 25 public HTML routes and 100 browser scenarios')
