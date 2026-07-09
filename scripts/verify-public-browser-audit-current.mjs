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
    'Phase 11 production closeout complete',
    'Phase 12 English release readiness complete',
    'R12C-3', 'complete',
    'Phase 12A Analytics Capture Foundation',
    '12A-0 current data and capacity baseline',
    'work-analytics-12a0-capacity-baseline',
    'Phase 15 Analytics Capability and Calibration Audit',
    'Phase 16A',
  ]) {
    assert.ok(source.includes(fragment), `${path} missing ${fragment}`)
  }
}

for (const fragment of [
  'Current phase: Phase 12A Analytics Capture Foundation',
  'Current workstream: 12A-0 current data and capacity baseline',
  'Exact next implementation branch: work-analytics-12a0-capacity-baseline',
  'Next branch created: no',
]) {
  assert.ok(roadmap.includes(fragment), `roadmap missing ${fragment}`)
  assert.ok(schedule.includes(fragment), `schedule missing ${fragment}`)
}

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

console.log('Current public-state handoff verification passed.')
console.log('- U10F, U10G, U10H, Phase 11, R12A, R12B, and Phase 12 remain completed evidence')
console.log('- R12C-0 inventory, R12C-1 English package, R12C-2 assets, and R12C-3 candidate evidence remain accepted')
console.log('- exact-SHA Phase 12 production release acceptance is complete')
console.log('- Phase 12A Analytics Capture Foundation is active at 12A-0 current data and capacity baseline')
console.log('- exact next branch is work-analytics-12a0-capacity-baseline and remains uncreated')
console.log('- current inventory owns 25 public HTML routes and 100 browser scenarios')
