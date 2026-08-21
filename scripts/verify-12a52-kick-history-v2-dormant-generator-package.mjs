import fs from 'node:fs'

const evidence = JSON.parse(fs.readFileSync('docs/audits/12a52-kick-history-v2-dormant-generator-package.json', 'utf8'))
const decision = JSON.parse(fs.readFileSync('docs/audits/12a51-kick-history-v2-generator-migration-decision.json', 'utf8'))
const schemaAcceptance = JSON.parse(fs.readFileSync('docs/audits/12a50-kick-history-v2-schema-retry-acceptance-evidence.json', 'utf8'))
const generator = fs.readFileSync('workers/dormant/history-category-v2-generator.ts', 'utf8')
const sql = fs.readFileSync('workers/dormant/history-category-v2-generator-sql.ts', 'utf8')
const candidate = fs.readFileSync('workers/dormant/history-category-chunked-v2-candidate.ts', 'utf8')
const entry = fs.readFileSync('workers/collector-kick/src/entry.ts', 'utf8')
const wrangler = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(evidence.schemaVersion === 'viewloom-12a52-kick-history-v2-dormant-generator-package-v1', 'schema')
assert(evidence.phase === '12A-52' && evidence.issue === 960, 'identity')
assert(evidence.provider === 'kick', 'provider')
assert(evidence.status === 'dormant_repository_package', 'status')
assert(decision.phase === '12A-51' && decision.decision === 'GO', '12A51 decision')
assert(decision.authorization.repositoryDormantV2GeneratorPackage === true, 'dormant package authority')
assert(decision.authorization.productionV2GeneratorWiring === false, 'production wiring boundary')
assert(schemaAcceptance.phase === '12A-50' && schemaAcceptance.status === 'PASS', '12A50 production schema PASS')
assert(schemaAcceptance.v2SchemaCompleteAfter === true && schemaAcceptance.v2AggregateRowsAfter === 0, 'v2 schema/row baseline')

const input = evidence.acceptedInputs
assert(input.rawCategoryContractVersion === 'category-source-v1', 'raw contract')
assert(input.outputContractVersion === 'category-source-v2-chunked', 'output contract')
assert(input.chunkSize === 128, 'chunk size')
assert(input.categoryRowCapPerDay === 300, 'category cap')
assert(input.physicalChunkRowBudgetPerDay === 1000, 'physical chunk budget')
assert(input.encodedContributorBytesCapPerDay === 47196, 'encoded byte cap')
assert(input.retentionDays === 180, 'retention')
assert(input.bucketMinutes === 5, 'bucket minutes')

for (const text of [
  "KICK_HISTORY_CATEGORY_V2_DORMANT_GENERATOR_VERSION =",
  'KICK_HISTORY_CATEGORY_V2_MAX_NORMAL_STATEMENTS = 19',
  'precheckKickHistoryCategoryDay(db, day)',
  'buildKickHistoryCategoryV2DayCandidate({',
  'JSON.stringify(candidate.categoryRows)',
  'JSON.stringify(candidate.chunks)',
  "'unavailable_generation_mismatch'",
  'rawCategoryReadPathsPerDay: 3',
  'activeCollectorWiringIncluded: false',
  'productionEnablementIncluded: false',
  'v1DisablementIncluded: false',
  'preActivationDaysEligible: false',
]) assert(generator.includes(text), `generator contract missing: ${text}`)

for (const text of [
  "category_contract_version = '${CATEGORY_CONTRACT_VERSION}'",
  "GROUP BY bucket_minute, category_id",
  'GROUP BY category_id, streamer_id',
  'history_category_daily_v2',
  'history_category_streamer_daily_chunks_v2',
  'history_category_day_status_v2',
  "FROM json_each(?) AS j",
  "DELETE FROM history_category_daily_v2 WHERE provider = ? AND day = ?",
  "DELETE FROM history_category_streamer_daily_chunks_v2 WHERE provider = ? AND day = ?",
]) assert(sql.includes(text), `SQL contract missing: ${text}`)

assert(candidate.includes('KICK_HISTORY_CATEGORY_V2_CHUNK_SIZE = 128'), 'accepted candidate chunk size')
assert(candidate.includes('KICK_HISTORY_CATEGORY_V2_ENCODED_BYTES_CAP = 47_196'), 'accepted candidate encoded cap')
assert(candidate.includes("'unavailable_encoded_bytes_overflow'"), 'encoded overflow state')
assert(candidate.includes('productionWiringIncluded: false'), 'candidate dormant boundary')

assert(!entry.includes('history-category-v2-generator'), 'v2 generator must not be active')
assert(!entry.includes('history-category-chunked-v2-candidate'), 'v2 candidate must not be active')
assert(entry.includes('maybeRunKickHistoryCategoryPermanentIntegration'), 'active v1 integration drifted')
assert(wrangler.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "true"'), 'v1 enable state drifted')
assert(wrangler.includes('HISTORY_CATEGORY_START_DAY = "2026-08-17"'), 'v1 startDay drifted')
assert(wrangler.includes('crons = ["*/5 * * * *"]'), 'cron drifted')

const persistence = evidence.boundedPersistence
assert(persistence.authoritativeDayBatchStatements === 5, 'authoritative statement count')
assert(persistence.failClosedDayBatchStatements === 3, 'fail-close statement count')
assert(persistence.retentionStatements === 3, 'retention statement count')
assert(persistence.maximumNormalStatementsForTwoDaysWithRetention === 19, 'maximum normal statements')
assert(persistence.oneStatementPerCategoryRow === false, 'per-category statement explosion')
assert(persistence.oneStatementPerChunkRow === false, 'per-chunk statement explosion')
assert(persistence.postWriteChangeCountVerification === true, 'change-count verification')

assert(evidence.productionCost.canonicalHistoricalV1PassRowsRead === 16117, 'canonical v1 cost PASS')
assert(evidence.productionCost.hardMaximumRowsRead === 250000, 'rows-read threshold')
assert(evidence.productionCost.v2ProductionRowsReadMeasured === false, 'must not invent v2 production cost')
assert(evidence.productionCost.newProductionCostProbeAuthorized === false, 'new probe forbidden')

const auth = evidence.authorization
assert(auth.repositoryDormantPackage === true && auth.mergeDormantPackage === true, 'repository package authority')
for (const [key, value] of Object.entries(auth)) {
  if (['repositoryDormantPackage', 'mergeDormantPackage'].includes(key)) continue
  assert(value === false, `authorization must remain false: ${key}`)
}

assert(evidence.nextGate.includes('disabled-by-default active collector migration candidate'), 'next gate')
console.log('12A-52 dormant Kick History v2 generator package verified; production authority unchanged')
