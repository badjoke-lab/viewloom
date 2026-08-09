import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a6-twitch-day-flow-category-hidden-production-revalidation-evidence.json'
const acceptancePath = 'docs/audits/12a6-twitch-day-flow-category-hidden-production-revalidation-acceptance.json'
const contractPath = 'docs/audits/12a6-twitch-day-flow-category-hidden-production-revalidation-contract.json'
const productionWorkflow = '.github/workflows/analytics-12a6-twitch-day-flow-category-hidden-production-revalidation.yml'
const retainedGitVerifier = '.github/workflows/verify-cloudflare-pages-git-integration.yml'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [evidencePath, acceptancePath, contractPath, retainedGitVerifier]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(productionWorkflow), false, `${productionWorkflow}: one-time production revalidation workflow must be retired`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const contract = json(contractPath)

assert.equal(evidence.schemaVersion, 'viewloom-12a6-twitch-day-flow-category-hidden-production-revalidation-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.equal(evidence.expectedProductionSha, 'cac1ea010caf0a11f0147ca3850691202be84122')
assert.equal(evidence.validationDate, '2026-08-08')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicCutoverAuthorized, false)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.deployment.commit_sha, evidence.expectedProductionSha)
assert.equal(evidence.deployment.pages_url, 'https://26afb6ad.viewloom.pages.dev')
assert.equal(evidence.deployment.primary_origin, 'https://www.viewloom.net')
assert.equal(evidence.deployment.canonical_host, 'www.viewloom.net')
assert.equal(evidence.deployment.propagationAttempts, 1)
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: must pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const normal = byName.get('twitch-normal-fixed-day-desktop')
const hidden = byName.get('twitch-hidden-fixed-day-desktop')
const mobile = byName.get('twitch-hidden-fixed-day-mobile')
const unknown = byName.get('twitch-hidden-unknown-category')
const kick = byName.get('kick-preview-query-isolation')
for (const scenario of [normal, hidden, mobile, unknown, kick]) assert.ok(scenario)

assert.equal(normal.checks.rangeMode, 'date')
assert.equal(normal.checks.selectedDate, '2026-08-08')
assert.equal(normal.checks.bucketCount, 288)
assert.equal(normal.checks.bandCount, 21)
assert.equal(normal.checks.pageGeometry.overflow, false)
assert.equal(normal.requests.length, 1)
assert.equal(new URL(normal.requests[0]).searchParams.has('category'), false)

assert.equal(hidden.checks.rangeMode, 'date')
assert.equal(hidden.checks.selectedDate, '2026-08-08')
assert.equal(hidden.checks.categoryOptions, 413)
assert.equal(hidden.checks.selectedCategory, '509658')
assert.equal(hidden.checks.selectedBandCount, 21)
assert.deepEqual(hidden.checks.coverageCounts, { observed: 96, partial: 192, unavailable: 0 })
assert.equal(hidden.checks.globalTotalsPreserved, true)
assert.equal(hidden.checks.pageGeometry.overflow, false)
assert.equal(hidden.requests.length, 2)
assert.equal(new URL(hidden.requests[0]).searchParams.get('category'), 'all')
assert.equal(new URL(hidden.requests[1]).searchParams.get('category'), '509658')

assert.equal(mobile.viewport.width, 390)
assert.equal(mobile.checks.box.width, 362)
assert.equal(mobile.checks.pageGeometry.width, 390)
assert.equal(mobile.checks.pageGeometry.scrollWidth, 390)
assert.equal(mobile.checks.pageGeometry.overflow, false)
assert.deepEqual(mobile.checks.coverageCounts, { observed: 96, partial: 192, unavailable: 0 })

assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.bandCount, 0)
assert.match(unknown.checks.statusText, /^Unknown Twitch category/)

assert.equal(kick.checks.rangeMode, 'date')
assert.equal(kick.checks.selectedDate, '2026-08-08')
assert.equal(kick.checks.bucketCount, 288)
assert.equal(kick.checks.bandCount, 21)
assert.equal(kick.checks.pageGeometry.overflow, false)
assert.equal(kick.requests.length, 1)
assert.equal(new URL(kick.requests[0]).pathname, '/api/kick-day-flow')
assert.equal(new URL(kick.requests[0]).searchParams.has('category'), false)

