import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a10-kick-battle-lines-category-hidden-production-evidence.json'
const acceptancePath = 'docs/audits/12a10-kick-battle-lines-category-hidden-production-acceptance.json'
const oneShotWorkflow = '.github/workflows/analytics-12a10-kick-battle-lines-category-hidden-production-revalidation.yml'
const apiPath = 'apps/web/functions/api/kick-battle-lines.ts'
const controllerPath = 'apps/web/src/live/battle-lines-current-shell-entry.ts'
const decisionPath = 'docs/audits/12a10-kick-battle-lines-category-feasibility-decision.json'
const fixturePath = 'apps/web/scripts/verify-kick-battle-lines-category-candidate.mjs'

for (const path of [evidencePath, acceptancePath, apiPath, controllerPath, decisionPath, fixturePath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(oneShotWorkflow), false, `${oneShotWorkflow}: consumed one-shot workflow must be retired`)

const HIDDEN_SHA = 'a802e7fe1e964180904c72744b7228c549a54660'
const read = (path) => readFileSync(path, 'utf8')
const readAt = (sha, path) => execFileSync('git', ['show', `${sha}:${path}`], { encoding: 'utf8' })
const json = (path) => JSON.parse(read(path))
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const decision = json(decisionPath)
const api = readAt(HIDDEN_SHA, apiPath)
const controller = readAt(HIDDEN_SHA, controllerPath)

assert.equal(sha256(evidencePath), 'c71dc2adcadf8f70dd891a41dd31347c427d52878e600455e3c548764085866b')
assert.equal(evidence.schemaVersion, 'viewloom-12a10-kick-battle-lines-category-hidden-production-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.equal(evidence.productAuthoritySha, 'a802e7fe1e964180904c72744b7228c549a54660')
assert.equal(evidence.expectedDeploymentSha, '3451d96d067e50c045387e4bbe337ee3be3f0368')
assert.equal(evidence.validationDate, '2026-08-10')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicCutoverAuthorized, false)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.deployment.commit_sha, evidence.expectedDeploymentSha)
assert.equal(evidence.scenarios.length, 6)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: scenario must pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const normal = byName.get('kick-normal-fixed-day-desktop')
const desktop = byName.get('kick-hidden-fixed-day-desktop')
const mobile = byName.get('kick-hidden-fixed-day-mobile')
const unknown = byName.get('kick-hidden-unknown-category')
const pointState = byName.get('kick-hidden-point-state-contract')
const twitch = byName.get('twitch-battle-lines-isolation')
for (const scenario of [normal, desktop, mobile, unknown, pointState, twitch]) assert.ok(scenario)

assert.equal(normal.checks.lines, 5)
assert.equal(normal.checks.battles, 6)
assert.equal(normal.checks.categoryControlAbsent, true)
assert.equal(normal.checks.pageGeometry.width, 1440)
assert.equal(normal.checks.pageGeometry.scrollWidth, 1440)
assert.equal(normal.checks.pageGeometry.overflow, false)
assert.equal(normal.requests.length, 1)
assert.equal(new URL(normal.requests[0]).pathname, '/api/kick-battle-lines')
assert.equal(new URL(normal.requests[0]).searchParams.has('category'), false)

assert.equal(desktop.checks.categoryOptions, 127)
assert.equal(desktop.checks.selectedCategory, '15')
assert.equal(desktop.checks.selectedStreamCount, 266)
assert.equal(desktop.checks.selectedLines, 5)
assert.equal(desktop.checks.selectedBattles, 6)
assert.deepEqual(desktop.checks.coverageCounts, { observed: 288, partial: 0, unavailable: 0 })
assert.equal(desktop.checks.overlapCount, 0)
assert.equal(desktop.checks.pageGeometry.overflow, false)
assert.equal(desktop.requests.length, 2)
assert.equal(new URL(desktop.requests[0]).searchParams.get('category'), 'all')
assert.equal(new URL(desktop.requests[1]).searchParams.get('category'), '15')

assert.equal(mobile.viewport.width, 390)
assert.equal(mobile.checks.selectBox.height, 44)
assert.equal(mobile.checks.pageGeometry.width, 390)
assert.equal(mobile.checks.pageGeometry.scrollWidth, 390)
assert.equal(mobile.checks.pageGeometry.overflow, false)

assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.lines, 0)
assert.equal(unknown.checks.battles, 0)
assert.equal(unknown.checks.observedBuckets, 288)
assert.deepEqual(unknown.checks.coverageCounts, { observed: 288, partial: 0, unavailable: 0 })
assert.match(unknown.checks.statusText, /^Unknown Kick category/)

assert.equal(pointState.checks.selectedCategory, '15')
assert.deepEqual(pointState.checks.contractStates, ['observed', 'outside_category', 'category_unavailable', 'offline', 'not_observed', 'missing'])
assert.equal(pointState.checks.actualStateCounts.outside_category, 121)
assert.ok(pointState.checks.actualStateCounts.observed > 0)
assert.equal(pointState.checks.repositoryFixtureAuthority, fixturePath)

assert.equal(twitch.checks.lines, 5)
assert.equal(twitch.checks.battles, 6)
assert.equal(twitch.checks.categoryControlAbsent, true)
assert.equal(twitch.checks.providerIsolation, true)
assert.equal(new URL(twitch.requests[0]).pathname, '/api/battle-lines')

assert.equal(acceptance.schemaVersion, 'viewloom-12a10-kick-battle-lines-category-hidden-production-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.implementationIssue, 815)
assert.equal(acceptance.acceptanceIssue, 819)
assert.equal(acceptance.acceptancePr, 820)
assert.equal(acceptance.provider, 'kick')
assert.equal(acceptance.feature, 'battle_lines_category_filter')
assert.equal(acceptance.package.feasibilityDecisionIssue, 813)
assert.equal(acceptance.package.feasibilityDecisionPr, 814)
assert.equal(acceptance.package.hiddenImplementationIssue, 815)
assert.equal(acceptance.package.hiddenImplementationPr, 816)
assert.equal(acceptance.package.productAuthoritySha, evidence.productAuthoritySha)
assert.equal(acceptance.package.productionRevalidationIssue, 817)
assert.equal(acceptance.package.productionRevalidationPr, 818)
assert.equal(acceptance.package.validationDeploymentSha, evidence.expectedDeploymentSha)
assert.equal(acceptance.execution.workflowRunId, 31519986415)
assert.equal(acceptance.execution.contractJobId, 93874375813)
assert.equal(acceptance.execution.productionJobId, 93874522742)
assert.equal(acceptance.execution.artifactId, 9112660165)
assert.equal(acceptance.execution.artifactDigest, 'sha256:507135af690c04aa7fdac67a8a2cafcffd7563da52c1b62da77fd83fe01327c9')
assert.equal(acceptance.execution.sourceEvidenceJsonSha256, sha256(evidencePath))
assert.equal(acceptance.productionIdentity.productToDeploymentRuntimeEquivalent, true)
assert.deepEqual(acceptance.productionIdentity.validationOnlyChangedFiles, [
  '.github/workflows/analytics-12a10-kick-battle-lines-category-hidden-production-revalidation.yml',
  'apps/web/scripts/kick-battle-lines-category-hidden-production-revalidation.mjs',
  'docs/audits/12a10-kick-battle-lines-category-hidden-production-revalidation-contract.json',
])

const result = acceptance.acceptedResult
assert.equal(result.scenarioCount, 6)
assert.equal(result.passedScenarioCount, 6)
assert.equal(result.failureCount, 0)
assert.equal(result.hiddenDesktopCategoryOptions, 127)
assert.equal(result.selectedCategory, '15')
assert.equal(result.selectedCategoryLines, 5)
assert.equal(result.selectedCategoryBattles, 6)
assert.equal(result.selectedCategoryObservedBuckets, 288)
assert.equal(result.mobileViewportWidth, 390)
assert.equal(result.mobileScrollWidth, 390)
assert.equal(result.mobileCategoryTouchTargetPx, 44)
assert.equal(result.mobileOverflow, false)
assert.equal(result.unknownCategoryState, 'unknown_category')
assert.equal(result.unknownSelectedLines, 0)
assert.equal(result.unknownSelectedBattles, 0)
assert.equal(result.unknownObservedBuckets, 288)
assert.equal(result.unknownGlobalSubstitutionAllowed, false)
assert.equal(result.productionActualOutsideCategoryPoints, 121)
assert.equal(result.outsideCategoryNeverZeroFilled, true)
assert.equal(result.categoryUnavailableNeverZeroFilled, true)
assert.equal(result.categoryBoundaryExcludedFromMissingPenalty, true)
assert.equal(result.providerSeparationPass, true)
assert.equal(result.productionMutationPerformed, false)
for (const key of [
  'humanVisualNormalKickPassed',
  'humanVisualHiddenDesktopPassed',
  'humanVisualHiddenMobilePassed',
  'humanVisualUnknownCategoryPassed',
  'humanVisualTwitchIsolationPassed',
]) assert.equal(result[key], true, `${key}: human visual acceptance required`)

assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.trackingIssue, 813)
assert.equal(decision.decision, 'authorize_hidden_kick_battle_lines_category_candidate')
assert.equal(decision.implementationBoundary.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.implementationBoundary.publicExposureAuthorized, false)

