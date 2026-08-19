import fs from 'node:fs'

const evidencePath = process.argv[2] || 'docs/audits/12a40-kick-history-chunked-contributor-benchmark-evidence.json'
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
const prototypePath = 'docs/prototypes/12a40-kick-history-chunked-contributors.sql'
const prototype = fs.readFileSync(prototypePath, 'utf8')
const decision = JSON.parse(fs.readFileSync('docs/audits/12a39-kick-history-streamer-category-overflow-remediation-decision.json', 'utf8'))
const failure = JSON.parse(fs.readFileSync('docs/audits/12a38-kick-history-first-natural-generation-acceptance-failure.json', 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(evidence.schemaVersion === 'viewloom-12a40-kick-history-chunked-contributor-benchmark-v1', 'schema')
assert(evidence.phase === '12A-40', 'phase')
assert(evidence.issue === 922, 'issue')
assert(evidence.provider === 'kick', 'provider')
assert(evidence.status === 'PASS', 'benchmark status')
assert(evidence.prototypeSchema === prototypePath, 'prototype path')
assert(evidence.retentionDays === 180, 'retention')
assert(evidence.storageFixture.categoryRowsPerDay === 300, 'category storage fixture')
assert(evidence.storageFixture.logicalStreamerCategoryContributorsPerDay === 1108, 'observed overflow fixture')

assert(decision.phase === '12A-39' && decision.decision === 'GO', '12A39 decision')
assert(decision.selectedPrototype.representation === 'lossless_chunked_category_day_contributors', '12A39 representation')
assert(decision.selectedPrototype.productionChunkSizeChosen === false, '12A39 production chunk size boundary')
assert(failure.phase === '12A-38' && failure.formalDetermination === 'FAIL', '12A38 failure')
assert(failure.statusRows.find(row => row.day === '2026-08-17')?.candidateStreamerCategoryRows === 1108, 'Aug17 source failure')
assert(failure.statusRows.find(row => row.day === '2026-08-18')?.candidateStreamerCategoryRows === 1066, 'Aug18 source failure')

assert(!prototypePath.startsWith('db/d1/'), 'prototype must not be a production migration')
for (const text of [
  'CREATE TABLE history_category_daily_v2',
  'CREATE TABLE history_category_streamer_daily_chunks_v2',
  'CREATE TABLE history_category_day_status_v2',
  'PRIMARY KEY (provider, day, category_id, chunk_index)',
  'idx_history_category_streamer_chunks_v2_category_day',
  'logical_streamer_category_contributors',
  'physical_contributor_chunk_rows',
  'contributor_encoded_bytes',
]) assert(prototype.includes(text), `prototype SQL missing ${text}`)

assert(JSON.stringify(evidence.acceptedBaseline) === JSON.stringify({
  acceptedKickProjectedMiB: 369.68,
  providerCeilingMiB: 440,
  providerHeadroomMinMiB: 10,
  acceptedAccountHeadroomMiB: 879.59,
  accountHeadroomMinMiB: 500,
  designBudgetMiB: 60,
  safetyMarginPct: 20,
  snapshotItemCap: 100,
  snapshotsPerDay: 288,
}), 'accepted baseline changed')

for (const pairCount of ['1000', '1066', '1108']) {
  for (const chunkSize of ['32', '64', '128']) {
    const fixture = evidence.logicalFixtures[pairCount]?.[chunkSize]
    assert(fixture, `missing fixture ${pairCount}/${chunkSize}`)
    assert(fixture.logicalPairs === Number(pairCount), `logical pair count ${pairCount}/${chunkSize}`)
    assert(fixture.recoveredLogicalPairs === Number(pairCount), `recovered pair count ${pairCount}/${chunkSize}`)
    assert(fixture.noContributorLoss === true, `contributor loss ${pairCount}/${chunkSize}`)
  }
}

assert(Array.isArray(evidence.measurements) && evidence.measurements.length === 3, 'measurements')
const byChunk = Object.fromEntries(evidence.measurements.map(item => [String(item.chunkSize), item]))
for (const chunkSize of ['32', '64', '128']) {
  const item = byChunk[chunkSize]
  assert(item, `missing chunk measurement ${chunkSize}`)
  assert(item.pass === true, `chunk ${chunkSize} failed`)
  for (const [gate, value] of Object.entries(item.gates)) assert(value === true, `chunk ${chunkSize} gate ${gate}`)
  assert(item.maximumPhysicalChunkRowsPerDay <= 1000, `chunk ${chunkSize} physical row budget`)
  assert(item.incrementalMiBWithSafety <= 60, `chunk ${chunkSize} storage budget`)
  assert(item.projectedKickMiB <= 440, `chunk ${chunkSize} projected provider size`)
  assert(item.providerHeadroomMiB >= 10, `chunk ${chunkSize} provider headroom`)
  assert(item.accountHeadroomMiB >= 500, `chunk ${chunkSize} account headroom`)
  assert(item.selectedCategoryExpandedRows30d === 18270, `chunk ${chunkSize} expanded row count`)
  assert(item.selectedCategoryPeriodResultRows === 609, `chunk ${chunkSize} selected-category result rows`)
  assert(item.queryPlan.some(plan => plan.includes('idx_history_category_streamer_chunks_v2_category_day')), `chunk ${chunkSize} index plan`)
}

assert(evidence.winner.chunkSize === 128, 'winner must be 128')
assert(evidence.winner.productionAuthorized === false, 'winner must not authorize production')
assert(byChunk['128'].incrementalMiBWithSafety <= byChunk['64'].incrementalMiBWithSafety, '128 storage vs 64')
assert(byChunk['128'].incrementalMiBWithSafety <= byChunk['32'].incrementalMiBWithSafety, '128 storage vs 32')

const stress = evidence.theoreticalSourceMaximumStress
assert(stress.logicalPairsPerDay === 28800, 'theoretical pair maximum')
assert(stress.measurements['128'].physicalChunkRows <= 1000, '128 theoretical physical rows')
assert(stress.measurements['128'].recoveredLogicalPairs === 28800, '128 theoretical recovery')
assert(stress.measurements['128'].noContributorLoss === true, '128 theoretical loss')
assert(stress.measurements['128'].projectedEncodedPayloadMiB180d > 60, 'theoretical byte pressure must be visible')
assert(stress.requiresEncodedByteFailCloseBeforeProduction === true, 'encoded-byte fail close requirement')

assert(evidence.semantics.lossless === true, 'lossless')
assert(evidence.semantics.topK === false, 'no Top K')
assert(evidence.semantics.sampling === false, 'no sampling')
assert(evidence.semantics.categoryFilterBeforePeriodRanking === true, 'filter before ranking')
assert(evidence.semantics.allSelectedChunksExpandedBeforeRanking === true, 'expand all chunks')
assert(evidence.nextGate === 'repository_only_chunked_schema_query_candidate_decision_with_encoded_byte_fail_close', 'next gate')
for (const [key, value] of Object.entries(evidence.authorizations)) assert(value === false, `authorization must remain false: ${key}`)

console.log(`12A-40 chunk benchmark verified: ${evidencePath}; winner=128; production remains forbidden`)
