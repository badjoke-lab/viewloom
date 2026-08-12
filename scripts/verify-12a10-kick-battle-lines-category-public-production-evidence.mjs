import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a10-kick-battle-lines-category-public-production-evidence.json'
const acceptancePath = 'docs/audits/12a10-kick-battle-lines-category-public-production-acceptance.json'
const decisionPath = 'docs/audits/12a10-kick-battle-lines-category-public-cutover-decision.json'
const apiPath = 'apps/web/functions/api/kick-battle-lines.ts'
const controllerPath = 'apps/web/src/live/battle-lines-current-shell-entry.ts'
const twitchApiPath = 'apps/web/functions/api/battle-lines.ts'
const oneShotWorkflow = '.github/workflows/analytics-12a10-kick-battle-lines-category-public-cutover.yml'

for (const path of [evidencePath, acceptancePath, decisionPath, apiPath, controllerPath, twitchApiPath]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(oneShotWorkflow), false, `${oneShotWorkflow}: consumed one-shot public workflow must be retired`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const decision = json(decisionPath)
const api = read(apiPath)
const controller = read(controllerPath)
const twitchApi = read(twitchApiPath)

assert.equal(sha256(evidencePath), '9841f5afedd1fe765df372a89a5c3deb58e5f691a43190fb7a21454b7468915d')
assert.equal(evidence.schemaVersion, 'viewloom-12a10-kick-battle-lines-category-public-production-evidence-v1')
assert.equal(evidence.status, 'pass')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.equal(evidence.expectedProductionSha, '2e81a04718885fedb993a39b28dc1655f6660f3a')
assert.equal(evidence.validationDate, '2026-08-10')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicKickBattleLinesCategoryUiActive, true)
assert.equal(evidence.twitchCategoryBoundaryPreserved, true)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.equal(evidence.deployment.commit_sha, evidence.expectedProductionSha)
assert.equal(evidence.scenarios.length, 6)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: scenario must pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const desktop = byName.get('kick-public-fixed-day-desktop')
const mobile = byName.get('kick-public-fixed-day-mobile')
const legacy = byName.get('kick-public-legacy-preview-compatibility')
const unknown = byName.get('kick-public-unknown-category')
const pointState = byName.get('kick-public-point-state-contract')
const twitch = byName.get('twitch-battle-lines-isolation')
for (const scenario of [desktop, mobile, legacy, unknown, pointState, twitch]) assert.ok(scenario)

assert.equal(desktop.checks.categoryOptions, 127)
assert.equal(desktop.checks.selectedCategory, '15')
assert.equal(desktop.checks.selectedStreamCount, 266)
assert.equal(desktop.checks.selectedLines, 5)
assert.equal(desktop.checks.selectedBattles, 6)
assert.deepEqual(desktop.checks.coverageCounts, { observed: 288, partial: 0, unavailable: 0 })
assert.equal(desktop.checks.overlapCount, 0)
assert.equal(desktop.checks.pageGeometry.width, 1440)
assert.equal(desktop.checks.pageGeometry.scrollWidth, 1440)
assert.equal(desktop.checks.pageGeometry.overflow, false)
assert.equal(desktop.checks.topDefault, 5)
assert.equal(desktop.checks.bucketDefault, '5m')
assert.equal(new URL(desktop.requests[0]).searchParams.get('category'), 'all')
assert.equal(new URL(desktop.requests[1]).searchParams.get('category'), '15')

assert.equal(mobile.viewport.width, 390)
assert.equal(mobile.checks.selectBox.height, 44)
assert.equal(mobile.checks.pageGeometry.width, 390)
assert.equal(mobile.checks.pageGeometry.scrollWidth, 390)
assert.equal(mobile.checks.pageGeometry.overflow, false)

assert.equal(legacy.checks.legacyParameterRemoved, true)
assert.equal(legacy.checks.selectedCategory, '15')
assert.equal(new URL(legacy.requests[0]).searchParams.get('category'), 'all')
assert.equal(new URL(legacy.requests[1]).searchParams.get('category'), '15')

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
assert.equal(pointState.checks.repositoryFixtureAuthority, 'apps/web/scripts/verify-kick-battle-lines-category-candidate.mjs')