for (const fragment of [
  "const categoryCandidateRequested = url.searchParams.has('category')",
  'if (!categoryCandidateRequested) {',
  "implementationState: 'hidden_candidate'",
  'publicExposureAuthorized: false',
  'filterBeforeCandidateCompaction: true',
  'filterBeforeTopN: true',
  'filterBeforeRecommendedBattleScoring: true',
  "candidateRankingMetric: 'category_qualified_viewer_minutes'",
  "selectedCategoryPointStates: ['observed', 'outside_category', 'category_unavailable', 'offline', 'not_observed', 'missing']",
  'outsideCategoryNeverZeroFilled: true',
  'categoryUnavailableNeverZeroFilled: true',
  'outsideCategoryExcludedFromMissingPenalty: true',
  'categoryUnavailableExcludedFromMissingPenalty: true',
  'unknownCategoryMaySubstituteGlobalLines: false',
]) assert.ok(api.includes(fragment), `hidden Kick API boundary missing: ${fragment}`)

for (const fragment of [
  "const categoryPreviewEnabled = provider === 'kick' && params.get('categoryPreview') === '1'",
  'if (categoryPreviewEnabled) installCategoryPreviewControl()',
  "if (categoryPreviewEnabled) query.set('category', state.category)",
]) assert.ok(controller.includes(fragment), `hidden UI boundary missing: ${fragment}`)

const authorization = acceptance.authorization
assert.equal(authorization.hiddenKickBattleLinesCategoryCandidateAccepted, true)
assert.equal(authorization.normalKickBattleLinesCategoryFreeAccepted, true)
for (const key of [
  'publicKickBattleLinesCategoryUiAuthorized',
  'kickHistoryCategoryUiAuthorized',
  'twitchRuntimeSemanticChangeAuthorized',
  'collectorChangeAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'd1SchemaChangeAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'thresholdRelaxationAuthorized',
  'credentialChangeAuthorized',
  'syntheticMappingAuthorized',
  'nameOnlyMappingAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(authorization[key], false, `${key}: must remain false`)

console.log(JSON.stringify({
  status: 'pass',
  acceptanceIssue: acceptance.acceptanceIssue,
  acceptancePr: acceptance.acceptancePr,
  productAuthoritySha: evidence.productAuthoritySha,
  deploymentSha: evidence.expectedDeploymentSha,
  workflowRunId: acceptance.execution.workflowRunId,
  productionJobId: acceptance.execution.productionJobId,
  artifactId: acceptance.execution.artifactId,
  scenarios: `${result.passedScenarioCount}/${result.scenarioCount}`,
  categoryOptions: result.hiddenDesktopCategoryOptions,
  selectedCategory: result.selectedCategory,
  actualOutsideCategoryPoints: result.productionActualOutsideCategoryPoints,
  mobileTouchTargetPx: result.mobileCategoryTouchTargetPx,
  publicCutoverAuthorized: authorization.publicKickBattleLinesCategoryUiAuthorized,
  oneShotProductionWorkflowRetired: true,
  historicalRuntimeVerifier: true,
  hiddenAuthoritySha: HIDDEN_SHA,
}, null, 2))