assert.equal(contract.schemaVersion, 'viewloom-12a6-twitch-day-flow-category-hidden-production-revalidation-v2')
assert.equal(contract.status, 'ready_for_validation')
assert.equal(contract.trackingIssue, 747)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.candidate.implementationPr, 746)
assert.equal(contract.candidate.mergeSha, '2abc28b6d81d5e970b7c6ecb7cde1010ce295834')
assert.equal(contract.candidate.publicCutoverAuthorized, false)
assert.equal(contract.acceptedProductionPath.mode, 'cloudflare_pages_git_integration')
assert.equal(contract.acceptedProductionPath.evidenceIssue, 751)
assert.equal(contract.acceptedProductionPath.evidencePr, 752)
assert.equal(contract.manualDeploymentPath.acceptedAsProductionAuthority, false)

assert.equal(acceptance.schemaVersion, 'viewloom-12a6-twitch-day-flow-category-hidden-production-revalidation-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.trackingIssue, 747)
assert.equal(acceptance.acceptanceIssue, 755)
assert.equal(acceptance.package.implementationPr, 746)
assert.equal(acceptance.package.implementationMergeSha, '2abc28b6d81d5e970b7c6ecb7cde1010ce295834')
assert.equal(acceptance.package.productionSourceSha, evidence.expectedProductionSha)
assert.equal(acceptance.execution.workflowRunId, 31304640405)
assert.equal(acceptance.execution.contractJobId, 93222927655)
assert.equal(acceptance.execution.productionJobId, 93222956254)
assert.equal(acceptance.execution.artifactId, 9035560024)
assert.equal(acceptance.execution.artifactDigest, 'sha256:36cf17a37eee81e48cd6674197985a5c3a271d870c37096195184c7277c81c8b')
assert.equal(acceptance.execution.sourceEvidenceJsonSha256, '18c7498590d727a76fcc21909500b6adadf914281d7a56dc5d8a4c90cc5f3c39')
assert.equal(acceptance.execution.productionPathAuthorityJsonSha256, 'e0922caa462978dd47c7bf64f062446afac7bd2f17e281fe81093237da6b96ae')
assert.equal(acceptance.productionIdentity.commitSha, evidence.expectedProductionSha)
assert.equal(acceptance.productionIdentity.deploymentPath, 'cloudflare_pages_git_integration')
assert.equal(acceptance.acceptedResult.scenarioCount, 5)
assert.equal(acceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.failureCount, 0)
assert.equal(acceptance.acceptedResult.hiddenDesktopCategoryOptions, 413)
assert.equal(acceptance.acceptedResult.selectedCategory, '509658')
assert.equal(acceptance.acceptedResult.globalTotalsPreserved, true)
assert.equal(acceptance.acceptedResult.mobileControlWidth, 362)
assert.equal(acceptance.acceptedResult.mobileViewportWidth, 390)
assert.equal(acceptance.acceptedResult.unknownCategoryState, 'unknown_category')
assert.equal(acceptance.acceptedResult.unknownCategoryBandCount, 0)
assert.equal(acceptance.acceptedResult.providerSeparationPass, true)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, true)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(acceptance.authorization.publicTwitchDayFlowCategoryUiAuthorized, false)
assert.equal(acceptance.authorization.historyCategoryUiAuthorized, false)
assert.equal(acceptance.authorization.kickCategoryUiAuthorized, false)
for (const key of [
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
  'cloudflareCredentialMutationAuthorized',
]) assert.equal(acceptance.authorization[key], false, `${key}: must remain false`)
assert.equal(acceptance.acceptancePr, 756)

console.log(JSON.stringify({
  status: 'pass',
  acceptanceIssue: acceptance.acceptanceIssue,
  acceptancePr: acceptance.acceptancePr,
  productionSourceSha: evidence.expectedProductionSha,
  workflowRunId: acceptance.execution.workflowRunId,
  productionJobId: acceptance.execution.productionJobId,
  artifactId: acceptance.execution.artifactId,
  scenarios: evidence.scenarios.length,
  categoryOptions: hidden.checks.categoryOptions,
  selectedCategory: hidden.checks.selectedCategory,
  publicCutoverDecisionAuthorized: acceptance.authorization.publicCutoverDecisionAuthorized,
  publicTwitchDayFlowCategoryUiAuthorized: acceptance.authorization.publicTwitchDayFlowCategoryUiAuthorized,
  productionRevalidationWorkflowRetired: true,
}, null, 2))
