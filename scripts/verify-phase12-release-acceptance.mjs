import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const evidence = JSON.parse(read('docs/audits/phase12-release-acceptance.json'))
const expectedSha = '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8'

assert.equal(evidence.schema, 'viewloom-phase12-release-acceptance-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.status, 'complete')
assert.equal(evidence.result, 'pass')

assert.equal(evidence.implementation.r12c2Pr, 486)
assert.equal(evidence.implementation.r12c2MergeSha, '13975969a077bbbf9979253e6ee4570b1e20aa4a')
assert.equal(evidence.implementation.r12c3Pr, 487)
assert.equal(evidence.implementation.r12c3MergeSha, expectedSha)

assert.equal(evidence.candidateAcceptance.status, 'candidate_pass')
assert.equal(evidence.candidateAcceptance.workflowRunId, 28992701959)
assert.equal(evidence.candidateAcceptance.artifactId, 8188563767)
assert.match(evidence.candidateAcceptance.artifactDigest, /^sha256:[a-f0-9]{64}$/)
assert.equal(evidence.candidateAcceptance.finalDedicatedRunId, 28992998420)
assert.equal(evidence.candidateAcceptance.finalArtifactId, 8188684969)
assert.match(evidence.candidateAcceptance.finalArtifactDigest, /^sha256:[a-f0-9]{64}$/)
assert.equal(evidence.candidateAcceptance.browser.routes, 25)
assert.equal(evidence.candidateAcceptance.browser.viewports, 4)
assert.equal(evidence.candidateAcceptance.browser.scenarios, 100)
assert.equal(evidence.candidateAcceptance.browser.violations, 0)
assert.equal(evidence.candidateAcceptance.browser.providerCrossingScenarios, 0)
assert.equal(evidence.candidateAcceptance.browser.providerNeutralApiRequestScenarios, 0)
assert.equal(evidence.candidateAcceptance.browser.overflowScenarios, 0)
assert.equal(evidence.candidateAcceptance.browser.focusFailures, 0)
assert.equal(evidence.candidateAcceptance.browser.unlabeledControlScenarios, 0)
assert.equal(evidence.candidateAcceptance.browser.legalMobileTargetFailures, 0)
assert.equal(evidence.candidateAcceptance.supportTransition.result, 'pass')
assert.equal(evidence.candidateAcceptance.supportTransition.violations, 0)
assert.equal(evidence.candidateAcceptance.refundDisclosure.result, 'pass')
assert.equal(evidence.candidateAcceptance.refundDisclosure.violations, 0)
assert.equal(evidence.candidateAcceptance.launchAssets.count, 6)
assert.equal(evidence.candidateAcceptance.launchAssets.captureResult, 'pass')
assert.equal(evidence.candidateAcceptance.launchAssets.packageVerificationResult, 'pass')

assert.equal(evidence.productionAcceptance.targetMainSha, expectedSha)
assert.equal(evidence.productionAcceptance.deployedSha, expectedSha)
assert.equal(evidence.productionAcceptance.workflow, 'Production Smoke')
assert.equal(evidence.productionAcceptance.workflowRunId, 28993206779)
assert.equal(evidence.productionAcceptance.artifactId, 8188712759)
assert.match(evidence.productionAcceptance.artifactDigest, /^sha256:[a-f0-9]{64}$/)
assert.equal(evidence.productionAcceptance.publicRoutesChecked, 25)
assert.equal(evidence.productionAcceptance.providerStatusApisChecked, 2)
assert.equal(evidence.productionAcceptance.providerCrossingFailures, 0)
assert.equal(evidence.productionAcceptance.explicit404Failures, 0)
assert.equal(evidence.productionAcceptance.providersSeparate, true)

assert.deepEqual(
  {
    binding: evidence.productionAcceptance.twitch.binding,
    database: evidence.productionAcceptance.twitch.database,
    sourceMode: evidence.productionAcceptance.twitch.sourceMode,
    collectorState: evidence.productionAcceptance.twitch.collectorState,
    fresh: evidence.productionAcceptance.twitch.fresh,
    stale: evidence.productionAcceptance.twitch.stale,
  },
  {
    binding: 'DB_TWITCH_HOT',
    database: 'vl_twitch_hot',
    sourceMode: 'real',
    collectorState: 'ok',
    fresh: true,
    stale: false,
  },
)
assert.deepEqual(
  {
    binding: evidence.productionAcceptance.kick.binding,
    database: evidence.productionAcceptance.kick.database,
    sourceMode: evidence.productionAcceptance.kick.sourceMode,
    collectorState: evidence.productionAcceptance.kick.collectorState,
    fresh: evidence.productionAcceptance.kick.fresh,
    stale: evidence.productionAcceptance.kick.stale,
  },
  {
    binding: 'DB_KICK_HOT',
    database: 'vl_kick_hot',
    sourceMode: 'authenticated',
    collectorState: 'snapshot_available',
    fresh: true,
    stale: false,
  },
)
assert.equal(evidence.productionAcceptance.monitoring.blockingAlerts, 0)
assert.equal(evidence.productionAcceptance.monitoring.watchAlerts, 2)

assert.equal(evidence.independentCloseoutProbe.workflow, 'Release Phase12 Hosted Closeout')
assert.equal(evidence.independentCloseoutProbe.workflowRunId, 28993547481)
assert.equal(evidence.independentCloseoutProbe.artifactId, 8188835607)
assert.match(evidence.independentCloseoutProbe.artifactDigest, /^sha256:[a-f0-9]{64}$/)
assert.equal(evidence.independentCloseoutProbe.result, 'pass')
assert.equal(evidence.independentCloseoutProbe.verifiedProductionSmokeRunId, 28993206779)
assert.equal(evidence.independentCloseoutProbe.verifiedProductionSmokeArtifactId, 8188712759)

for (const key of [
  'r12aComplete',
  'r12bCompleteThroughR12B2',
  'r12c0Complete',
  'r12c1Complete',
  'r12c2Complete',
  'r12c3CandidateAccepted',
  'exactMainShaProductionSmokePassed',
  'permanentReleaseAcceptanceRecorded',
  'phase12Complete',
]) {
  assert.equal(evidence.completion[key], true, `completion.${key} must be true`)
}
assert.equal(evidence.completion.nextProgram, 'Phase 12A Analytics Capture Foundation')
assert.equal(evidence.completion.nextWorkstream, '12A-0 current data and capacity baseline')
assert.equal(evidence.completion.nextBranch, 'work-analytics-12a0-current-data-capacity-baseline')
assert.equal(evidence.capacityCarryForward.authorizationToExpandWindows, false)
assert.equal(evidence.capacityCarryForward.authorizationToExtendRawRetention, false)

assert.equal(existsSync('docs/operations/phase12-release-acceptance-2026-07-09.md'), true)
const record = read('docs/operations/phase12-release-acceptance-2026-07-09.md')
for (const fragment of [
  'Status: complete',
  'Target production main SHA: `32c27a9a772cb62ff38f009c5fd1bb095ac27ad8`',
  'Workflow run: 28993206779',
  'Artifact id: 8188712759',
  'Workflow run: 28993547481',
  'Phase 12 is complete.',
  'Phase 12A Analytics Capture Foundation',
  'work-analytics-12a0-current-data-capacity-baseline',
]) {
  assert.ok(record.includes(fragment), `operations record missing ${fragment}`)
}

console.log(JSON.stringify({
  result: 'pass',
  schema: evidence.schema,
  targetMainSha: evidence.productionAcceptance.targetMainSha,
  productionSmokeRunId: evidence.productionAcceptance.workflowRunId,
  closeoutProbeRunId: evidence.independentCloseoutProbe.workflowRunId,
  phase12Complete: evidence.completion.phase12Complete,
  nextProgram: evidence.completion.nextProgram,
  nextBranch: evidence.completion.nextBranch,
}, null, 2))
