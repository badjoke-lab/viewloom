import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a9-kick-day-flow-category-post-repair-production-revalidation-evidence.json'
const acceptancePath = 'docs/audits/12a9-kick-day-flow-category-post-repair-production-revalidation-acceptance.json'
const contractPath = 'docs/audits/12a9-kick-day-flow-category-post-repair-production-revalidation-contract.json'
const oneShotWorkflow = '.github/workflows/analytics-12a9-kick-day-flow-category-post-repair-production-revalidation.yml'
const permanentWorkflow = '.github/workflows/analytics-12a9-kick-day-flow-category-post-repair-production-evidence.yml'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

for (const path of [evidencePath, acceptancePath, contractPath, permanentWorkflow]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(oneShotWorkflow), false, `${oneShotWorkflow}: consumed one-shot workflow must be retired`)
assert.equal(sha256(evidencePath), 'd910722372f8241225a752ae2d7e5a6308dac5f99c6583315fda2da893cdf465', 'frozen evidence JSON hash mismatch')

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const contract = json(contractPath)

assert.equal(evidence.schemaVersion, 'viewloom-12a9-kick-day-flow-category-post-repair-production-revalidation-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.equal(evidence.expectedProductSha, '27b3cca084d62d8badd512c068be415c6865965e')
assert.equal(evidence.expectedDeploymentSha, '7db7b2b71c6424f0bbaa20d1965933e9407cd19c')
assert.equal(evidence.validationDate, '2026-08-10')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicCutoverAuthorized, false)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.deployment.commit_sha, evidence.expectedDeploymentSha)
assert.equal(evidence.deployment.pages_url, 'https://3b29b6c9.viewloom.pages.dev')
assert.equal(evidence.deployment.primary_origin, 'https://www.viewloom.net')
assert.equal(evidence.deployment.canonical_host, 'www.viewloom.net')
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: must pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const normal = byName.get('kick-normal-fixed-day-desktop')
const hidden = byName.get('kick-hidden-fixed-day-desktop')
const mobile = byName.get('kick-hidden-fixed-day-mobile')
const unknown = byName.get('kick-hidden-unknown-category')
const twitch = byName.get('twitch-public-day-flow-isolation')
for (const scenario of [normal, hidden, mobile, unknown, twitch]) assert.ok(scenario)

assert.equal(normal.checks.rangeMode, 'date')
assert.equal(normal.checks.selectedDate, '2026-08-10')
assert.equal(normal.checks.bucketCount, 288)
assert.equal(normal.checks.bandCount, 21)
assert.equal(normal.checks.categoryControls, 0)
assert.equal(normal.checks.categoryQuerySent, false)
assert.equal(normal.checks.pageGeometry.overflow, false)
assert.equal(normal.requests.length, 1)
assert.equal(new URL(normal.requests[0]).pathname, '/api/kick-day-flow')
assert.equal(new URL(normal.requests[0]).searchParams.has('category'), false)

assert.equal(hidden.checks.rangeMode, 'date')
assert.equal(hidden.checks.selectedDate, '2026-08-10')
assert.equal(hidden.checks.categoryOptions, 127)
assert.equal(hidden.checks.selectedCategory, '15')
assert.equal(hidden.checks.selectedBandCount, 21)
assert.deepEqual(hidden.checks.coverageCounts, { observed: 288, partial: 0, unavailable: 0 })
assert.equal(hidden.checks.globalTotalsPreserved, true)
assert.equal(hidden.checks.fullShareDenominator, 'all_observed_kick_viewers_per_bucket')
assert.equal(hidden.checks.topFocusShareDenominator, 'displayed_selected_category_top_n_viewers_per_bucket')
assert.equal(hidden.checks.toolbarOverlapCount, 0)
assert.equal(hidden.checks.pageGeometry.overflow, false)
assert.equal(hidden.requests.length, 2)
assert.equal(new URL(hidden.requests[0]).searchParams.get('category'), 'all')
assert.equal(new URL(hidden.requests[1]).searchParams.get('category'), '15')

