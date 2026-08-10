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
assert.equal(existsSync(productionWorkflow), false, `${productionWorkflow}: one-time hidden production revalidation workflow must be retired`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const contract = json(contractPath)
const decision = json(decisionPath)
const apiPackage = json(apiPackagePath)
const controlsPackage = json(controlsPackagePath)

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
assert.equal(evidence.deployment.pages_url, 'https://403141bd.viewloom.pages.dev')
assert.equal(evidence.deployment.primary_origin, 'https://www.viewloom.net')
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: must pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const normal = byName.get('kick-normal-desktop')
const hidden = byName.get('kick-hidden-desktop')
const mobile = byName.get('kick-hidden-mobile')
const unknown = byName.get('kick-hidden-unknown-category')
const twitch = byName.get('twitch-public-isolation')
for (const scenario of [normal, hidden, mobile, unknown, twitch]) assert.ok(scenario)

assert.equal(normal.checks.state, 'live')
assert.equal(normal.checks.itemCount, 100)
assert.equal(normal.checks.categoryImplementation, 'hidden')
assert.equal(normal.checks.categoryCoverageState, 'observed')
assert.equal(normal.checks.geometry.overflow, false)

assert.equal(hidden.checks.categoryOptions, 25)
assert.equal(hidden.checks.categoryCoverageState, 'observed')
assert.equal(hidden.checks.selectedCategory, '15')
assert.equal(hidden.checks.selectedItems, 16)
assert.equal(hidden.checks.unavailableMomentumItems, 1)
assert.equal(hidden.checks.top20Items, 16)
assert.equal(hidden.checks.keyboard, true)
assert.equal(hidden.checks.geometry.overflow, false)

assert.equal(mobile.checks.categoryOptions, 25)
assert.equal(mobile.checks.categoryCoverageState, 'observed')
assert.equal(mobile.checks.geometry.width, 390)
assert.equal(mobile.checks.geometry.scrollWidth, 390)
assert.equal(mobile.checks.geometry.overflow, false)
assert.equal(mobile.checks.controls.viewport, 390)
assert.equal(mobile.checks.controls.root.width, 362)
assert.equal(mobile.checks.controls.category.width, 336)
assert.equal(mobile.checks.controls.top.width, 336)

assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.itemCount, 0)
assert.equal(unknown.checks.uiTitle, 'Unknown Kick category')
assert.equal(unknown.checks.geometry.overflow, false)

assert.equal(twitch.checks.itemCount, 50)
assert.equal(twitch.checks.categoryControls, 1)
assert.equal(twitch.checks.geometry.width, 390)
assert.equal(twitch.checks.geometry.scrollWidth, 390)
assert.equal(twitch.checks.geometry.overflow, false)

assert.equal(contract.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-revalidation-v2')
assert.equal(contract.status, 'ready_for_validation')
assert.equal(contract.provider, 'kick')
assert.equal(contract.authority.controlsMergeSha, evidence.expectedSha)
assert.equal(contract.authority.productionSourceAuthority, 'exact_controls_product_sha')
assert.equal(contract.authority.productionExpectedProductSha, evidence.expectedSha)
assert.equal(contract.authority.publicCutoverAuthorized, false)
assert.equal(decision.decision, 'authorize_hidden_kick_heatmap_category_candidate')
assert.equal(decision.authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.authorization.publicExposureAuthorized, false)
assert.equal(apiPackage.provider, 'kick')
assert.equal(apiPackage.apiContract.filterBeforeTopN, true)
assert.equal(apiPackage.hiddenBoundary.publicExposureAuthorized, false)
assert.equal(controlsPackage.provider, 'kick')
assert.equal(controlsPackage.hiddenEntry.kickOnlyHiddenGate, true)
assert.equal(controlsPackage.hiddenEntry.publicKickExposureAuthorized, false)
assert.equal(controlsPackage.dataTruth.selectedCategoryMomentumUnavailableTilePresentation, 'neutral_na_not_flat_zero')

assert.equal(acceptance.schemaVersion, 'viewloom-12a8-kick-heatmap-category-hidden-production-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.provider, 'kick')
assert.equal(acceptance.trackingIssue, 770)
assert.equal(acceptance.package.decisionPr, 769)
assert.equal(acceptance.package.apiPackagePr, 771)
assert.equal(acceptance.package.controlsPackagePr, 772)
assert.equal(acceptance.package.controlsProductSha, evidence.expectedSha)
assert.equal(acceptance.package.revalidationPackagePr, 775)
assert.equal(acceptance.package.sourceAuthorityCorrectionPr, 776)
assert.equal(acceptance.execution.workflowRunId, 31368780619)
assert.equal(acceptance.execution.contractJobId, 93392869297)
assert.equal(acceptance.execution.productionJobId, 93393053863)
assert.equal(acceptance.execution.artifactId, 9055232142)
assert.equal(acceptance.execution.artifactDigest, 'sha256:ad543f9433626e4c4c7b74a6da8813a97c633ae7c9753f6ca72bc6e588317f34')
assert.equal(acceptance.execution.sourceEvidenceJsonSha256, 'd7a540d8ff25fa4843406606513d3708b8d420b0dff43338d694146d1cfdcde5')
assert.equal(acceptance.execution.sourceDeploymentJsonSha256, '4679bc87c6214441e99be8cd7c346bb15a95c82327fe53094082e818a0462963')
assert.equal(acceptance.execution.expectedProductSha, evidence.expectedSha)
assert.equal(acceptance.execution.observedProductSha, evidence.expectedSha)
assert.equal(acceptance.execution.pagesUrl, evidence.deployment.pages_url)
assert.equal(acceptance.acceptedResult.scenarioCount, 5)
assert.equal(acceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.failureCount, 0)
assert.equal(acceptance.acceptedResult.normalKickItemCount, 100)
assert.equal(acceptance.acceptedResult.hiddenDesktopCategoryOptions, 25)
assert.equal(acceptance.acceptedResult.selectedCategory, '15')
assert.equal(acceptance.acceptedResult.selectedCategoryItems, 16)
assert.equal(acceptance.acceptedResult.selectedCategoryUnavailableMomentumItems, 1)
assert.equal(acceptance.acceptedResult.mobileControlRootWidth, 362)
assert.equal(acceptance.acceptedResult.unknownCategoryItems, 0)
assert.equal(acceptance.acceptedResult.twitchIsolationItemCount, 50)
assert.equal(acceptance.acceptedResult.providerSeparationPass, true)
assert.equal(acceptance.acceptedResult.normalRoutePublicControlsAbsent, true)
assert.equal(acceptance.acceptedResult.hiddenApiPublicExposureFlagFalse, true)
assert.equal(acceptance.acceptedResult.filterBeforeTopNPass, true)
assert.equal(acceptance.acceptedResult.selectedCategoryMomentumHonestyPass, true)

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

console.log(JSON.stringify({
  status: 'pass',
  acceptancePr: acceptance.acceptancePr,
  productSha: evidence.expectedSha,
  workflowRunId: acceptance.execution.workflowRunId,
  productionJobId: acceptance.execution.productionJobId,
  artifactId: acceptance.execution.artifactId,
  scenarios: evidence.scenarios.length,
  categoryOptions: hidden.checks.categoryOptions,
  selectedCategory: hidden.checks.selectedCategory,
  selectedItems: hidden.checks.selectedItems,
  mobileWidth: mobile.checks.geometry.width,
  publicCutoverDecisionAuthorized: true,
  publicKickCategoryUiAuthorized: false,
  productionRevalidationWorkflowRetired: true,
}, null, 2))
