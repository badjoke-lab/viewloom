import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const decision = json('docs/audits/12a8-kick-heatmap-category-feasibility-decision.json')
const api = execFileSync(
  'git',
  ['show', `${decision.evidenceBasis.sourceMainSha}:apps/web/functions/api/kick-heatmap.ts`],
  { encoding: 'utf8' },
)
const collector = read('workers/collector-kick/src/index-category.ts')
const official = read('workers/collector-kick/src/official-livestreams.ts')
const capture = read('workers/shared/category-capture.ts')
const runtime = read('apps/web/functions/_provider-runtime.ts')
const gate = json('docs/audits/12a2-current-gate-state.json')

assert.equal(decision.schemaVersion, 'viewloom-12a8-kick-heatmap-category-feasibility-decision-v1')
assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.phase, '12A-8')
assert.equal(decision.parentTrackingIssue, 623)
assert.equal(decision.trackingIssue, 768)
assert.equal(decision.provider, 'kick')
assert.equal(decision.surface, 'heatmap')
assert.equal(decision.decision, 'authorize_hidden_kick_heatmap_category_candidate')
assert.equal(decision.evidenceBasis.sourceMainSha, 'ea3d4dd4e866cce7bda2bad598b0d4a7dad7c055')
assert.equal(decision.evidenceBasis.acceptedPermanentCapturePr, 648)
assert.equal(decision.evidenceBasis.acceptedPermanentObservationSnapshots, 298)
assert.equal(decision.evidenceBasis.acceptedPermanentExpectedSnapshots, 298)
assert.equal(decision.evidenceBasis.acceptedPermanentLatestStreamCount, 100)
assert.equal(decision.evidenceBasis.acceptedPermanentProviderLeakageRows, 0)
assert.equal(decision.evidenceBasis.categoryContractVersion, 'category-source-v1')
assert.equal(decision.evidenceBasis.collectionCadenceMinutes, 5)
assert.equal(decision.evidenceBasis.heatmapTopLimit, 100)
assert.equal(decision.evidenceBasis.newCollectionRequired, false)
assert.equal(decision.evidenceBasis.newStorageRequired, false)

assert.equal(decision.currentHeatmapPath.latestSnapshotRead, true)
assert.equal(decision.currentHeatmapPath.previousSnapshotReadForMomentum, true)
assert.equal(decision.currentHeatmapPath.currentApiCategoryAware, false)
assert.equal(decision.currentHeatmapPath.currentApiCategoryParameterPresent, false)
assert.equal(decision.currentHeatmapPath.existingUnfilteredHeatmapMustRemainBackwardCompatible, true)

assert.equal(decision.acceptedKickCategorySource.identityScope, 'provider_scoped')
assert.equal(decision.acceptedKickCategorySource.identityFormat, '(kick, categoryProviderId)')
assert.equal(decision.acceptedKickCategorySource.providerIdSource, 'official livestream category.id')
assert.equal(decision.acceptedKickCategorySource.nameSource, 'official livestream category.name')
assert.equal(decision.acceptedKickCategorySource.membershipEvaluation, 'per_observed_snapshot')
assert.equal(decision.acceptedKickCategorySource.dictionaryProvider, 'kick')
assert.equal(decision.acceptedKickCategorySource.dictionaryNameIsPresentationOnly, true)
for (const key of [
  'latestCategoryBackProjectionAllowed',
  'syntheticMappingAllowed',
  'nameOnlyIdentityAllowed',
  'crossProviderIdentityAllowed',
]) assert.equal(decision.acceptedKickCategorySource[key], false, `${key}: must remain false`)

