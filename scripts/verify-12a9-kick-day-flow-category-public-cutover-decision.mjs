import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const decision = json('docs/audits/12a9-kick-day-flow-category-public-cutover-decision.json')
const feasibility = json('docs/audits/12a9-kick-day-flow-category-feasibility-decision.json')
const acceptance = json('docs/audits/12a9-kick-day-flow-category-post-repair-production-revalidation-acceptance.json')
const evidence = json('docs/audits/12a9-kick-day-flow-category-post-repair-production-revalidation-evidence.json')
const sourceMainSha = decision.evidenceBasis.sourceMainSha
const controls = execFileSync('git', ['show', `${sourceMainSha}:apps/web/src/live/day-flow-category-preview-entry.ts`], { encoding: 'utf8' })
const api = execFileSync('git', ['show', `${sourceMainSha}:apps/web/functions/api/kick-day-flow.ts`], { encoding: 'utf8' })
const page = execFileSync('git', ['show', `${sourceMainSha}:apps/web/kick/day-flow/index.html`], { encoding: 'utf8' })

assert.equal(decision.schemaVersion, 'viewloom-12a9-kick-day-flow-category-public-cutover-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-9-P1')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 807)
assert.equal(decision.provider, 'kick')
assert.equal(decision.feature, 'day_flow_category_filter')
assert.equal(decision.decision, 'authorize_public_kick_day_flow_category_filter')

const basis = decision.evidenceBasis
assert.equal(basis.sourceMainSha, 'd843f119a790fa3a088a9e536f1296b267ff49fa')
assert.equal(basis.hiddenAcceptanceIssue, 805)
assert.equal(basis.hiddenAcceptancePr, 806)
assert.equal(basis.hiddenAcceptanceMergeSha, basis.sourceMainSha)
assert.equal(basis.repairedProductSha, '27b3cca084d62d8badd512c068be415c6865965e')
assert.equal(basis.acceptedValidationDeploymentSha, '7db7b2b71c6424f0bbaa20d1965933e9407cd19c')
assert.equal(basis.workflowRunId, 31473190849)
assert.equal(basis.contractJobId, 93720897005)
assert.equal(basis.productionJobId, 93720969068)
assert.equal(basis.artifactId, 9094188971)
assert.equal(basis.artifactDigest, 'sha256:0c82ce4ad88abeff4569a3219757fbb293ae487a69854be0ff4e0976623e9925')
assert.equal(basis.scenarioCount, 5)
assert.equal(basis.passedScenarioCount, 5)
assert.equal(basis.failureCount, 0)
assert.equal(basis.humanVisualAcceptancePassed, true)
assert.equal(basis.normalKickControlsVisible, false)
assert.equal(basis.desktopWidth, 1440)
assert.equal(basis.desktopScrollWidth, 1440)
assert.equal(basis.mobileWidth, 390)
assert.equal(basis.mobileScrollWidth, 390)
assert.equal(basis.mobileControlWidth, 362)
assert.equal(basis.unknownCategoryState, 'unknown_category')
assert.equal(basis.unknownOverallState, 'live')
assert.equal(basis.unknownSelectedBandCount, 0)
assert.equal(basis.unknownGlobalOthersCount, 1)
assert.equal(basis.unknownChartRendered, true)
assert.equal(basis.unknownFalseNoObservedCopyAbsent, true)
assert.equal(basis.twitchPublicControlsPreserved, true)

