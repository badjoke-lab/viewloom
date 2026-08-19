#!/usr/bin/env node
import fs from 'node:fs'

const evidencePath = 'docs/audits/12a42-kick-history-chunked-v2-candidate-benchmark-evidence.json'
const decisionPath = 'docs/audits/12a41-kick-history-chunked-encoded-byte-fail-close-decision.json'
const schemaPath = 'docs/prototypes/12a42-kick-history-chunked-v2-candidate.sql'
const candidatePath = 'workers/dormant/history-category-chunked-v2-candidate.ts'

const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
const decision = JSON.parse(fs.readFileSync(decisionPath, 'utf8'))
const schema = fs.readFileSync(schemaPath, 'utf8')
const candidate = fs.readFileSync(candidatePath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(evidence.schemaVersion === 'viewloom-12a42-kick-history-chunked-v2-candidate-benchmark-v1', 'schemaVersion mismatch')
assert(evidence.phase === '12A-42', 'phase mismatch')
assert(evidence.issue === 926, 'issue mismatch')
assert(evidence.provider === 'kick', 'provider mismatch')
assert(evidence.status === 'PASS', 'candidate benchmark must PASS')
assert(evidence.stableBenchmarkSignatureSha256 === '2db007d3881152ffdbe7dbcff1c69b02ff24b24b09ffbd315e35e54ac0845c63', 'benchmark signature mismatch')

const fixed = evidence.fixedContract
assert(fixed.chunkSize === 128, 'chunk size mismatch')
assert(fixed.categoryRowCap === 300, 'category cap mismatch')
assert(fixed.physicalChunkRowBudget === 1000, 'physical chunk budget mismatch')
assert(fixed.encodedBytesCap === 47196, 'encoded byte cap mismatch')
assert(fixed.retentionDays === 180, 'retention mismatch')

assert(decision.selectedCandidateContract.chunkSize === fixed.chunkSize, '12A41 chunk mismatch')
assert(decision.selectedCandidateContract.hardDailyBounds.categoryRows === fixed.categoryRowCap, '12A41 category cap mismatch')
assert(decision.selectedCandidateContract.hardDailyBounds.physicalContributorChunkRows === fixed.physicalChunkRowBudget, '12A41 physical budget mismatch')
assert(decision.selectedCandidateContract.hardDailyBounds.encodedContributorBytes === fixed.encodedBytesCap, '12A41 encoded cap mismatch')

const fixtures = evidence.fixtures
assert(fixtures.encodedByteBoundaryPass.encodedBytes === 47196, '47196 fixture missing')
assert(fixtures.encodedByteBoundaryPass.coverageState === 'observed', '47196 must PASS')
assert(fixtures.encodedByteBoundaryFail.encodedBytes === 47197, '47197 fixture missing')
assert(fixtures.encodedByteBoundaryFail.coverageState === 'unavailable_encoded_bytes_overflow', '47197 must fail closed')
assert(fixtures.categoryOverflow.candidateCategoryRows === 301, '301 category fixture missing')
assert(fixtures.categoryOverflow.coverageState === 'unavailable_overflow', '301 categories must fail closed')
assert(fixtures.physicalChunkOverflow.physicalChunks === 1001, '1001 physical chunks fixture missing')
assert(fixtures.physicalChunkOverflow.coverageState === 'unavailable_overflow', '1001 physical chunks must fail closed')
assert(fixtures.observedPairShapes['1066'].noContributorLoss === true, '1066 contributor loss')
assert(fixtures.observedPairShapes['1108'].noContributorLoss === true, '1108 contributor loss')
assert(fixtures.observedPairShapes['1108'].encodedBytes === 46850, '1108 canonical encoded size changed')
assert(fixtures.duplicatePair.duplicateRejected === true, 'duplicate pair must be rejected')
assert(fixtures.duplicatePair.coverageState === 'unavailable_generation_mismatch', 'duplicate pair state mismatch')

const measurement = evidence.measurement
assert(measurement.incrementalMiBWithSafety === 30.05, 'unexpected safety-adjusted storage')
assert(measurement.projectedKickMiB === 399.73, 'unexpected projected Kick size')
assert(measurement.providerHeadroomMiB === 40.27, 'unexpected provider headroom')
assert(measurement.accountHeadroomMiB === 849.54, 'unexpected account headroom')
assert(measurement.maximumPhysicalChunkRowsPerDay === 304, 'unexpected physical rows/day')
assert(measurement.maximumEncodedBytesPerDay === 47196, 'unexpected max bytes/day')
assert(measurement.pass === true, 'measurement must pass')
for (const [key, value] of Object.entries(measurement.gates)) assert(value === true, `measurement gate failed: ${key}`)
assert(measurement.queryPlan.some((line) => line.includes('idx_history_category_streamer_chunks_v2_category_day')), 'indexed provider/category/day query missing')

assert(evidence.semantics.lossless === true, 'lossless required')
assert(evidence.semantics.topK === false, 'Top-K forbidden')
assert(evidence.semantics.sampling === false, 'sampling forbidden')
assert(evidence.semantics.categoryFilterBeforePeriodRanking === true, 'filter-before-ranking required')
assert(evidence.semantics.allSelectedChunksExpandedBeforeRanking === true, 'expand-all required')
assert(evidence.semantics.forwardOnly === true, 'forward-only required')
assert(evidence.semantics.backfill === false, 'backfill forbidden')

for (const [key, value] of Object.entries(evidence.authorizations)) assert(value === false, `authorization must remain false: ${key}`)

for (const fragment of [
  'CREATE TABLE history_category_daily_v2',
  'CREATE TABLE history_category_streamer_daily_chunks_v2',
  'CREATE TABLE history_category_day_status_v2',
  'contributor_encoded_bytes_cap INTEGER NOT NULL',
  'idx_history_category_streamer_chunks_v2_category_day',
  "DEFAULT 'category-source-v2-chunked'",
]) assert(schema.includes(fragment), `schema fragment missing: ${fragment}`)
assert(schema.includes('REPOSITORY-ONLY'), 'schema must be explicitly repository-only')

for (const fragment of [
  "KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE = 128",
  'KICK_HISTORY_CATEGORY_V2_CATEGORY_ROW_CAP = 300',
  'KICK_HISTORY_CATEGORY_V2_PHYSICAL_CHUNK_ROW_BUDGET = 1000',
  'KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP = 47_196',
  'KICK_HISTORY_CATEGORY_V2_RETENTION_DAYS = 180',
  "'unavailable_encoded_bytes_overflow'",
  'JSON.stringify(tuples)',
  'new TextEncoder()',
  'streamerId.localeCompare',
  'json_each(selected_chunks.contributors_json)',
  'GROUP BY streamer_id',
  'ORDER BY viewer_minutes DESC, peak_viewers DESC, streamer_id',
  'productionWiringIncluded: false',
]) assert(candidate.includes(fragment), `candidate fragment missing: ${fragment}`)

assert(!candidate.includes('fetch('), 'dormant candidate must not expose fetch runtime')
assert(!candidate.includes('scheduled('), 'dormant candidate must not expose scheduled runtime')
assert(!candidate.includes('wrangler'), 'dormant candidate must not deploy')

console.log('12A-42 concrete chunked v2 candidate verified')
