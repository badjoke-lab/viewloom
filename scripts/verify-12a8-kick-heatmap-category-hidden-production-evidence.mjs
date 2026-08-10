import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-evidence.json'
const acceptancePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-acceptance.json'
const correctionPath = 'docs/audits/12a8-kick-heatmap-category-hidden-visual-correction-contract.json'
const revalidationWorkflow = '.github/workflows/analytics-12a8-kick-category-hidden-visual-revalidation.yml'
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [evidencePath, acceptancePath, correctionPath, revalidationWorkflow]) assert.equal(existsSync(path), true, `${path}: missing`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const correction = json(correctionPath)

assert.equal(evidence.schemaVersion, 'viewloom-12a8-kick-category-hidden-production-revalidation-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-acceptance-v2')
assert.equal(acceptance.status, 'superseded_visual_revalidation_required')
assert.equal(acceptance.trackingIssue, 780)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, false)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, false)
assert.equal(acceptance.authorization.publicKickCategoryUiAuthorized, false)

assert.equal(correction.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-visual-correction-v3')
assert.equal(correction.status, 'repaired_product_pending_validation_descendant_revalidation')
assert.equal(correction.parentTrackingIssue, 623)
assert.equal(correction.trackingIssue, 780)
assert.equal(correction.supersedesAcceptancePr, 778)
assert.equal(correction.repair.pr, 782)
assert.equal(correction.repair.productSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
assert.equal(correction.repair.desktopLayoutPassed, true)
assert.equal(correction.repair.mobile390LayoutPassed, true)
assert.equal(correction.repair.humanVisualDesktopPassed, true)
assert.equal(correction.repair.humanVisualMobilePassed, true)

assert.equal(correction.firstRepairValidationAttempt.workflowRun, 31370065098)
assert.equal(correction.firstRepairValidationAttempt.artifactId, 9055717263)
assert.equal(correction.firstRepairValidationAttempt.productFailureEstablished, false)
assert.equal(correction.secondRepairValidationAttempt.workflowRun, 31370886449)
assert.equal(correction.secondRepairValidationAttempt.productionJob, 93399474953)
assert.equal(correction.secondRepairValidationAttempt.artifactId, 9056024352)
assert.equal(correction.secondRepairValidationAttempt.artifactDigest, 'sha256:6972f9f7cf9f65ef946006bff8c3d97c9bb0947f8c790191532ef4427b995b80')
assert.equal(correction.secondRepairValidationAttempt.observedValidationOnlyDeploymentSha, '49d4f430e780419588768cf6e69a900a03c79569')
assert.equal(correction.secondRepairValidationAttempt.allBrowserScenariosPassed, true)
assert.equal(correction.secondRepairValidationAttempt.scenarioCount, 4)
assert.equal(correction.secondRepairValidationAttempt.browserFailureCount, 0)
assert.equal(correction.secondRepairValidationAttempt.failureStage, 'deployment_sha_advanced_to_validation_only_descendant')
assert.equal(correction.secondRepairValidationAttempt.productFailureEstablished, false)
assert.equal(correction.secondRepairValidationAttempt.validationHarnessFailureEstablished, true)

const authority = correction.validationDescendantAuthority
assert.equal(authority.productSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
assert.equal(authority.productRuntimeChangedAfterProductSha, false)
assert.equal(authority.requiredChangedPathCount, 4)
assert.deepEqual(authority.allowedChangedPathsFromProductSha, [
  '.github/workflows/analytics-12a8-kick-category-hidden-visual-revalidation.yml',
  'apps/web/scripts/kick-category-hidden-visual-revalidation.mjs',
  'docs/audits/12a8-kick-heatmap-category-hidden-visual-correction-contract.json',
  'scripts/verify-12a8-kick-heatmap-category-hidden-production-evidence.mjs',
])
assert.equal(correction.productionValidation.productSha, authority.productSha)
assert.equal(correction.productionValidation.expectedDeploymentSha, 'github.sha')
assert.equal(correction.productionValidation.requireValidationOnlyAncestry, true)
for (const value of Object.values(correction.requiredBrowserChecks)) assert.equal(value, true)
assert.equal(correction.authorization.publicCutoverDecisionAuthorized, false)
assert.equal(correction.authorization.publicKickCategoryUiAuthorized, false)

console.log(JSON.stringify({
  status: 'pass',
  correctionIssue: 780,
  repairedProductSha: authority.productSha,
  secondAttemptBrowserScenariosPassed: correction.secondRepairValidationAttempt.allBrowserScenariosPassed,
  remainingFailureClass: correction.secondRepairValidationAttempt.failureStage,
  validationOnlyPaths: authority.allowedChangedPathsFromProductSha,
  publicCutoverDecisionAuthorized: false,
}, null, 2))