assert.equal(feasibility.decision, 'authorize_hidden_kick_day_flow_category_candidate')
assert.equal(feasibility.provider, 'kick')
assert.equal(feasibility.surface, 'day_flow')
assert.equal(feasibility.authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(feasibility.authorization.defaultRoutePublicExposureAuthorized, false)
assert.equal(feasibility.candidateContract.previewParameter, 'categoryPreview=1')
assert.equal(feasibility.candidateContract.productionHiddenBrowserRevalidationRequired, true)

assert.equal(acceptance.schemaVersion, 'viewloom-12a9-kick-day-flow-category-post-repair-production-revalidation-acceptance-v1')
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.acceptanceIssue, 805)
assert.equal(acceptance.acceptancePr, 806)
assert.equal(acceptance.package.repairedProductSha, basis.repairedProductSha)
assert.equal(acceptance.package.validationDeploymentSha, basis.acceptedValidationDeploymentSha)
assert.equal(acceptance.execution.workflowRunId, basis.workflowRunId)
assert.equal(acceptance.execution.contractJobId, basis.contractJobId)
assert.equal(acceptance.execution.productionJobId, basis.productionJobId)
assert.equal(acceptance.execution.artifactId, basis.artifactId)
assert.equal(acceptance.execution.artifactDigest, basis.artifactDigest)
assert.equal(acceptance.execution.humanVisualAcceptancePassed, true)
assert.equal(acceptance.acceptedResult.scenarioCount, 5)
assert.equal(acceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.failureCount, 0)
assert.equal(acceptance.acceptedResult.unknownCategoryState, 'unknown_category')
assert.equal(acceptance.acceptedResult.unknownOverallState, 'live')
assert.equal(acceptance.acceptedResult.unknownSelectedBandCount, 0)
assert.equal(acceptance.acceptedResult.unknownGlobalOthersCount, 1)
assert.equal(acceptance.acceptedResult.unknownChartRendered, true)
assert.equal(acceptance.acceptedResult.unknownFalseNoObservedCopyAbsent, true)
assert.equal(acceptance.acceptedResult.providerSeparationPass, true)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, true)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(acceptance.authorization.publicKickDayFlowCategoryUiAuthorized, false)

