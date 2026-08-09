import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a6-twitch-day-flow-category-public-production-evidence.json'
const acceptancePath = 'docs/audits/12a6-twitch-day-flow-category-public-production-acceptance.json'
const decisionPath = 'docs/audits/12a6-twitch-day-flow-category-public-cutover-decision.json'
const productionWorkflow = '.github/workflows/analytics-12a6-twitch-day-flow-category-public-cutover.yml'
const evidenceWorkflow = '.github/workflows/analytics-12a6-twitch-day-flow-category-public-production-evidence.yml'

const raw = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(raw(path))
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

for (const path of [evidencePath, acceptancePath, decisionPath, evidenceWorkflow]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(productionWorkflow), false, `${productionWorkflow}: consumed production acceptance workflow must be retired`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const decision = json(decisionPath)

assert.equal(sha256(evidencePath), '27efccc6d6eb4d63b007a9fd400caac5983ac2da5ab8277361eb00a7d2e86ac8', 'frozen evidence bytes changed')
assert.equal(evidence.schemaVersion, 'viewloom-12a6-twitch-day-flow-category-public-production-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.equal(evidence.expectedProductionSha, '18347cdcb6af3248a44c62f8f56b7932b459cb96')
assert.equal(evidence.validationDate, '2026-08-08')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicTwitchDayFlowCategoryUiActive, true)
assert.equal(evidence.kickCategoryUiEnabled, false)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.deployment.commit_sha, evidence.expectedProductionSha)
assert.equal(evidence.deployment.pages_url, 'https://556f7241.viewloom.pages.dev')
assert.equal(evidence.deployment.primary_origin, 'https://www.viewloom.net')
assert.equal(evidence.deployment.canonical_host, 'www.viewloom.net')
assert.equal(evidence.deployment.propagationAttempts, 2)
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: must pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const desktop = byName.get('twitch-public-fixed-day-desktop')
const mobile = byName.get('twitch-public-fixed-day-mobile')
const legacy = byName.get('twitch-public-legacy-preview-compatibility')
const unknown = byName.get('twitch-public-unknown-category')
const kick = byName.get('kick-public-cutover-isolation')
for (const scenario of [desktop, mobile, legacy, unknown, kick]) assert.ok(scenario)

assert.equal(desktop.checks.categoryOptions, 413)
assert.equal(desktop.checks.selectedCategory, '509658')
assert.equal(desktop.checks.selectedBandCount, 21)
assert.deepEqual(desktop.checks.coverageCounts, { observed: 96, partial: 192, unavailable: 0 })
assert.equal(desktop.checks.globalTotalsPreserved, true)
assert.deepEqual(desktop.checks.pageGeometry, { width: 1440, scrollWidth: 1440, overflow: false })
assert.equal(desktop.requests.length, 2)
assert.equal(new URL(desktop.requests[0]).pathname, '/api/day-flow')
assert.equal(new URL(desktop.requests[0]).searchParams.get('category'), 'all')
assert.equal(new URL(desktop.requests[1]).searchParams.get('category'), '509658')

assert.equal(mobile.viewport.width, 390)
assert.equal(mobile.checks.box.width, 362)
assert.deepEqual(mobile.checks.pageGeometry, { width: 390, scrollWidth: 390, overflow: false })
assert.deepEqual(mobile.checks.coverageCounts, { observed: 96, partial: 192, unavailable: 0 })
assert.equal(mobile.requests.length, 1)
assert.equal(new URL(mobile.requests[0]).searchParams.get('category'), 'all')

assert.equal(legacy.checks.selectedCategory, '509658')
assert.equal(legacy.checks.legacyParameterRemoved, true)
assert.equal(legacy.requests.length, 2)
assert.equal(new URL(legacy.requests[0]).searchParams.get('category'), 'all')
assert.equal(new URL(legacy.requests[1]).searchParams.get('category'), '509658')

assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.bandCount, 0)
assert.match(unknown.checks.statusText, /^Unknown Twitch category/)
assert.equal(unknown.requests.length, 1)
assert.equal(new URL(unknown.requests[0]).searchParams.get('category'), '__viewloom_unknown_category__')

assert.equal(kick.viewport.width, 390)
assert.equal(kick.checks.bucketCount, 288)
assert.equal(kick.checks.bandCount, 21)
assert.deepEqual(kick.checks.pageGeometry, { width: 390, scrollWidth: 390, overflow: false })
assert.equal(kick.requests.length, 1)
assert.equal(new URL(kick.requests[0]).pathname, '/api/kick-day-flow')
assert.equal(new URL(kick.requests[0]).searchParams.has('category'), false)

