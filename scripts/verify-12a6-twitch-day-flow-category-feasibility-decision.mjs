import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const decisionPath = 'docs/audits/12a6-twitch-day-flow-category-feasibility-decision.json'
const decision = json(decisionPath)
const dayFlowApi = read('apps/web/functions/api/day-flow.ts')
const dayFlowClient = read('apps/web/src/live/day-flow-current-shell-entry.ts')
const heatmapApi = read('apps/web/functions/api/twitch-heatmap.ts')
const twitchWrangler = read('workers/collector-twitch/wrangler.toml')
const kickWrangler = read('workers/collector-kick/wrangler.toml')

assert.equal(decision.schemaVersion, 'viewloom-12a6-twitch-day-flow-category-feasibility-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 743)
assert.equal(decision.provider, 'twitch')
assert.equal(decision.surface, 'day_flow')
assert.equal(decision.decision, 'authorize_hidden_twitch_day_flow_category_candidate')
assert.equal(decision.evidenceBasis.sourceMainSha, '490486fc89393bf41d69ba6b10d3dd9b292e6d5f')
assert.equal(decision.evidenceBasis.categoryContractVersion, 'category-source-v1')
assert.equal(decision.evidenceBasis.newCollectionRequired, false)
assert.equal(decision.evidenceBasis.newStorageRequired, false)

assert.equal(decision.existingDayFlowSemantics.fullShareDenominator, 'all_observed_twitch_viewers_per_bucket')
assert.equal(decision.existingDayFlowSemantics.topFocusShareDenominator, 'displayed_top_n_viewers_per_bucket')
assert.equal(decision.existingDayFlowSemantics.allCategoriesMustRemainBackwardCompatible, true)

assert.equal(decision.categorySemantics.identityScope, 'provider_scoped')
assert.equal(decision.categorySemantics.identityFormat, '(twitch, categoryProviderId)')
assert.equal(decision.categorySemantics.membershipEvaluation, 'per_observed_snapshot')
assert.equal(decision.categorySemantics.latestCategoryBackProjectionAllowed, false)
assert.equal(decision.categorySemantics.filterBeforeTopN, true)
assert.equal(decision.categorySemantics.topNRankingBasis, 'viewer_minutes_accumulated_only_from_selected_category_observations')
assert.equal(decision.categorySemantics.historicalCategoryViewsAdditiveTaxonomy, false)
for (const key of ['syntheticMappingAllowed', 'nameOnlyIdentityAllowed', 'crossProviderIdentityAllowed', 'crossProviderTotalsAllowed', 'combinedProviderRankingAllowed']) {
  assert.equal(decision.categorySemantics[key], false, `${key}: must remain false`)
}

assert.equal(decision.shareAndContextSemantics.fullShareDenominatorWhenCategorySelected, 'all_observed_twitch_viewers_per_bucket')
assert.equal(decision.shareAndContextSemantics.topFocusShareDenominatorWhenCategorySelected, 'displayed_selected_category_top_n_viewers_per_bucket')
assert.equal(decision.shareAndContextSemantics.silentCategoryOnlyRenormalizationAllowed, false)
assert.equal(decision.shareAndContextSemantics.topFocusNonGlobalShareDisclosureRequired, true)

assert.equal(decision.coverageContract.required, true)
assert.equal(decision.coverageContract.granularity, 'bucket')
assert.deepEqual(decision.coverageContract.states, ['observed', 'partial', 'unavailable'])
assert.equal(decision.coverageContract.missingCategoryMetadataMeansZeroViewers, false)
assert.equal(decision.coverageContract.selectedCategoryUnavailableStateRequired, true)
assert.equal(decision.coverageContract.unknownCategoryStateRequired, true)

assert.equal(decision.candidateContract.implementationState, 'hidden_candidate')
assert.equal(decision.candidateContract.previewParameter, 'categoryPreview=1')
assert.equal(decision.candidateContract.publicDefaultRouteControlsVisible, false)
assert.equal(decision.candidateContract.existingUnfilteredResponseSemanticsMustRemainCompatible, true)
assert.equal(decision.candidateContract.additionalExternalApiRequestsAllowed, false)
assert.equal(decision.candidateContract.additionalCollectorRequestsAllowed, false)

assert.equal(decision.authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.authorization.dayFlowApiCategoryContractAuthorized, true)
assert.equal(decision.authorization.hiddenTwitchDayFlowCategoryControlsAuthorized, true)
for (const key of [
  'defaultRoutePublicExposureAuthorized',
  'kickCategoryUiAuthorized',
  'historyCategoryUiAuthorized',
  'collectorChangeAuthorized',
  'workerCollectorDeploymentAuthorized',
  'd1MutationAuthorized',
  'd1SchemaChangeAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'thresholdRelaxationAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

// Feasibility basis: Day Flow already reads ViewLoom-owned minute snapshots from
// DB_TWITCH_HOT, while the accepted Heatmap path proves the same payload carries
// provider-scoped category references and the same D1 carries the dictionary.
for (const fragment of [
  'DB_TWITCH_HOT.prepare',
  'FROM minute_snapshots',
  'payload_json',
  'total_viewers',
  'totalViewerMinutes',
  'peakShare',
]) assert.ok(dayFlowApi.includes(fragment), `Day Flow API missing feasibility basis: ${fragment}`)
for (const fragment of [
  "const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryIds',
  'categoryRefs',
  'provider_category_dictionary',
  "WHERE provider = ?",
  ".bind('twitch')",
  'category_filter_before_top_n=true',
  'category_filter_public_exposure=true',
]) assert.ok(heatmapApi.includes(fragment), `Heatmap category reference missing: ${fragment}`)

// This PR is a decision only. The normal Day Flow route must still have no
// category controls/params until the separately reviewed candidate lands.
assert.equal(dayFlowApi.includes('categoryFilter'), false)
assert.equal(dayFlowApi.includes("searchParams.get('category')"), false)
assert.equal(dayFlowClient.includes('categoryPreview'), false)
assert.equal(dayFlowClient.includes('data-dayflow-category'), false)

// Existing Full/Top Focus share semantics must remain the evidence basis.
assert.ok(dayFlowClient.includes("if (state.scope === 'full') return globalShareAt(band, index)"))
assert.ok(dayFlowClient.includes('const denominator = nonOthers(payload).slice(0, state.top).reduce'))

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(cron(twitchWrangler), '*/5 * * * *')
assert.equal(cron(kickWrangler), '*/5 * * * *')

console.log(JSON.stringify({
  status: 'pass',
  decision: decision.decision,
  provider: decision.provider,
  categoryMembership: decision.categorySemantics.membershipEvaluation,
  fullShareDenominator: decision.shareAndContextSemantics.fullShareDenominatorWhenCategorySelected,
  coverageGranularity: decision.coverageContract.granularity,
  hiddenCandidateAuthorized: decision.authorization.hiddenCandidateImplementationAuthorized,
  publicExposureAuthorized: decision.authorization.defaultRoutePublicExposureAuthorized,
  kickCategoryUiAuthorized: decision.authorization.kickCategoryUiAuthorized,
}, null, 2))
