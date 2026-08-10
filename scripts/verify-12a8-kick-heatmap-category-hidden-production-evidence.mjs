import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-evidence.json'
const acceptancePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-acceptance.json'
const correctionPath = 'docs/audits/12a8-kick-heatmap-category-hidden-visual-correction-contract.json'
const revalidationWorkflow = '.github/workflows/analytics-12a8-kick-category-hidden-visual-revalidation.yml'
const revalidationScript = 'apps/web/scripts/kick-category-hidden-visual-revalidation.mjs'
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [evidencePath, acceptancePath, correctionPath, revalidationWorkflow, revalidationScript]) assert.equal(existsSync(path), true, `${path}: missing`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const correction = json(correctionPath)
const script = readFileSync(revalidationScript, 'utf8')

assert.equal(evidence.schemaVersion, 'viewloom-12a8-kick-category-hidden-production-revalidation-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-acceptance-v2')
assert.equal(acceptance.status, 'superseded_visual_revalidation_required')
assert.equal(acceptance.trackingIssue, 780)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, false)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, false)
assert.equal(acceptance.authorization.publicKickCategoryUiAuthorized, false)

assert.equal(correction.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-visual-correction-v4')
assert.equal(correction.status, 'repaired_product_pending_single_source_revalidation')
assert.equal(correction.parentTrackingIssue, 623)
assert.equal(correction.trackingIssue, 780)
assert.equal(correction.supersedesAcceptancePr, 778)
assert.equal(correction.repair.pr, 782)
assert.equal(correction.repair.productSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
assert.equal(correction.repair.desktopLayoutPassed, true)
assert.equal(correction.repair.mobile390LayoutPassed, true)
assert.equal(correction.repair.humanVisualDesktopPassed, true)
assert.equal(correction.repair.humanVisualMobilePassed, true)

assert.equal(correction.validationHistory.length, 3)
assert.equal(correction.validationHistory[0].workflowRun, 31370065098)
assert.equal(correction.validationHistory[0].artifactId, 9055717263)
assert.equal(correction.validationHistory[0].productFailureEstablished, false)
assert.equal(correction.validationHistory[1].workflowRun, 31370886449)
assert.equal(correction.validationHistory[1].artifactId, 9056024352)
assert.equal(correction.validationHistory[1].allBrowserScenariosPassed, true)
assert.equal(correction.validationHistory[1].browserFailureCount, 0)
assert.equal(correction.validationHistory[2].workflowRun, 31371416146)
assert.equal(correction.validationHistory[2].productionJob, 93401125358)
assert.equal(correction.validationHistory[2].artifactId, 9056232516)
assert.equal(correction.validationHistory[2].artifactDigest, 'sha256:ff98d96a2e039111defa8b8dfc7ccb1d57400ba8fe0ad447ada2d8c781ef415a')
assert.equal(correction.validationHistory[2].expectedValidationSha, '19f4a5d0ce83b8044e33e67fff072691c939017c')
assert.equal(correction.validationHistory[2].workflowExactSourceGatePassed, true)
assert.equal(correction.validationHistory[2].allBrowserScenariosPassed, true)
assert.equal(correction.validationHistory[2].scenarioCount, 4)
assert.equal(correction.validationHistory[2].browserFailureCount, 0)
assert.equal(correction.validationHistory[2].scriptDuplicateSourceFetchObservedSha, '49d4f430e780419588768cf6e69a900a03c79569')
assert.equal(correction.validationHistory[2].failureStage, 'duplicate_deployment_fetch_edge_staleness')
assert.equal(correction.validationHistory[2].productFailureEstablished, false)
assert.equal(correction.validationHistory[2].browserFailureEstablished, false)
assert.equal(correction.validationHistory[2].duplicateSourceCheckFailureEstablished, true)

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

const source = correction.singleSourceEvidenceAuthority
assert.equal(source.authoritativeFile, 'artifacts/12a8-kick-category-hidden-visual-revalidation/last-deployment.json')
assert.equal(source.producedImmediatelyBeforeBrowserExecution, true)
assert.equal(source.scriptNetworkRefetchAllowed, false)
assert.equal(source.scriptMustReadAuthoritativeFile, true)
assert.equal(source.scriptMustVerifyExpectedSha, true)
assert.equal(source.scriptMustVerifyEnvironmentProduction, true)
assert.equal(source.scriptMustVerifyBranchMain, true)
assert.ok(script.includes("const sourcePath = path.join(OUT, 'last-deployment.json')"))
assert.ok(script.includes("fs.readFileSync(sourcePath, 'utf8')"))
assert.equal(script.includes("fetch(`${ORIGIN}/deployment.json?visualRevalidation="), false)

assert.equal(correction.productionValidation.productSha, authority.productSha)
assert.equal(correction.productionValidation.expectedDeploymentSha, 'github.sha')
assert.equal(correction.productionValidation.requireValidationOnlyAncestry, true)
assert.equal(correction.productionValidation.deploymentEvidenceSource, 'workflow-produced last-deployment.json')
for (const value of Object.values(correction.requiredBrowserChecks)) assert.equal(value, true)
assert.equal(correction.authorization.publicCutoverDecisionAuthorized, false)
assert.equal(correction.authorization.publicKickCategoryUiAuthorized, false)

console.log(JSON.stringify({
  status: 'pass',
  correctionIssue: 780,
  repairedProductSha: authority.productSha,
  thirdAttemptBrowserScenariosPassed: correction.validationHistory[2].allBrowserScenariosPassed,
  remainingFailureClass: correction.validationHistory[2].failureStage,
  singleSourceDeploymentEvidence: source.authoritativeFile,
  scriptNetworkRefetchAllowed: false,
  publicCutoverDecisionAuthorized: false,
}, null, 2))