assert.equal(decision.schemaVersion, 'viewloom-12a6-twitch-day-flow-category-public-cutover-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 757)
assert.equal(decision.publicCutoverPr, 758)
assert.equal(decision.authorization.publicTwitchDayFlowCategoryUiAuthorized, true)
assert.equal(decision.authorization.historyCategoryUiAuthorized, false)
assert.equal(decision.authorization.kickCategoryUiAuthorized, false)

assert.equal(acceptance.schemaVersion, 'viewloom-12a6-twitch-day-flow-category-public-production-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.trackingIssue, 757)
assert.equal(acceptance.acceptanceIssue, 763)
assert.equal(acceptance.provider, 'twitch')
assert.equal(acceptance.feature, 'day_flow_category_filter')
assert.equal(acceptance.package.publicCutoverPr, 758)
assert.equal(acceptance.package.publicCutoverMergeSha, '7ec1b77bdd1dc06024c31c2d6ad6459c91babdbd')
assert.equal(acceptance.package.u10gAlignmentPr, 760)
assert.equal(acceptance.package.u10gAlignmentMergeSha, '3f97e479c682df2ff8aec1266fb2e648f6b9052b')
assert.equal(acceptance.package.compatibilityFixPr, 762)
assert.equal(acceptance.package.productionSourceSha, evidence.expectedProductionSha)
assert.equal(acceptance.execution.workflowRunId, 31315640061)
assert.equal(acceptance.execution.verifyJobId, 93250313637)
assert.equal(acceptance.execution.productionJobId, 93250353913)
assert.equal(acceptance.execution.artifactId, 9038663038)
assert.equal(acceptance.execution.artifactName, 'analytics-12a6-twitch-day-flow-category-public-production-acceptance')
assert.equal(acceptance.execution.artifactDigest, 'sha256:f4e5c3766f47eeba44c4f0ec1bb86300dcd51da3b9371836287793525e5cd5a3')
assert.equal(acceptance.execution.sourceEvidenceJsonSha256, sha256(evidencePath))
assert.equal(acceptance.execution.observedAt, evidence.observedAt)
assert.equal(acceptance.productionIdentity.commitSha, evidence.expectedProductionSha)
assert.equal(acceptance.productionIdentity.pagesUrl, evidence.deployment.pages_url)
assert.equal(acceptance.productionIdentity.propagationAttempts, 2)
assert.equal(acceptance.productionIdentity.deploymentPath, 'cloudflare_pages_git_integration')
assert.equal(acceptance.productionIdentity.deploymentPathEvidenceIssue, 751)
assert.equal(acceptance.productionIdentity.deploymentPathEvidencePr, 752)
assert.equal(acceptance.acceptedResult.scenarioCount, 5)
assert.equal(acceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.failureCount, 0)
assert.equal(acceptance.acceptedResult.publicDesktopCategoryOptions, 413)
assert.equal(acceptance.acceptedResult.selectedCategory, '509658')
assert.equal(acceptance.acceptedResult.selectedCategoryBandCount, 21)
assert.equal(acceptance.acceptedResult.coverageObservedBuckets, 96)
assert.equal(acceptance.acceptedResult.coveragePartialBuckets, 192)
assert.equal(acceptance.acceptedResult.coverageUnavailableBuckets, 0)
assert.equal(acceptance.acceptedResult.globalTotalsPreserved, true)
assert.equal(acceptance.acceptedResult.desktopOverflow, false)
assert.equal(acceptance.acceptedResult.mobileControlWidth, 362)
assert.equal(acceptance.acceptedResult.mobileViewportWidth, 390)
assert.equal(acceptance.acceptedResult.mobileOverflow, false)
assert.equal(acceptance.acceptedResult.legacyPreviewCompatibilityAccepted, true)
assert.equal(acceptance.acceptedResult.legacyParameterRemovedAfterInteraction, true)
assert.equal(acceptance.acceptedResult.unknownCategoryState, 'unknown_category')
assert.equal(acceptance.acceptedResult.unknownCategoryBandCount, 0)
assert.equal(acceptance.acceptedResult.providerSeparationPass, true)
assert.equal(acceptance.acceptedResult.publicTwitchDayFlowCategoryUiActive, true)
assert.equal(acceptance.acceptedResult.kickCategoryUiEnabled, false)
assert.equal(acceptance.acceptedResult.productionMutationPerformed, false)
assert.equal(acceptance.authorization.publicDayFlowProductionAcceptedOnMerge, true)
assert.equal(acceptance.authorization.publicTwitchDayFlowCategoryUiAccepted, true)
assert.equal(acceptance.authorization.historyCategoryDecisionAuthorized, true)
assert.equal(acceptance.authorization.historyCategoryUiAuthorized, false)
assert.equal(acceptance.authorization.kickCategoryDecisionAuthorized, false)
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
  'combinedProviderRankingAuthorized',
  'cloudflareCredentialMutationAuthorized',
]) assert.equal(acceptance.authorization[key], false, `${key}: must remain false`)
assert.equal(acceptance.acceptancePr, 764)

console.log(JSON.stringify({
  status: 'pass',
  acceptanceIssue: acceptance.acceptanceIssue,
  acceptancePr: acceptance.acceptancePr,
  productionSourceSha: evidence.expectedProductionSha,
  workflowRunId: acceptance.execution.workflowRunId,
  productionJobId: acceptance.execution.productionJobId,
  artifactId: acceptance.execution.artifactId,
  scenarios: evidence.scenarios.length,
  categoryOptions: desktop.checks.categoryOptions,
  selectedCategory: desktop.checks.selectedCategory,
  legacyCompatibilityAccepted: acceptance.acceptedResult.legacyPreviewCompatibilityAccepted,
  publicTwitchDayFlowCategoryUiAccepted: acceptance.authorization.publicTwitchDayFlowCategoryUiAccepted,
  historyCategoryDecisionAuthorized: acceptance.authorization.historyCategoryDecisionAuthorized,
  productionAcceptanceWorkflowRetired: true,
}, null, 2))
