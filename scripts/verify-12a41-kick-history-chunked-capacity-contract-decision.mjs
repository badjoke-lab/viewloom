import fs from 'node:fs'

const decision = JSON.parse(fs.readFileSync('docs/audits/12a41-kick-history-chunked-capacity-contract-decision.json', 'utf8'))
const benchmark = JSON.parse(fs.readFileSync('docs/audits/12a40-kick-history-chunked-contributor-benchmark-evidence.json', 'utf8'))
const remediation = JSON.parse(fs.readFileSync('docs/audits/12a39-kick-history-streamer-category-overflow-remediation-decision.json', 'utf8'))
const failure = JSON.parse(fs.readFileSync('docs/audits/12a38-kick-history-first-natural-generation-acceptance-failure.json', 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(decision.schemaVersion === 'viewloom-12a41-kick-history-chunked-capacity-contract-decision-v1', 'schema')
assert(decision.phase === '12A-41', 'phase')
assert(decision.issue === 924, 'issue')
assert(decision.provider === 'kick', 'provider')
assert(decision.status === 'candidate_contract_go_production_forbidden', 'status')
assert(decision.decision === 'GO', 'decision')
assert(decision.sourceMainSha === '7f13d974f387fdad23f6a1efb6334025702122ce', 'source main')

assert(failure.phase === '12A-38' && failure.formalDetermination === 'FAIL', '12A38 source failure')
assert(failure.reason === 'streamer_category_candidate_overflow_fail_closed', '12A38 failure reason')
assert(remediation.phase === '12A-39' && remediation.decision === 'GO', '12A39 remediation Decision')
assert(remediation.selectedPrototype.representation === 'lossless_chunked_category_day_contributors', '12A39 representation')
assert(benchmark.phase === '12A-40' && benchmark.status === 'PASS', '12A40 benchmark')
assert(benchmark.winner.chunkSize === 128, '12A40 winner')
assert(benchmark.stableBenchmarkSignatureSha256 === 'b6cc5e9f0922c7ec6fb438ae438eb14756162949a0ec3a8306640f447fde8de5', 'stable benchmark signature')
assert(decision.sourceChain.prototypeBenchmarkRunId === 32208724956, 'benchmark run')
assert(decision.sourceChain.prototypeBenchmarkJobId === 95936961712, 'benchmark job')
assert(decision.sourceChain.prototypeBenchmarkArtifactId === 9349985693, 'benchmark artifact')
assert(decision.sourceChain.prototypeBenchmarkArtifactDigest === 'sha256:714bc059d7c67651c480d03e7688b91a4b20faad2f54ec607b4a0d3f390e3523', 'benchmark digest')
assert(decision.sourceChain.stableBenchmarkSignatureSha256 === benchmark.stableBenchmarkSignatureSha256, 'benchmark signature chain')

const contract = decision.selectedContract
assert(contract.contractVersionCandidate === 'category-source-v2-chunked', 'contract version candidate')
assert(contract.chunkSize === 128, 'chunk size')
assert(contract.canonicalContributorTuple.encoding === 'canonical_json_array', 'tuple encoding')
assert(contract.canonicalContributorTuple.orderingBeforeChunking === 'streamer_id_ascending', 'tuple ordering')
assert(contract.canonicalContributorTuple.lossless === true, 'lossless')
assert(contract.canonicalContributorTuple.topK === false, 'no Top K')
assert(contract.canonicalContributorTuple.sampling === false, 'no sampling')
assert(JSON.stringify(contract.canonicalContributorTuple.positions) === JSON.stringify({
  '0': 'streamerId',
  '1': 'displayName',
  '2': 'viewerMinutes',
  '3': 'peakViewers',
  '4': 'observedMinutes',
  '5': 'sampleCount',
}), 'tuple positions')

const cap = contract.dailyCapacity
assert(cap.categoryRowsMaximum === 300, 'category cap')
assert(cap.physicalContributorChunkRowsMaximum === 522, 'physical chunk cap')
assert(cap.contributorEncodedBytesMaximum === 131072, 'encoded byte cap')
assert(cap.contributorEncodedBytesMaximumKiB === 128, 'encoded KiB cap')
assert(cap.logicalStreamerCategoryContributorsMaximum === null, 'logical contributors must not be Top-K capped')
assert(cap.physicalChunkBoundDerivation.snapshotItemCap === 100, 'snapshot item cap')
assert(cap.physicalChunkBoundDerivation.snapshotsPerDay === 288, 'snapshots/day')
assert(cap.physicalChunkBoundDerivation.maximumLogicalPairObservationsPerDay === 28800, 'logical pair source maximum')
assert(cap.physicalChunkBoundDerivation.categoryRowsMaximum === 300, 'derived category maximum')
assert(cap.physicalChunkBoundDerivation.chunkSize === 128, 'derived chunk size')
const derivedRows = (300 - 1) + Math.ceil((28800 - (300 - 1)) / 128)
assert(derivedRows === 522, 'local derived physical chunk maximum math')
assert(cap.physicalChunkBoundDerivation.result === derivedRows, 'stored physical chunk maximum derivation')

for (const field of [
  'candidate_category_rows',
  'logical_streamer_category_contributors',
  'physical_contributor_chunk_rows',
  'contributor_encoded_bytes',
  'category_row_cap',
  'physical_contributor_chunk_row_cap',
  'contributor_encoded_bytes_cap',
  'coverage_state',
]) assert(contract.statusFields.includes(field), `missing status field ${field}`)

assert(contract.failCloseStates.categoryRowsExceeded === 'unavailable_category_overflow', 'category overflow state')
assert(contract.failCloseStates.physicalContributorChunkRowsExceeded === 'unavailable_chunk_row_overflow', 'chunk overflow state')
assert(contract.failCloseStates.contributorEncodedBytesExceeded === 'unavailable_encoded_overflow', 'encoded overflow state')
assert(contract.overflowBehavior.wholeDayFailClosed === true, 'whole day fail close')
assert(contract.overflowBehavior.partialCategoryRowsExposed === false, 'no partial category rows')
assert(contract.overflowBehavior.partialContributorChunksExposed === false, 'no partial chunks')
assert(contract.historyReadSemantics.expandAllSelectedChunks === true, 'expand all chunks')
assert(contract.historyReadSemantics.aggregateAcrossSelectedPeriodByStreamer === true, 'period aggregation')
assert(contract.historyReadSemantics.rankAfterCategoryFilterAndPeriodAggregation === true, 'filter before ranking')
assert(contract.historyReadSemantics.periodTopKOnlyAfterExactAggregation === true, 'Top K only after exact aggregation')
assert(contract.rolloutSemantics.forwardOnly === true && contract.rolloutSemantics.backfill === false, 'forward-only rollout')
assert(contract.rolloutSemantics.legacyUnavailableDaysRemainHistorical === true, 'legacy unavailable days preserved')
assert(contract.rolloutSemantics.productionV2StartDayChosenLater === true, 'production start day deferred')

const selected = decision.capacityEvidence.selected128KiB
assert(selected.encodedBytesPerDay === 131072, 'selected encoded bytes')
assert(selected.categoryRowsPerDay === 300, 'selected category rows')
assert(selected.physicalContributorChunkRowsPerDay === 522, 'selected chunk rows')
assert(selected.retentionDays === 180, 'selected retention')
assert(selected.rawIncrementalMiB === 44.98046875, 'selected raw storage')
assert(selected.incrementalMiBWithSafety === 53.9765625, 'selected safe storage')
assert(selected.incrementalMiBWithSafety <= selected.designBudgetMiBMaximum, 'selected design budget pass')
assert(selected.projectedKickMiB <= selected.providerCeilingMiB, 'selected provider size pass')
assert(selected.providerHeadroomMiB >= selected.providerHeadroomMiBMinimum, 'selected provider headroom pass')
assert(selected.accountHeadroomMiB >= selected.accountHeadroomMiBMinimum, 'selected account headroom pass')
assert(selected.pass === true, 'selected capacity pass')

const rejected144 = decision.capacityEvidence.rejected144KiB
assert(rejected144.encodedBytesPerDay === 147456, '144 KiB candidate')
assert(rejected144.technicalGatePass === true && rejected144.selected === false, '144 KiB stricter selection')
assert(rejected144.providerHeadroomMiB > 10, '144 KiB should technically pass provider headroom')
const rejected160 = decision.capacityEvidence.rejected160KiB
assert(rejected160.encodedBytesPerDay === 163840, '160 KiB candidate')
assert(rejected160.incrementalMiBWithSafety === 61.3359375, '160 KiB safe storage')
assert(rejected160.incrementalMiBWithSafety > 60, '160 KiB must fail design budget')
assert(rejected160.providerHeadroomMiB === 8.9840625 && rejected160.providerHeadroomMiB < 10, '160 KiB must fail headroom')
assert(rejected160.designBudgetPass === false && rejected160.providerHeadroomPass === false, '160 KiB failure flags')

const semantics = decision.semanticConstraintsPreserved
for (const key of [
  'providerScopedObservationTimeCategoryIdentity',
  'exactCategoryViewerMinutes',
  'exactConcurrentCategoryPeak',
  'exactPerStreamerCategoryViewerMinutes',
  'exactPerStreamerCategoryPeak',
  'categoryFilterBeforePeriodRanking',
  'explicitCoverageAuthority',
]) assert(semantics[key] === true, `semantic must remain true: ${key}`)
for (const key of ['topKTruncation', 'sampling', 'latestCategoryBackprojection', 'providerMixing']) {
  assert(semantics[key] === false, `semantic must remain false: ${key}`)
}
assert(semantics.retentionDays === 180, 'semantic retention')

assert(decision.nextGate === 'repository_only_chunked_migration_generator_query_candidate_with_local_tests', 'next gate')
const auth = decision.authorizations
for (const [key, value] of Object.entries(auth)) {
  if (['repositoryOnlyConcreteCandidate', 'localDeterministicTests', 'localDeterministicBenchmark'].includes(key)) {
    assert(value === true, `local authorization missing: ${key}`)
  } else {
    assert(value === false, `production/expansion authorization must remain false: ${key}`)
  }
}

console.log('12A-41 chunked capacity contract Decision verified: 128/chunk, 522 chunks/day, 131072 bytes/day; production forbidden')
