import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const jsonPath = 'docs/audits/r12c3-candidate-acceptance.json'
const mdPath = 'docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md'
for (const path of [jsonPath, mdPath]) assert.equal(existsSync(path), true, `missing ${path}`)

const evidence = JSON.parse(readFileSync(jsonPath, 'utf8'))
assert.equal(evidence.schema, 'viewloom-r12c3-candidate-acceptance-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.workstream, 'R12C-3')
assert.equal(evidence.status, 'candidate_pass')
assert.equal(evidence.candidateHeadSha, '52584565ae3ac4b10509df68c90692915f7fe475')
assert.equal(evidence.workflowRunId, '28992701959')
assert.deepEqual(evidence.artifact, {
  id: 8188563767,
  name: 'r12c3-candidate-acceptance',
  digest: 'sha256:e81cdbce17fb5a97285d1dbddce768fea7b0332705ab0afa424619db656c90d6',
})
assert.equal(evidence.completedChecks.length, 15)
assert.deepEqual(evidence.publicSurface, {
  htmlRoutes: 25,
  inventoryEntries: 26,
  publicReadinessPages: 25,
  productionSmokeRoutes: 25,
})
assert.deepEqual(evidence.browser, {
  routes: 25,
  viewports: 4,
  scenarios: 100,
  violations: 0,
  providerCrossingScenarios: 0,
  providerNeutralApiRequestScenarios: 0,
  overflowScenarios: 0,
  focusFailures: 0,
  unlabeledControlScenarios: 0,
  legalMobileTargetFailures: 0,
})
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
assert.equal(evidence.supportTransition.result, 'pass')
assert.equal(evidence.supportTransition.mobileCtaHeightPx, 44)
assert.equal(evidence.supportTransition.violations, 0)
assert.equal(evidence.refundDisclosureConsistency.result, 'pass')
assert.equal(evidence.refundDisclosureConsistency.canonicalOrigin, 'https://vl.badjoke-lab.com')
assert.equal(evidence.refundDisclosureConsistency.pageScenarios, 8)
assert.equal(evidence.refundDisclosureConsistency.navigationFlows, 2)
assert.equal(evidence.refundDisclosureConsistency.violations, 0)
assert.equal(evidence.remainingGate, 'exact production SHA smoke after merge and permanent Phase 12 closeout evidence')

const record = readFileSync(mdPath, 'utf8')
for (const fragment of [
  'Status: candidate accepted',
  'Candidate head SHA: 52584565ae3ac4b10509df68c90692915f7fe475',
  'Workflow run: 28992701959',
  'Artifact id: 8188563767',
  'Browser scenarios: 100',
  'Browser violations: 0',
  'Combined totals allowed: false',
  'Combined rankings allowed: false',
  'Mobile CTA height: 44px',
  'Page scenarios: 8',
  'Mobile Back/return flows: 2',
  'Candidate merge alone does not complete Phase 12.',
  'Phase 12A remains blocked until the hosted exact-SHA closeout completes.',
]) assert.ok(record.includes(fragment), `${mdPath}: missing ${fragment}`)

console.log('R12C-3 permanent candidate acceptance record verification passed.')
console.log('- exact candidate head, workflow run, artifact id, and digest are fixed')
console.log('- 25 routes / 4 viewports / 100 scenarios / 0 violations are fixed')
console.log('- provider separation and six launch assets remain accepted')
console.log('- candidate Support and Refund/Disclosure checks are fixed')
console.log('- exact production SHA closeout remains the only release gate')
