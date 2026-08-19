import fs from 'node:fs'

const decisionPath = 'docs/audits/12a39-kick-history-streamer-category-overflow-remediation-decision.json'
const failurePath = 'docs/audits/12a38-kick-history-first-natural-generation-acceptance-failure.json'
const decision = JSON.parse(fs.readFileSync(decisionPath, 'utf8'))
const failure = JSON.parse(fs.readFileSync(failurePath, 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(decision.schemaVersion === 'viewloom-12a39-kick-history-streamer-category-overflow-remediation-decision-v1', 'schema')
assert(decision.phase === '12A-39', 'phase')
assert(decision.issue === 920, 'issue')
assert(decision.provider === 'kick', 'provider')
assert(decision.status === 'prototype_go_production_forbidden', 'status')
assert(decision.decision === 'GO', 'decision')

assert(failure.formalDetermination === 'FAIL', '12A38 failure missing')
assert(failure.reason === 'streamer_category_candidate_overflow_fail_closed', '12A38 failure reason')
assert(decision.sourceFailure.formalDetermination === 'FAIL', 'source failure determination')
assert(decision.sourceFailure.observationRunId === 32206729876, 'source run')
assert(decision.sourceFailure.artifactId === 9349382835, 'source artifact')
assert(decision.sourceFailure.artifactDigest === 'sha256:cf8ef86a3793d8cca028d2fafcddd0ea2c7dae4e549e45471af5d58a54309900', 'source digest')
assert(decision.sourceFailure.days['2026-08-17'].candidateStreamerCategoryRows === 1108, 'Aug17 cardinality')
assert(decision.sourceFailure.days['2026-08-18'].candidateStreamerCategoryRows === 1066, 'Aug18 cardinality')
assert(decision.sourceFailure.days['2026-08-17'].coverageState === 'unavailable_overflow', 'Aug17 coverage')
assert(decision.sourceFailure.days['2026-08-18'].coverageState === 'unavailable_overflow', 'Aug18 coverage')

const semantics = decision.acceptedSemanticConstraints
for (const key of [
  'categoryFilterBeforeStreamerRanking',
  'exactCategoryViewerMinutes',
  'exactConcurrentCategoryPeak',
  'exactPerStreamerCategoryViewerMinutes',
  'exactPerStreamerCategoryPeak',
  'observationTimeProviderCategoryIdentity',
  'explicitCoverageAuthority',
  'forwardOnly',
]) assert(semantics[key] === true, `required semantic ${key}`)
for (const key of [
  'topKTruncationAllowed',
  'samplingAllowed',
  'latestCategoryBackprojectionAllowed',
  'providerMixingAllowed',
  'hiddenBackfillAllowed',
  'raiseLegacyStreamerCategoryRowCapAllowed',
]) assert(semantics[key] === false, `forbidden semantic ${key}`)
assert(semantics.retentionDays === 180, 'retention days')
assert(semantics.sourceDecisionPr === 830, 'source decision PR')

const rejected = new Set(decision.rejectedOptions.map(x => x.option))
for (const option of [
  'keep_one_physical_row_per_day_category_streamer_under_legacy_1000_bound',
  'raise_legacy_1000_bound',
  'top_k_or_sample_contributors',
  'single_unbounded_contributor_blob_per_category_day',
]) assert(rejected.has(option), `missing rejection ${option}`)

const prototype = decision.selectedPrototype
assert(prototype.representation === 'lossless_chunked_category_day_contributors', 'selected representation')
assert(prototype.candidateChunkTable === 'history_category_streamer_daily_chunks_v2', 'candidate table')
assert(JSON.stringify(prototype.candidatePrimaryKey) === JSON.stringify(['provider','day','category_id','chunk_index']), 'primary key')
assert(prototype.chunkPayload.encoding === 'canonical_json_array', 'encoding')
assert(prototype.chunkPayload.ordering === 'streamer_id_ascending_before_chunking', 'ordering')
assert(prototype.chunkPayload.lossless === true, 'lossless')
assert(prototype.chunkPayload.duplicateStreamerWithinCategoryDayAllowed === false, 'duplicate rule')
assert(JSON.stringify(prototype.prototypeChunkSizes) === JSON.stringify([32,64,128]), 'prototype chunk sizes')
assert(prototype.productionChunkSizeChosen === false, 'production chunk size must remain undecided')
for (const field of ['streamerId','displayName','viewerMinutes','peakViewers','observedMinutes','sampleCount']) {
  assert(prototype.chunkPayload.requiredContributorFields.includes(field), `missing contributor field ${field}`)
}
assert(prototype.historyReadSemantics.includes('rank/cap period results'), 'filter-before-ranking read semantics')
assert(prototype.statusModelRequirement.includes('logical candidate streamer-category count separate'), 'status separation')

const benchmark = decision.requiredLocalPrototypeBenchmark
assert(benchmark.remoteD1 === false && benchmark.productionDataRead === false, 'benchmark must be local')
for (const fixture of ['legacy_boundary_1000_pairs','observed_failure_shape_1108_pairs','observed_failure_shape_1066_pairs','multi_day_period_filter_before_ranking']) {
  assert(benchmark.fixtures.includes(fixture), `missing fixture ${fixture}`)
}
assert(benchmark.hardGates.exactResultEquivalence === true, 'exact equivalence gate')
assert(benchmark.hardGates.noContributorLoss === true, 'no loss gate')
assert(benchmark.hardGates.noTopK === true && benchmark.hardGates.noSampling === true, 'no topk/sampling gate')
assert(benchmark.hardGates.physicalContributorStorageRowsPerDayMaximum === 1000, 'physical row budget')
assert(benchmark.hardGates.incrementalStorageBudgetMiBMaximum === 60, 'storage budget')
assert(benchmark.hardGates.providerProjectedSizeMiBMaximum === 440, 'provider size budget')
assert(benchmark.hardGates.providerHeadroomMiBMinimum === 10, 'provider headroom')
assert(benchmark.hardGates.accountHeadroomMiBMinimum === 500, 'account headroom')

assert(decision.nextGateIfPrototypePasses === 'repository_only_chunked_schema_query_candidate_decision', 'next gate')
const auth = decision.authorizations
assert(auth.repositoryLocalPrototype === true && auth.deterministicLocalBenchmark === true, 'local prototype authority')
for (const [key, value] of Object.entries(auth)) {
  if (key === 'repositoryLocalPrototype' || key === 'deterministicLocalBenchmark') continue
  assert(value === false, `production or expansion authority must remain false: ${key}`)
}

const pr830 = fs.readFileSync('docs/audits/12a12-kick-history-category-aggregate-capacity-decision.json', 'utf8')
assert(/1000/.test(pr830), 'legacy 1000 capacity decision missing')
assert(/filter/i.test(pr830) || /ranking/i.test(pr830), 'legacy exact ranking semantics missing')

console.log('12A-39 exact overflow remediation Decision verified')
