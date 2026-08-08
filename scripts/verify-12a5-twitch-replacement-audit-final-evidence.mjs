import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a5-twitch-replacement-audit-final-evidence.json'
const acceptancePath = 'docs/audits/12a5-twitch-replacement-audit-final-acceptance.json'
const retirementPath = 'docs/audits/12a5-twitch-replacement-audit-final-retirement.json'
const triggerPath = 'docs/audits/12a5-twitch-replacement-audit-final-trigger.json'
const executionWorkflowPath = '.github/workflows/analytics-12a5-twitch-replacement-audit-final.yml'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [evidencePath, acceptancePath, retirementPath]) assert.equal(existsSync(path), true, `${path}: missing`)
assert.equal(existsSync(triggerPath), false, `${triggerPath}: one-time trigger must be retired`)
assert.equal(existsSync(executionWorkflowPath), false, `${executionWorkflowPath}: production execution workflow must be retired`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const retirement = json(retirementPath)

assert.equal(evidence.status, 'accepted')
assert.equal(evidence.mode, 'final')
assert.equal(evidence.provider, 'twitch')
assert.equal(evidence.trackingIssue, 659)
assert.equal(evidence.window.startAt, '2026-07-31T17:00:00.000Z')
assert.equal(evidence.window.endExclusiveAt, '2026-08-07T17:00:00.000Z')
assert.equal(evidence.window.expectedSlots, 2016)
assert.equal(evidence.data.slotAnalysis.expectedSlots, 2016)
assert.equal(evidence.data.slotAnalysis.observedDistinctSlots, 2016)
assert.equal(evidence.data.slotAnalysis.coverageRatio, 1)
assert.equal(evidence.data.slotAnalysis.missingSlotCount, 0)
assert.equal(evidence.data.slotAnalysis.duplicateSlotCount, 0)
assert.equal(evidence.data.slotAnalysis.invalidBucketCount, 0)
assert.equal(evidence.data.slotAnalysis.maximumConsecutiveMissingSlots, 0)
assert.ok(evidence.data.categoryReferenceCoverageRatio >= 0.99)
assert.equal(evidence.data.unresolvedCategoryIds, 0)
assert.equal(evidence.data.collectorErrorRuns, 0)
assert.equal(evidence.data.twitchProviderLeakageRows, 0)
assert.equal(evidence.data.kickProviderLeakageRows, 0)
assert.equal(evidence.storage.providerPass, true)
assert.equal(evidence.storage.accountPass, true)
assert.equal(evidence.publicSurface.pass, true)
assert.equal(evidence.publicCutoverAuthorized, false)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.kickMutationPerformed, false)
assert.deepEqual(evidence.warnings, [])
assert.deepEqual(evidence.hardStops, [])
for (const [name, value] of Object.entries(evidence.gates)) assert.equal(value, true, `evidence gate ${name}: must be true`)

assert.equal(acceptance.status, 'candidate')
assert.equal(acceptance.provider, 'twitch')
assert.equal(acceptance.mode, 'final')
assert.equal(acceptance.package.executionPackagePr, 733)
assert.equal(acceptance.package.executionPackageMergeSha, '8ac77609d09e91c65e03b7a9a79c37f8f6b5f79d')
assert.equal(acceptance.package.executionPackageAcceptancePr, 734)
assert.equal(acceptance.package.executionPackageAcceptanceMergeSha, 'f69b7255c69598534c145a5019ba771f77cbb8ce')
assert.equal(acceptance.package.triggerPr, 735)
assert.equal(acceptance.package.triggerMergeSha, 'ccef802fc33a045b13c420331b64ef352b430e6c')
assert.equal(acceptance.execution.workflowRunId, 31241374639)
assert.equal(acceptance.execution.workflowConclusion, 'success')
assert.equal(acceptance.execution.finalJobId, 93063011226)
assert.equal(acceptance.execution.finalJobConclusion, 'success')
assert.equal(acceptance.execution.artifactId, 9017123435)
assert.equal(acceptance.execution.artifactName, 'analytics-12a5-twitch-replacement-audit-final')
assert.equal(acceptance.execution.artifactDigest, 'sha256:fc876b48c35c928661ec55449cd3fd73e58057c9b1b1f1260cc13513a2172401')
assert.equal(acceptance.execution.sourceEvidenceJsonSha256, '24cdf73f927a1fc1ccba5bf24170a61e2924d74aef36cb960fc89f2cf4fac1dd')
assert.equal(acceptance.acceptedResult.expectedSlots, evidence.data.slotAnalysis.expectedSlots)
assert.equal(acceptance.acceptedResult.observedDistinctSlots, evidence.data.slotAnalysis.observedDistinctSlots)
assert.equal(acceptance.acceptedResult.categoryReferenceCoverageRatio, evidence.data.categoryReferenceCoverageRatio)
assert.equal(acceptance.acceptedResult.allHardStopsClear, true)
assert.equal(acceptance.authorization.auditEvidenceAcceptedOnMerge, true)
assert.equal(acceptance.authorization.finalModeDecisionAuthorized, true)
assert.equal(acceptance.authorization.hiddenTwitchFilterRevalidationAuthorized, false)
assert.equal(acceptance.authorization.publicCategoryUiAuthorized, false)
assert.equal(acceptance.authorization.kickCategoryUiAuthorized, false)

assert.equal(retirement.status, 'retired_on_merge')
assert.equal(retirement.finalOutcome, 'accepted')
assert.equal(retirement.execution.workflowRunId, acceptance.execution.workflowRunId)
assert.equal(retirement.execution.finalJobId, acceptance.execution.finalJobId)
assert.equal(retirement.execution.artifactId, acceptance.execution.artifactId)
assert.equal(retirement.execution.artifactDigest, acceptance.execution.artifactDigest)
assert.deepEqual(retirement.retiredPaths, [triggerPath, executionWorkflowPath])
for (const value of Object.values(retirement.boundaries)) assert.equal(value, false)

console.log(JSON.stringify({
  status: 'pass',
  auditStatus: evidence.status,
  expectedSlots: evidence.data.slotAnalysis.expectedSlots,
  observedSlots: evidence.data.slotAnalysis.observedDistinctSlots,
  coverage: evidence.data.slotAnalysis.coverageRatio,
  categoryReferenceCoverage: evidence.data.categoryReferenceCoverageRatio,
  artifactId: acceptance.execution.artifactId,
  runId: acceptance.execution.workflowRunId,
  jobId: acceptance.execution.finalJobId,
  executionPathRetired: true,
  publicCutoverAuthorized: false
}, null, 2))