assert.equal(decision.sourceModeBoundary.primaryCategorySourceMode, 'official-livestreams')
assert.equal(decision.sourceModeBoundary.primaryRowSourceMode, 'authenticated')
assert.equal(decision.sourceModeBoundary.officialLivestreamsCanCarryCategorySourceFields, true)
assert.equal(decision.sourceModeBoundary.authenticatedChannelFallbackCanBeAssumedCategoryComplete, false)
assert.equal(decision.sourceModeBoundary.publicChannelFallbackCanBeAssumedCategoryComplete, false)
assert.equal(decision.sourceModeBoundary.fixtureCanBeAssumedCategoryComplete, false)
assert.equal(decision.sourceModeBoundary.sourceModeAloneMayNotInventMembership, true)
assert.equal(decision.sourceModeBoundary.selectionRequiresAcceptedContract, true)
assert.equal(decision.sourceModeBoundary.selectionRequiresAlignedRefs, true)
assert.equal(decision.sourceModeBoundary.selectionRequiresAtLeastOneObservedCategoryItem, true)
assert.equal(decision.sourceModeBoundary.fallbackWithoutUsableCategoryMetadata, 'category_unavailable')

assert.equal(decision.filterSemantics.allCategoriesDefault, true)
assert.equal(decision.filterSemantics.filterBeforeTopN, true)
assert.equal(decision.filterSemantics.selectedCategoryUnknown, 'unknown_category')
assert.equal(decision.filterSemantics.selectedCategoryUnavailable, 'category_unavailable')
assert.equal(decision.filterSemantics.missingCategoryItemIncludedInSelectedCategory, false)
assert.equal(decision.filterSemantics.missingCategoryItemCountsAsZeroCategoryViewers, false)
assert.equal(decision.filterSemantics.partialCoverageMayReturnObservedMatches, true)
assert.equal(decision.filterSemantics.partialCoverageMustBeVisible, true)
assert.equal(decision.filterSemantics.allCategoriesFallbackWhenCategoryUnavailable, true)
assert.equal(decision.filterSemantics.automaticSelectedCategoryFallbackToAll, false)

assert.equal(decision.momentumSemantics.baseMetric, 'viewer_delta')
assert.equal(decision.momentumSemantics.selectedCategoryRequiresCurrentMembership, true)
assert.equal(decision.momentumSemantics.selectedCategoryPreviousComparisonRequiresSameCategoryMembership, true)
assert.equal(decision.momentumSemantics.previousCategoryMissingOrDifferent, 'momentum_unavailable_for_selected_category')
assert.equal(decision.momentumSemantics.previousMissing, 'momentum_unavailable_for_selected_category')
assert.equal(decision.momentumSemantics.latestCategoryBackProjectionAllowed, false)
assert.equal(decision.momentumSemantics.crossCategoryViewerDeltaPresentedAsSelectedCategoryMomentum, false)

assert.deepEqual(decision.coverageContract.states, ['observed', 'partial', 'unavailable'])
for (const key of [
  'observedItemsRequired',
  'missingItemsRequired',
  'dictionaryMissingItemsRequired',
  'sourceModeRequired',
  'targetSourceRequired',
]) assert.equal(decision.coverageContract[key], true, `${key}: must remain true`)

assert.equal(decision.candidateContract.implementationState, 'hidden_candidate')
assert.equal(decision.candidateContract.previewParameter, 'categoryPreview=1')
assert.equal(decision.candidateContract.categoryParameter, 'category')
assert.equal(decision.candidateContract.topParameter, 'top')
assert.equal(decision.candidateContract.normalRouteDefault, 'all')
assert.equal(decision.candidateContract.normalRouteControlsVisible, false)
assert.equal(decision.candidateContract.hiddenKickControlsAuthorized, true)
assert.equal(decision.candidateContract.kickApiCategoryMetadataAuthorized, true)
assert.equal(decision.candidateContract.existingUnfilteredResponseCompatibilityRequired, true)
assert.equal(decision.candidateContract.providerDictionaryQueryMustBind, 'kick')
assert.equal(decision.candidateContract.twitchEndpointRequestsAllowed, false)
assert.equal(decision.candidateContract.twitchDictionaryRowsAllowed, false)
assert.equal(decision.candidateContract.additionalExternalRequestsAllowed, false)
assert.equal(decision.candidateContract.additionalCollectorRequestsAllowed, false)

