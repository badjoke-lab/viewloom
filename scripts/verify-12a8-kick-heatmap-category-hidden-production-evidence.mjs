import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-evidence.json'
const acceptancePath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-acceptance.json'
const contractPath = 'docs/audits/12a8-kick-heatmap-category-hidden-production-revalidation-contract.json'
const decisionPath = 'docs/audits/12a8-kick-heatmap-category-feasibility-decision.json'
const apiPackagePath = 'docs/audits/12a8-kick-heatmap-category-api-package-contract.json'
const controlsPackagePath = 'docs/audits/12a8-kick-heatmap-category-hidden-controls-contract.json'
const productionWorkflow = '.github/workflows/analytics-12a8-kick-category-hidden-production-revalidation.yml'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [evidencePath, acceptancePath, contractPath, decisionPath, apiPackagePath, controlsPackagePath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(productionWorkflow), false, `${productionWorkflow}: consumed one-time workflow must remain retired`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const contract = json(contractPath)
const decision = json(decisionPath)
const apiPackage = json(apiPackagePath)
const controlsPackage = json(controlsPackagePath)

// Historical automated evidence remains immutable and proves the hidden data/runtime path.
assert.equal(evidence.schemaVersion, 'viewloom-12a8-kick-category-hidden-production-revalidation-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.equal(evidence.expectedSha, '555e30a754f4dee74e8ebe21fb59f85ef2b5a4b0')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicCutoverAuthorized, false)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.deployment.commit_sha, evidence.expectedSha)
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: historical automated scenario must remain pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const normal = byName.get('kick-normal-desktop')
const hidden = byName.get('kick-hidden-desktop')
const mobile = byName.get('kick-hidden-mobile')
const unknown = byName.get('kick-hidden-unknown-category')
const twitch = byName.get('twitch-public-isolation')
for (const scenario of [normal, hidden, mobile, unknown, twitch]) assert.ok(scenario)
assert.equal(normal.checks.itemCount, 100)
assert.equal(hidden.checks.categoryOptions, 25)
assert.equal(hidden.checks.selectedCategory, '15')
assert.equal(hidden.checks.selectedItems, 16)
assert.equal(hidden.checks.unavailableMomentumItems, 1)
assert.equal(mobile.checks.geometry.width, 390)
assert.equal(mobile.checks.geometry.scrollWidth, 390)
assert.equal(mobile.checks.geometry.overflow, false)
assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.itemCount, 0)
assert.equal(twitch.checks.itemCount, 50)
assert.equal(twitch.checks.categoryControls, 1)

// Accepted hidden implementation boundaries remain unchanged.
assert.equal(contract.provider, 'kick')
assert.equal(contract.authority.controlsMergeSha, evidence.expectedSha)
assert.equal(contract.authority.publicCutoverAuthorized, false)
assert.equal(decision.decision, 'authorize_hidden_kick_heatmap_category_candidate')
assert.equal(decision.authorization.publicExposureAuthorized, false)
assert.equal(apiPackage.provider, 'kick')
assert.equal(apiPackage.apiContract.filterBeforeTopN, true)
assert.equal(apiPackage.hiddenBoundary.publicExposureAuthorized, false)
assert.equal(controlsPackage.provider, 'kick')
assert.equal(controlsPackage.hiddenEntry.kickOnlyHiddenGate, true)
assert.equal(controlsPackage.hiddenEntry.publicKickExposureAuthorized, false)
assert.equal(controlsPackage.dataTruth.selectedCategoryMomentumUnavailableTilePresentation, 'neutral_na_not_flat_zero')

// #778 is now explicitly superseded for release/public-cutover authority by human visual QA.
assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-acceptance-v1')
assert.equal(acceptance.status, 'superseded_for_visual_qa')
assert.equal(acceptance.acceptancePr, 778)
assert.equal(acceptance.provider, 'kick')
assert.equal(acceptance.package.controlsProductSha, evidence.expectedSha)
assert.equal(acceptance.execution.workflowRunId, 31368780619)
assert.equal(acceptance.execution.productionJobId, 93393053863)
assert.equal(acceptance.execution.artifactId, 9055232142)
assert.equal(acceptance.acceptedResult.automatedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.automatedPassedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.automatedFailureCount, 0)
assert.equal(acceptance.acceptedResult.elementNonOverlapWasTested, false)
assert.equal(acceptance.visualQa.status, 'rejected')
assert.equal(acceptance.visualQa.supersededByIssue, 780)
assert.equal(acceptance.visualQa.supersededPublicDecisionIssue, 779)
assert.equal(acceptance.visualQa.supersededPublicDecisionPr, 781)
assert.equal(acceptance.visualQa.defect, 'desktop_category_status_crowds_or_overlaps_adjacent_map_metadata')
assert.equal(acceptance.visualQa.affectedScenario, 'kick-hidden-desktop')
assert.equal(acceptance.visualQa.pageOverflowMetricWasInsufficient, true)
assert.equal(acceptance.visualQa.newProductionEvidenceRequired, true)
assert.match(acceptance.visualQa.requiredNewAssertion, /DOMRect non-overlap/)

assert.equal(acceptance.authorization.historicalAutomatedEvidenceRetained, true)
assert.equal(acceptance.authorization.hiddenRevalidationAccepted, false)
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
assert.match(acceptance.nextGate, /Issue #780/)
assert.match(acceptance.nextGate, /DOMRect non-overlap/)

console.log(JSON.stringify({
  status: 'pass',
  acceptancePr: 778,
  historicalAutomatedEvidence: '5/5 pass retained',
  visualQa: acceptance.visualQa.status,
  supersededByIssue: acceptance.visualQa.supersededByIssue,
  defect: acceptance.visualQa.defect,
  publicCutoverDecisionAuthorized: false,
  publicKickCategoryUiAuthorized: false,
  newProductionEvidenceRequired: true,
}, null, 2))