assert.equal(twitch.checks.lines, 5)
assert.equal(twitch.checks.battles, 6)
assert.equal(twitch.checks.categoryControlAbsent, true)
assert.equal(twitch.checks.providerIsolation, true)
assert.equal(new URL(twitch.requests[0]).pathname, '/api/battle-lines')

assert.equal(acceptance.schemaVersion, 'viewloom-12a10-kick-battle-lines-category-public-production-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.parentTrackingIssue, 623)
assert.equal(acceptance.publicDecisionIssue, 821)
assert.equal(acceptance.publicDecisionPr, 822)
assert.equal(acceptance.publicImplementationIssue, 823)
assert.equal(acceptance.publicImplementationPr, 824)
assert.equal(acceptance.acceptanceIssue, 825)
assert.equal(acceptance.acceptancePr, 826)
assert.equal(acceptance.provider, 'kick')
assert.equal(acceptance.feature, 'battle_lines_category_filter')
assert.equal(acceptance.package.publicDecisionMergeSha, '3314f0b7a401d5fbd54cdaaa8f08595f85756e88')
assert.equal(acceptance.package.publicProductAuthoritySha, evidence.expectedProductionSha)
assert.equal(acceptance.package.productionDeploymentSha, evidence.expectedProductionSha)
assert.equal(acceptance.execution.workflowRunId, 31615910629)
assert.equal(acceptance.execution.verifyJobId, 94178528484)
assert.equal(acceptance.execution.productionJobId, 94179111662)
assert.equal(acceptance.execution.artifactId, 9149490130)
assert.equal(acceptance.execution.artifactDigest, 'sha256:d99bf1319feb88f76bf73a9b405c1c9cad81d9d2fb8446aa1c04903e084359a9')
assert.equal(acceptance.execution.sourceEvidenceJsonSha256, sha256(evidencePath))
assert.equal(acceptance.execution.deploymentJsonSha256, '788a14d803f2fcf9ef9f59848eef0bb22654a746a8b9fb6f22e67eb4731625c6')
assert.equal(acceptance.execution.publicDesktopScreenshotSha256, 'df3683e6e9ecae06e107fc87124504d944fd62e031bc1acd4edfc9c5e2f6ea3b')
assert.equal(acceptance.execution.publicMobileScreenshotSha256, '0e4ce6bb8af8818a5881441b6b9e9c00941d67a7cb7e8faf55a842298c1cf78d')
assert.equal(acceptance.execution.legacyCompatibilityScreenshotSha256, '53ef4eb0bd4d9c831ccbc9be3463f7bde73c392d229c69ccab6aca59b7322ed8')
assert.equal(acceptance.execution.unknownCategoryScreenshotSha256, 'ac16764c7363bdf6cabc690bfe5efdd393fb2108cfab3ab9648b3466b7599d88')
assert.equal(acceptance.execution.twitchIsolationScreenshotSha256, '9996335abf36cb8a97e45e2497383089669bcfc9613f125d515965cada920305')

const result = acceptance.acceptedResult
assert.equal(result.scenarioCount, 6)
assert.equal(result.passedScenarioCount, 6)
assert.equal(result.failureCount, 0)
assert.equal(result.publicKickBattleLinesCategoryUiActive, true)
assert.equal(result.defaultCategory, 'all')
assert.equal(result.hiddenPreviewRequired, false)
assert.equal(result.publicDesktopCategoryOptions, 127)
assert.equal(result.selectedCategory, '15')
assert.equal(result.selectedCategoryStreamCount, 266)
assert.equal(result.selectedCategoryLines, 5)
assert.equal(result.selectedCategoryBattles, 6)
assert.equal(result.selectedCategoryObservedBuckets, 288)
assert.equal(result.mobileViewportWidth, 390)
assert.equal(result.mobileScrollWidth, 390)
assert.equal(result.mobileCategoryTouchTargetPx, 44)
assert.equal(result.mobileOverflow, false)
assert.equal(result.legacyCategoryPreviewCompatibilityPassed, true)
assert.equal(result.legacyCategoryPreviewRemovedAfterPublicInteraction, true)
assert.equal(result.unknownCategoryState, 'unknown_category')
assert.equal(result.unknownSelectedLines, 0)
assert.equal(result.unknownSelectedBattles, 0)
assert.equal(result.unknownObservedBuckets, 288)
assert.equal(result.unknownGlobalSubstitutionAllowed, false)
assert.equal(result.productionActualOutsideCategoryPoints, 121)
assert.equal(result.outsideCategoryNeverZeroFilled, true)
assert.equal(result.categoryUnavailableNeverZeroFilled, true)
assert.equal(result.categoryBoundaryExcludedFromMissingPenalty, true)
assert.equal(result.categoryFilterBeforeCandidateCompaction, true)
assert.equal(result.categoryFilterBeforeTopN, true)
assert.equal(result.categoryFilterBeforeRecommendedBattleScoring, true)
assert.equal(result.candidateRankingMetric, 'category_qualified_viewer_minutes')
assert.equal(result.twitchCategoryControlAbsent, true)
assert.equal(result.providerSeparationPass, true)
assert.equal(result.productionMutationPerformed, false)
for (const key of [
  'humanVisualPublicDesktopPassed',
  'humanVisualPublicMobilePassed',
  'humanVisualLegacyCompatibilityPassed',
  'humanVisualUnknownCategoryPassed',
  'humanVisualTwitchIsolationPassed',
]) assert.equal(result[key], true, `${key}: human visual acceptance required`)

assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.trackingIssue, 821)
assert.equal(decision.decision, 'authorize_public_kick_battle_lines_category_filter')
assert.equal(decision.authorization.publicKickBattleLinesCategoryUiAuthorized, true)
assert.equal(decision.authorization.defaultRouteExposureAuthorized, true)
assert.equal(decision.authorization.legacyPreviewCompatibilityAuthorized, true)