assert.equal(decision.authorization.hiddenCandidateImplementationAuthorized, true)
for (const key of [
  'publicExposureAuthorized',
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
  'thresholdRelaxationAuthorized',
  'credentialChangeAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

// Verify the exact pre-candidate API captured by the accepted decision rather
// than today's mutable runtime. This keeps the permanent decision evidence
// valid after the decision-authorized hidden candidate starts changing the API.
for (const fragment of [
  'FROM minute_snapshots',
  "WHERE provider = ?",
  ".bind('kick')",
  'LIMIT 2',
  'const previousViewers = previous ? viewerMap(previous.payload_json)',
  "const runtime = providerRuntime('kick')",
  "'momentum_source=viewer_delta'",
]) assert.ok(api.includes(fragment), `Kick Heatmap basis missing: ${fragment}`)
assert.equal(api.includes("searchParams.get('category')"), false)
assert.equal(api.includes('categoryRefs'), false)
assert.equal(api.includes('provider_category_dictionary'), false)

// Official livestream discovery is the accepted category-bearing source.
for (const fragment of [
  "new URL('https://api.kick.com/public/v1/livestreams')",
  'const category = asRecord(raw.category)',
  'const categoryProviderId = asIdentifier(category?.id)',
  'const categoryName = asText(category?.name)',
  'categoryProviderId: categoryProviderId || null',
  'categoryName: categoryName || null',
]) assert.ok(official.includes(fragment), `Official Kick category source missing: ${fragment}`)

// Collector stores category refs beside the same stripped items and marks only
// official-livestreams as the accepted primary source for complete coverage.
for (const fragment of [
  "const acceptedPrimarySource = collectorMeta.sourceMode === 'official-livestreams'",
  'const encoded = categoryEnabled ? encodeCategorySnapshot(items, !acceptedPrimarySource) : null',
  '{ items: storedItems, collectorMeta, ...encoded.payloadFields }',
  "env.DB_KICK_HOT",
  "'kick'",
  'writeCategoryDictionary',
]) assert.ok(collector.includes(fragment), `Kick collector category boundary missing: ${fragment}`)

const officialChannelStart = collector.indexOf('function normalizeOfficialChannel')
const officialChannelEnd = collector.indexOf('async function latestSnapshot', officialChannelStart)
const authenticatedChannelNormalizer = collector.slice(officialChannelStart, officialChannelEnd)
assert.ok(authenticatedChannelNormalizer.length > 0)
assert.equal(authenticatedChannelNormalizer.includes('categoryProviderId:'), false)
assert.equal(authenticatedChannelNormalizer.includes('categoryName:'), false)

const publicStart = collector.indexOf('function normalizeChannel')
const publicEnd = collector.indexOf('async function writeSnapshot', publicStart)
const publicNormalizer = collector.slice(publicStart, publicEnd)
assert.ok(publicNormalizer.length > 0)
assert.equal(publicNormalizer.includes('categoryProviderId:'), false)
assert.equal(publicNormalizer.includes('categoryName:'), false)

// Shared accepted encoding guarantees item-index alignment and honest coverage.
for (const fragment of [
  "export const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryIds: string[]',
  'categoryRefs: Array<number | null>',
  "? 'partial_source_coverage'",
  "? 'missing_from_source'",
  "? 'observed'",
  "provider_category_dictionary",
]) assert.ok(capture.includes(fragment), `Shared category contract missing: ${fragment}`)

// Provider limits and accepted canonical state remain provider-specific.
for (const fragment of [
  'kick: {',
  'collectionCadenceMinutes: 5',
  'topLimit: 100',
  'rawRetentionDays: 60',
]) assert.ok(runtime.includes(fragment), `Kick provider runtime missing: ${fragment}`)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.equal(gate.currentWorkstream.kickFinalAcceptancePr, 648)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentObservationAccepted, true)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: decision.trackingIssue,
  decision: decision.decision,
  provider: decision.provider,
  surface: decision.surface,
  evidenceSourceMainSha: decision.evidenceBasis.sourceMainSha,
  hiddenCandidateAuthorized: decision.authorization.hiddenCandidateImplementationAuthorized,
  publicExposureAuthorized: decision.authorization.publicExposureAuthorized,
  primaryCategorySourceMode: decision.sourceModeBoundary.primaryCategorySourceMode,
  fallbackWithoutMetadata: decision.sourceModeBoundary.fallbackWithoutUsableCategoryMetadata,
}, null, 2))
