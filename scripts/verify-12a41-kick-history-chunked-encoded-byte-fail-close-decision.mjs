#!/usr/bin/env node
import fs from 'node:fs'

const decisionPath = 'docs/audits/12a41-kick-history-chunked-encoded-byte-fail-close-decision.json'
const benchmarkPath = 'docs/audits/12a40-kick-history-chunked-contributor-benchmark-evidence.json'
const priorDecisionPath = 'docs/audits/12a39-kick-history-streamer-category-overflow-remediation-decision.json'

const decision = JSON.parse(fs.readFileSync(decisionPath, 'utf8'))
const benchmark = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'))
const prior = JSON.parse(fs.readFileSync(priorDecisionPath, 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(decision.schemaVersion === 'viewloom-12a41-kick-history-chunked-encoded-byte-fail-close-decision-v1', 'schemaVersion mismatch')
assert(decision.phase === '12A-41', 'phase mismatch')
assert(decision.issue === 924, 'issue mismatch')
assert(decision.provider === 'kick', 'provider mismatch')
assert(decision.status === 'candidate_go_production_forbidden', 'status mismatch')
assert(decision.decision === 'GO', 'decision must be GO')

assert(benchmark.status === 'PASS', '12A-40 benchmark must remain PASS')
assert(benchmark.winner?.chunkSize === 128, 'accepted winner must remain 128')
assert(benchmark.winner?.productionAuthorized === false, '12A-40 must not authorize production')
assert(benchmark.stableBenchmarkSignatureSha256 === decision.acceptedPrototype.stableBenchmarkSignatureSha256, 'benchmark signature mismatch')
const winner = benchmark.measurements.find((item) => item.chunkSize === 128)
assert(winner, 'missing 128 benchmark measurement')
assert(winner.incrementalMiBWithSafety === 30.05, 'unexpected 128 safety-adjusted storage')
assert(winner.projectedKickMiB === 399.73, 'unexpected projected Kick size')
assert(winner.providerHeadroomMiB === 40.27, 'unexpected provider headroom')
assert(winner.maximumEncodedBytesPerDay === 47196, 'unexpected measured encoded bytes/day')
assert(winner.maximumPhysicalChunkRowsPerDay === 304, 'unexpected measured physical chunk rows/day')
for (const value of Object.values(winner.gates)) assert(value === true, '12A-40 winner hard gate regressed')

const stress = benchmark.theoreticalSourceMaximumStress
assert(stress.logicalPairsPerDay === 28800, 'theoretical logical-pair bound mismatch')
assert(stress.measurements['128'].physicalChunkRows === 423, 'theoretical 128 physical row count mismatch')
assert(stress.measurements['128'].encodedBytes === 1275301, 'theoretical 128 encoded bytes mismatch')
assert(stress.requiresEncodedByteFailCloseBeforeProduction === true, 'encoded-byte fail-close must remain required')

assert(prior.acceptedSemanticConstraints.topKTruncationAllowed === false, 'Top-K must remain forbidden')
assert(prior.acceptedSemanticConstraints.samplingAllowed === false, 'sampling must remain forbidden')
assert(prior.acceptedSemanticConstraints.categoryFilterBeforeStreamerRanking === true, 'filter-before-ranking must remain required')
assert(prior.requiredLocalPrototypeBenchmark.hardGates.physicalContributorStorageRowsPerDayMaximum === 1000, 'physical row budget must remain 1000')

const contract = decision.selectedCandidateContract
assert(contract.chunkSize === 128, 'candidate chunk size must be 128')
assert(JSON.stringify(contract.canonicalContributorTuple) === JSON.stringify([
  'streamer_id',
  'display_name',
  'viewer_minutes',
  'peak_viewers',
  'observed_minutes',
  'sample_count',
]), 'canonical tuple mismatch')
assert(contract.canonicalEncoding.contributorOrdering === 'streamer_id_ascending_before_chunking', 'canonical ordering mismatch')
assert(contract.hardDailyBounds.categoryRows === 300, 'category row cap must remain 300')
assert(contract.hardDailyBounds.physicalContributorChunkRows === 1000, 'physical chunk row budget must remain 1000')
assert(contract.hardDailyBounds.encodedContributorBytes === 47196, 'encoded bytes/day cap must equal accepted measured maximum')
assert(contract.hardDailyBounds.capIsRankingOrSampling === false, 'capacity bounds must not become ranking/sampling')
assert(contract.failCloseStates.encodedContributorBytesExceeded === 'unavailable_encoded_bytes_overflow', 'encoded overflow state mismatch')
assert(contract.forwardOnly === true, 'candidate must remain forward-only')
assert(contract.retentionDays === 180, 'retention must remain 180 days')
assert(contract.backfill === false, 'backfill must remain false')
assert(contract.latestCategoryBackprojection === false, 'latest-category backprojection must remain false')
assert(contract.providerMixing === false, 'provider mixing must remain false')

const auth = decision.authorizations
for (const key of [
  'productionSchemaApply',
  'productionD1Read',
  'productionD1Mutation',
  'productionGeneratorChange',
  'productionDeployment',
  'manualGeneration',
  'backfill',
  'cronChange',
  'rawRetentionChange',
  'historyCategoryApiUiCutover',
  'twitchRollout',
  'crossProviderChange',
  'newProductionCostProbe',
  'thresholdRelaxation',
]) {
  assert(auth[key] === false, `${key} must remain unauthorized`)
}
assert(auth.repositoryOnlyConcreteCandidateNext === true, 'next repository-only candidate must be authorized')
assert(auth.localDeterministicTestsNext === true, 'local deterministic tests must be authorized')
assert(auth.localStorageBenchmarkNext === true, 'local benchmark must be authorized')

console.log('12A-41 chunked encoded-byte fail-close Decision verified')