const noCategoryBranch = api.indexOf('if (!categoryCandidateRequested)')
const dictionaryRead = api.indexOf('FROM provider_category_dictionary')
assert.ok(noCategoryBranch > 0 && dictionaryRead > noCategoryBranch, 'direct no-category API fallback must return before category dictionary path')
for (const fragment of [
  "implementationState: 'public'",
  'publicExposureAuthorized: true',
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
]) assert.ok(api.includes(fragment), `public Kick API boundary missing: ${fragment}`)

for (const fragment of [
  "const legacyCategoryPreviewRequested = provider === 'kick' && params.get('categoryPreview') === '1'",
  "const categoryControlsEnabled = provider === 'kick'",
  'let retainLegacyCategoryPreview = legacyCategoryPreviewRequested',
  'if (categoryControlsEnabled) installCategoryPreviewControl()',
  "if (categoryControlsEnabled) query.set('category', state.category)",
  "if (retainLegacyCategoryPreview) next.set('categoryPreview', '1')",
  'retainLegacyCategoryPreview = false',
  "root.dataset.battleCategoryPreview = 'public'",
  "filter.implementationState !== 'public' || filter.publicExposureAuthorized !== true",
  '.battle-category-preview select{min-height:44px}',
]) assert.ok(controller.includes(fragment), `public controller boundary missing: ${fragment}`)

assert.equal(twitchApi.includes('battle-lines-category'), false)
assert.equal(twitchApi.includes('categoryFilter'), false)

const authorization = acceptance.authorization
assert.equal(authorization.publicKickBattleLinesCategoryUiAccepted, true)
assert.equal(authorization.normalKickBattleLinesCategoryPublicAccepted, true)
assert.equal(authorization.legacyCategoryPreviewCompatibilityAccepted, true)
assert.equal(authorization.twitchBattleLinesCategoryFreeAccepted, true)
for (const key of [
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
  productionSha: evidence.expectedProductionSha,
  workflowRunId: acceptance.execution.workflowRunId,
  productionJobId: acceptance.execution.productionJobId,
  artifactId: acceptance.execution.artifactId,
  scenarios: `${result.passedScenarioCount}/${result.scenarioCount}`,
  categoryOptions: result.publicDesktopCategoryOptions,
  selectedCategory: result.selectedCategory,
  actualOutsideCategoryPoints: result.productionActualOutsideCategoryPoints,
  mobileTouchTargetPx: result.mobileCategoryTouchTargetPx,
  legacyCompatibility: result.legacyCategoryPreviewCompatibilityPassed,
  twitchCategoryBoundaryPreserved: result.twitchCategoryControlAbsent,
  oneShotPublicWorkflowRetired: true,
  kickHistoryCategoryAuthorized: authorization.kickHistoryCategoryUiAuthorized,
}, null, 2))