assert.equal(mobile.viewport.width, 390)
assert.equal(mobile.checks.box.width, 362)
assert.equal(mobile.checks.pageGeometry.width, 390)
assert.equal(mobile.checks.pageGeometry.scrollWidth, 390)
assert.equal(mobile.checks.pageGeometry.overflow, false)
assert.deepEqual(mobile.checks.coverageCounts, { observed: 288, partial: 0, unavailable: 0 })

assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.overallState, 'live')
assert.equal(unknown.checks.overallStatus, 'live')
assert.equal(unknown.checks.selectedBandCount, 0)
assert.equal(unknown.checks.globalOthersCount, 1)
assert.equal(unknown.checks.chartRendered, true)
assert.equal(unknown.checks.falseNoObservedCopyAbsent, true)
assert.equal(unknown.checks.globalContextPresent, true)
assert.match(unknown.checks.statusText, /^Unknown Kick category/)
assert.equal(unknown.checks.pageGeometry.overflow, false)
assert.equal(unknown.requests.length, 1)
assert.equal(new URL(unknown.requests[0]).pathname, '/api/kick-day-flow')

assert.equal(twitch.viewport.width, 390)
assert.equal(twitch.checks.implementationState, 'public')
assert.equal(twitch.checks.publicExposureAuthorized, true)
assert.equal(twitch.checks.pageGeometry.width, 390)
assert.equal(twitch.checks.pageGeometry.scrollWidth, 390)
assert.equal(twitch.checks.pageGeometry.overflow, false)
assert.equal(twitch.requests.length, 1)
assert.equal(new URL(twitch.requests[0]).pathname, '/api/day-flow')

assert.equal(contract.schemaVersion, 'viewloom-12a9-kick-day-flow-category-post-repair-production-revalidation-contract-v1')
assert.equal(contract.status, 'ready_for_validation')
assert.equal(contract.parentTrackingIssue, 623)
assert.equal(contract.revalidationIssue, 797)
assert.equal(contract.repairIssue, 801)
assert.equal(contract.trackingIssue, 803)
assert.equal(contract.provider, 'kick')
assert.equal(contract.productAuthority.repairPr, 802)
assert.equal(contract.productAuthority.sha, evidence.expectedProductSha)
assert.equal(contract.productAuthority.publicCutoverAuthorized, false)
assert.equal(contract.preRepairEvidence.workflowRun, 31471759777)
assert.equal(contract.preRepairEvidence.artifactId, 9093633104)
assert.equal(contract.preRepairEvidence.accepted, false)
assert.equal(contract.productionAuthority.manualDeployWorkflowIsAuthority, false)
assert.equal(contract.productionAuthority.pagesGitIntegrationIsAuthority, true)
assert.equal(contract.productionAuthority.productRuntimeEquivalenceRequired, true)

