import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const roadmap = read('docs/product/current-roadmap.md')
const schedule = read('docs/product/current-schedule.md')
const program = read('docs/product/post-watchlist-program-plan.md')

for (const [name, source] of [
  ['roadmap', roadmap],
  ['schedule', schedule],
  ['program', program],
]) {
  for (const fragment of [
    'Phase 12',
    'complete',
    'Phase 12A Analytics Capture Foundation',
    '12A-0 current data and capacity baseline',
    'work-analytics-12a0-current-data-capacity-baseline',
    'Phase 15 Analytics Capability and Calibration Audit',
    'Phase 16A',
  ]) {
    assert.ok(source.includes(fragment), `${name} missing ${fragment}`)
  }
}

for (const fragment of [
  'Current workstream: 12A-0 current data and capacity baseline',
  'Exact next implementation branch: work-analytics-12a0-current-data-capacity-baseline',
  'Next branch created: no',
]) {
  assert.ok(roadmap.includes(fragment), `roadmap missing ${fragment}`)
  assert.ok(schedule.includes(fragment), `schedule missing ${fragment}`)
}

const phase12 = JSON.parse(read('docs/audits/phase12-release-acceptance.json'))
assert.equal(phase12.schema, 'viewloom-phase12-release-acceptance-v1')
assert.equal(phase12.status, 'complete')
assert.equal(phase12.result, 'pass')
assert.equal(phase12.productionAcceptance.targetMainSha, '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8')
assert.equal(phase12.productionAcceptance.deployedSha, phase12.productionAcceptance.targetMainSha)
assert.equal(phase12.productionAcceptance.workflowRunId, 28993206779)
assert.equal(phase12.productionAcceptance.publicRoutesChecked, 25)
assert.equal(phase12.productionAcceptance.providerCrossingFailures, 0)
assert.equal(phase12.productionAcceptance.explicit404Failures, 0)
assert.equal(phase12.productionAcceptance.monitoring.blockingAlerts, 0)
assert.equal(phase12.independentCloseoutProbe.workflowRunId, 28993547481)
assert.equal(phase12.independentCloseoutProbe.result, 'pass')
assert.equal(phase12.completion.phase12Complete, true)
assert.equal(phase12.completion.nextProgram, 'Phase 12A Analytics Capture Foundation')

const candidate = JSON.parse(read('docs/audits/r12c3-candidate-acceptance.json'))
assert.equal(candidate.status, 'candidate_pass')
assert.equal(candidate.browser.routes, 25)
assert.equal(candidate.browser.viewports, 4)
assert.equal(candidate.browser.scenarios, 100)
assert.equal(candidate.browser.violations, 0)
assert.equal(candidate.browser.providerCrossingScenarios, 0)
assert.equal(candidate.browser.overflowScenarios, 0)
assert.equal(candidate.browser.focusFailures, 0)
assert.equal(candidate.browser.unlabeledControlScenarios, 0)
assert.equal(candidate.browser.legalMobileTargetFailures, 0)

const launchPackage = JSON.parse(read('docs/audits/r12c1-launch-copy-package.json'))
assert.equal(launchPackage.status, 'complete')
assert.equal(launchPackage.completion.r12c1_complete, true)
assert.equal(launchPackage.faq.length, 12)

const assetCapture = JSON.parse(read('docs/audits/r12c2-launch-assets-capture.json'))
assert.equal(assetCapture.result, 'pass')
assert.equal(assetCapture.assets.length, 6)
assert.equal(assetCapture.violations.length, 0)

const assetManifest = JSON.parse(read('docs/audits/r12c2-launch-asset-manifest.json'))
assert.equal(assetManifest.capture.result, 'pass')
assert.equal(assetManifest.packageVerification.result, 'pass')
assert.equal(assetManifest.assetCount, 6)
assert.equal(assetManifest.assets.length, 6)

const contract = JSON.parse(read('docs/audits/r12c3-release-candidate-contract.json'))
assert.equal(contract.status, 'complete')
assert.equal(contract.closeout.result, 'pass')
assert.equal(contract.closeout.productionSmokeRunId, 28993206779)

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.current_browser_required_viewports, 4)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.provider_invariants.twitch_binding, 'DB_TWITCH_HOT')
assert.equal(inventory.provider_invariants.kick_binding, 'DB_KICK_HOT')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

console.log('Current public-state handoff verification passed.')
console.log('- Phase 12 permanent acceptance is complete and exact-SHA bound')
console.log('- candidate browser evidence remains 25 routes x 4 viewports = 100 scenarios with zero violations')
console.log('- Production Smoke accepted exact main SHA 32c27a9a772cb62ff38f009c5fd1bb095ac27ad8')
console.log('- Twitch/Kick provider separation remains enforced')
console.log('- current program is Phase 12A Analytics Capture Foundation')
console.log('- exact next branch is work-analytics-12a0-current-data-capacity-baseline and remains uncreated')
