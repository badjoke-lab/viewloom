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
    'Phase 12 English release readiness',
    'R12A', 'complete',
    'R12B', 'complete',
    'R12C-0', 'complete',
    'R12C-1', 'complete',
    'R12C-2', 'complete',
    'R12C-3', 'active',
    'work-release-r12c3-release-candidate-acceptance',
    'Phase 12A Analytics Capture Foundation',
    'Phase 15 Analytics Capability and Calibration Audit',
    'Phase 16A',
  ]) {
    assert.ok(source.includes(fragment), `${path} missing ${fragment}`)
  }
}

for (const fragment of [
  'Current workstream: R12C-3 release candidate acceptance',
  'Exact active implementation branch: work-release-r12c3-release-candidate-acceptance',
  'Active branch created: yes',
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

const candidate = JSON.parse(read('docs/audits/r12c3-release-candidate-contract.json'))
assert.equal(candidate.schema, 'viewloom-r12c3-release-candidate-contract-v1')
assert.equal(candidate.phase, 'Phase 12')
assert.equal(candidate.workstream, 'R12C-3')
assert.equal(candidate.status, 'active')
assert.equal(candidate.branch, 'work-release-r12c3-release-candidate-acceptance')
assert.equal(candidate.candidateContract.htmlRoutes, 25)
assert.equal(candidate.candidateContract.browserViewports, 4)
assert.equal(candidate.candidateContract.browserScenarios, 100)
assert.equal(candidate.postmergeBoundary.exactMainShaProductionSmokeRequired, true)

const acceptance = JSON.parse(read('docs/audits/r12a-production-acceptance.json'))
assert.equal(acceptance.status, 'complete')
assert.equal(acceptance.result, 'pass')
assert.equal(acceptance.expected_main_sha, acceptance.deployed_sha)
assert.equal(acceptance.counts.html_routes, 25)
assert.equal(acceptance.counts.provider_crossing_failures, 0)
assert.equal(acceptance.counts.blocking_alerts, 0)

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.current_browser_required_viewports, 4)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.active_program, 'Phase 12 R12C English launch package and release acceptance')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

console.log('Current public-state handoff verification passed.')
console.log('- U10F, U10G, U10H, Phase 11, R12A, and R12B remain completed evidence')
console.log('- R12C-0 inventory, R12C-1 English source package, and R12C-2 asset package are complete')
console.log('- Phase 12 English release readiness is active at R12C-3 release candidate acceptance')
console.log('- active branch is work-release-r12c3-release-candidate-acceptance')
console.log('- current candidate contract owns 25 routes x 4 viewports = 100 browser scenarios')
console.log('- exact main SHA Production Smoke remains required after candidate merge')
