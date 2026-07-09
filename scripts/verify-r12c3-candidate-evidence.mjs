import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/r12c3-candidate/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-r12c3-candidate-acceptance-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.workstream, 'R12C-3')
assert.equal(evidence.status, 'candidate_pass')
assert.match(evidence.candidateHeadSha ?? '', /^[a-f0-9]{40}$/)
assert.ok(evidence.workflowRunId)
assert.equal(evidence.completedChecks.length, 13)

assert.deepEqual(evidence.publicSurface, {
  htmlRoutes: 25,
  inventoryEntries: 26,
  publicReadinessPages: 25,
  productionSmokeRoutes: 25,
})

assert.equal(evidence.browser.routes, 25)
assert.equal(evidence.browser.viewports, 4)
assert.equal(evidence.browser.scenarios, 100)
assert.equal(evidence.browser.violations, 0)
assert.equal(evidence.browser.providerCrossingScenarios, 0)
assert.equal(evidence.browser.providerNeutralApiRequestScenarios, 0)
assert.equal(evidence.browser.overflowScenarios, 0)
assert.equal(evidence.browser.focusFailures, 0)
assert.equal(evidence.browser.unlabeledControlScenarios, 0)
assert.equal(evidence.browser.legalMobileTargetFailures, 0)

assert.deepEqual(evidence.providerSeparation, {
  twitchBinding: 'DB_TWITCH_HOT',
  kickBinding: 'DB_KICK_HOT',
  combinedTotalsAllowed: false,
  combinedRankingsAllowed: false,
})

assert.deepEqual(evidence.launchAssets, {
  count: 6,
  captureResult: 'pass',
  packageVerificationResult: 'pass',
})

assert.equal(evidence.remainingGate, 'exact production SHA smoke after merge and permanent Phase 12 closeout evidence')

console.log('R12C-3 candidate evidence verification passed.')
console.log(`- candidate head: ${evidence.candidateHeadSha}`)
console.log('- 13 candidate checks completed')
console.log('- 25 routes / 4 viewports / 100 browser scenarios / 0 violations')
console.log('- provider crossing and provider-neutral API request scenarios: 0')
console.log('- R12C-2 six-asset package remains verified')
console.log('- remaining gate is exact production SHA smoke and permanent Phase 12 closeout')
