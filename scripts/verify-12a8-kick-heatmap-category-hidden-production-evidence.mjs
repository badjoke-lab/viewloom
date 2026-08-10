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

assert.equal(correction.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-visual-correction-v1')
assert.equal(correction.status, 'repair_required')
assert.equal(correction.parentTrackingIssue, 623)
assert.equal(correction.trackingIssue, 780)
assert.equal(correction.supersedesAcceptancePr, 778)
assert.equal(correction.requiredBrowserChecks.statusInsideRoot, true)
assert.equal(correction.requiredBrowserChecks.statusDoesNotOverlapFields, true)
assert.equal(correction.requiredBrowserChecks.statusDoesNotOverlapMapGroup, true)
assert.equal(correction.authorization.publicCutoverDecisionAuthorized, false)
assert.equal(correction.authorization.publicKickCategoryUiAuthorized, false)

console.log(JSON.stringify({
  status: 'pass',
  historicalAutomatedRun: acceptance.historicalAutomatedEvidence.workflowRunId,
  historicalArtifact: acceptance.historicalAutomatedEvidence.artifactId,
  humanVisualAcceptancePassed: false,
  supersededAcceptancePr: acceptance.supersededAcceptancePr,
  correctionIssue: acceptance.trackingIssue,
  publicCutoverDecisionAuthorized: false,
  visualRevalidationWorkflowRestored: true,
}, null, 2))
