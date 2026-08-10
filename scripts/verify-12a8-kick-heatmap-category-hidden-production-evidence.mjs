import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-evidence.json'
const acceptancePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-acceptance.json'
const correctionPath = 'docs/audits/12a8-kick-heatmap-category-hidden-visual-correction-contract.json'
const revalidationWorkflow = '.github/workflows/analytics-12a8-kick-category-hidden-visual-revalidation.yml'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [evidencePath, acceptancePath, correctionPath, revalidationWorkflow]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const correction = json(correctionPath)

// Preserve the historical automated pass exactly as evidence, but do not treat
// it as current acceptance authority after the visual QA defect was discovered.
assert.equal(evidence.schemaVersion, 'viewloom-12a8-kick-category-hidden-production-revalidation-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.expectedSha, '555e30a754f4dee74e8ebe21fb59f85ef2b5a4b0')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: historical automation must remain recorded as pass`)

assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-acceptance-v2')
assert.equal(acceptance.status, 'superseded_visual_revalidation_required')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.trackingIssue, 780)
assert.equal(acceptance.originalTrackingIssue, 770)
assert.equal(acceptance.supersededAcceptancePr, 778)
assert.equal(acceptance.historicalAutomatedEvidence.workflowRunId, 31368780619)
assert.equal(acceptance.historicalAutomatedEvidence.productionJobId, 93393053863)
assert.equal(acceptance.historicalAutomatedEvidence.artifactId, 9055232142)
assert.equal(acceptance.historicalAutomatedEvidence.artifactDigest, 'sha256:ad543f9433626e4c4c7b74a6da8813a97c633ae7c9753f6ca72bc6e588317f34')
assert.equal(acceptance.historicalAutomatedEvidence.automatedAssertionsPassed, true)
assert.equal(acceptance.historicalAutomatedEvidence.humanVisualAcceptancePassed, false)
assert.equal(acceptance.supersession.issue, 780)
assert.equal(acceptance.supersession.reason, 'human_visual_qa_desktop_category_status_overlap')
assert.equal(acceptance.supersession.sourceArtifactId, 9055232142)
assert.equal(acceptance.supersession.sourceScreenshot, 'screenshots/kick-hidden-desktop.png')
assert.equal(acceptance.supersession.historicalEvidenceRetained, true)
assert.equal(acceptance.supersession.historicalAutomatedPassRevokedAsAcceptanceAuthority, true)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, false)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, false)
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

assert.equal(correction.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-visual-correction-v2')
assert.equal(correction.status, 'repaired_product_pending_test_harness_revalidation')
assert.equal(correction.parentTrackingIssue, 623)
assert.equal(correction.trackingIssue, 780)
assert.equal(correction.supersedesAcceptancePr, 778)
assert.equal(correction.repair.pr, 782)
assert.equal(correction.repair.productSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
assert.equal(correction.repair.categoryStatusContainedByCategoryRoot, true)
assert.equal(correction.repair.categoryStatusDoesNotOverlapCategoryFields, true)
assert.equal(correction.repair.categoryStatusDoesNotOverlapAdjacentMapGroup, true)
assert.equal(correction.firstRepairValidationAttempt.workflowRun, 31370065098)
assert.equal(correction.firstRepairValidationAttempt.productionJob, 93396942797)
assert.equal(correction.firstRepairValidationAttempt.artifactId, 9055717263)
assert.equal(correction.firstRepairValidationAttempt.artifactDigest, 'sha256:daf27c93d55fe67339343c3c0f570f4c8d03b4ca759af5ff850fe50a404641d2')
assert.equal(correction.firstRepairValidationAttempt.productSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
assert.equal(correction.firstRepairValidationAttempt.exactProductionShaObserved, true)
assert.equal(correction.firstRepairValidationAttempt.desktopLayoutPassed, true)
assert.equal(correction.firstRepairValidationAttempt.desktopHumanVisualReviewPassed, true)
assert.equal(correction.firstRepairValidationAttempt.mobileLayoutPassed, true)
assert.equal(correction.firstRepairValidationAttempt.mobileHumanVisualReviewPassed, true)
assert.equal(correction.firstRepairValidationAttempt.twitchPublicControlsPreserved, true)
assert.equal(correction.firstRepairValidationAttempt.failedScenario, 'kick-normal-remains-hidden')
assert.equal(correction.firstRepairValidationAttempt.failureStage, 'normal_kick_response_wait_assumption')
assert.equal(correction.firstRepairValidationAttempt.productFailureEstablished, false)
assert.equal(correction.firstRepairValidationAttempt.testHarnessFailureEstablished, true)
assert.equal(correction.testHarnessCorrection.productRuntimeChange, false)
assert.equal(correction.testHarnessCorrection.pinnedProductSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
assert.equal(correction.testHarnessCorrection.normalKickApiResponseRequired, false)
assert.equal(correction.productionValidation.pinnedProductSha, 'b921f15b127f13d7ad8a7f52976e4715d08919c1')
for (const key of [
  'statusInsideRoot',
  'statusDoesNotOverlapFields',
  'statusDoesNotOverlapMapGroup',
  'categoryFieldsInsideRoot',
  'rootDoesNotOverlapMapGroup',
  'desktopNoHorizontalOverflow',
  'mobile390NoHorizontalOverflow',
  'normalKickControlCountZero',
  'normalKickCategoryAndTopQueryAbsent',
  'twitchPublicControlCountOne',
]) assert.equal(correction.requiredBrowserChecks[key], true, `${key}: must remain true`)
assert.equal(correction.authorization.publicCutoverDecisionAuthorized, false)
assert.equal(correction.authorization.publicKickCategoryUiAuthorized, false)

console.log(JSON.stringify({
  status: 'pass',
  historicalAutomatedRun: acceptance.historicalAutomatedEvidence.workflowRunId,
  historicalArtifact: acceptance.historicalAutomatedEvidence.artifactId,
  humanVisualAcceptancePassed: false,
  supersededAcceptancePr: acceptance.supersededAcceptancePr,
  correctionIssue: acceptance.trackingIssue,
  repairedProductSha: correction.repair.productSha,
  firstRepairDesktopPassed: correction.firstRepairValidationAttempt.desktopLayoutPassed,
  firstRepairMobilePassed: correction.firstRepairValidationAttempt.mobileLayoutPassed,
  remainingFailureClass: correction.firstRepairValidationAttempt.failureStage,
  productFailureEstablished: false,
  publicCutoverDecisionAuthorized: false,
  visualRevalidationWorkflowRestored: true,
}, null, 2))