assert.equal(acceptance.schemaVersion, 'viewloom-12a9-kick-day-flow-category-post-repair-production-revalidation-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.revalidationIssue, 797)
assert.equal(acceptance.repairIssue, 801)
assert.equal(acceptance.trackingIssue, 803)
assert.equal(acceptance.acceptanceIssue, 805)
assert.equal(acceptance.package.decisionPr, 794)
assert.equal(acceptance.package.implementationPr, 796)
assert.equal(acceptance.package.repairedProductPr, 802)
assert.equal(acceptance.package.repairedProductSha, evidence.expectedProductSha)
assert.equal(acceptance.package.validationPackagePr, 804)
assert.equal(acceptance.package.validationDeploymentSha, evidence.expectedDeploymentSha)
assert.equal(acceptance.execution.workflowRunId, 31473190849)
assert.equal(acceptance.execution.contractJobId, 93720897005)
assert.equal(acceptance.execution.productionJobId, 93720969068)
assert.equal(acceptance.execution.artifactId, 9094188971)
assert.equal(acceptance.execution.artifactDigest, 'sha256:0c82ce4ad88abeff4569a3219757fbb293ae487a69854be0ff4e0976623e9925')
assert.equal(acceptance.execution.evidenceJsonSha256, 'd910722372f8241225a752ae2d7e5a6308dac5f99c6583315fda2da893cdf465')
assert.equal(acceptance.execution.deploymentJsonSha256, 'a2b77638dbadfa8cd9e1eba2d6dbd75aa0aa451a5371cfc8e24123923aa03843')
assert.equal(acceptance.execution.correctedUnknownScreenshotSha256, '4a88287f5c7600ff2003a96bd8807ba919ccc3e7b374a53a919b6321fd110546')
assert.equal(acceptance.execution.humanVisualAcceptancePassed, true)
assert.equal(acceptance.productionIdentity.productAuthoritySha, evidence.expectedProductSha)
assert.equal(acceptance.productionIdentity.deploymentCommitSha, evidence.expectedDeploymentSha)
assert.equal(acceptance.productionIdentity.deploymentPath, 'cloudflare_pages_git_integration')
assert.equal(acceptance.acceptedResult.scenarioCount, 5)
assert.equal(acceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.failureCount, 0)
assert.equal(acceptance.acceptedResult.hiddenDesktopCategoryOptions, 127)
assert.equal(acceptance.acceptedResult.selectedCategory, '15')
assert.equal(acceptance.acceptedResult.globalTotalsPreserved, true)
assert.equal(acceptance.acceptedResult.mobileControlWidth, 362)
assert.equal(acceptance.acceptedResult.mobileViewportWidth, 390)
assert.equal(acceptance.acceptedResult.unknownCategoryState, 'unknown_category')
assert.equal(acceptance.acceptedResult.unknownOverallState, 'live')
assert.equal(acceptance.acceptedResult.unknownOverallStatus, 'live')
assert.equal(acceptance.acceptedResult.unknownSelectedBandCount, 0)
assert.equal(acceptance.acceptedResult.unknownGlobalOthersCount, 1)
assert.equal(acceptance.acceptedResult.unknownChartRendered, true)
assert.equal(acceptance.acceptedResult.unknownFalseNoObservedCopyAbsent, true)
assert.equal(acceptance.acceptedResult.unknownGlobalContextPresent, true)
assert.equal(acceptance.acceptedResult.humanUnknownVisualAcceptancePassed, true)
assert.equal(acceptance.acceptedResult.desktopOverlapCount, 0)
assert.equal(acceptance.acceptedResult.providerSeparationPass, true)
assert.equal(acceptance.preRepairSupersession.workflowRunId, 31471759777)
assert.equal(acceptance.preRepairSupersession.artifactId, 9093633104)
assert.equal(acceptance.preRepairSupersession.acceptanceAuthority, false)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, true)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(acceptance.authorization.publicKickDayFlowCategoryUiAuthorized, false)
for (const key of [
  'kickBattleLinesCategoryUiAuthorized',
  'kickHistoryCategoryUiAuthorized',
  'twitchSemanticChangeAuthorized',
  'collectorChangeAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'schemaChangeAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'thresholdRelaxationAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
  'cloudflareCredentialMutationAuthorized',
]) assert.equal(acceptance.authorization[key], false, `${key}: must remain false`)
assert.equal(acceptance.acceptancePr, 806)

console.log(JSON.stringify({
  status: 'pass',
  acceptanceIssue: acceptance.acceptanceIssue,
  acceptancePr: acceptance.acceptancePr,
  repairedProductSha: evidence.expectedProductSha,
  validationDeploymentSha: evidence.expectedDeploymentSha,
  workflowRunId: acceptance.execution.workflowRunId,
  artifactId: acceptance.execution.artifactId,
  scenarios: evidence.scenarios.length,
  correctedUnknownState: unknown.checks.state,
  correctedUnknownOverallState: unknown.checks.overallState,
  correctedUnknownGlobalOthers: unknown.checks.globalOthersCount,
  humanVisualAcceptancePassed: acceptance.execution.humanVisualAcceptancePassed,
  publicCutoverDecisionAuthorized: acceptance.authorization.publicCutoverDecisionAuthorized,
  publicKickDayFlowCategoryUiAuthorized: acceptance.authorization.publicKickDayFlowCategoryUiAuthorized,
  oneShotProductionWorkflowRetired: true,
}, null, 2))