assert.equal(evidence.status, 'pass')
assert.equal(evidence.expectedProductSha, basis.repairedProductSha)
assert.equal(evidence.expectedDeploymentSha, basis.acceptedValidationDeploymentSha)
assert.equal(evidence.deployment.commit_sha, basis.acceptedValidationDeploymentSha)
assert.equal(evidence.deployment.environment, 'production')
assert.equal(evidence.deployment.branch, 'main')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: accepted hidden evidence must pass`)

const semantics = decision.acceptedSemantics
assert.equal(semantics.categoryIdentity, '(kick, categoryProviderId)')
assert.equal(semantics.dictionaryProvider, 'kick')
assert.equal(semantics.dictionaryNameIsPresentationOnly, true)
assert.equal(semantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(semantics.filterBeforeTopN, true)
assert.equal(semantics.rankingMetric, 'viewer_minutes')
assert.equal(semantics.bucketAggregation, 'average_observed_stream_viewers')
assert.deepEqual(semantics.coverageStates, ['observed', 'partial', 'unavailable'])
assert.equal(semantics.missingMetadataZeroFilled, false)
assert.equal(semantics.unknownCategoryState, 'unknown_category')
assert.equal(semantics.selectedCategoryUnavailableState, 'category_unavailable')
assert.equal(semantics.unknownCategorySelectedStreamerCount, 0)
assert.equal(semantics.unavailableCategorySelectedStreamerCount, 0)
assert.equal(semantics.zeroMatchGlobalContextPreserved, true)
assert.equal(semantics.zeroMatchGlobalOthersMeaning, 'all_observed_kick_viewers_outside_displayed_selected_category_top_n')
assert.equal(semantics.allCategoriesUsesUnfilteredFallback, true)
assert.equal(semantics.fullShareDenominator, 'all_observed_kick_viewers_per_bucket')
assert.equal(semantics.topFocusShareDenominator, 'displayed_selected_category_top_n_viewers_per_bucket')
assert.equal(semantics.fullOthersMeaning, 'global_observed_kick_remainder_outside_displayed_selected_category_top_n')
assert.equal(semantics.latestCategoryBackProjectionAllowed, false)
assert.equal(semantics.syntheticMappingAllowed, false)
assert.equal(semantics.nameOnlyIdentityAllowed, false)
assert.equal(semantics.crossProviderIdentityAllowed, false)
assert.equal(semantics.combinedProviderRankingAllowed, false)

const behavior = decision.publicBehavior
assert.equal(behavior.normalKickRouteEnabled, true)
assert.equal(behavior.controlsVisibleOnNormalRoute, true)
assert.equal(behavior.defaultCategory, 'all')
assert.equal(behavior.urlCategoryParameter, 'category')
assert.equal(behavior.legacyCategoryPreviewParameter, 'categoryPreview=1')
assert.equal(behavior.legacyCategoryPreviewParameterAccepted, true)
assert.equal(behavior.legacyCategoryPreviewParameterRequired, false)
assert.equal(behavior.legacyCategoryPreviewParameterRemovedAfterPublicControlInteraction, true)
assert.equal(behavior.existingTopDefault, 20)
assert.deepEqual(behavior.existingAllowedTopValues, [10, 20, 50])
assert.equal(behavior.existingBucketDefaultMinutes, 5)
assert.deepEqual(behavior.existingAllowedBucketMinutes, [5, 10])
assert.equal(behavior.topControlSemanticsChanged, false)
assert.equal(behavior.bucketControlSemanticsChanged, false)
assert.equal(behavior.unfilteredFallbackWhenAllSelected, true)
assert.equal(behavior.filterBeforeTopN, true)
assert.equal(behavior.partialCoverageVisible, true)
assert.equal(behavior.categoryUnavailableVisible, true)
assert.equal(behavior.unknownCategoryRetainsGlobalContext, true)
assert.equal(behavior.selectedUnavailableRetainsGlobalContext, true)
assert.equal(behavior.falseEmptyWhenGlobalObservationsExistForbidden, true)
assert.equal(behavior.mobile390NoHorizontalOverflowRequired, true)
assert.equal(behavior.desktopControlNonOverlapRequired, true)

const authorization = decision.authorization
assert.equal(authorization.publicKickDayFlowCategoryUiAuthorized, true)
assert.equal(authorization.defaultRouteExposureAuthorized, true)
assert.equal(authorization.legacyPreviewCompatibilityAuthorized, true)
assert.equal(authorization.publicNavigationAuthorized, false)
for (const key of [
  'kickHeatmapSemanticChangeAuthorized',
  'kickBattleLinesCategoryUiAuthorized',
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
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(authorization[key], false, `${key}: must remain false`)
assert.equal(decision.productionAcceptanceRequired, true)

// Freeze the accepted pre-public hidden runtime boundary at the evidence-acceptance main SHA.
for (const fragment of [
  "const publicProvider = provider === 'twitch'",
  'const enabled = publicProvider || legacyPreviewAtLoad',
  "root.dataset.dayflowCategoryPreview = publicProvider ? 'public' : 'hidden'",
  "if (!publicProvider) current.searchParams.set(PREVIEW_PARAM, '1')",
  "if (publicProvider) url.searchParams.delete(PREVIEW_PARAM)",
  "else url.searchParams.set(PREVIEW_PARAM, '1')",
  "return legacyPreviewAtLoad && filter.implementationState === 'hidden_candidate' && filter.publicExposureAuthorized === false",
]) assert.ok(controls.includes(fragment), `pre-public Day Flow control boundary missing: ${fragment}`)

for (const fragment of [
  "const categoryCandidateRequested = url.searchParams.has('category')",
  'if (!categoryCandidateRequested)',
  "provider: 'kick'",
  "bucketAggregation: 'average'",
  "implementationState: 'hidden_candidate'",
  'publicExposureAuthorized: false',
  "requestedCategory === 'all'",
  "if (filterState !== 'selected') {",
  'const others = makeGlobalOthers([], labels, totals, bucketSize)',
  "'category_filter_before_top_n=true'",
  "'category_full_share_denominator=all_observed_kick_viewers_per_bucket'",
  "'category_top_focus_share_denominator=displayed_selected_category_top_n_viewers_per_bucket'",
]) assert.ok(api.includes(fragment), `pre-public Kick Day Flow API boundary missing: ${fragment}`)
assert.equal(api.includes('DB_TWITCH_HOT'), false, 'pre-public Kick Day Flow API must not cross Twitch storage')

for (const fragment of [
  'data-dayflow-top="10"',
  'data-dayflow-top="20"',
  'data-dayflow-top="50"',
  'data-dayflow-bucket="5"',
  'data-dayflow-bucket="10"',
  '/src/live/day-flow-kick-entry.ts',
]) assert.ok(page.includes(fragment), `existing Kick Day Flow page control boundary missing: ${fragment}`)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  decision: decision.decision,
  sourceMainSha,
  acceptedHiddenScenarios: `${basis.passedScenarioCount}/${basis.scenarioCount}`,
  humanVisualAcceptancePassed: basis.humanVisualAcceptancePassed,
  publicKickDayFlowCategoryUiAuthorized: authorization.publicKickDayFlowCategoryUiAuthorized,
  defaultCategory: behavior.defaultCategory,
  existingTopDefault: behavior.existingTopDefault,
  existingAllowedTopValues: behavior.existingAllowedTopValues,
  legacyPreviewRequired: behavior.legacyCategoryPreviewParameterRequired,
  correctedUnknownGlobalContextRequired: behavior.unknownCategoryRetainsGlobalContext,
  productionAcceptanceRequired: decision.productionAcceptanceRequired,
}, null, 2))
