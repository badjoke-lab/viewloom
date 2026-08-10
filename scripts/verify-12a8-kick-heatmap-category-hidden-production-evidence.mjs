import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const historicalEvidencePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-evidence.json'
const correctedEvidencePath = 'docs/audits/12a8-kick-heatmap-category-hidden-corrected-visual-production-evidence.json'
const acceptancePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-acceptance.json'
const correctionPath = 'docs/audits/12a8-kick-heatmap-category-hidden-visual-correction-contract.json'
const revalidationWorkflow = '.github/workflows/analytics-12a8-kick-category-hidden-visual-revalidation.yml'
const revalidationScript = 'apps/web/scripts/kick-category-hidden-visual-revalidation.mjs'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [historicalEvidencePath, correctedEvidencePath, acceptancePath, correctionPath, revalidationScript]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(revalidationWorkflow), false, `${revalidationWorkflow}: consumed one-shot workflow must be retired`)

const historical = json(historicalEvidencePath)
const corrected = json(correctedEvidencePath)
const acceptance = json(acceptancePath)
const correction = json(correctionPath)
const script = readFileSync(revalidationScript, 'utf8')

// Preserve #778 as historical automated evidence, but never restore it as acceptance authority.
assert.equal(historical.schemaVersion, 'viewloom-12a8-kick-category-hidden-production-revalidation-evidence-v1')
assert.equal(historical.status, 'pass')
assert.deepEqual(historical.failures, [])
assert.equal(historical.scenarios.length, 5)

// Canonical corrected production evidence.
assert.equal(corrected.schemaVersion, 'viewloom-12a8-kick-category-hidden-visual-revalidation-evidence-v1')
assert.equal(corrected.status, 'pass')
assert.equal(corrected.expectedSha, '67fee8ba326f088422c85a61738f0251e9cd3c8d')
assert.equal(corrected.deployment?.commit_sha, corrected.expectedSha)
assert.equal(corrected.deployment?.environment, 'production')
assert.equal(corrected.deployment?.branch, 'main')
assert.equal(corrected.deployment?.pages_url, 'https://a6b76a8a.viewloom.pages.dev')
assert.deepEqual(corrected.failures, [])
assert.equal(corrected.scenarios.length, 4)
for (const scenario of corrected.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: must pass`)

const desktop = corrected.scenarios.find((scenario) => scenario.name === 'kick-hidden-desktop-layout')
const mobile = corrected.scenarios.find((scenario) => scenario.name === 'kick-hidden-mobile-layout')
const normalKick = corrected.scenarios.find((scenario) => scenario.name === 'kick-normal-remains-hidden')
const twitch = corrected.scenarios.find((scenario) => scenario.name === 'twitch-public-controls-preserved')
for (const scenario of [desktop, mobile, normalKick, twitch]) assert.ok(scenario, 'required corrected scenario missing')
assert.equal(desktop.checks.geometry.width, 1440)
assert.equal(desktop.checks.geometry.scrollWidth, 1440)
assert.equal(desktop.checks.geometry.overflow, false)
assert.equal(mobile.checks.geometry.width, 390)
assert.equal(mobile.checks.geometry.scrollWidth, 390)
assert.equal(mobile.checks.geometry.overflow, false)
assert.equal(normalKick.checks.categoryControls, 0)
assert.equal(normalKick.checks.categoryQueryCount, 0)
assert.equal(twitch.checks.categoryControls, 1)
assert.equal(corrected.publicCutoverAuthorized, false)
assert.equal(corrected.productionMutationPerformed, false)

// Final acceptance authority.
assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-acceptance-v3')
assert.equal(acceptance.status, 'accepted_corrected_visual_evidence')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.trackingIssue, 780)
assert.equal(acceptance.originalTrackingIssue, 770)
assert.equal(acceptance.package.prematureAcceptancePr, 778)
assert.equal(acceptance.package.visualRepairPr, 782)
assert.equal(acceptance.package.harnessCorrectionPr, 784)
assert.equal(acceptance.package.deploymentAuthorityPr, 785)
assert.equal(acceptance.package.singleSourceEvidencePr, 786)
assert.equal(acceptance.package.repairedProductSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
assert.equal(acceptance.package.acceptedValidationSha, corrected.expectedSha)
assert.equal(acceptance.supersededHistoricalAcceptance.pr, 778)
assert.equal(acceptance.supersededHistoricalAcceptance.automatedAssertionsPassed, true)
assert.equal(acceptance.supersededHistoricalAcceptance.humanVisualAcceptancePassed, false)
assert.equal(acceptance.supersededHistoricalAcceptance.remainsAcceptanceAuthority, false)
assert.equal(acceptance.correctedEvidence.workflowRunId, 31371899291)
assert.equal(acceptance.correctedEvidence.contractJobId, 93402501132)
assert.equal(acceptance.correctedEvidence.productionJobId, 93402574458)
assert.equal(acceptance.correctedEvidence.artifactId, 9056407163)
assert.equal(acceptance.correctedEvidence.artifactDigest, 'sha256:8efd05de170ec91c04e0bce5c7a16c3ab323cbb54f217d53f167ceb45cbd33af')
assert.equal(acceptance.correctedEvidence.evidenceJsonSha256, 'd342a42e90414717fb245754648aad4d522973f6d4a1abd6c1f3f2b1807dd526')
assert.equal(acceptance.correctedEvidence.deploymentJsonSha256, 'ef3d7d4f4f953523cce0ff6838ba35c286c00b59b93702f7a2cb8f23426dbd14')
assert.equal(acceptance.correctedEvidence.desktopScreenshotSha256, 'e1e37bbe2b392a4f6bd62c6531762ed1cea5f3eee0f027255aec6b854a0df5fc')
assert.equal(acceptance.correctedEvidence.mobileScreenshotSha256, 'a0c9b5dc51dde3ce65e15af6c491e89a736c0620c8c8af5f0c4bed53edb20cfe')
assert.equal(acceptance.correctedEvidence.validationDeploymentSha, corrected.expectedSha)
assert.equal(acceptance.correctedEvidence.scenarioCount, 4)
assert.equal(acceptance.correctedEvidence.passedScenarioCount, 4)
assert.equal(acceptance.correctedEvidence.failureCount, 0)
for (const key of [
  'desktopGeometryPassed',
  'mobile390GeometryPassed',
  'normalKickRemainedHidden',
  'twitchPublicControlsPreserved',
  'singleSourceDeploymentEvidencePassed',
  'humanVisualDesktopPassed',
  'humanVisualMobilePassed',
]) assert.equal(acceptance.correctedEvidence[key], true, `${key}: corrected acceptance must remain true`)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, true)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(acceptance.authorization.publicKickCategoryUiAuthorized, false)
for (const key of [
  'kickDayFlowCategoryUiAuthorized',
  'kickBattleLinesCategoryUiAuthorized',
  'kickHistoryCategoryUiAuthorized',
  'twitchRuntimeChangeAuthorized',
  'collectorChangeAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'd1SchemaChangeAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'credentialChangeAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(acceptance.authorization[key], false, `${key}: must remain false`)

// Close the visual-correction contract only after the exact accepted run exists.
assert.equal(correction.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-visual-correction-v5')
assert.equal(correction.status, 'corrected_visual_evidence_accepted')
assert.equal(correction.trackingIssue, 780)
assert.equal(correction.repair.pr, 782)
assert.equal(correction.repair.productSha, acceptance.package.repairedProductSha)
assert.equal(correction.validationHistory.length, 4)
const finalAttempt = correction.validationHistory[3]
assert.equal(finalAttempt.workflowRun, 31371899291)
assert.equal(finalAttempt.contractJob, 93402501132)
assert.equal(finalAttempt.productionJob, 93402574458)
assert.equal(finalAttempt.artifactId, 9056407163)
assert.equal(finalAttempt.artifactDigest, acceptance.correctedEvidence.artifactDigest)
assert.equal(finalAttempt.expectedValidationSha, corrected.expectedSha)
assert.equal(finalAttempt.workflowExactSourceGatePassed, true)
assert.equal(finalAttempt.singleSourceDeploymentEvidencePassed, true)
assert.equal(finalAttempt.allBrowserScenariosPassed, true)
assert.equal(finalAttempt.scenarioCount, 4)
assert.equal(finalAttempt.browserFailureCount, 0)
assert.equal(finalAttempt.desktopLayoutPassed, true)
assert.equal(finalAttempt.mobile390LayoutPassed, true)
assert.equal(finalAttempt.desktopHumanVisualReviewPassed, true)
assert.equal(finalAttempt.mobileHumanVisualReviewPassed, true)
assert.equal(finalAttempt.normalKickRemainedHidden, true)
assert.equal(finalAttempt.twitchPublicControlsPreserved, true)
assert.equal(finalAttempt.productFailureEstablished, false)
assert.equal(finalAttempt.accepted, true)
assert.equal(correction.acceptedEvidence.file, correctedEvidencePath)
assert.equal(correction.acceptedEvidence.workflowRun, 31371899291)
assert.equal(correction.acceptedEvidence.artifactId, 9056407163)
assert.equal(correction.acceptedEvidence.validationDeploymentSha, corrected.expectedSha)
assert.equal(correction.retirement.oneShotVisualRevalidationWorkflowConsumed, true)
assert.equal(correction.retirement.oneShotVisualRevalidationWorkflowRetiredOnAcceptance, true)
assert.equal(correction.retirement.permanentEvidenceVerifierRetained, true)
for (const value of Object.values(correction.requiredBrowserChecks)) assert.equal(value, true)
assert.equal(correction.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(correction.authorization.publicKickCategoryUiAuthorized, false)

// Retain the final browser script as historical/reproducible test logic, but make
// the workflow-produced deployment file the only source authority it consumes.
assert.ok(script.includes("const sourcePath = path.join(OUT, 'last-deployment.json')"))
assert.ok(script.includes("fs.readFileSync(sourcePath, 'utf8')"))
assert.equal(script.includes("fetch(`${ORIGIN}/deployment.json?visualRevalidation="), false)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: 780,
  repairedProductSha: acceptance.package.repairedProductSha,
  acceptedValidationSha: acceptance.package.acceptedValidationSha,
  acceptedWorkflowRun: acceptance.correctedEvidence.workflowRunId,
  acceptedArtifact: acceptance.correctedEvidence.artifactId,
  correctedScenarios: `${acceptance.correctedEvidence.passedScenarioCount}/${acceptance.correctedEvidence.scenarioCount}`,
  oneShotVisualWorkflowRetired: true,
  publicCutoverDecisionAuthorized: true,
  publicKickCategoryUiAuthorized: false,
}, null, 2))
